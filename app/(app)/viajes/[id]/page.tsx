"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { LoginPrompt } from "@/components/LoginPrompt";
import { detectLang, NAV_COPY, type AppLang } from "@/lib/lang";
import { useAuth } from "@/lib/useAuth";
import { getItineraryById, type SavedItinerary } from "@/lib/itineraries";
import { supabase } from "@/lib/supabase";

export default function ViajeDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [lang, setLang] = useState<AppLang>("es");
  const [trip, setTrip] = useState<SavedItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLang(detectLang("es"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (authLoading || !id) return;
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const row = await getItineraryById(supabase, id);
      if (cancelled) return;
      if (!row) setNotFound(true);
      else setTrip(row);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn, id]);

  const copy = NAV_COPY[lang].viajes;

  return (
    <>
      <AppHeader title={trip?.destination || copy.title} />
      <main className="flex-1 px-4 py-6 sm:px-6 max-w-2xl mx-auto w-full">
        {authLoading || loading ? (
          <p className="text-sm text-[#6B6B6B] text-center py-12 m-0">
            {copy.loading}
          </p>
        ) : !isLoggedIn ? (
          <LoginPrompt
            title={copy.loginTitle}
            body={copy.loginBody}
            cta={copy.loginCta}
          />
        ) : notFound || !trip ? (
          <div className="text-center py-12">
            <p className="text-[#6B6B6B] m-0">{copy.emptyTitle}</p>
            <Link
              href="/viajes"
            className="mt-4 inline-block text-sm text-[#2D7B7B] no-underline hover:opacity-80 transition-opacity duration-200"
            >
              ← {copy.title}
            </Link>
          </div>
        ) : (
          <article>
            {trip.profile_type ? (
              <p className="text-[0.65rem] tracking-[0.14em] uppercase text-[#2D7B7B] font-medium m-0 mb-2">
                {trip.profile_type}
              </p>
            ) : null}
            <h1 className="text-[1.65rem] font-medium tracking-tight text-[#1A1A1A] m-0 leading-snug">
              {trip.destination || copy.untitled}
            </h1>
            {trip.profile_essence ? (
              <p className="mt-3 text-sm text-[#6B6B6B] leading-relaxed m-0">
                {trip.profile_essence}
              </p>
            ) : null}
            {trip.itinerary_html ? (
              <div
                className="prose-viaje mt-8"
                dangerouslySetInnerHTML={{ __html: trip.itinerary_html }}
              />
            ) : (
              <p className="mt-8 text-sm text-[#6B6B6B]">{copy.emptyBody}</p>
            )}
          </article>
        )}
      </main>
    </>
  );
}
