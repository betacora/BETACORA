/**
 * Official BeTacora sample trips for Descubre.
 *
 * Contract:
 * - shared_trips rows use user_id = null (system content, not a fake person).
 * - Flags: show_in_feed = true, is_example = true (see migrations).
 * - Feed + /viaje/[slug] must show EXAMPLE_BADGE when is_example / example slug.
 * - Safe cleanup: DELETE FROM shared_trips WHERE is_example = true;
 * - Fixed slugs below are stable; seed upserts by slug.
 */

import type { FeedTripCard, FeedTripPlace } from "@/lib/shared-trips-feed";

export const EXAMPLE_TRIP_SLUGS = [
  "ejemplogastro1",
  "ejemplonatura1",
] as const;

export type ExampleTripSlug = (typeof EXAMPLE_TRIP_SLUGS)[number];

/** Visible honesty label — keep short for feed cards. */
export const EXAMPLE_BADGE = {
  es: {
    short: "Ejemplo",
    full: "Ejemplo · Creado por BeTacora",
    eyebrow: "Contenido de muestra BeTacora",
  },
  en: {
    short: "Example",
    full: "Example · Created by BeTacora",
    eyebrow: "BeTacora sample content",
  },
  fr: {
    short: "Exemple",
    full: "Exemple · Créé par BeTacora",
    eyebrow: "Contenu d'exemple BeTacora",
  },
} as const;

export type ExampleBadgeLang = keyof typeof EXAMPLE_BADGE;

export function resolveExampleBadgeLang(
  value: string | null | undefined,
): ExampleBadgeLang {
  if (value === "en" || value === "fr" || value === "es") return value;
  return "es";
}

export function isExampleTripSlug(slug: string): boolean {
  return (EXAMPLE_TRIP_SLUGS as readonly string[]).includes(slug);
}

export function isExampleSharedTrip(row: {
  is_example?: boolean | null;
  slug?: string | null;
}): boolean {
  if (row.is_example === true) return true;
  if (row.slug && isExampleTripSlug(row.slug)) return true;
  return false;
}

/**
 * Built-in feed cards so Descubre is never empty before migrations/seed flags land.
 * Full HTML lives in shared_trips (and data/example-trips/*.json); cards stay lean.
 */
export const OFFICIAL_EXAMPLE_FEED_CARDS: FeedTripCard[] = [
  {
    slug: "ejemplogastro1",
    destination: "Ciudad de México",
    duration_label: "5 días",
    profile_type: "El Navegante Gastronómico Chilango",
    highlights: [
      "Colonia Roma Norte",
      "Colonia Condesa",
      "El Cardenal – Centro Histórico",
    ],
    places: [
      {
        name: "Colonia Roma Norte",
        lat: 19.4194,
        lng: -99.1594,
        type: "sight",
        day: 1,
      },
      {
        name: "Colonia Condesa",
        lat: 19.4116,
        lng: -99.1741,
        type: "sight",
        day: 1,
      },
      {
        name: "El Cardenal – Centro Histórico",
        lat: 19.4326,
        lng: -99.1332,
        type: "food",
        day: 2,
      },
      {
        name: "Mercado de La Merced",
        lat: 19.4236,
        lng: -99.1207,
        type: "sight",
        day: 2,
      },
      {
        name: "El Jarocho – Coyoacán",
        lat: 19.3502,
        lng: -99.1623,
        type: "food",
        day: 3,
      },
    ] satisfies FeedTripPlace[],
    lang: "es",
    created_at: "2026-07-30T00:00:00.000Z",
    is_example: true,
  },
  {
    slug: "ejemplonatura1",
    destination: "Patagonia Argentina — El Calafate y El Chaltén",
    duration_label: "6 días",
    profile_type: "El Guardián de los Hielos del Sur",
    highlights: [
      "El Calafate — centro",
      "Glaciar Perito Moreno — Pasarelas",
      "Parque Nacional Los Glaciares — Zona Sur",
    ],
    places: [
      {
        name: "El Calafate — centro",
        lat: -50.3397,
        lng: -72.2653,
        type: "sight",
        day: 1,
      },
      {
        name: "Glaciar Perito Moreno — Pasarelas",
        lat: -50.4969,
        lng: -73.0392,
        type: "sight",
        day: 2,
      },
      {
        name: "El Chaltén — pueblo",
        lat: -49.3311,
        lng: -72.8868,
        type: "sight",
        day: 3,
      },
      {
        name: "Laguna Torre — sendero",
        lat: -49.3067,
        lng: -72.9531,
        type: "sight",
        day: 3,
      },
      {
        name: "Laguna de los Tres — sendero",
        lat: -49.2739,
        lng: -72.9908,
        type: "sight",
        day: 4,
      },
    ] satisfies FeedTripPlace[],
    lang: "es",
    created_at: "2026-07-30T00:00:01.000Z",
    is_example: true,
  },
];

/** Merge DB feed with official samples; DB wins on slug collision. */
export function mergeDiscoverFeedWithExamples(
  trips: FeedTripCard[],
  limit = 24,
): FeedTripCard[] {
  const bySlug = new Map<string, FeedTripCard>();
  for (const card of OFFICIAL_EXAMPLE_FEED_CARDS) {
    bySlug.set(card.slug, card);
  }
  for (const trip of trips) {
    bySlug.set(trip.slug, {
      ...trip,
      is_example: trip.is_example || isExampleTripSlug(trip.slug),
    });
  }
  return [...bySlug.values()]
    .sort((a, b) => {
      // Keep examples visible near the top while the organic feed is thin
      if (a.is_example !== b.is_example) return a.is_example ? -1 : 1;
      return String(b.created_at).localeCompare(String(a.created_at));
    })
    .slice(0, limit);
}
