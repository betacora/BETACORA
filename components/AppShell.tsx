"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { detectLang, type AppLang } from "@/lib/lang";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<AppLang>("es");
  const pathname = usePathname() || "";
  const isExplorar =
    pathname === "/explorar" || pathname.startsWith("/questionnaire");

  useEffect(() => {
    setLang(detectLang("es"));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#1A1A1A]">
      <div
        className={`flex-1 flex flex-col min-h-0 ${
          isExplorar
            ? ""
            : "pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))]"
        }`}
      >
        {children}
      </div>
      <BottomNav lang={lang} />
    </div>
  );
}
