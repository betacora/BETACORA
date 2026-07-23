"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandWordmark } from "@/components/BrandWordmark";
import { InstallAppButton } from "@/components/InstallAppButton";
import { FunnelEvent, trackFunnel } from "@/lib/analytics";
import {
  detectLang,
  persistLang,
  LANDING_COPY,
  type AppLang,
} from "@/lib/lang";
import { ABOUT_PATH } from "@/lib/site";
import { useAuth } from "@/lib/useAuth";
import { getTravelerProfile } from "@/lib/travelerProfile";
import { supabase } from "@/lib/supabase";

const LANGS: AppLang[] = ["es", "en", "fr"];
const LANG_LABEL: Record<AppLang, string> = {
  es: "ES",
  en: "EN",
  fr: "FR",
};

export function LandingPage() {
  const [lang, setLang] = useState<AppLang>("en");
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [hasProfile, setHasProfile] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    const detected = detectLang("en");
    setLang(detected);
    if (!localStorage.getItem("bt_lang")) {
      persistLang(detected);
    }
    document.documentElement.lang = detected;
    const t = window.setTimeout(() => {
      trackFunnel(FunnelEvent.LandingPageView, { lang: detected });
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (authLoading) return;
      if (!isLoggedIn) {
        if (!cancelled) {
          setHasProfile(false);
          setProfileReady(true);
        }
        return;
      }
      const profile = await getTravelerProfile(supabase);
      if (!cancelled) {
        setHasProfile(Boolean(profile?.profile_type));
        setProfileReady(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn]);

  function switchLang(next: AppLang) {
    setLang(next);
    persistLang(next);
    document.documentElement.lang = next;
  }

  const copy = LANDING_COPY[lang];
  const ctaHref = !isLoggedIn
    ? "/auth?next=/explorar"
    : hasProfile
      ? "/explorar?mode=trip"
      : "/explorar?mode=discover";
  const ctaLabel = hasProfile && isLoggedIn ? copy.ctaReturning : copy.cta;

  return (
    <main className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#1A1A1A]">
      <header className="w-full px-4 py-4 sm:px-8 md:px-12 md:py-7 flex items-center justify-between gap-2 sm:gap-4 border-b border-[#E5E2DC]">
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-2.5 no-underline text-[#1A1A1A] min-w-0"
          aria-label="BeTacora"
        >
          <img
            src="/icon-512.png?v=4"
            alt="BeTacora — bitácora inteligente de viajes"
            width={36}
            height={36}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-[7px] object-contain shrink-0"
          />
          <BrandWordmark className="text-lg sm:text-xl md:text-2xl font-medium tracking-tight truncate" />
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <InstallAppButton lang={lang} variant="header" />
          <div className="flex gap-0" role="group" aria-label="Language">
            {LANGS.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => switchLang(code)}
                className={`text-[0.7rem] sm:text-xs tracking-wide px-1.5 sm:px-2.5 py-1.5 border-0 border-b-[1.5px] bg-transparent cursor-pointer transition-colors font-normal ${
                  lang === code
                    ? "text-[#1A1A1A] border-[#E8634A]"
                    : "text-[#6B6B6B] border-transparent hover:text-[#1A1A1A]"
                }`}
                aria-pressed={lang === code}
              >
                {LANG_LABEL[code]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6 pb-24 sm:px-8 md:px-12 text-center">
        <img
          src="/icon-512.png?v=4"
          alt="BeTacora — bitácora inteligente de viajes"
          width={72}
          height={72}
          className="h-16 w-16 sm:h-[72px] sm:w-[72px] rounded-[8px] object-contain mb-10 sm:mb-12"
        />

        <h1 className="text-[1.75rem] sm:text-[2rem] md:text-[2.35rem] font-medium text-[#1A1A1A] max-w-md leading-[1.25] tracking-tight">
          {copy.tagline}
        </h1>

        <p className="mt-5 text-[0.9375rem] sm:text-base text-[#6B6B6B] max-w-sm leading-[1.65] font-normal">
          {copy.sub}
        </p>

        <div className="mt-12 sm:mt-14 flex flex-col items-center gap-3.5 w-full max-w-xs">
          <Link
            href={authLoading || !profileReady ? "/auth?next=/explorar" : ctaHref}
            onClick={() =>
              trackFunnel(FunnelEvent.QuestionnaireStarted, {
                source: "landing_cta",
                lang,
                gated: !isLoggedIn,
                returning: hasProfile,
              })
            }
            className="w-full px-8 py-3.5 sm:px-10 sm:py-4 rounded-[7px] bg-[#E8634A] text-white font-medium text-base no-underline hover:opacity-90 transition-opacity duration-200 text-center"
          >
            {authLoading || !profileReady ? copy.cta : ctaLabel}
          </Link>
          <InstallAppButton lang={lang} variant="hero" />
        </div>
      </section>

      <footer className="w-full px-6 py-8 sm:px-8 md:px-12 border-t border-[#E5E2DC] text-center">
        <p className="text-sm text-[#6B6B6B] leading-relaxed">
          <Link
            href={ABOUT_PATH[lang]}
            className="text-[#2D7B7B] no-underline hover:opacity-80 transition-opacity"
          >
            {copy.about}
          </Link>
          <span className="mx-2 text-[#E5E2DC]" aria-hidden="true">
            ·
          </span>
          <span>{copy.tagline}</span>
        </p>
      </footer>
    </main>
  );
}
