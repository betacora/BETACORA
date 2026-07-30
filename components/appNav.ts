import { Compass, Home, Map, Sparkles, UserRound, type LucideIcon } from "lucide-react";
import type { NavTabId } from "@/lib/lang";

export type AppNavItem = {
  id: NavTabId;
  href: string;
  Icon: LucideIcon;
};

/** Shared tab definitions for BottomNav (mobile) and AppSidebar (desktop). */
export const APP_NAV_TABS: AppNavItem[] = [
  { id: "inicio", href: "/inicio", Icon: Home },
  { id: "explorar", href: "/explorar", Icon: Compass },
  { id: "descubre", href: "/descubre", Icon: Sparkles },
  { id: "viajes", href: "/viajes", Icon: Map },
  { id: "perfil", href: "/perfil", Icon: UserRound },
];

/** Quick action: start a new trip flow in Explorar. */
export const APP_NEW_TRIP_HREF = "/explorar?mode=trip";

export function isAppNavActive(pathname: string, id: NavTabId, href: string): boolean {
  return (
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (id === "explorar" && pathname.startsWith("/questionnaire")) ||
    (id === "descubre" && pathname.startsWith("/guia"))
  );
}
