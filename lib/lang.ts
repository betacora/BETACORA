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
  { tagline: string; sub: string; cta: string }
> = {
  es: {
    tagline: "Tu bitácora inteligente de viajes",
    sub: "Descubre tu perfil viajero y genera itinerarios hechos a tu medida.",
    cta: "Descubre tu perfil viajero",
  },
  en: {
    tagline: "Your smart travel logbook",
    sub: "Discover your traveler profile and get itineraries made for you.",
    cta: "Discover your traveler profile",
  },
  fr: {
    tagline: "Votre carnet de voyage intelligent",
    sub: "Découvrez votre profil voyageur et des itinéraires sur mesure.",
    cta: "Découvrez votre profil voyageur",
  },
};

export const INSTALL_COPY: Record<
  AppLang,
  {
    button: string;
    iosTitle: string;
    iosSteps: string;
    iosHint: string;
    close: string;
  }
> = {
  es: {
    button: "Instalar App",
    iosTitle: "Instalar BeTacora",
    iosSteps: "Toca compartir → Añadir a inicio",
    iosHint:
      "En Safari, toca el botón Compartir (cuadrado con flecha) y elige «Añadir a pantalla de inicio».",
    close: "Entendido",
  },
  en: {
    button: "Install App",
    iosTitle: "Install BeTacora",
    iosSteps: "Tap Share → Add to Home Screen",
    iosHint:
      "In Safari, tap the Share button (square with arrow), then choose “Add to Home Screen”.",
    close: "Got it",
  },
  fr: {
    button: "Installer l'app",
    iosTitle: "Installer BeTacora",
    iosSteps: "Touchez Partager → Sur l'écran d'accueil",
    iosHint:
      "Dans Safari, touchez Partager (carré avec flèche), puis « Sur l'écran d'accueil ».",
    close: "Compris",
  },
};
