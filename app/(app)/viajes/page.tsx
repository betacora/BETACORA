"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookPlus, Filter } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { LoginPrompt } from "@/components/LoginPrompt";
import { detectLang, NAV_COPY, type AppLang } from "@/lib/lang";
import { useAuth } from "@/lib/useAuth";
import { listUserItineraries, type SavedItinerary } from "@/lib/itineraries";
import { supabase } from "@/lib/supabase";

type ViajesCopy = (typeof NAV_COPY)[AppLang]["viajes"];

function formatDate(iso: string, lang: AppLang) {
  try {
    const locale = lang === "en" ? "en-US" : lang === "fr" ? "fr-FR" : "es-ES";
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function formatMonthYear(iso: string, lang: AppLang) {
  try {
    const locale = lang === "en" ? "en-US" : lang === "fr" ? "fr-FR" : "es-ES";
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    })
      .format(new Date(iso))
      .toUpperCase();
  } catch {
    return iso.slice(0, 7);
  }
}

function TripCover({ label }: { label: string }) {
  const initial = (label.trim().charAt(0) || "B").toUpperCase();
  return (
    <div
      className="relative aspect-[16/9] w-full overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-[#F3F4F6]"
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 18% 28%, rgba(17,24,39,0.05), transparent 58%), radial-gradient(ellipse 50% 40% at 88% 78%, rgba(17,24,39,0.03), transparent 55%), #F9FAFB",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl font-semibold tracking-tight text-[#111827]/10">
          {initial}
        </span>
      </div>
    </div>
  );
}

