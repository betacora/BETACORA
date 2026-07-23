"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { LoginPrompt } from "@/components/LoginPrompt";
import {
  TravelerProfileCard,
  type TravelerProfileData,
} from "@/components/TravelerProfileCard";
import { detectLang, NAV_COPY, type AppLang } from "@/lib/lang";
import { useAuth } from "@/lib/useAuth";
import { getLatestTravelerProfile } from "@/lib/itineraries";
import { supabase } from "@/lib/supabase";

export default function PerfilPage() {
  const { isLoggedIn, loading: authLoading, signOut } = useAuth();
  const [lang, setLang] = useState<AppLang>("es");
  const [profile, setProfile] = useState<TravelerProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLang(detectLang("es"));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (authLoading) return;
      if (!isLoggedIn) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const latest = await getLatestTravelerProfile(supabase);
      if (cancelled) return;
      if (latest?.profile_type) {
        setProfile({
          profile_type: latest.profile_type,
          profile_essence: latest.profile_essence,
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn]);

  const copy = NAV_COPY[lang].perfil;

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
            href="/auth?next=/perfil"
          />
        ) : profile ? (
          <div className="flex flex-col gap-4">
            <TravelerProfileCard lang={lang} profile={profile} />
            <Link
              href="/explorar?mode=discover"
              className="w-full text-center py-2.5 text-sm text-[#2D7B7B] no-underline hover:opacity-80"
            >
              {copy.updateProfile}
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full py-3 rounded-[7px] border border-[#E5E2DC] bg-white text-sm font-medium text-[#6B6B6B] cursor-pointer hover:text-[#1A1A1A] transition-colors"
            >
              {copy.logout}
            </button>
          </div>
        ) : (
          <div className="rounded-[8px] border border-[#E5E2DC] bg-white p-7 text-center">
            <p className="text-lg font-medium text-[#1A1A1A] m-0">
              {copy.emptyTitle}
            </p>
            <Link
              href="/explorar?mode=discover"
              className="mt-6 inline-flex w-full max-w-xs justify-center px-6 py-3 rounded-[7px] bg-[#E8634A] text-white font-medium text-sm no-underline hover:opacity-90"
            >
              {copy.emptyCta}
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="mt-4 w-full py-2.5 text-sm text-[#6B6B6B] bg-transparent border-0 cursor-pointer"
            >
              {copy.logout}
            </button>
          </div>
        )}
      </main>
    </>
  );
}
