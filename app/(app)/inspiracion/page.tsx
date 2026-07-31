"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { detectLang, NAV_COPY, type AppLang } from "@/lib/lang";

export default function InspiracionPage() {
  const [lang, setLang] = useState<AppLang>("es");
  useEffect(() => {
    setLang(detectLang("es"));
  }, []);
  const copy = NAV_COPY[lang].inspiracion;

  return (
    <>
      <AppHeader title={NAV_COPY[lang].tabs.inspiracion} />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-md mx-auto w-full">
        <div className="flex h-16 w-16 items-center justify-center rounded-[8px] border border-[#E5E5E5] bg-white text-[#2D7B7B]">
          <Sparkles size={28} strokeWidth={1.75} aria-hidden />
        </div>
        <h1 className="mt-7 text-xl font-medium tracking-tight text-[#1A1A1A] m-0 leading-snug">
          {copy.title}
        </h1>
        <p className="mt-3 text-[0.9375rem] text-[#6B6B6B] leading-relaxed m-0">
          {copy.body}
        </p>
      </main>
    </>
  );
}
