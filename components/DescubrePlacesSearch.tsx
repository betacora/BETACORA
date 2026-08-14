"use client";

import { useId, useState, type FormEvent } from "react";
import type { AppLang } from "@/lib/lang";
import type { PlaceSearchResult } from "@/lib/places";

type PlacesCopy = {
  title: string;
  subtitle: string;
  placeholder: string;
  submit: string;
  loading: string;
  empty: string;
  error: string;
  rateLimited: string;
  attribution: string;
  ratingLabel: string;
  reviewsLabel: string;
  openMaps: string;
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
  copy: PlacesCopy;
};

function formatRating(rating: number, lang: AppLang): string {
  return new Intl.NumberFormat(lang, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rating);
}

function reviewsLabel(template: string, n: number, lang: AppLang): string {
  return template.replace("{n}", n.toLocaleString(lang));
}

export function DescubrePlacesSearch({ lang, copy }: Props) {
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
        if (res.status === 429 || err.code === "rate_limited") {
          setErrorMessage(copy.rateLimited);
        } else if (err.code === "rate_limit_unavailable") {
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

  const showList = status === "done" && places.length > 0;

  return (
    <section className="mb-10" aria-labelledby={headingId}>
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
          className="min-w-0 flex-1 rounded-[7px] border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-[border-color] focus:border-[#2D7B7B]"
        />
        <button
          type="submit"
          disabled={status === "loading" || !query.trim()}
          className="inline-flex shrink-0 items-center justify-center rounded-[7px] bg-[#2D7B7B] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
                {place.mapsUrl ? (
                  <a
                    href={place.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block no-underline text-[#111827] hover:text-[#2D7B7B]"
                    aria-label={`${place.name}. ${copy.openMaps}`}
                  >
                    <PlaceRow place={place} lang={lang} copy={copy} />
                  </a>
                ) : (
                  <PlaceRow place={place} lang={lang} copy={copy} />
                )}
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

function PlaceRow({
  place,
  lang,
  copy,
}: {
  place: PlaceSearchResult;
  lang: AppLang;
  copy: PlacesCopy;
}) {
  return (
    <>
      <p className="text-[0.9375rem] font-medium m-0 leading-snug">
        {place.name}
      </p>
      {place.rating != null ? (
        <p className="mt-1 text-sm text-[#2D7B7B] m-0">
          <span className="sr-only">{copy.ratingLabel}: </span>
          {formatRating(place.rating, lang)}
          {place.ratingCount != null ? (
            <span className="text-[#9CA3AF]">
              {" "}
              ({reviewsLabel(copy.reviewsLabel, place.ratingCount, lang)})
            </span>
          ) : null}
        </p>
      ) : null}
      {place.address ? (
        <p className="mt-1 text-sm text-[#6B7280] m-0 leading-snug">
          {place.address}
        </p>
      ) : null}
    </>
  );
}
