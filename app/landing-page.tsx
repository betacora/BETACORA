"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { InstallAppButton } from "@/components/InstallAppButton";
import {
  detectLang,
  persistLang,
  LANDING_COPY,
  type AppLang,
} from "@/lib/lang";

const LANGS: AppLang[] = ["es", "en", "fr"];
const LANG_LABEL: Record<AppLang, string> = {
  es: "ES",
  en: "EN",
  fr: "FR",
};

export function LandingPage() {
  const [lang, setLang] = useState<AppLang>("en");

  useEffect(() => {
    const detected = detectLang("en");
    setLang(detected);
    if (!localStorage.getItem("bt_lang")) {
      persistLang(detected);
    }
    document.documentElement.lang = detected;
  }, []);

  function switchLang(next: AppLang) {
    setLang(next);
    persistLang(next);
    document.documentElement.lang = next;
  }

  const copy = LANDING_COPY[lang];

  return (
    <main className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#1A1A1A]">
      <header className="w-full px-5 py-5 sm:px-8 md:px-12 md:py-7 flex items-center justify-between gap-4 border-b border-[#E5E2DC]">
        <Link
          href="/"
          className="flex items-center gap-2.5 no-underline text-[#1A1A1A]"
          aria-label="BeTacora"
        >
          <img
            src="/icon-512.png?v=3"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-[7px] object-contain"
          />
          <span className="text-xl md:text-2xl font-medium tracking-tight">
            Be<span className="text-[#E8634A]">Tacora</span>
          </span>
        </Link>

        <div className="flex gap-0.5" role="group" aria-label="Language">
          {LANGS.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => switchLang(code)}
              className={`text-xs tracking-wide px-2.5 py-1.5 border-0 border-b-[1.5px] bg-transparent cursor-pointer transition-colors font-normal ${
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
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-5 pb-20 sm:px-8 md:px-12 text-center">
        <img
          src="/icon-512.png?v=3"
          alt="BeTacora"
          width={88}
          height={88}
          className="h-[72px] w-[72px] sm:h-[88px] sm:w-[88px] rounded-[8px] object-contain mb-8 sm:mb-10"
        />

        <h1 className="text-[1.625rem] sm:text-3xl md:text-[2.25rem] font-medium text-[#1A1A1A] max-w-md leading-snug tracking-tight">
          {copy.tagline}
        </h1>

        <p className="mt-4 text-[0.9375rem] text-[#6B6B6B] max-w-sm leading-relaxed font-normal">
          {copy.sub}
        </p>

        <Link
          href="/questionnaire"
          className="mt-10 sm:mt-12 px-8 py-3.5 sm:px-10 sm:py-4 rounded-[7px] bg-[#E8634A] text-white font-medium text-base no-underline hover:opacity-90 transition-opacity"
        >
          {copy.cta}
        </Link>

        <InstallAppButton lang={lang} className="mt-3.5" />
      </section>
    </main>
  );
}
