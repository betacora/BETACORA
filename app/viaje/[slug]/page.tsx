import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SharedTrip = {
  slug: string;
  destination: string | null;
  duration_label: string | null;
  profile_type: string | null;
  highlights: string[] | null;
  places: Array<{
    name: string;
    lat: number;
    lng: number;
    type?: string;
    day?: number | string | null;
  }> | null;
  itinerary_html: string | null;
  lang: string | null;
  created_at: string;
};

const COPY = {
  es: {
    eyebrow: "Viaje compartido",
    back: "Crear el mío",
    duration: "Duración",
    archetype: "Perfil",
    highlights: "Destacados",
    map: "Mapa",
    empty: "Este viaje ya no está disponible.",
    cta: "Descubre tu propio perfil viajero en BeTacora",
  },
  en: {
    eyebrow: "Shared trip",
    back: "Create mine",
    duration: "Duration",
    archetype: "Profile",
    highlights: "Highlights",
    map: "Map",
    empty: "This trip is no longer available.",
    cta: "Discover your own traveler profile on BeTacora",
  },
  fr: {
    eyebrow: "Voyage partagé",
    back: "Créer le mien",
    duration: "Durée",
    archetype: "Profil",
    highlights: "Temps forts",
    map: "Carte",
    empty: "Ce voyage n'est plus disponible.",
    cta: "Découvrez votre propre profil voyageur sur BeTacora",
  },
} as const;

type Lang = keyof typeof COPY;

function resolveLang(value: string | null | undefined): Lang {
  if (value === "en" || value === "fr" || value === "es") return value;
  return "es";
}

async function fetchSharedTrip(slug: string): Promise<SharedTrip | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("shared_trips")
    .select(
      "slug, destination, duration_label, profile_type, highlights, places, itinerary_html, lang, created_at"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as SharedTrip;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trip = await fetchSharedTrip(slug);
  const lang = resolveLang(trip?.lang);
  const dest = trip?.destination || "BeTacora";
  const archetype = trip?.profile_type ? ` · ${trip.profile_type}` : "";
  const fallbackDesc =
    lang === "en"
      ? "Shared trip on BeTacora"
      : lang === "fr"
        ? "Voyage partagé sur BeTacora"
        : "Viaje compartido en BeTacora";
  const ogFallback =
    lang === "en"
      ? "Your intelligent travel log"
      : lang === "fr"
        ? "Votre carnet de voyage intelligent"
        : "Tu bitácora inteligente";
  return {
    title: `${dest}${archetype} — BeTacora`,
    description: trip?.duration_label
      ? `${dest} · ${trip.duration_label}`
      : fallbackDesc,
    openGraph: {
      title: `${dest} — BeTacora`,
      description: trip?.profile_type || ogFallback,
    },
  };
}

