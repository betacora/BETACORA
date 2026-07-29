"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandWordmark } from "@/components/BrandWordmark";
import { FunnelEvent, trackFunnel } from "@/lib/analytics";
import {
  detectLang,
  ONBOARDING_WELCOME_COPY,
  type AppLang,
} from "@/lib/lang";
import {
  hasSeenOnboardingWelcome,
  hasTravelerDna,
  markOnboardingWelcomeSeen,
  ONBOARDING_CONTINUE_PATH,
} from "@/lib/onboardingWelcome";
import { safeNextPath } from "@/lib/safeNextPath";
import { supabase } from "@/lib/supabase";

/**
 * First-time welcome after signup/login for users without traveler DNA.
 * Shown once per user (localStorage). Returning DNA users never land here.
 */
export default function BienvenidaPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center bg-[#FFFFFF]"
          aria-busy="true"
        />
      }
    >
      <BienvenidaInner />
    </Suspense>
  );
}

function BienvenidaInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const continuePath = safeNextPath(
    searchParams.get("next"),
    ONBOARDING_CONTINUE_PATH,
  );
  const [lang, setLang] = useState<AppLang>("es");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const detected = detectLang("es");
    setLang(detected);
    document.documentElement.lang = detected;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function gate() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;

      if (!user) {
        router.replace(
          `/auth?next=${encodeURIComponent(`/bienvenida?next=${encodeURIComponent(continuePath)}`)}`,
        );
        return;
      }

      // Already has DNA → normal app (never show welcome again)
      if (await hasTravelerDna(supabase)) {
        if (!cancelled) router.replace("/inicio");
        return;
      }

      // Already seen once on this device → skip to questionnaire / next
      if (hasSeenOnboardingWelcome(user.id)) {
        if (!cancelled) router.replace(continuePath);
        return;
      }

      markOnboardingWelcomeSeen(user.id);
      trackFunnel(FunnelEvent.OnboardingWelcomeViewed, { source: "bienvenida" });
      if (!cancelled) setReady(true);
    }

    void gate();
    return () => {
      cancelled = true;
    };
  }, [continuePath, router]);

  const copy = ONBOARDING_WELCOME_COPY[lang];

  function handleContinue() {
    router.push(continuePath);
  }

  if (!ready) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-5 bg-[#FFFFFF] text-[#6B6B6B]"
        aria-busy="true"
      >
        <p className="m-0 text-sm">{copy.loading}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#1A1A1A]">
      <header className="w-full px-5 py-5 sm:px-8 border-b border-[#E5E5E5]">
        <BrandWordmark className="text-xl font-medium tracking-tight" />
      </header>

      <div className="flex-1 flex flex-col px-5 py-10 sm:px-8 max-w-lg mx-auto w-full">
        <p className="text-[0.65rem] tracking-[0.14em] uppercase text-[#2D7B7B] font-medium m-0 mb-3">
          {copy.kicker}
        </p>
        <h1 className="text-[1.65rem] sm:text-[1.85rem] font-medium tracking-tight leading-snug m-0">
          {copy.title}
        </h1>
        <p className="mt-4 text-[0.95rem] text-[#6B6B6B] leading-relaxed m-0">
          {copy.body}
        </p>

        <ul className="mt-8 space-y-3 list-none p-0 m-0">
          {[copy.bullet1, copy.bullet2, copy.bullet3].map((item) => (
            <li
              key={item}
              className="flex gap-3 text-[0.95rem] leading-snug text-[#1A1A1A]"
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#E8634A] shrink-0"
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-12">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full text-center px-6 py-3.5 rounded-[7px] bg-[#E8634A] text-white font-medium text-base border-0 cursor-pointer hover:opacity-90 transition-opacity"
          >
            {copy.cta}
          </button>
        </div>
      </div>
    </main>
  );
}
