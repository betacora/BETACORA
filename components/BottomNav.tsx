"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV_TABS, isAppNavActive } from "@/components/appNav";
import { NAV_COPY, type AppLang } from "@/lib/lang";

type Props = {
  lang: AppLang;
};

/** Mobile-only bottom tabs. Hidden from md (768px) upward — desktop uses AppSidebar. */
export function BottomNav({ lang }: Props) {
  const pathname = usePathname() || "";
  const copy = NAV_COPY[lang];
  const [navReady, setNavReady] = useState(false);

  useEffect(() => {
    setNavReady(true);
  }, []);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-[#E5E5E5] bg-[#FFFFFF]/80 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1 pt-1.5 pb-1">
        {APP_NAV_TABS.map(({ id, href, Icon }) => {
          const active = navReady && isAppNavActive(pathname, id, href);
          return (
            <li key={id} className="flex-1 min-w-0">
              <Link
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 no-underline transition-colors duration-200 ${
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
