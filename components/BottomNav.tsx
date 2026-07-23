"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, Map, UserRound, BookOpen } from "lucide-react";
import { NAV_COPY, type AppLang, type NavTabId } from "@/lib/lang";

const TABS: {
  id: NavTabId;
  href: string;
  Icon: typeof Home;
}[] = [
  { id: "inicio", href: "/inicio", Icon: Home },
  { id: "explorar", href: "/explorar", Icon: Compass },
  { id: "guia", href: "/guia", Icon: BookOpen },
  { id: "viajes", href: "/viajes", Icon: Map },
  { id: "perfil", href: "/perfil", Icon: UserRound },
];

type Props = {
  lang: AppLang;
};

export function BottomNav({ lang }: Props) {
  const pathname = usePathname() || "";
  const copy = NAV_COPY[lang];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-[#E5E2DC] bg-[#FAF8F4]/80 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1 pt-1.5 pb-1">
        {TABS.map(({ id, href, Icon }) => {
          const active =
            pathname === href ||
            pathname.startsWith(`${href}/`) ||
            (id === "explorar" && pathname.startsWith("/questionnaire"));
          return (
            <li key={id} className="flex-1 min-w-0">
              <Link
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 no-underline transition-colors ${
                  active ? "text-[#E8634A]" : "text-[#6B6B6B] hover:text-[#1A1A1A]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.25 : 1.75}
                  aria-hidden
                />
                <span
                  className={`text-[0.62rem] leading-tight tracking-wide truncate max-w-full px-0.5 ${
                    active ? "font-medium" : "font-normal"
                  }`}
                >
                  {copy.tabs[id]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
