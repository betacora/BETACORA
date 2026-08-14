"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import {
  APP_NAV_TABS,
  APP_NEW_TRIP_HREF,
  isAppNavActive,
} from "@/components/appNav";
import { NAV_COPY, type AppLang } from "@/lib/lang";

type Props = {
  lang: AppLang;
};

/**
 * Desktop-only icon rail (md+). Mobile keeps BottomNav unchanged.
 * Neutral app palette — not the warm public landing.
 */
export function AppSidebar({ lang }: Props) {
  const pathname = usePathname() || "";
  const copy = NAV_COPY[lang];

  return (
    <aside
      className="hidden md:flex sticky top-0 h-screen w-[4.25rem] shrink-0 flex-col items-center border-r border-[#E5E5E5] bg-[#FFFFFF] z-50"
      aria-label={copy.sidebar.navLabel}
    >
      <Link
        href="/inicio"
        className="mt-4 mb-6 flex h-9 w-9 items-center justify-center rounded-[8px] no-underline overflow-hidden border border-[#E5E5E5] bg-[#FFFFFF] hover:border-[#D4D4D4] transition-colors"
        aria-label="BeTacora"
      >
        <img
          src="/icon-512.png?v=4"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
        />
      </Link>

      <nav className="flex flex-1 flex-col items-center gap-1 w-full px-2" aria-label="Main">
        <ul className="flex flex-col items-center gap-1 w-full m-0 p-0 list-none">
          {APP_NAV_TABS.map(({ id, href, Icon }) => {
            const active = isAppNavActive(pathname, id, href);
            return (
              <li key={id} className="w-full">
                <Link
                  href={href}
                  title={copy.tabs[id]}
                  className={`group flex flex-col items-center justify-center gap-0.5 w-full rounded-[8px] py-2.5 no-underline transition-colors duration-200 ${
                    active
                      ? "bg-[#F5F5F5] text-[#E8634A]"
                      : "text-[#6B6B6B] hover:bg-[#FAFAFA] hover:text-[#1A1A1A]"
                  }`}
                  aria-current={active ? "page" : undefined}
                  aria-label={copy.tabs[id]}
                >
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.25 : 1.75}
                    aria-hidden
                  />
                  <span
                    className={`text-[0.58rem] leading-tight tracking-wide max-w-full truncate px-0.5 ${
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

        <div className="mt-auto mb-5 w-full flex justify-center pt-3">
          <Link
            href={APP_NEW_TRIP_HREF}
            title={copy.sidebar.newTrip}
            aria-label={copy.sidebar.newTrip}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8634A] text-white no-underline shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={22} strokeWidth={2.25} aria-hidden />
          </Link>
        </div>
      </nav>
    </aside>
  );
}
