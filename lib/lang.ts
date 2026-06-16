export type AppLang = "es" | "en" | "fr";

const VALID: AppLang[] = ["es", "en", "fr"];

export function isAppLang(value: string | null): value is AppLang {
  return value === "es" || value === "en" || value === "fr";
}

/** localStorage first, then browser language, then fallback */
export function detectLang(fallback: AppLang = "en"): AppLang {
  if (typeof window === "undefined") return fallback;

  const saved = localStorage.getItem("bt_lang");
  if (isAppLang(saved)) return saved;

  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("fr")) return "fr";
  if (nav.startsWith("en")) return "en";
  if (nav.startsWith("es")) return "es";

  return fallback;
}

export function persistLang(lang: AppLang): void {
  localStorage.setItem("bt_lang", lang);
}

export const LANDING_COPY: Record<
  AppLang,
  { tagline: string; cta: string }
> = {
  es: {
    tagline: "Tu bitácora inteligente de viajes",
    cta: "Descubre tu perfil viajero",
  },
  en: {
    tagline: "Your smart travel logbook",
    cta: "Discover your traveler profile",
  },
  fr: {
    tagline: "Votre carnet de voyage intelligent",
    cta: "Découvrez votre profil voyageur",
  },
};
