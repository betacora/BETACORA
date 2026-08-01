"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ChevronRight, Send, Sparkles, X } from "lucide-react";
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
  welcome: string;
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

function welcomeText(template: string, destination: string | null): string {
  const place = destination?.trim() || "";
  if (!place) return template.replace(/\s*\{destination\}\.?/gi, "").trim();
  return template.replace(/\{destination\}/gi, place);
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
          className="fixed z-30 bottom-[4.75rem] right-4 md:bottom-6 md:right-6 inline-flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-white text-[#1A1A1A] px-4 py-2.5 text-[0.7rem] font-medium tracking-[0.06em] uppercase shadow-sm hover:border-[#2D7B7B]/40 transition-colors duration-200"
          aria-controls={panelId}
          aria-expanded={false}
        >
          <Sparkles className="size-3.5 shrink-0 text-[#2D7B7B]" aria-hidden />
          {copy.open}
        </button>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-40 md:bg-black/15"
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
          "fixed z-50 flex flex-col bg-white border border-[#E5E5E5] shadow-[0_8px_40px_rgba(0,0,0,0.08)]",
          "transition-transform duration-300 ease-out",
          // Mobile: bottom sheet
          "inset-x-0 bottom-0 max-h-[min(88vh,640px)] rounded-t-[16px]",
          // Desktop: side panel
          "md:inset-y-0 md:right-0 md:left-auto md:bottom-auto md:max-h-none md:w-[min(100%,380px)] md:rounded-none md:border-l md:border-t-0 md:border-b-0 md:shadow-none",
          open
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:translate-x-full pointer-events-none",
        ].join(" ")}
      >
        <header className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-[#E5E5E5] shrink-0">
          <div className="mt-0.5 flex size-9 items-center justify-center rounded-full bg-[#2D7B7B]/10 text-[#2D7B7B]">
            <Sparkles className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[0.95rem] font-semibold text-[#1A1A1A] m-0 leading-snug">
              {copy.title}
            </h2>
            <p className="flex items-center gap-1.5 text-[0.65rem] font-medium tracking-[0.08em] uppercase text-[#2D7B7B] m-0 mt-1 leading-none">
              <span
                className="inline-block size-1.5 rounded-full bg-[#2D7B7B]"
                aria-hidden
              />
              {copy.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="shrink-0 p-1.5 rounded-[7px] text-[#6B6B6B] hover:bg-[#F5F5F5] transition-colors"
            aria-label={copy.close}
          >
            <X className="size-4" />
          </button>
        </header>

        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 min-h-0 bg-[#FAFAFA]"
        >
          {messages.length === 0 ? (
            <div className="space-y-3">
              <div className="mr-6 rounded-[12px] bg-[#F0F0F0] px-3.5 py-3 text-sm text-[#1A1A1A] leading-relaxed">
                {welcomeText(copy.welcome, destination)}
              </div>
              <p className="text-xs text-[#6B6B6B] m-0 leading-relaxed px-0.5">
                {copy.emptyHint}
              </p>
              <div className="flex flex-col gap-2 pt-1">
                {copy.suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={sending}
                    onClick={() => void sendMessage(prompt)}
                    className="group flex items-center justify-between gap-2 text-left text-sm px-3.5 py-2.5 rounded-[10px] border border-[#E5E5E5] bg-white text-[#1A1A1A] hover:border-[#2D7B7B]/35 transition-colors disabled:opacity-50"
                  >
                    <span className="min-w-0">{prompt}</span>
                    <ChevronRight
                      className="size-4 shrink-0 text-[#9A9A9A] group-hover:text-[#2D7B7B]"
                      aria-hidden
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m) => (
            <div key={m.id} className="space-y-2">
              <div
                className={
                  m.role === "user"
                    ? "ml-6 rounded-[12px] bg-[#FFF8F5] border border-[#E8634A]/35 text-[#1A1A1A] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                    : "mr-6 rounded-[12px] bg-[#F0F0F0] px-3.5 py-2.5 text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-wrap"
                }
              >
                {m.content}
              </div>
              {m.role === "assistant" && m.actions && m.actions.length > 0 ? (
                <div className="mr-6 flex flex-col gap-2">
                  {m.actions.map((action) => (
                    <div key={action.id}>
                      <button
                        type="button"
                        onClick={() => onActionClick(action)}
                        className="group w-full flex items-center justify-between gap-2 text-left text-sm px-3.5 py-2.5 rounded-[10px] border border-[#E5E5E5] bg-white text-[#1A1A1A] hover:border-[#E8634A]/45 transition-colors"
                      >
                        <span className="min-w-0 font-medium">{action.label}</span>
                        <ChevronRight
                          className="size-4 shrink-0 text-[#9A9A9A] group-hover:text-[#E8634A]"
                          aria-hidden
                        />
                      </button>
                      {comingSoonId === action.id ? (
                        <p className="text-[0.7rem] text-[#6B6B6B] m-0 mt-1.5 px-0.5">
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
            <p className="text-xs text-[#6B6B6B] m-0 animate-pulse px-0.5">
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
          className="shrink-0 border-t border-[#E5E5E5] bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-3"
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input);
          }}
        >
          <div className="flex items-end gap-2 rounded-[12px] border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2 focus-within:border-[#2D7B7B] transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={1000}
              placeholder={copy.placeholder}
              disabled={sending}
              className="flex-1 resize-none bg-transparent px-0.5 py-1.5 text-sm text-[#1A1A1A] placeholder:text-[#9A9A9A] focus:outline-none disabled:opacity-60 min-h-[2.25rem] max-h-24"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="shrink-0 inline-flex items-center justify-center size-9 rounded-full bg-[#2D7B7B] text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
              aria-label={copy.send}
            >
              <Send className="size-3.5" />
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
