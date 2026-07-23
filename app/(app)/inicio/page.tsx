"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BrandWordmark } from "@/components/BrandWordmark";
import { detectLang, NAV_COPY, type AppLang } from "@/lib/lang";
import { useAuth } from "@/lib/useAuth";
import { getLatestTravelerProfile } from "@/lib/itineraries";
import { supabase } from "@/lib/supabase";

export default function InicioPage() {
  const { user, loading: authLoading, isLoggedIn } = useAuth();
  const [lang, setLang] = useState<AppLang>("es");
  const [archetype, setArchetype] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    setLang(detectLang("es"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (authLoading) return;
      if (!isLoggedIn) {
        setArchetype(null);
        setLoadingProfile(false);
        return;
      }
      setLoadingProfile(true);
      const profile = await getLatestTravelerProfile(supabase);
      if (!cancelled) {
        setArchetype(profile?.profile_type ?? null);
        setLoadingProfile(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn, user?.id]);

  const copy = NAV_COPY[lang].inicio;
  const greeting =
    archetype && !loadingProfile
      ? copy.greetingNamed.replace("{name}", archetype)
      : copy.greetingGeneric;

  return (
    <>
      <AppHeader />
      <main className="flex-1 flex flex-col px-5 pt-10 pb-8 sm:px-8 max-w-lg mx-auto w-full">
        <div className="flex flex-col items-start">
          <BrandWordmark className="text-2xl font-medium tracking-tight" />
          <h1 className="mt-6 text-[1.65rem] sm:text-[1.85rem] font-medium tracking-tight leading-snug text-[#1A1A1A] m-0">
            {authLoading || loadingProfile ? "…" : greeting}
          </h1>
          <p className="mt-3 text-[0.95rem] text-[#6B6B6B] leading-relaxed m-0">
            {copy.sub}
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-3 w-full">
          <Link
            href={archetype ? "/explorar?mode=trip" : "/explorar?mode=discover"}
            className="w-full text-center px-6 py-3.5 rounded-[7px] bg-[#E8634A] text-white font-medium text-base no-underline hover:opacity-90 transition-opacity"
          >
            {archetype ? copy.startTrip : copy.discoverProfile}
          </Link>
          {archetype ? (
            <Link
              href="/perfil"
              className="w-full text-center px-6 py-3.5 rounded-[7px] border border-[#E5E2DC] bg-white text-[#1A1A1A] font-medium text-base no-underline hover:border-[#d5d0c8] transition-colors"
            >
              {copy.viewProfile}
            </Link>
          ) : null}
          <Link
            href="/viajes"
            className="w-full text-center px-6 py-3 rounded-[7px] text-[#2D7B7B] font-medium text-sm no-underline hover:opacity-80"
          >
            {copy.myTrips}
          </Link>
        </div>
      </main>
    </>
  );
}
