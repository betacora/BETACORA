"use client";

import { useState, type FormEvent } from "react";
import type { AppLang } from "@/lib/lang";
import { NAV_COPY } from "@/lib/lang";

type PlaceHit = {
  id: string;
  name: string;
  address: string | null;
  rating: number | null;
  ratingCount: number | null;
  mapsUrl: string | null;
};

type SearchResponse = {
  ok?: boolean;
  places?: PlaceHit[];
  count?: number;
  error?: string;
  code?: string;
};

type PlacesCopy = (typeof NAV_COPY)[AppLang]["descubre"]["places"];

function reviewsLabel(template: string, n: number): string {
  return template.replace("{n}", String(n));
}

export function DescubrePlacesSearch({
  lang,
  copy,
}: {
  lang: AppLang;
  copy: PlacesCopy;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [places, setPlaces] = useState<PlaceHit[] | null>(null);
  const [searched, setSearched] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.replace(/\s+/g, " ").trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setSearched(true);

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
      const data = (await res.json()) as SearchResponse;

      if (!res.ok || data.ok === false) {
        if (res.status === 429 || data.code === "rate_limited") {
          setError(copy.rateLimited);
        } else if (data.code === "rate_limit_unavailable") {
          setError(copy.rateLimited);
        } else {
          setError(copy.error);
        }
        setPlaces([]);
        return;
      }

      setPlaces(Array.isArray(data.places) ? data.places : []);
    } catch {
      setError(copy.error);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-10" aria-labelledby="descubre-places-title">
      <h2
        id="descubre-places-title"
        className="text-lg font-medium tracking-tight text-[#111827] m-0"
      >
        {copy.title}
      </h2>
      <p className="mt-1.5 text-sm text-[#6B7280] leading-relaxed m-0">
        {copy.subtitle}
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-4 flex flex-col sm:flex-row gap-2"
        role="search"
      >
        <label className="sr-only" htmlFor="descubre-places-q">
          {copy.title}
        </label>
        <input
          id="descubre-places-q"
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={copy.placeholder}
          autoComplete="off"
          maxLength={200}
          className="flex-1 min-w-0 rounded-[7px] border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none focus:border-[#2D7B7B] focus:ring-1 focus:ring-[#2D7B7B]"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="inline-flex items-center justify-center rounded-[7px] bg-[#2D7B7B] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:opacity-90"
        >
          {loading ? copy.searching : copy.submit}
        </button>
      </form>

      {error ? (
        <p className="mt-3 text-sm text-[#E8634A] m-0" role="alert">
          {error}
        </p>
      ) : null}

      {searched && !loading && !error && places && places.length === 0 ? (
        <p className="mt-3 text-sm text-[#6B7280] m-0">{copy.empty}</p>
      ) : null}

      {places && places.length > 0 ? (
        <>
          <ul className="mt-4 m-0 p-0 list-none divide-y divide-[#E5E7EB] border-y border-[#E5E7EB]">
            {places.map((place) => (
              <li key={place.id} className="py-3.5">
                {place.mapsUrl ? (
                  <a
                    href={place.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block no-underline text-[#111827] hover:text-[#2D7B7B]"
                  >
                    <PlaceRow place={place} copy={copy} />
                  </a>
                ) : (
                  <PlaceRow place={place} copy={copy} />
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.7rem] text-[#9CA3AF] m-0">
            {copy.attribution}
          </p>
        </>
      ) : null}
    </section>
  );
}

function PlaceRow({
  place,
  copy,
}: {
  place: PlaceHit;
  copy: PlacesCopy;
}) {
  return (
    <>
      <p className="text-[0.95rem] font-medium tracking-tight m-0 leading-snug">
        {place.name}
      </p>
      {place.address ? (
        <p className="mt-1 text-sm text-[#6B7280] m-0 leading-snug">
          {place.address}
        </p>
      ) : null}
      {typeof place.rating === "number" ? (
        <p className="mt-1.5 text-xs text-[#6B7280] m-0">
          <span className="text-[#111827] font-medium">
            {place.rating.toFixed(1)}
          </span>
          <span className="mx-1.5 text-[#D1D5DB]" aria-hidden>
            ·
          </span>
          <span className="sr-only">{copy.ratingLabel}: </span>
          {typeof place.ratingCount === "number"
            ? reviewsLabel(copy.reviewsLabel, place.ratingCount)
            : copy.ratingLabel}
        </p>
      ) : null}
    </>
  );
}