function MiniMap({
  places,
  label,
}: {
  places: NonNullable<SharedTrip["places"]>;
  label: string;
}) {
  const valid = places.filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
  );
  if (!valid.length) return null;

  const lats = valid.map((p) => p.lat);
  const lngs = valid.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lngSpan = Math.max(maxLng - minLng, 0.01);
  const pad = 12;

  const points = valid.slice(0, 8).map((p, i) => {
    const x = pad + ((p.lng - minLng) / lngSpan) * (100 - pad * 2);
    const y = pad + (1 - (p.lat - minLat) / latSpan) * (56 - pad * 2);
    return { ...p, x, y, i };
  });

  return (
    <section className="mt-8" aria-label={label}>
      <h2 className="text-[0.65rem] tracking-[0.16em] uppercase text-[#2D7B7B] font-medium mb-3">
        {label}
      </h2>
      <div className="relative rounded-[8px] border border-[#E5E2DC] bg-[#F3F1EC] overflow-hidden h-44">
        <svg viewBox="0 0 100 56" className="absolute inset-0 w-full h-full" aria-hidden>
          <defs>
            <radialGradient id="g1" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="rgba(45,123,123,0.12)" />
              <stop offset="100%" stopColor="rgba(45,123,123,0)" />
            </radialGradient>
          </defs>
          <rect width="100" height="56" fill="url(#g1)" />
          <path
            d="M0 38 Q25 28 50 36 T100 30"
            fill="none"
            stroke="rgba(45,123,123,0.18)"
            strokeWidth="0.6"
          />
          <path
            d="M0 22 Q30 18 55 24 T100 16"
            fill="none"
            stroke="rgba(232,99,74,0.12)"
            strokeWidth="0.5"
          />
          {points.map((p) => (
            <g key={`${p.name}-${p.i}`}>
              <circle cx={p.x} cy={p.y} r="1.8" fill="#E8634A" />
              <circle cx={p.x} cy={p.y} r="3.2" fill="none" stroke="#E8634A" strokeOpacity="0.35" strokeWidth="0.5" />
            </g>
          ))}
        </svg>
      </div>
      <ul className="mt-3 space-y-1.5">
        {points.slice(0, 4).map((p) => (
          <li key={`${p.name}-legend`} className="text-sm text-[#1A1A1A] flex gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#E8634A] shrink-0" />
            <span>{p.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function SharedTripPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!/^[a-z0-9]{6,16}$/.test(slug)) notFound();

  const trip = await fetchSharedTrip(slug);
  if (!trip) notFound();

  const lang = resolveLang(trip.lang);
  const copy = COPY[lang];
  const highlights = Array.isArray(trip.highlights) ? trip.highlights.filter(Boolean) : [];
  const places = Array.isArray(trip.places) ? trip.places : [];

  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#1A1A1A]">
      <header className="w-full px-5 py-5 sm:px-8 md:px-12 flex items-center justify-between gap-4 border-b border-[#E5E2DC]">
        <Link href="/" className="flex items-center gap-2.5 no-underline text-[#1A1A1A]">
          <img
            src="/icon-512.png?v=4"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-[7px] object-contain"
          />
          <span className="text-xl font-medium tracking-tight">
            Be<span className="text-[#E8634A]">Tacora</span>
          </span>
        </Link>
        <Link
          href="/questionnaire"
          className="text-sm font-medium text-[#E8634A] no-underline hover:opacity-80"
        >
          {copy.back}
        </Link>
      </header>

      <article className="max-w-2xl mx-auto px-5 py-10 sm:px-8">
        <p className="text-[0.65rem] tracking-[0.16em] uppercase text-[#2D7B7B] font-medium mb-3">
          {copy.eyebrow}
        </p>
        <h1 className="text-[1.75rem] sm:text-[2.1rem] font-medium tracking-tight leading-tight">
          {trip.destination || "BeTacora"}
        </h1>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#6B6B6B]">
          {trip.duration_label ? (
            <span>
              <span className="text-[#9a9590]">{copy.duration}: </span>
              {trip.duration_label}
            </span>
          ) : null}
          {trip.profile_type ? (
            <span>
              <span className="text-[#9a9590]">{copy.archetype}: </span>
              {trip.profile_type}
            </span>
          ) : null}
        </div>

        {highlights.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-[0.65rem] tracking-[0.16em] uppercase text-[#2D7B7B] font-medium mb-3">
              {copy.highlights}
            </h2>
            <ul className="space-y-2">
              {highlights.map((h) => (
                <li
                  key={h}
                  className="rounded-[7px] border border-[#E5E2DC] bg-white px-4 py-3 text-[0.95rem] leading-snug"
                >
                  {h}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <MiniMap places={places} label={copy.map} />

        {trip.itinerary_html ? (
          <section
            className="mt-10 prose-viaje"
            dangerouslySetInnerHTML={{ __html: trip.itinerary_html }}
          />
        ) : null}

        <div className="mt-12 pt-8 border-t border-[#E5E2DC] text-center">
          <p className="text-sm text-[#6B6B6B] mb-4">{copy.cta}</p>
          <Link
            href="/questionnaire"
            className="inline-flex px-8 py-3.5 rounded-[7px] bg-[#E8634A] text-white font-medium text-sm no-underline hover:opacity-90"
          >
            {copy.back}
          </Link>
        </div>
      </article>
    </main>
  );
}
