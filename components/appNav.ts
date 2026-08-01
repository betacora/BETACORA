import {
  BedDouble,
  BookOpen,
  Compass,
  Home,
  Lightbulb,
  Map,
  Plane,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { NavTabId } from "@/lib/lang";

export type AppNavItem = {
  id: NavTabId;
  href: string;
  Icon: LucideIcon;
};

/**
 * Mobile bottom nav — core tabs only (fits the bar).
 * Descubre replaces Guía on mobile; Guía remains on desktop sidebar.
 */
export const APP_NAV_TABS: AppNavItem[] = [
  { id: "inicio", href: "/inicio", Icon: Home },
  { id: "explorar", href: "/explorar", Icon: Compass },
  { id: "descubre", href: "/descubre", Icon: Sparkles },
  { id: "viajes", href: "/viajes", Icon: Map },
  { id: "perfil", href: "/perfil", Icon: UserRound },
];

/**
 * Desktop sidebar — full combined structure.
 * Guía and Descubre both appear here. Settings stay under Perfil.
 */
export const APP_SIDEBAR_TABS: AppNavItem[] = [
  { id: "inicio", href: "/inicio", Icon: Home },
  { id: "explorar", href: "/explorar", Icon: Compass },
  { id: "inspiracion", href: "/inspiracion", Icon: Lightbulb },
  { id: "vuelos", href: "/vuelos", Icon: Plane },
  { id: "alojamientos", href: "/alojamientos", Icon: BedDouble },
  { id: "guia", href: "/guia", Icon: BookOpen },
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
    (id === "explorar" && pathname.startsWith("/questionnaire"))
  );
}
