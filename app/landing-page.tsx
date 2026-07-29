"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandWordmark } from "@/components/BrandWordmark";
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
import "./landing-warm.css";

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

  // If Site URL still points at `/`, Supabase drops hash tokens on the landing
  // page. Forward them to the auth callback so the user gets logged in + success UI.
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
  const startHref = !isLoggedIn
    ? "/auth?next=/explorar"
    : hasProfile
      ? "/explorar?mode=trip"
      : "/explorar?mode=discover";
  const ctaHref =
    authLoading || !profileReady ? "/auth?next=/explorar" : startHref;
  const ctaLabel =
    hasProfile && isLoggedIn ? copy.ctaReturning : copy.cta;

  function trackStart(source: string) {
    trackFunnel(FunnelEvent.QuestionnaireStarted, {
      source,
      lang,
      gated: !isLoggedIn,
      returning: hasProfile,
    });
  }

  const pieces = [
    {
      key: "dna",
      title: copy.dnaTitle,
      body: copy.dnaBody,
      mark: "lp-piece-mark--dna",
      glyph: "✦",
    },
    {
      key: "itin",
      title: copy.itineraryTitle,
      body: copy.itineraryBody,
      mark: "lp-piece-mark--itin",
      glyph: "◈",
    },
    {
      key: "guides",
      title: copy.guidesTitle,
      body: copy.guidesBody,
      mark: "lp-piece-mark--guides",
      glyph: "◎",
    },
    {
      key: "book",
      title: copy.bookingTitle,
      body: copy.bookingBody,
      mark: "lp-piece-mark--book",
      glyph: "▭",
    },
  ] as const;

  return (
    <main className="lp-warm min-h-screen flex flex-col">
      <header className="lp-warm-header sticky top-0 z-40 w-full px-4 py-3.5 sm:px-8 md:px-12 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 sm:gap-2.5 no-underline text-[var(--lp-ink)] min-w-0"
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

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex gap-0" role="group" aria-label="Language">
            {LANGS.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => switchLang(code)}
                className={`text-[0.7rem] sm:text-xs tracking-wide px-1.5 sm:px-2 py-1.5 border-0 border-b-[1.5px] bg-transparent cursor-pointer transition-colors font-normal ${
                  lang === code
                    ? "text-[var(--lp-ink)] border-[var(--lp-sunset)]"
                    : "text-[var(--lp-muted)] border-transparent hover:text-[var(--lp-ink)]"
                }`}
                aria-pressed={lang === code}
              >
                {LANG_LABEL[code]}
              </button>
            ))}
          </div>
          {!isLoggedIn ? (
            <Link href="/auth?next=/inicio" className="lp-btn-secondary hidden sm:inline-flex">
              {copy.login}
            </Link>
          ) : null}
          <Link
            href={ctaHref}
            onClick={() => trackStart("landing_header_start")}
            className="lp-btn-primary"
          >
            {isLoggedIn && hasProfile ? copy.ctaReturning : copy.start}
          </Link>
        </div>
      </header>

      <section className="lp-warm-hero relative">
        <div className="relative z-[1] mx-auto max-w-6xl px-5 sm:px-8 md:px-12 pt-10 pb-14 sm:pt-14 sm:pb-20 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:items-center">
          <div className="max-w-xl">
            {accountDeleted ? (
              <p
                role="status"
                className="mb-6 max-w-md text-sm text-[var(--lp-moss)] leading-relaxed m-0 px-4 py-3 rounded-[10px] border border-[rgba(47,93,80,0.25)] bg-[rgba(255,248,240,0.7)]"
              >
                {copy.accountDeleted}
              </p>
            ) : null}

            <p className="m-0 mb-4 text-[0.7rem] sm:text-xs tracking-[0.18em] uppercase text-[var(--lp-muted)] font-medium">
              BeTacora
            </p>

            <h1 className="lp-display m-0 text-[2.35rem] sm:text-[3.1rem] md:text-[3.6rem] text-[var(--lp-ink)] whitespace-pre-line">
              {copy.tagline}
            </h1>

            <p className="mt-5 sm:mt-6 text-[1.02rem] sm:text-[1.1rem] text-[var(--lp-muted)] leading-[1.65] max-w-md m-0">
              {copy.sub}
            </p>

            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3">
              <Link
                href={ctaHref}
                onClick={() => trackStart("landing_hero_cta")}
                className="lp-btn-coral !w-auto !max-w-none px-8"
              >
                {ctaLabel}
              </Link>
              {!isLoggedIn ? (
                <Link href="/auth?next=/inicio" className="lp-btn-secondary sm:hidden">
                  {copy.login}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="lp-visual" aria-hidden="true">
            <div
              className="lp-visual-panel"
              style={{ left: "8%", top: "14%", width: "58%" }}
            >
              <p className="m-0 text-[0.65rem] tracking-[0.14em] uppercase text-[var(--lp-muted)]">
                Travel DNA
              </p>
              <p className="m-0 mt-1.5 text-sm font-medium text-[var(--lp-ink)]">
                {lang === "en"
                  ? "Psychological traveler profile"
                  : lang === "fr"
                    ? "Profil psychologique voyageur"
                    : "Perfil psicológico viajero"}
              </p>
              <div className="mt-3 flex gap-1.5">
                <span className="h-1.5 flex-1 rounded-full bg-[var(--lp-sunset)]/80" />
                <span className="h-1.5 flex-1 rounded-full bg-[var(--lp-moss)]/70" />
                <span className="h-1.5 flex-1 rounded-full bg-[rgba(184,132,74,0.7)]" />
              </div>
            </div>
            <div
              className="lp-visual-panel"
              style={{ right: "7%", top: "42%", width: "52%" }}
            >
              <p className="m-0 text-[0.65rem] tracking-[0.14em] uppercase text-[var(--lp-muted)]">
                {lang === "en" ? "Day 02" : lang === "fr" ? "Jour 02" : "Día 02"}
              </p>
              <p className="m-0 mt-1.5 text-sm font-medium text-[var(--lp-ink)] leading-snug">
                {lang === "en"
                  ? "A chapter written for your pace"
                  : lang === "fr"
                    ? "Un chapitre au rythme qui vous va"
                    : "Un capítulo a tu ritmo"}
              </p>
            </div>
            <div
              className="lp-visual-panel"
              style={{ left: "18%", bottom: "10%", width: "44%" }}
            >
              <p className="m-0 text-[0.65rem] tracking-[0.14em] uppercase text-[var(--lp-muted)]">
                {lang === "en" ? "Bitácora" : lang === "fr" ? "Carnet" : "Bitácora"}
              </p>
              <p className="m-0 mt-1.5 text-sm font-medium text-[var(--lp-ink)]">
                {lang === "en"
                  ? "Profile + itinerary, kept"
                  : lang === "fr"
                    ? "Profil + itinéraire, conservés"
                    : "Perfil + itinerario, guardados"}
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-[1] flex justify-center pb-6">
          <a href="#piezas" className="lp-scroll">
            {copy.scrollMore}
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <section
        id="piezas"
        className="px-5 sm:px-8 md:px-12 py-16 sm:py-20 bg-[var(--lp-paper)]"
      >
        <div className="mx-auto max-w-6xl">
          <p className="m-0 text-[0.7rem] tracking-[0.16em] uppercase text-[var(--lp-muted)] font-medium">
            {copy.piecesEyebrow}
          </p>
          <h2 className="lp-display m-0 mt-3 text-[1.85rem] sm:text-[2.35rem] text-[var(--lp-ink)] max-w-xl">
            {copy.piecesTitle}
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pieces.map((piece) => (
              <article key={piece.key} className="lp-piece">
                <div className={`lp-piece-mark ${piece.mark}`} aria-hidden="true">
                  {piece.glyph}
                </div>
                <h3 className="m-0 text-lg font-medium tracking-tight text-[var(--lp-ink)]">
                  {piece.title}
                </h3>
                <p className="m-0 mt-2.5 text-sm leading-relaxed text-[var(--lp-muted)]">
                  {piece.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-final px-5 sm:px-8 md:px-12 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center flex flex-col items-center">
          <h2 className="lp-display m-0 text-[1.9rem] sm:text-[2.5rem] text-[var(--lp-paper)]">
            {copy.finalTitle}
          </h2>
          <p className="m-0 mt-4 text-base sm:text-lg leading-relaxed text-[rgba(255,248,240,0.78)] max-w-lg">
            {copy.finalBody}
          </p>
          <Link
            href={ctaHref}
            onClick={() => trackStart("landing_final_cta")}
            className="lp-btn-coral mt-9"
          >
            {hasProfile && isLoggedIn ? copy.ctaReturning : copy.finalCta}
          </Link>
        </div>
      </section>

      <footer className="w-full px-6 py-8 sm:px-8 md:px-12 border-t border-[rgba(31,20,16,0.08)] bg-[var(--lp-sand)] text-center">
        <p className="text-sm text-[var(--lp-muted)] leading-relaxed flex flex-wrap items-center justify-center gap-x-2 gap-y-1 m-0">
          <Link
            href={ABOUT_PATH[lang]}
            className="text-[var(--lp-moss)] no-underline hover:opacity-80 transition-opacity"
          >
            {copy.about}
          </Link>
          <span className="text-[rgba(31,20,16,0.2)]" aria-hidden="true">
            ·
          </span>
          <Link
            href={PRIVACY_PATH}
            className="text-[var(--lp-moss)] no-underline hover:opacity-80 transition-opacity"
          >
            {copy.privacy}
          </Link>
          <span className="text-[rgba(31,20,16,0.2)]" aria-hidden="true">
            ·
          </span>
          <Link
            href={TERMS_PATH}
            className="text-[var(--lp-moss)] no-underline hover:opacity-80 transition-opacity"
          >
            {copy.terms}
          </Link>
        </p>
      </footer>
    </main>
  );
}
