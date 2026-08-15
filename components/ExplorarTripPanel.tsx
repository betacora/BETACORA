"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ExplorarCitySearch,
  type CitySearchCopy,
} from "@/components/ExplorarCitySearch";
import {
  VisitSuggestionCards,
  type VisitCardsCopy,
} from "@/components/VisitSuggestionCards";
import type { AppLang } from "@/lib/lang";
import type { PlaceSearchResult } from "@/lib/places";
import { supabase } from "@/lib/supabase";
import type { VisitSuggestion } from "@/lib/visitSuggestions";

export type ExplorarTripCopy = {
  kicker: string;
  title: string;
  subtitle: string;
  dnaReady: string;
  updateDna: string;
  city: CitySearchCopy;
  cards: VisitCardsCopy;
  loadingSuggestions: string;
  suggestionsError: string;
  suggestionsAuth: string;
  nextPieceNote: string;
};

type Props = {
  lang: AppLang;
  copy: ExplorarTripCopy;
  profileType: string;
  profileEssence: string | null;
};

/**
 * Explorar trip panel — piece 1: city via Places + Claude visit suggestions
 * with in-memory toggle selection. No save / flights / lodging yet.
 */
export function ExplorarTripPanel({
  lang,
  copy,
  profileType,
  profileEssence,
}: Props) {
  const [destination, setDestination] = useState<PlaceSearchResult | null>(
    null,
  );
  const [suggestions, setSuggestions] = useState<VisitSuggestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSuggestions = useCallback(
    async (place: PlaceSearchResult) => {
      setStatus("loading");
      setErrorMessage(null);
      setSuggestions([]);
      setSelectedIds(new Set());

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setErrorMessage(copy.suggestionsAuth);
          setStatus("error");
          return;
        }

        const res = await fetch("/api/visit-suggestions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            city: place.name,
            place_id: place.id,
            ui_lang: lang,
            profile_type: profileType || undefined,
            profile_essence: profileEssence || undefined,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          suggestions?: VisitSuggestion[];
          error?: string;
          code?: string;
        };

        if (!res.ok || !data.ok || !Array.isArray(data.suggestions)) {
          if (res.status === 401 || data.code === "unauthorized") {
            setErrorMessage(copy.suggestionsAuth);
          } else {
            setErrorMessage(data.error?.trim() || copy.suggestionsError);
          }
          setStatus("error");
          return;
        }

        setSuggestions(data.suggestions);
        setSelectedIds(new Set());
        setStatus("ready");
      } catch {
        setErrorMessage(copy.suggestionsError);
        setStatus("error");
      }
    },
    [
      copy.suggestionsAuth,
      copy.suggestionsError,
      lang,
      profileEssence,
      profileType,
    ],
  );

  useEffect(() => {
    if (!destination) return;
    void loadSuggestions(destination);
  }, [destination, loadSuggestions]);

  function handleSelectCity(place: PlaceSearchResult) {
    setDestination(place);
  }

  function handleClearCity() {
    setDestination(null);
    setSuggestions([]);
    setSelectedIds(new Set());
    setStatus("idle");
    setErrorMessage(null);
  }

  function toggleSuggestion(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-6 sm:px-6 sm:py-8">
      <p className="text-[0.65rem] tracking-[0.16em] uppercase text-[#6B7280] font-medium m-0 mb-2">
        {copy.kicker}
      </p>
      <h1 className="text-[1.5rem] sm:text-[1.75rem] font-semibold tracking-tight text-[#111827] m-0 leading-snug">
        {copy.title}
      </h1>
      <p className="mt-2 text-sm text-[#6B7280] leading-relaxed m-0">
        {copy.subtitle}
      </p>

      <div className="mt-5 rounded-[8px] border border-[#E5E7EB] bg-white px-4 py-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.65rem] tracking-[0.14em] uppercase text-[#6B7280] font-medium m-0 mb-1">
            {copy.dnaReady}
          </p>
          <p className="text-sm font-medium text-[#111827] m-0 truncate">
            {profileType}
          </p>
        </div>
        <Link
          href="/explorar?mode=discover"
          className="text-sm font-medium text-[#2D7B7B] no-underline hover:opacity-80 shrink-0"
        >
          {copy.updateDna}
        </Link>
      </div>

      <div className="mt-8">
        <ExplorarCitySearch
          lang={lang}
          copy={copy.city}
          selected={destination}
          onSelect={handleSelectCity}
          onClear={handleClearCity}
          disabled={status === "loading"}
        />
      </div>

      {status === "loading" ? (
        <p className="mt-8 text-sm text-[#6B7280] m-0" aria-live="polite">
          {copy.loadingSuggestions}
        </p>
      ) : null}

      {status === "error" && errorMessage ? (
        <p
          className="mt-8 text-sm text-[#6B7280] leading-relaxed m-0"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      {status === "ready" && suggestions.length > 0 && destination ? (
        <div className="mt-8">
          <VisitSuggestionCards
            suggestions={suggestions}
            selectedIds={selectedIds}
            onToggle={toggleSuggestion}
            copy={copy.cards}
            cityName={destination.name}
          />
          <p className="mt-6 text-[0.75rem] text-[#9CA3AF] leading-relaxed m-0">
            {copy.nextPieceNote}
          </p>
        </div>
      ) : null}
    </div>
  );
}
