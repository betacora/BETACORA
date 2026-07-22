export type UiLang = "es" | "en" | "fr";

export type ItineraryLabels = {
  duration_pace: string;
  how_to_get_there: string;
  where_to_stay: string;
  day_by_day: string;
  day_n: string;
  morning: string;
  afternoon: string;
  evening: string;
  where_to_eat: string;
  local_tip: string;
  local_tip_heading: string;
  budget_estimate: string;
  what_nobody_tells: string;
  your_route_through: string;
  how_long: string;
  how_to_get_inline: string;
  what_to_see: string;
  what_to_eat: string;
  budget_in: string;
  practical_info: string;
  language: string;
  currency: string;
  safety: string;
  sim_connectivity: string;
  total_route_budget: string;
  traveler_communities: string;
  superpower: string;
  if_animal: string;
};

export const ITINERARY_LABELS: Record<UiLang, ItineraryLabels> = {
  es: {
    duration_pace: "Duración y ritmo",
    how_to_get_there: "Cómo llegar",
    where_to_stay: "Dónde dormir",
    day_by_day: "Día a día",
    day_n: "Día",
    morning: "Mañana:",
    afternoon: "Tarde:",
    evening: "Noche:",
    where_to_eat: "Dónde comer:",
    local_tip: "💡 Tip local:",
    local_tip_heading: "💡 Tip local",
    budget_estimate: "Presupuesto estimado",
    what_nobody_tells: "Lo que nadie te cuenta",
    your_route_through: "Tu ruta por",
    how_long: "Cuánto tiempo:",
    how_to_get_inline: "Cómo llegar:",
    what_to_see: "Qué ver y hacer",
    what_to_eat: "Qué comer",
    budget_in: "Presupuesto en",
    practical_info: "Info práctica general",
    language: "Idioma:",
    currency: "Moneda:",
    safety: "Seguridad:",
    sim_connectivity: "SIM/Conectividad:",
    total_route_budget: "Presupuesto total de la ruta",
    traveler_communities: "Comunidades de viajeros",
    superpower: "Tu superpoder:",
    if_animal: "Si fueras un animal:",
  },
  en: {
    duration_pace: "Duration & pace",
    how_to_get_there: "Getting there",
    where_to_stay: "Where to stay",
    day_by_day: "Day by day",
    day_n: "Day",
    morning: "Morning:",
    afternoon: "Afternoon:",
    evening: "Evening:",
    where_to_eat: "Where to eat:",
    local_tip: "💡 Local tip:",
    local_tip_heading: "💡 Local tip",
    budget_estimate: "Estimated budget",
    what_nobody_tells: "What nobody tells you",
    your_route_through: "Your route through",
    how_long: "How long:",
    how_to_get_inline: "Getting there:",
    what_to_see: "What to see & do",
    what_to_eat: "What to eat",
    budget_in: "Budget in",
    practical_info: "Practical info",
    language: "Language:",
    currency: "Currency:",
    safety: "Safety:",
    sim_connectivity: "SIM / connectivity:",
    total_route_budget: "Total route budget",
    traveler_communities: "Traveler communities",
    superpower: "Your superpower:",
    if_animal: "If you were an animal:",
  },
  fr: {
    duration_pace: "Durée et rythme",
    how_to_get_there: "Comment y aller",
    where_to_stay: "Où dormir",
    day_by_day: "Jour par jour",
    day_n: "Jour",
    morning: "Matin :",
    afternoon: "Après-midi :",
    evening: "Soir :",
    where_to_eat: "Où manger :",
    local_tip: "💡 Astuce locale :",
    local_tip_heading: "💡 Astuce locale",
    budget_estimate: "Budget estimé",
    what_nobody_tells: "Ce que personne ne te dit",
    your_route_through: "Ton itinéraire à travers",
    how_long: "Combien de temps :",
    how_to_get_inline: "Comment y aller :",
    what_to_see: "Que voir et faire",
    what_to_eat: "Que manger",
    budget_in: "Budget à",
    practical_info: "Infos pratiques",
    language: "Langue :",
    currency: "Monnaie :",
    safety: "Sécurité :",
    sim_connectivity: "SIM / connectivité :",
    total_route_budget: "Budget total de l'itinéraire",
    traveler_communities: "Communautés de voyageurs",
    superpower: "Ton superpouvoir :",
    if_animal: "Si tu étais un animal :",
  },
};

export function resolveUiLang(value: unknown): UiLang {
  return value === "en" || value === "fr" || value === "es" ? value : "es";
}
