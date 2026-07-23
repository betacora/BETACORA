"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { LoginPrompt } from "@/components/LoginPrompt";
import { detectLang, NAV_COPY, type AppLang } from "@/lib/lang";
import { useAuth } from "@/lib/useAuth";
import { listUserItineraries, type SavedItinerary } from "@/lib/itineraries";
import { supabase } from "@/lib/supabase";

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

  return (
    <>
      <AppHeader title={copy.title} />
      <main className="flex-1 px-4 py-6 sm:px-6 max-w-lg mx-auto w-full">
        {authLoading || (isLoggedIn && loading) ? (
          <p className="text-sm text-[#6B6B6B] text-center py-12 m-0">
            {copy.loading}
          </p>
        ) : !isLoggedIn ? (
          <LoginPrompt
            title={copy.loginTitle}
            body={copy.loginBody}
            cta={copy.loginCta}
            href="/auth?next=/viajes"
          />
        ) : trips.length === 0 ? (
          <div className="rounded-[8px] border border-[#E5E2DC] bg-white p-7 text-center">
            <p className="text-lg font-medium text-[#1A1A1A] m-0">
              {copy.emptyTitle}
            </p>
            <p className="mt-2.5 text-sm text-[#6B6B6B] leading-relaxed m-0">
              {copy.emptyBody}
            </p>
            <Link
              href="/explorar"
              className="mt-6 inline-flex w-full max-w-xs justify-center px-6 py-3 rounded-[7px] bg-[#E8634A] text-white font-medium text-sm no-underline hover:opacity-90"
            >
              {copy.emptyCta}
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3 list-none m-0 p-0">
            {trips.map((trip) => (
              <li key={trip.id}>
                <Link
                  href={`/viajes/${trip.id}`}
                  className="block rounded-[8px] border border-[#E5E2DC] bg-white p-4 no-underline hover:border-[#d5d0c8] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-medium text-[#1A1A1A] m-0 truncate">
                        {trip.destination || copy.untitled}
                      </p>
                      {trip.profile_type ? (
                        <p className="mt-1 text-sm text-[#2D7B7B] m-0 truncate">
                          {trip.profile_type}
                        </p>
                      ) : null}
                      <p className="mt-1.5 text-xs text-[#6B6B6B] m-0">
                        {formatDate(trip.created_at, lang)}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-[#E8634A] mt-0.5">
                      {copy.openTrip}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
