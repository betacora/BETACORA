import type { AppLang } from "@/lib/lang";

export type AboutContent = {
  lang: AppLang;
  eyebrow: string;
  title: string;
  lead: string;
  sections: Array<{ heading: string; paragraphs: string[] }>;
  faq: Array<{ question: string; answer: string }>;
  ctaLabel: string;
  ctaHref: string;
  homeLabel: string;
  navAbout: string;
};

/**
 * About / story copy. Target ~400–600 words per locale.
 * Plain, quotable prose for search engines and AI crawlers.
 */
export const ABOUT_CONTENT: Record<AppLang, AboutContent> = {
  es: {
    lang: "es",
    eyebrow: "Sobre BeTacora",
    title: "Una bitácora inteligente que planifica como viajas de verdad",
    lead:
      "BeTacora es una aplicación de planificación de viajes con inteligencia artificial. No reparte listas genéricas de atracciones: primero construye un perfil psicológico del viajero y, a partir de ese perfil, genera un itinerario concreto, con nombres reales, ritmo realista y razones explícitas.",
    sections: [
      {
        heading: "El problema",
        paragraphs: [
          "La mayoría de herramientas de viaje tratan a todos los viajeros igual. Buscas un destino y recibes los mismos museos, los mismos hoteles cerca del centro y el mismo “must-see” que aparece en mil blogs. Eso sirve para orientarse, pero no responde a cómo duermes, qué ritmo aguantas, si priorizas comida callejera o silencio, si viajas solo o con familia, ni qué quieres que este viaje concreto logre.",
          "El resultado habitual es un itinerario que suena bien en abstracto y falla en la práctica: demasiados días en una sola ciudad, actividades que no encajan con tu energía, o recomendaciones que podrías haber sacado de cualquier guía genérica. BeTacora existe para cerrar ese hueco entre “inspiración” y un plan que puedas ejecutar.",
        ],
      },
      {
        heading: "Qué hace BeTacora",
        paragraphs: [
          "BeTacora empieza con un cuestionario de perfil viajero. Recoge cómo estructuras tus días, qué te motiva, cómo te alojas, qué comes, qué cultura y actividades te interesan, y la misión específica de este viaje. Con esas respuestas, el sistema asigna un arquetipo psicológico y genera una bitácora: perfil + itinerario personalizado.",
          "El itinerario no es un resumen vacío. Incluye logística, alojamientos con nombre, un día a día con títulos narrativos, tips locales y un mapa de lugares. Cuando tiene sentido, explica en el propio texto por qué una recomendación encaja con tu perfil —transparencia, no marketing.",
        ],
      },
      {
        heading: "Para quién es",
        paragraphs: [
          "BeTacora está pensada para viajeros que quieren un plan útil sin renunciar a su forma de viajar: solo, en pareja, con amigos o familia; con presupuesto definido o flexible; con foco en cultura, naturaleza, gastronomía u otras misiones concretas. También sirve a quien está cansado de copiar itinerarios ajenos y prefiere algo calibrado a cómo se mueve de verdad.",
        ],
      },
      {
        heading: "Qué la hace distinta",
        paragraphs: [
          "La diferencia no es “usar IA”. La diferencia es que la IA trabaja sobre un perfil viajero real, no sobre una plantilla de destino. BeTacora combina ese perfil con investigación actualizada del destino para proponer lugares, tiempos y advertencias concretas. Disponible en español, inglés y francés, con la misma lógica: personalización primero, contenido genérico después —si es que hace falta.",
          "En resumen: BeTacora es tu bitácora inteligente de viajes. Sirve para descubrir cómo viajas y para convertir ese conocimiento en un itinerario que puedas seguir, compartir y guardar.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Qué es una bitácora de viajes inteligente?",
        answer:
          "Una bitácora de viajes es el cuaderno donde se apuntan rutas, descubrimientos y aprendizajes. Una bitácora inteligente va un paso más allá: combina ese registro con un perfil real de cómo viajas, y te ayuda a planificar el siguiente viaje con el mismo criterio. En BeTacora, ese perfil alimenta itinerarios concretos —destino, ritmo y experiencias— en lugar de listas genéricas de atracciones.",
      },
      {
        question: "¿Por qué se llama BeTacora?",
        answer:
          "Porque el corazón del producto es la bitácora: el registro íntimo de tus viajes. El nombre juega con esa palabra y con la idea de un compañero que te acompaña antes, durante y después de cada aventura.",
      },
    ],
    ctaLabel: "Descubre tu perfil viajero",
    ctaHref: "/explorar",
    homeLabel: "Inicio",
    navAbout: "Sobre nosotros",
  },
  en: {
    lang: "en",
    eyebrow: "About BeTacora",
    title: "A smart travel logbook that plans the way you actually travel",
    lead:
      "BeTacora is an AI travel-planning app. It does not hand out generic attraction lists. It first builds a psychological traveler profile, then generates a concrete itinerary — real names, realistic pacing, and explicit reasons — from that profile.",
    sections: [
      {
        heading: "The problem",
        paragraphs: [
          "Most travel tools treat every traveler the same. You pick a destination and get the same museums, the same central hotels, and the same “must-sees” recycled across a thousand blogs. That can orient you, but it ignores how you sleep, what pace you can sustain, whether you want street food or quiet, whether you travel solo or with family, and what this specific trip is meant to achieve.",
          "The usual result is an itinerary that sounds fine in theory and fails in practice: too many days in one city, activities that drain the wrong kind of energy, or recommendations you could have copied from any generic guide.",
        ],
      },
      {
        heading: "What BeTacora does",
        paragraphs: [
          "BeTacora starts with a traveler-profile questionnaire. It captures how you structure your days, what motivates you, how you stay, what you eat, which culture and activities matter, and the mission of this particular trip. From those answers, the system assigns a psychological archetype and produces a logbook: profile plus a personalized itinerary.",
          "The itinerary is not an empty summary. It includes logistics, named stays, a day-by-day plan with narrative chapter titles, local tips, and a map of places. Where it helps, the text explains why a recommendation fits your profile — transparency, not sales copy.",
        ],
      },
      {
        heading: "Who it is for",
        paragraphs: [
          "BeTacora is for travelers who want a usable plan without giving up how they travel: solo, as a couple, with friends or family; with a fixed or flexible budget; focused on culture, nature, food, or another concrete mission. It is also for anyone tired of copying someone else’s itinerary and wanting something calibrated to how they actually move through a place.",
        ],
      },
      {
        heading: "What makes it different",
        paragraphs: [
          "The difference is not “using AI.” The difference is that the AI works from a real traveler profile, not a destination template. BeTacora combines that profile with up-to-date destination research to propose specific places, timing, and honest warnings. It is available in Spanish, English, and French with the same logic: personalization first, generic filler last — if at all.",
          "In short: BeTacora is your smart travel logbook. It helps you understand how you travel, then turns that into an itinerary you can follow, share, and keep.",
        ],
      },
    ],
    faq: [
      {
        question: "What is a smart travel logbook?",
        answer:
          "A travel logbook is where routes, discoveries, and lessons get written down. A smart one goes further: it pairs that record with a real profile of how you travel, then helps you plan the next trip with the same judgment. In BeTacora, that profile drives concrete itineraries — destination, pace, and experiences — instead of generic attraction lists. (In Spanish, that logbook is a bitácora — the word at the heart of our name.)",
      },
      {
        question: "Why the name BeTacora?",
        answer:
          "Because the heart of the product is the logbook — in Spanish, bitácora: the intimate record of your trips. The name plays on that word and on the idea of a companion before, during, and after every adventure.",
      },
    ],
    ctaLabel: "Discover your traveler profile",
    ctaHref: "/explorar",
    homeLabel: "Home",
    navAbout: "About",
  },
  fr: {
    lang: "fr",
    eyebrow: "À propos de BeTacora",
    title: "Un carnet de voyage intelligent qui planifie comme vous voyagez vraiment",
    lead:
      "BeTacora est une application de planification de voyage par intelligence artificielle. Elle ne distribue pas de listes d’attractions génériques. Elle construit d’abord un profil psychologique du voyageur, puis génère un itinéraire concret — noms réels, rythme réaliste, raisons explicites — à partir de ce profil.",
    sections: [
      {
        heading: "Le problème",
        paragraphs: [
          "La plupart des outils de voyage traitent tous les voyageurs de la même façon. Vous choisissez une destination et vous recevez les mêmes musées, les mêmes hôtels du centre et les mêmes « incontournables » recyclés sur mille blogs. Cela peut orienter, mais ignore comment vous dormez, quel rythme vous tenez, si vous voulez de la street food ou du silence, si vous voyagez seul ou en famille, et ce que ce voyage précis doit accomplir.",
          "Le résultat habituel est un itinéraire séduisant sur le papier et fragile sur le terrain : trop de jours dans une seule ville, des activités qui ne correspondent pas à votre énergie, ou des conseils que l’on trouverait dans n’importe quel guide générique.",
        ],
      },
      {
        heading: "Ce que fait BeTacora",
        paragraphs: [
          "BeTacora commence par un questionnaire de profil voyageur. Il capture la structure de vos journées, vos motivations, votre façon de vous loger et de manger, la culture et les activités qui comptent, ainsi que la mission de ce voyage-ci. À partir de ces réponses, le système attribue un archétype psychologique et produit une bitácora : profil + itinéraire personnalisé.",
          "L’itinéraire n’est pas un résumé vide. Il inclut la logistique, des hébergements nommés, un jour par jour avec des titres de chapitre narratifs, des astuces locales et une carte des lieux. Quand c’est utile, le texte explique pourquoi une recommandation correspond à votre profil — de la transparence, pas du marketing.",
        ],
      },
      {
        heading: "Pour qui",
        paragraphs: [
          "BeTacora s’adresse aux voyageurs qui veulent un plan utile sans renoncer à leur manière de voyager : seuls, en couple, entre amis ou en famille ; avec un budget défini ou flexible ; centrés sur la culture, la nature, la gastronomie ou une autre mission concrète. Elle sert aussi à ceux qui en ont assez de copier l’itinéraire de quelqu’un d’autre et préfèrent quelque chose calibré à leur façon réelle de se déplacer.",
        ],
      },
      {
        heading: "Ce qui la rend différente",
        paragraphs: [
          "La différence n’est pas « d’utiliser l’IA ». La différence, c’est que l’IA travaille à partir d’un vrai profil voyageur, pas d’un modèle de destination. BeTacora combine ce profil avec une recherche actualisée sur la destination pour proposer des lieux, un timing et des avertissements concrets. Disponible en espagnol, anglais et français, avec la même logique : personnalisation d’abord, contenu générique ensuite — si vraiment nécessaire.",
          "En résumé : BeTacora est votre carnet de voyage intelligent. Elle aide à comprendre comment vous voyagez, puis transforme cette connaissance en un itinéraire que vous pouvez suivre, partager et conserver.",
        ],
      },
    ],
    faq: [
      {
        question: "Qu'est-ce qu'un carnet de voyage intelligent ?",
        answer:
          "Un carnet de voyage, c'est l'endroit où l'on note itinéraires, découvertes et apprentissages. Un carnet intelligent va plus loin : il associe ce registre à un vrai profil de la façon dont vous voyagez, puis vous aide à planifier le prochain voyage avec le même jugement. Chez BeTacora, ce profil alimente des itinéraires concrets — destination, rythme et expériences — plutôt que des listes d'attractions génériques. (En espagnol, ce carnet s'appelle bitácora — le mot au cœur de notre nom.)",
      },
      {
        question: "Pourquoi BeTacora ?",
        answer:
          "Parce que le cœur du produit, c'est le carnet de bord — en espagnol, bitácora : le registre intime de vos voyages. Le nom joue avec ce mot et avec l'idée d'un compagnon avant, pendant et après chaque aventure.",
      },
    ],
    ctaLabel: "Découvrez votre profil voyageur",
    ctaHref: "/explorar",
    homeLabel: "Accueil",
    navAbout: "À propos",
  },
};

/** Approximate word counts for editorial QA (ES/EN/FR body text). */
export function aboutWordCount(lang: AppLang): number {
  const c = ABOUT_CONTENT[lang];
  const text = [
    c.lead,
    ...c.sections.flatMap((s) => s.paragraphs),
    ...c.faq.flatMap((f) => [f.question, f.answer]),
  ].join(" ");
  return text.trim().split(/\s+/).filter(Boolean).length;
}
