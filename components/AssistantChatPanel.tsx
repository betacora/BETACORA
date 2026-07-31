"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { trackFunnel, FunnelEvent } from "@/lib/analytics";
import type { AppLang } from "@/lib/lang";
import { supabase } from "@/lib/supabase";

export type AssistantAction = {
  id: string;
  label: string;
  kind: "book_ticket" | "book_restaurant" | "other";
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: AssistantAction[];
};

export type AssistantChatCopy = {
  title: string;
  subtitle: string;
  open: string;
  close: string;
  placeholder: string;
  send: string;
  thinking: string;
  emptyHint: string;
  errorGeneric: string;
  errorAuth: string;
  comingSoon: string;
  suggestedPrompts: string[];
};

type Props = {
  itineraryId: string;
  destination: string | null;
  lang: AppLang;
  copy: AssistantChatCopy;
};

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function AssistantChatPanel({
  itineraryId,
  destination,
  lang,
  copy,
}: Props) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comingSoonId, setComingSoonId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    trackFunnel(FunnelEvent.AssistantChatOpen, {
      itinerary_id: itineraryId,
      destination: destination || null,
    });
  }, [open, itineraryId, destination]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, sending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text || sending) return;

    setError(null);
    setComingSoonId(null);
    const userMsg: ChatMessage = { id: uid(), role: "user", content: text };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setSending(true);

    trackFunnel(FunnelEvent.AssistantChatMessage, {
      itinerary_id: itineraryId,
      destination: destination || null,
      chars: text.length,
    });

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError(copy.errorAuth);
        setSending(false);
        return;
      }

      const history = nextHistory.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          itinerary_id: itineraryId,
          message: text,
          history: history.slice(0, -1),
          ui_lang: lang,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        actions?: AssistantAction[];
        error?: string;
      };

      if (!res.ok) {
        setError(data.error || copy.errorGeneric);
        setSending(false);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: data.reply || copy.errorGeneric,
          actions: Array.isArray(data.actions) ? data.actions : [],
        },
      ]);
    } catch {
      setError(copy.errorGeneric);
    } finally {
      setSending(false);
    }
  }

  function onActionClick(action: AssistantAction) {
    trackFunnel(FunnelEvent.AssistantActionClick, {
      itinerary_id: itineraryId,
      destination: destination || null,
      action_id: action.id,
      action_kind: action.kind,
      action_label: action.label.slice(0, 80),
      placeholder: true,
    });
    setComingSoonId(action.id);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed z-30 bottom-[4.75rem] right-4 md:bottom-6 md:right-6 inline-flex items-center gap-2 rounded-[8px] bg-[#2D7B7B] text-white px-4 py-3 text-sm font-medium shadow-md hover:opacity-90 transition-opacity duration-200"
          aria-controls={panelId}
          aria-expanded={false}
        >
          <Sparkles className="size-4 shrink-0" aria-hidden />
          {copy.open}
        </button>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-40 md:bg-black/20"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      <aside
        id={panelId}
        role="dialog"
        aria-label={copy.title}
        aria-hidden={!open}
        className={[
          "fixed z-50 flex flex-col bg-[#FAFAF8] border border-[#E5E5E5]",
          "transition-transform duration-300 ease-out",
          // Mobile: bottom sheet
          "inset-x-0 bottom-0 max-h-[min(88vh,640px)] rounded-t-[16px]",
          // Desktop: side panel
          "md:inset-y-0 md:right-0 md:left-auto md:bottom-auto md:max-h-none md:w-[min(100%,400px)] md:rounded-none md:border-l md:border-t-0 md:border-b-0",
          open
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:translate-x-full pointer-events-none",
        ].join(" ")}
      >
        <header className="flex items-start gap-3 px-4 pt-4 pb-3 border-b border-[#E5E5E5] shrink-0">
          <div className="mt-0.5 flex size-9 items-center justify-center rounded-full bg-[#2D7B7B]/10 text-[#2D7B7B]">
            <MessageCircle className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[0.95rem] font-medium text-[#1A1A1A] m-0 leading-snug">
              {copy.title}
            </h2>
            <p className="text-xs text-[#6B6B6B] m-0 mt-0.5 leading-relaxed">
              {copy.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="shrink-0 p-1.5 rounded-[7px] text-[#6B6B6B] hover:bg-[#E5E5E5]/60 transition-colors"
            aria-label={copy.close}
          >
            <X className="size-4" />
          </button>
        </header>

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0"
        >
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-[#6B6B6B] m-0 leading-relaxed">
                {copy.emptyHint}
              </p>
              <div className="flex flex-col gap-2">
                {copy.suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={sending}
                    onClick={() => void sendMessage(prompt)}
                    className="text-left text-sm px-3 py-2 rounded-[8px] border border-[#E5E5E5] bg-white text-[#1A1A1A] hover:border-[#2D7B7B]/40 transition-colors disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user"
                  ? "ml-8 rounded-[10px] bg-[#2D7B7B] text-white px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap"
                  : "mr-4 rounded-[10px] bg-white border border-[#E5E5E5] px-3 py-2 text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-wrap"
              }
            >
              {m.content}
              {m.role === "assistant" && m.actions && m.actions.length > 0 ? (
                <div className="mt-2.5 flex flex-col gap-1.5">
                  {m.actions.map((action) => (
                    <div key={action.id}>
                      <button
                        type="button"
                        onClick={() => onActionClick(action)}
                        className="w-full text-left text-xs font-medium px-2.5 py-2 rounded-[7px] border border-[#E8634A]/35 text-[#E8634A] bg-[#E8634A]/5 hover:bg-[#E8634A]/10 transition-colors"
                      >
                        {action.label}
                      </button>
                      {comingSoonId === action.id ? (
                        <p className="text-[0.7rem] text-[#6B6B6B] m-0 mt-1 px-0.5">
                          {copy.comingSoon}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          {sending ? (
            <p className="text-xs text-[#6B6B6B] m-0 animate-pulse">
              {copy.thinking}
            </p>
          ) : null}

          {error ? (
            <p className="text-xs text-[#E8634A] m-0" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <form
          className="shrink-0 border-t border-[#E5E5E5] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-3"
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input);
          }}
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              maxLength={1000}
              placeholder={copy.placeholder}
              disabled={sending}
              className="flex-1 resize-none rounded-[8px] border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9A9A9A] focus:outline-none focus:border-[#2D7B7B] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="shrink-0 inline-flex items-center justify-center size-10 rounded-[8px] bg-[#E8634A] text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
              aria-label={copy.send}
            >
              <Send className="size-4" />
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
