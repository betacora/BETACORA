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
import { ABOUT_PATH, PRIVACY_PATH, TERMS_PATH } from "@/lib/site";
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
  const [accountDeleted, setAccountDeleted] = useState(false);

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
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("account") === "deleted") {
      setAccountDeleted(true);
      params.delete("account");
      const next = params.toString();
      const clean = `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", clean);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const params = new URLSearchParams(hash.slice(1));
    const isAuthReturn =
      params.has("access_token") ||
      params.get("type") === "signup" ||
      params.get("type") === "email" ||
      params.has("error") ||
      params.has("error_code");
    if (!isAuthReturn) return;
    window.location.replace(`/auth/callback?confirmed=1&next=/inicio${hash}`);
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
  const primaryHref = !isLoggedIn
    ? "/auth?next=/explorar"
    : hasProfile
      ? "/explorar?mode=trip"
      : "/explorar?mode=discover";
  const primaryLabel = hasProfile && isLoggedIn ? copy.ctaReturning : copy.cta;
  const secondaryHref = isLoggedIn ? "/viajes" : "/auth?next=/viajes";
  const inventoryHref = isLoggedIn ? "/perfil" : "/auth?next=/perfil";
  const ready = !(authLoading || !profileReady);

  return (
    <main className="min-h-screen flex flex-col bg-[#F9FAFB] text-[#111827]">
      <header className="sticky top-0 z-40 w-full px-4 py-4 sm:px-8 md:px-12 flex items-center justify-between gap-2 sm:gap-4 border-b border-[#E5E7EB] bg-white/90 backdrop-blur-md">
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-2.5 no-underline text-[#111827] min-w-0"
          aria-label="BeTacora"
        >
          <img
            src="/icon-512.png?v=4"
            alt=""
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
                className={`text-[0.7rem] sm:text-xs tracking-wide px-1.5 sm:px-2.5 py-1.5 border-0 border-b bg-transparent cursor-pointer transition-colors font-normal ${
                  lang === code
                    ? "text-[#111827] border-[#2D7B7B]"
                    : "text-[#6B7280] border-transparent hover:text-[#111827]"
                }`}
                aria-pressed={lang === code}
              >
                {LANG_LABEL[code]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Hero — full-bleed atmospheric plane */}
      <section className="relative isolate overflow-hidden border-b border-[#E5E7EB]">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(180deg, rgba(249,250,251,0.55) 0%, rgba(249,250,251,0.82) 55%, #F9FAFB 100%), radial-gradient(ellipse 90% 70% at 70% 20%, rgba(45,123,123,0.12), transparent 55%), radial-gradient(ellipse 70% 50% at 15% 80%, rgba(17,24,39,0.06), transparent 50%), linear-gradient(160deg, #E8EEF0 0%, #F3F4F6 45%, #ECE7E2 100%)",
          }}
          aria-hidden
        />
        <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center sm:px-8 sm:py-24 md:py-28">
          {accountDeleted ? (
            <p
              role="status"
              className="mb-8 max-w-sm text-sm text-[#2D7B7B] leading-relaxed m-0 px-4 py-3 rounded-[8px] border border-[#E5E7EB] bg-white"
            >
              {copy.accountDeleted}
            </p>
          ) : null}
          <p className="m-0 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-[#6B7280]">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 m-0 text-[1.85rem] sm:text-[2.35rem] md:text-[2.75rem] font-semibold text-[#111827] max-w-2xl leading-[1.15] tracking-tight">
            {copy.tagline}
          </h1>
          <p className="mt-5 text-[0.95rem] sm:text-base text-[#6B7280] max-w-lg leading-[1.65] font-normal">
            {copy.sub}
          </p>
          <div className="mt-10 flex w-full max-w-md flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            <Link
              href={ready ? primaryHref : "/auth?next=/explorar"}
              onClick={() =>
                trackFunnel(FunnelEvent.QuestionnaireStarted, {
                  source: "landing_cta",
                  lang,
                  gated: !isLoggedIn,
                  returning: hasProfile,
                })
              }
              className="inline-flex flex-1 items-center justify-center px-6 py-3.5 rounded-[8px] bg-[#2D7B7B] text-white font-medium text-[0.95rem] no-underline hover:opacity-92 transition-opacity duration-200 text-center"
            >
              {ready ? primaryLabel : copy.cta}
            </Link>
            <Link
              href={secondaryHref}
              className="inline-flex flex-1 items-center justify-center px-6 py-3.5 rounded-[8px] border border-[#E5E7EB] bg-white text-[#111827] font-medium text-[0.95rem] no-underline hover:border-[#D1D5DB] transition-colors duration-200 text-center"
            >
              {copy.ctaSecondary}
            </Link>
          </div>
          <div className="mt-4">
            <InstallAppButton lang={lang} variant="hero" />
          </div>
        </div>
      </section>

      {/* Prepare next trip */}
      <section className="mx-auto w-full max-w-5xl px-6 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="m-0 text-[1.45rem] sm:text-[1.65rem] font-semibold tracking-tight text-[#111827]">
            {copy.prepTitle}
          </h2>
          <p className="mt-3 m-0 text-sm text-[#6B7280] leading-relaxed">
            {copy.prepSub}
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <article className="flex flex-col rounded-[10px] border border-[#E5E7EB] bg-white p-5 sm:p-6">
            <p className="m-0 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[#E8634A]">
              {copy.logisticsLabel}
            </p>
            <h3 className="mt-2 m-0 text-[1.2rem] font-semibold tracking-tight text-[#111827]">
              {copy.logisticsTitle}
            </h3>
            <p className="mt-2.5 m-0 flex-1 text-sm text-[#6B7280] leading-relaxed">
              {copy.logisticsBody}
            </p>
            <div
              className="mt-5 h-28 rounded-[8px] border border-[#E5E7EB]"
              style={{
                background:
                  "linear-gradient(135deg, #E8DFD6 0%, #C4A484 48%, #8B6B4A 100%)",
              }}
              aria-hidden
            />
            <Link
              href={ready ? primaryHref : "/auth?next=/explorar"}
              className="mt-4 inline-flex text-sm font-medium text-[#2D7B7B] no-underline hover:opacity-80"
            >
              {copy.logisticsCta} →
            </Link>
          </article>

          <article className="flex flex-col rounded-[10px] border border-[#E5E7EB] bg-white p-5 sm:p-6">
            <p className="m-0 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[#2D7B7B]">
              {copy.inventoryLabel}
            </p>
            <h3 className="mt-2 m-0 text-[1.2rem] font-semibold tracking-tight text-[#111827]">
              {copy.inventoryTitle}
            </h3>
            <p className="mt-2.5 m-0 flex-1 text-sm text-[#6B7280] leading-relaxed">
              {copy.inventoryBody}
            </p>
            <div
              className="mt-5 h-28 rounded-[8px] border border-[#E5E7EB] bg-[#F3F4F6]"
              style={{
                background:
                  "radial-gradient(circle at 30% 40%, #E8F2F2, #F3F4F6 55%, #E5E7EB)",
              }}
              aria-hidden
            />
            <Link
              href={inventoryHref}
              className="mt-4 inline-flex text-sm font-medium text-[#2D7B7B] no-underline hover:opacity-80"
            >
              {copy.inventoryCta} →
            </Link>
          </article>
        </div>
      </section>

      {/* Dark archetype band */}
      <section className="border-y border-[#E5E7EB] bg-[#111827] text-[#F9FAFB]">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-14 sm:px-8 sm:py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <p className="m-0 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-[#2D7B7B]">
              {copy.archetypeEyebrow}
            </p>
            <h2 className="mt-3 m-0 text-[1.55rem] sm:text-[1.85rem] font-semibold tracking-tight leading-snug">
              {copy.archetypeTitle}
            </h2>
            <p className="mt-3 m-0 max-w-md text-sm text-[#9CA3AF] leading-relaxed">
              {copy.archetypeBody}
            </p>
            <Link
              href={
                isLoggedIn
                  ? "/explorar?mode=discover"
                  : "/auth?next=/explorar?mode=discover"
              }
              onClick={() =>
                trackFunnel(FunnelEvent.QuestionnaireStarted, {
                  source: "landing_archetype",
                  lang,
                  gated: !isLoggedIn,
                })
              }
              className="mt-7 inline-flex items-center justify-center px-6 py-3.5 rounded-[8px] bg-[#2D7B7B] text-white font-medium text-sm no-underline hover:opacity-92 transition-opacity"
            >
              {copy.archetypeCta}
            </Link>
          </div>
          <div
            className="aspect-[4/5] max-h-[22rem] w-full justify-self-stretch rounded-[10px] border border-white/10 md:max-h-none"
            style={{
              background:
                "linear-gradient(165deg, #1F2937 0%, #111827 40%, #0B1220 100%), radial-gradient(ellipse at 60% 30%, rgba(45,123,123,0.35), transparent 50%)",
            }}
            aria-hidden
          />
        </div>
      </section>

      <footer className="w-full px-6 py-10 sm:px-8 md:px-12 bg-[#F3F4F6] border-t border-[#E5E7EB]">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <BrandWordmark className="text-base font-medium tracking-tight" />
            <p className="mt-1.5 m-0 text-xs text-[#6B7280]">
              © {new Date().getFullYear()} BeTacora. {copy.footerNote}
            </p>
          </div>
          <p className="m-0 text-sm text-[#6B7280] leading-relaxed flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              href={ABOUT_PATH[lang]}
              className="text-[#6B7280] no-underline hover:text-[#111827] transition-colors"
            >
              {copy.about}
            </Link>
            <Link
              href={PRIVACY_PATH}
              className="text-[#6B7280] no-underline hover:text-[#111827] transition-colors"
            >
              {copy.privacy}
            </Link>
            <Link
              href={TERMS_PATH}
              className="text-[#6B7280] no-underline hover:text-[#111827] transition-colors"
            >
              {copy.terms}
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
