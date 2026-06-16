"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  detectLang,
  persistLang,
  LANDING_COPY,
  type AppLang,
} from "@/lib/lang";

const LANGS: AppLang[] = ["es", "en", "fr"];
const FLAG: Record<AppLang, string> = { es: "🇪🇸", en: "🇬🇧", fr: "🇫🇷" };

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
    <main className="min-h-screen bg-[#F5EFE6] flex flex-col">
      <header className="w-full px-6 py-6 md:px-12 md:py-8 flex items-center justify-between gap-4">
        <span className="text-2xl md:text-3xl font-bold text-[#2D7B7B]">
          Be<span className="text-[#E8634A]">Tacora</span>
        </span>
        <div className="flex gap-1 rounded-full bg-white/80 p-1 shadow-sm border border-[#2D7B7B]/10">
          {LANGS.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => switchLang(code)}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-full transition-colors cursor-pointer border-0 ${
                lang === code
                  ? "bg-[#E8634A] text-white"
                  : "bg-transparent text-[#2D7B7B]/70 hover:text-[#2D7B7B]"
              }`}
              aria-pressed={lang === code}
            >
              {FLAG[code]} {code.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6 pb-16 md:px-12 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2D7B7B] max-w-xl leading-snug">
          {copy.tagline}
        </h1>

        <Link
          href="/questionnaire"
          className="mt-8 md:mt-10 px-8 py-3 md:px-10 md:py-4 rounded-full bg-[#E8634A] text-white font-semibold text-base md:text-lg hover:opacity-90 transition-opacity shadow-md"
        >
          {copy.cta}
        </Link>
      </section>
    </main>
  );
}