function FeaturedTrip({
  trip,
  copy,
  lang,
}: {
  trip: SavedItinerary;
  copy: ViajesCopy;
  lang: AppLang;
}) {
  const title = trip.destination || copy.untitled;
  return (
    <Link
      href={`/viajes/${trip.id}`}
      className="group block rounded-[10px] border border-[#E5E7EB] bg-white p-3 no-underline transition-colors hover:border-[#D1D5DB] sm:p-4"
    >
      <div className="relative">
        <TripCover label={title} />
        <span className="absolute left-3 top-3 inline-flex items-center rounded-md border border-[#E5E7EB] bg-white/95 px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-[#111827]">
          {copy.latestBadge}
        </span>
      </div>
      <div className="mt-3.5 flex flex-col gap-1.5 px-0.5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h3 className="m-0 text-[1.15rem] font-semibold tracking-tight text-[#111827] leading-snug group-hover:text-[#E8634A] transition-colors">
            {title}
          </h3>
          {trip.profile_type ? (
            <p className="mt-1.5 m-0 text-sm text-[#6B7280] truncate">
              {trip.profile_type}
            </p>
          ) : null}
          {trip.profile_essence ? (
            <p className="mt-2 m-0 text-sm text-[#6B7280] leading-relaxed line-clamp-2">
              {trip.profile_essence}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="m-0 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-[#6B7280]">
            {formatDate(trip.created_at, lang)}
          </p>
          <p className="mt-1 m-0 text-xs font-medium text-[#111827]">
            {copy.openTrip}
          </p>
        </div>
      </div>
    </Link>
  );
}

function MemoryCard({
  trip,
  copy,
  lang,
}: {
  trip: SavedItinerary;
  copy: ViajesCopy;
  lang: AppLang;
}) {
  const title = trip.destination || copy.untitled;
  return (
    <Link
      href={`/viajes/${trip.id}`}
      className="group flex flex-col rounded-[10px] border border-[#E5E7EB] bg-white p-3 no-underline transition-colors hover:border-[#D1D5DB]"
    >
      <div className="relative">
        <TripCover label={title} />
        <span className="absolute left-2.5 top-2.5 inline-flex items-center rounded-md border border-[#E5E7EB] bg-white/95 px-2 py-0.5 text-[0.58rem] font-medium uppercase tracking-[0.1em] text-[#6B7280]">
          {formatMonthYear(trip.created_at, lang)}
        </span>
      </div>
      <h3 className="mt-3 m-0 text-[0.98rem] font-medium tracking-tight text-[#111827] leading-snug group-hover:text-[#E8634A] transition-colors line-clamp-2">
        {title}
      </h3>
      <p className="mt-1.5 m-0 text-xs text-[#6B7280]">
        {trip.profile_type || formatDate(trip.created_at, lang)}
      </p>
    </Link>
  );
}

function NewJournalCard({ copy }: { copy: ViajesCopy }) {
  return (
    <Link
      href="/explorar"
      className="flex min-h-[11.5rem] flex-col items-center justify-center gap-2.5 rounded-[10px] border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4 py-6 text-center no-underline transition-colors hover:border-[#E8634A]/50 hover:bg-white"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-white text-[#6B7280]">
        <BookPlus className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="text-[0.98rem] font-medium tracking-tight text-[#111827]">
        {copy.newJournalTitle}
      </span>
      <span className="max-w-[14rem] text-xs leading-relaxed text-[#6B7280]">
        {copy.newJournalBody}
      </span>
    </Link>
  );
}

export default function ViajesPage() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [lang, setLang] = useState<AppLang>("es");
  const [trips, setTrips] = useState<SavedItinerary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLang(detectLang("es"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (authLoading) return;
      if (!isLoggedIn) {
        setTrips([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const rows = await listUserItineraries(supabase);
      if (!cancelled) {
        setTrips(rows);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn]);

  const copy = NAV_COPY[lang].viajes;
  const featured = trips[0] ?? null;
  const memories = useMemo(() => trips.slice(1), [trips]);

  return (
    <>
      <AppHeader title={copy.title} />
      <main className="flex-1 w-full bg-[#F9FAFB]">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {authLoading || (isLoggedIn && loading) ? (
            <p className="text-sm text-[#6B7280] text-center py-12 m-0">
              {copy.loading}
            </p>
          ) : !isLoggedIn ? (
            <div className="max-w-lg mx-auto">
              <LoginPrompt
                title={copy.loginTitle}
                body={copy.loginBody}
                cta={copy.loginCta}
                href="/auth?next=/viajes"
              />
            </div>
          ) : (
            <>
              <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="m-0 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-[#6B7280]">
                    {copy.eyebrow}
                  </p>
                  <h1 className="mt-2 m-0 text-[1.85rem] sm:text-[2.15rem] font-semibold tracking-tight text-[#111827] leading-[1.15]">
                    {copy.title}
                  </h1>
                  <p className="mt-2.5 m-0 max-w-xl text-sm text-[#6B7280] leading-relaxed">
                    {copy.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#E5E7EB] bg-white px-3 py-2 text-xs font-medium text-[#111827]">
                    {copy.sortRecent}
                  </span>
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-white text-[#6B7280]"
                    aria-hidden
                  >
                    <Filter className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                </div>
              </header>

              <div className="mt-6 flex items-center gap-5 border-b border-[#E5E7EB]">
                <span className="relative pb-2.5 text-sm font-medium text-[#111827]">
                  {copy.tabJournals}
                  <span className="absolute inset-x-0 -bottom-px h-px bg-[#E8634A]" />
                </span>
              </div>

              {trips.length === 0 ? (
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2 lg:col-span-2 rounded-[10px] border border-[#E5E7EB] bg-white p-7 text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:gap-6">
                    <div>
                      <p className="text-lg font-medium text-[#111827] m-0">
                        {copy.emptyTitle}
                      </p>
                      <p className="mt-2.5 text-sm text-[#6B7280] leading-relaxed m-0 max-w-md">
                        {copy.emptyBody}
                      </p>
                    </div>
                    <Link
                      href="/explorar"
                      className="mt-5 sm:mt-0 inline-flex shrink-0 justify-center px-6 py-3 rounded-[8px] bg-[#E8634A] text-white font-medium text-sm no-underline hover:opacity-90"
                    >
                      {copy.emptyCta}
                    </Link>
                  </div>
                  <NewJournalCard copy={copy} />
                </div>
              ) : (
                <>
                  {featured ? (
                    <section className="mt-8">
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[#2D7B7B]"
                          aria-hidden
                        />
                        <h2 className="m-0 text-sm font-medium text-[#111827]">
                          {copy.inProgress}
                        </h2>
                      </div>
                      <FeaturedTrip trip={featured} copy={copy} lang={lang} />
                    </section>
                  ) : null}

                  <section className="mt-9">
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-[#D1D5DB]"
                        aria-hidden
                      />
                      <h2 className="m-0 text-sm font-medium text-[#111827]">
                        {copy.recentMemories}
                      </h2>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {memories.map((trip) => (
                        <MemoryCard
                          key={trip.id}
                          trip={trip}
                          copy={copy}
                          lang={lang}
                        />
                      ))}
                      <NewJournalCard copy={copy} />
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
