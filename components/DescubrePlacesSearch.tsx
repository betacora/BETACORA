"use client";

import { useId, useState, type FormEvent } from "react";
import type { AppLang } from "@/lib/lang";
import type { PlaceSearchResult } from "@/lib/places";

type PlacesCopy = {
  title: string;
  placeholder: string;
  submit: string;
  loading: string;
  empty: string;
  error: string;
  attribution: string;
  ratingLabel: string;
};

type SearchOk = {
  ok: true;
  places: PlaceSearchResult[];
  count: number;
};

type SearchErr = {
  ok: false;
  error?: string;
  code?: string;
};

type Props = {
  lang: AppLang;
  copy: PlacesCopy;
};

function formatRating(rating: number, lang: AppLang): string {
  return new Intl.NumberFormat(lang, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rating);
}

export function DescubrePlacesSearch({ lang, copy }: Props) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [places, setPlaces] = useState<PlaceSearchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.replace(/\s+/g, " ").trim();
    if (!q) {
      setStatus("idle");
      setPlaces([]);
      setErrorMessage(null);
      return;
    }

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

      if (!res.ok || !data.ok) {
        const err = data as SearchErr;
        setPlaces([]);
        setErrorMessage(err.error?.trim() || copy.error);
        setStatus("error");
        return;
      }

      setPlaces(data.places);
      setStatus("done");
    } catch {
      setPlaces([]);
      setErrorMessage(copy.error);
      setStatus("error");
    }
  }

  const showList = status === "done" && places.length > 0;

  return (
    <section
      className="mb-10"
      aria-labelledby={`${inputId}-heading`}
    >
      <h2
        id={`${inputId}-heading`}
        className="text-base font-medium tracking-tight text-[#111827] m-0"
      >
        {copy.title}
      </h2>

      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch"
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
          className="min-w-0 flex-1 rounded-[7px] border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-[border-color,box-shadow] focus:border-[#2D7B7B] focus:shadow-[0_0_0_3px_rgba(45,123,123,0.18)]"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex shrink-0 items-center justify-center rounded-[7px] bg-[#2D7B7B] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
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
          <ul className="mt-4 m-0 p-0 list-none divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
            {places.map((place) => (
              <li key={place.id} className="py-3.5 first:pt-3 last:pb-3">
                <p className="text-[0.9375rem] font-medium text-[#111827] m-0 leading-snug">
                  {place.name}
                </p>
                {place.rating != null ? (
                  <p className="mt-1 text-sm text-[#2D7B7B] m-0">
                    <span className="sr-only">{copy.ratingLabel}: </span>
                    {formatRating(place.rating, lang)}
                    {place.ratingCount != null ? (
                      <span className="text-[#9CA3AF]">
                        {" "}
                        ({place.ratingCount.toLocaleString(lang)})
                      </span>
                    ) : null}
                  </p>
                ) : null}
                {place.address ? (
                  <p className="mt-1 text-sm text-[#6B7280] m-0 leading-snug">
                    {place.address}
                  </p>
                ) : null}
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
