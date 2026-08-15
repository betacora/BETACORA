"use client";

import { useId, useState, type FormEvent } from "react";
import type { AppLang } from "@/lib/lang";
import type { PlaceSearchResult } from "@/lib/places";

export type CitySearchCopy = {
  title: string;
  subtitle: string;
  placeholder: string;
  submit: string;
  loading: string;
  empty: string;
  error: string;
  rateLimited: string;
  attribution: string;
  selectedLabel: string;
  changeCity: string;
};

type SearchOk = {
  ok: true;
  places: PlaceSearchResult[];
  count: number;
};

type SearchErr = {
  ok?: false;
  error?: string;
  code?: string;
};

type Props = {
  lang: AppLang;
  copy: CitySearchCopy;
  selected: PlaceSearchResult | null;
  onSelect: (place: PlaceSearchResult) => void;
  onClear: () => void;
  disabled?: boolean;
};

/**
 * City/destination picker for Explorar trip panel — uses /api/places/search
 * (same backend as Descubre). Selecting a row sets the destination; no Maps deep-link.
 */
export function ExplorarCitySearch({
  lang,
  copy,
  selected,
  onSelect,
  onClear,
  disabled = false,
}: Props) {
  const inputId = useId();
  const headingId = `${inputId}-heading`;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [places, setPlaces] = useState<PlaceSearchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (disabled) return;
    const q = query.replace(/\s+/g, " ").trim();
    if (!q) {
      setStatus("idle");
      setPlaces([]);
      setErrorMessage(null);
      return;
    }
    if (status === "loading") return;

    setStatus("loading");
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        q,
        lang,
        limit: "8",
      });
      const res = await fetch(`/api/places/search?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const data = (await res.json()) as SearchOk | SearchErr;

      if (!res.ok || !("ok" in data) || data.ok !== true) {
        const err = data as SearchErr;
        setPlaces([]);
        if (
          res.status === 429 ||
          err.code === "rate_limited" ||
          err.code === "rate_limit_unavailable"
        ) {
          setErrorMessage(copy.rateLimited);
        } else {
          setErrorMessage(err.error?.trim() || copy.error);
        }
        setStatus("error");
        return;
      }

      setPlaces(Array.isArray(data.places) ? data.places : []);
      setStatus("done");
    } catch {
      setPlaces([]);
      setErrorMessage(copy.error);
      setStatus("error");
    }
  }

  if (selected) {
    return (
      <section aria-labelledby={headingId}>
        <h2
          id={headingId}
          className="text-base font-medium tracking-tight text-[#111827] m-0"
        >
          {copy.title}
        </h2>
        <div className="mt-4 flex items-start justify-between gap-3 rounded-[8px] border border-[#E5E7EB] bg-white px-4 py-3.5">
          <div className="min-w-0">
            <p className="text-[0.65rem] tracking-[0.14em] uppercase text-[#6B7280] font-medium m-0 mb-1">
              {copy.selectedLabel}
            </p>
            <p className="text-[0.9375rem] font-medium text-[#111827] m-0 leading-snug truncate">
              {selected.name}
            </p>
            {selected.address ? (
              <p className="mt-1 text-sm text-[#6B7280] m-0 leading-snug">
                {selected.address}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="shrink-0 text-sm font-medium text-[#2D7B7B] bg-transparent border-0 p-0 cursor-pointer hover:opacity-80 disabled:opacity-50"
          >
            {copy.changeCity}
          </button>
        </div>
      </section>
    );
  }

  const showList = status === "done" && places.length > 0;

  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="text-base font-medium tracking-tight text-[#111827] m-0"
      >
        {copy.title}
      </h2>
      <p className="mt-1.5 text-sm text-[#6B7280] leading-relaxed m-0">
        {copy.subtitle}
      </p>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch"
        onSubmit={onSubmit}
        role="search"
      >
        <label htmlFor={inputId} className="sr-only">
          {copy.title}
        </label>
        <input
          id={inputId}
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={copy.placeholder}
          autoComplete="off"
          enterKeyHint="search"
          maxLength={200}
          disabled={disabled}
          className="min-w-0 flex-1 rounded-[8px] border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-[border-color] focus:border-[#2D7B7B] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || status === "loading" || !query.trim()}
          className="inline-flex shrink-0 items-center justify-center rounded-[8px] bg-[#111827] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" ? copy.loading : copy.submit}
        </button>
      </form>

      {status === "error" && errorMessage ? (
        <p
          className="mt-3 text-sm text-[#6B7280] leading-relaxed m-0"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      {status === "loading" ? (
        <p className="mt-4 text-sm text-[#6B7280] m-0" aria-live="polite">
          {copy.loading}
        </p>
      ) : null}

      {status === "done" && places.length === 0 ? (
        <p className="mt-4 text-sm text-[#6B7280] m-0" aria-live="polite">
          {copy.empty}
        </p>
      ) : null}

      {showList ? (
        <>
          <ul className="mt-4 m-0 p-0 list-none divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-[8px] overflow-hidden bg-white">
            {places.map((place) => (
              <li key={place.id} className="m-0 p-0">
                <button
                  type="button"
                  onClick={() => onSelect(place)}
                  className="w-full text-left px-4 py-3.5 bg-white border-0 cursor-pointer transition-colors hover:bg-[#F9FAFB]"
                >
                  <p className="text-[0.9375rem] font-medium text-[#111827] m-0 leading-snug">
                    {place.name}
                  </p>
                  {place.address ? (
                    <p className="mt-1 text-sm text-[#6B7280] m-0 leading-snug">
                      {place.address}
                    </p>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.6875rem] tracking-wide text-[#9CA3AF] m-0">
            {copy.attribution}
          </p>
        </>
      ) : null}
    </section>
  );
}
