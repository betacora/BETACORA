"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
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
    <div className="min-h-screen flex bg-[#FFFFFF] text-[#1A1A1A]">
      <AppSidebar lang={lang} />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <div
          className={`flex-1 flex flex-col min-h-0 ${
            isExplorar
              ? ""
              : "pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] md:pb-0"
          }`}
        >
          {children}
        </div>
        <BottomNav lang={lang} />
      </div>
    </div>
  );
}
