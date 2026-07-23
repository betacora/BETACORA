import type { Metadata } from "next";
import type { AppLang } from "@/lib/lang";
import { ABOUT_PATH, SITE_LOGO_URL, SITE_NAME, SITE_URL } from "@/lib/site";

type PageKey = "home" | "auth" | "questionnaire" | "about";

const PAGE_META: Record<
  PageKey,
  Record<AppLang, { title: string; description: string }>
> = {
  home: {
    es: {
      title: "BeTacora — Tu bitácora inteligente de viajes",
      description:
        "BeTacora es tu bitácora inteligente de viajes: descubre tu perfil viajero, genera itinerarios con IA a tu medida y guarda cada experiencia en un solo lugar.",
    },
    en: {
      title: "BeTacora — Your smart travel logbook",
      description:
        "BeTacora is your smart travel logbook: discover your traveler profile, generate AI itineraries made for you, and keep every trip in one place.",
    },
    fr: {
      title: "BeTacora — Votre carnet de voyage intelligent",
      description:
        "BeTacora est votre carnet de voyage intelligent : découvrez votre profil voyageur, générez des itinéraires IA sur mesure et gardez chaque voyage au même endroit.",
    },
  },
  auth: {
    es: {
      title: "Iniciar sesión o registrarse — BeTacora",
      description:
        "Crea tu cuenta BeTacora para guardar itinerarios personalizados y desbloquear más generaciones de tu bitácora inteligente de viajes.",
    },
    en: {
      title: "Sign in or register — BeTacora",
      description:
        "Create your BeTacora account to save personalized itineraries and unlock more generations of your smart travel logbook.",
    },
    fr: {
      title: "Connexion ou inscription — BeTacora",
      description:
        "Créez votre compte BeTacora pour enregistrer vos itinéraires personnalisés et débloquer plus de générations de votre carnet de voyage intelligent.",
    },
  },
  questionnaire: {
    es: {
      title: "Cuestionario de perfil viajero — BeTacora",
      description:
        "Responde el cuestionario BeTacora y descubre tu perfil psicológico de viajero. Genera un itinerario personalizado con IA según cómo viajas de verdad.",
    },
    en: {
      title: "Traveler profile questionnaire — BeTacora",
      description:
        "Take the BeTacora questionnaire to discover your psychological traveler profile and generate an AI itinerary based on how you actually travel.",
    },
    fr: {
      title: "Questionnaire de profil voyageur — BeTacora",
      description:
        "Répondez au questionnaire BeTacora pour découvrir votre profil psychologique de voyageur et générer un itinéraire IA fidèle à votre façon de voyager.",
    },
  },
  about: {
    es: {
      title: "Sobre nosotros — BeTacora, bitácora inteligente de viajes",
      description:
        "Qué es BeTacora y qué es una bitácora de viajes inteligente: perfil viajero real, itinerarios personalizados con IA y el relato de cada aventura.",
    },
    en: {
      title: "About BeTacora — Smart travel logbook & AI itineraries",
      description:
        "What BeTacora is and what a smart travel logbook means: a real traveler profile, personalized AI itineraries, and the story of every trip.",
    },
    fr: {
      title: "À propos — BeTacora, carnet de voyage intelligent",
      description:
        "Ce qu'est BeTacora et ce qu'est un carnet de voyage intelligent : un vrai profil voyageur, des itinéraires IA personnalisés et le récit de chaque aventure.",
    },
  },
};

function aboutAlternates(lang: AppLang) {
  return {
    canonical: `${SITE_URL}${ABOUT_PATH[lang]}`,
    languages: {
      es: `${SITE_URL}${ABOUT_PATH.es}`,
      en: `${SITE_URL}${ABOUT_PATH.en}`,
      fr: `${SITE_URL}${ABOUT_PATH.fr}`,
      "x-default": `${SITE_URL}${ABOUT_PATH.es}`,
    },
  };
}

export function buildPageMetadata(
  page: PageKey,
  lang: AppLang,
  path: string
): Metadata {
  const { title, description } = PAGE_META[page][lang];
  const url = `${SITE_URL}${path}`;
  const alternates =
    page === "about"
      ? aboutAlternates(lang)
      : { canonical: url };

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: lang === "es" ? "es_ES" : lang === "fr" ? "fr_FR" : "en_US",
      type: "website",
      images: [{ url: SITE_LOGO_URL, width: 512, height: 512, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [SITE_LOGO_URL],
    },
  };
}

/** JSON-LD for Organization + WebApplication (schema.org). */
export function buildJsonLd(): Record<string, unknown> {
  const description =
    "BeTacora es tu bitácora inteligente de viajes: planifica itinerarios personalizados con IA a partir de tu perfil viajero real.";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: SITE_LOGO_URL,
        },
        description,
        sameAs: [],
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#webapp`,
        name: SITE_NAME,
        url: SITE_URL,
        applicationCategory: "TravelApplication",
        operatingSystem: "Web",
        description,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
        },
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: ["es", "en", "fr"],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: ["es", "en", "fr"],
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/sobre-nosotros#faq`,
        url: `${SITE_URL}/sobre-nosotros`,
        mainEntity: [
          {
            "@type": "Question",
            name: "¿Qué es una bitácora de viajes inteligente?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Una bitácora de viajes es el cuaderno donde se apuntan rutas, descubrimientos y aprendizajes. Una bitácora inteligente combina ese registro con un perfil real de cómo viajas y te ayuda a planificar el siguiente viaje. En BeTacora, ese perfil alimenta itinerarios concretos en lugar de listas genéricas.",
            },
          },
          {
            "@type": "Question",
            name: "¿Por qué se llama BeTacora?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Porque el corazón del producto es la bitácora: el registro íntimo de tus viajes. El nombre juega con esa palabra y con la idea de un compañero que te acompaña antes, durante y después de cada aventura.",
            },
          },
        ],
      },
    ],
  };
}
