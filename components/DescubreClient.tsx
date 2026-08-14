"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { DescubrePlacesSearch } from "@/components/DescubrePlacesSearch";
import type { FeedTripCard, FeedTripPlace } from "@/lib/shared-trips-feed";
import { detectLang, NAV_COPY, type AppLang } from "@/lib/lang";

function CardMap({ places }: { places: FeedTripPlace[] }) {
  const valid = places.filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng),
  );
  if (!valid.length) {
    return (
      <div
        className="h-28 w-full rounded-[8px] border border-[#E5E5E5] bg-gradient-to-br from-[#F7FAFA] to-[#FFFFFF]"
        aria-hidden
      />
    );
  }

  const lats = valid.map((p) => p.lat);
  const lngs = valid.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lngSpan = Math.max(maxLng - minLng, 0.01);
  const pad = 10;

  const points = valid.slice(0, 6).map((p, i) => {
    const x = pad + ((p.lng - minLng) / lngSpan) * (100 - pad * 2);
    const y = pad + (1 - (p.lat - minLat) / latSpan) * (56 - pad * 2);
    return { x, y, i, name: p.name };
  });

  return (
    <div className="relative h-28 w-full overflow-hidden rounded-[8px] border border-[#E5E5E5] bg-white">
      <svg
        viewBox="0 0 100 56"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <radialGradient id="feedMapGlow" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="rgba(45,123,123,0.14)" />
            <stop offset="100%" stopColor="rgba(45,123,123,0)" />
          </radialGradient>
        </defs>
        <rect width="100" height="56" fill="url(#feedMapGlow)" />
        <path
          d="M0 38 Q25 28 50 36 T100 30"
          fill="none"
          stroke="rgba(45,123,123,0.2)"
          strokeWidth="0.6"
        />
        {points.map((p) => (
          <g key={`${p.name}-${p.i}`}>
            <circle cx={p.x} cy={p.y} r="1.8" fill="#E8634A" />
            <circle
              cx={p.x}
              cy={p.y}
              r="3.2"
              fill="none"
              stroke="#E8634A"
              strokeOpacity="0.35"
              strokeWidth="0.5"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

function TripCard({
  trip,
  copy,
}: {
  trip: FeedTripCard;
  copy: (typeof NAV_COPY)[AppLang]["descubre"];
}) {
  const destination = trip.destination || copy.untitled;
  const highlight = trip.highlights[0];

  return (
    <Link
      href={`/viaje/${trip.slug}`}
      className="group flex flex-col rounded-[10px] border border-[#E5E5E5] bg-white p-3.5 no-underline text-[#1A1A1A] transition-colors hover:border-[#D4D4D4]"
    >
      <CardMap places={trip.places} />
      <p className="mt-3 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[#2D7B7B] m-0">
        {trip.profile_type || copy.archetypeFallback}
      </p>
      <h2 className="mt-1.5 text-[1.05rem] font-medium tracking-tight leading-snug m-0 group-hover:text-[#E8634A] transition-colors">
        {destination}
      </h2>
      {trip.duration_label ? (
        <p className="mt-1.5 text-sm text-[#6B6B6B] m-0">{trip.duration_label}</p>
      ) : null}
      {highlight ? (
        <p className="mt-2 text-sm text-[#6B6B6B] leading-snug m-0 line-clamp-2">
          {highlight}
        </p>
      ) : null}
      <span className="mt-3 text-sm font-medium text-[#2D7B7B]">{copy.openTrip}</span>
    </Link>
  );
}

export function DescubreClient({ trips }: { trips: FeedTripCard[] }) {
  const [lang, setLang] = useState<AppLang>("es");
  useEffect(() => {
    setLang(detectLang("es"));
  }, []);
  const copy = NAV_COPY[lang].descubre;

  return (
    <>
      <AppHeader title={NAV_COPY[lang].tabs.descubre} />
      <main className="flex-1 px-5 py-8 sm:px-8 max-w-3xl mx-auto w-full">
        <DescubrePlacesSearch lang={lang} copy={copy.places} />

        <header className="mb-8">
          <h1 className="text-xl font-medium tracking-tight text-[#1A1A1A] m-0">
            {copy.places.feedTitle}
          </h1>
          <p className="mt-2 text-[0.9375rem] text-[#6B6B6B] leading-relaxed m-0">
            {copy.subtitle}
          </p>
          <p className="mt-3 text-xs text-[#9CA3AF] leading-relaxed m-0">
            {copy.privacyNote}
          </p>
        </header>

        {trips.length === 0 ? (
          <div className="rounded-[10px] border border-[#E5E5E5] bg-white px-5 py-12 text-center">
            <h2 className="text-base font-medium text-[#1A1A1A] m-0">
              {copy.emptyTitle}
            </h2>
            <p className="mt-2 text-sm text-[#6B6B6B] leading-relaxed m-0">
              {copy.emptyBody}
            </p>
            <Link
              href="/explorar?mode=trip"
              className="inline-flex mt-6 px-6 py-3 rounded-[7px] bg-[#E8634A] text-white text-sm font-medium no-underline hover:opacity-90"
            >
              {copy.emptyCta}
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 m-0 p-0 list-none">
            {trips.map((trip) => (
              <li key={trip.slug}>
                <TripCard trip={trip} copy={copy} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
