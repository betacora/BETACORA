/** Maps questionnaire option keys → Lucide icon names */
const QV_ICONS = {
  "wake:alba": "sunrise",
  "wake:manana": "sun",
  "wake:media": "cloud-sun",
  "wake:tarde": "moon",
  "pace:packed": "zap",
  "pace:balanced": "scale",
  "pace:slow": "leaf",
  "pace:zero": "waves",
  "motiv:desconectar": "unplug",
  "motiv:culturas": "globe",
  "motiv:aventura": "mountain",
  "motiv:gastronomia": "utensils",
  "motiv:historia": "landmark",
  "motiv:naturaleza": "tree-pine",
  "motiv:espiritual": "church",
  "motiv:lujo": "sparkles",
  "motiv:unico": "map",
  "motiv:social": "users",
  "motiv:foto": "camera",
  "motiv:nomad": "laptop",
  "exp:nadie": "search",
  "exp:local": "home",
  "exp:icono": "trophy",
  "exp:nat_ext": "mountain-snow",
  "exp:arte": "palette",
  "exp:gente": "message-circle",
  "guide:presencial": "handshake",
  "guide:digital": "smartphone",
  "guide:ocasional": "map-pin",
  "guide:no": "bird",
  "accom:hotel5": "building-2",
  "accom:hotel3": "hotel",
  "accom:boutique": "house",
  "accom:aparto": "key-round",
  "accom:villa": "palmtree",
  "accom:hostel": "backpack",
  "accom:glamping": "tent",
  "accom:tradicional": "landmark",
  "accom:barco": "sailboat",
  "accom_location:centro": "map-pin",
  "accom_location:fuera": "house",
  "accom_location:igual": "move-horizontal",
  "accom_priority:precio": "wallet",
  "accom_priority:comodidad": "bed-double",
  "accom_priority:equilibrio": "scale",
  "amenity:wifi": "wifi",
  "amenity:piscina": "waves-ladder",
  "amenity:gym": "dumbbell",
  "amenity:spa": "sparkles",
  "amenity:cocina": "chef-hat",
  "amenity:vista": "mountain",
  "amenity:desayuno": "croissant",
  "amenity:nada": "bed-double",
  "food:calle": "utensils",
  "food:mercado": "shopping-basket",
  "food:local": "utensils-crossed",
  "food:gourmet": "star",
  "food:rooftop": "building-2",
  "food:casas": "home",
  "diet:ninguna": "circle",
  "diet:vegeta": "salad",
  "diet:vegano": "leaf",
  "diet:halal": "circle-dot",
  "diet:gluten": "wheat-off",
  "diet:lactosa": "milk-off",
  "diet:alergias": "alert-triangle",
  "diet:picante": "flame",
  "cultura:museos": "frame",
  "cultura:historia": "landmark",
  "cultura:templos": "church",
  "cultura:arqueologia": "shovel",
  "cultura:teatro": "drama",
  "cultura:musica": "music",
  "cultura:arte_u": "palette",
  "cultura:tiendas": "shopping-bag",
  "cultura:mercados": "store",
  "cultura:idioma": "languages",
  "cultura:festivales": "party-popper",
  "cultura:improv": "compass",
  "act:trekking": "footprints",
  "act:buceo": "fish",
  "act:surf": "waves",
  "act:kitesurf": "wind-arrow-down",
  "act:kayak": "kayak",
  "act:escalada": "mountain",
  "act:ciclismo": "bike",
  "act:running": "sport-shoe",
  "act:esqui": "snowflake",
  "act:golf": "flag",
  "act:tennis": "volleyball",
  "act:padel": "square-activity",
  "act:parapente": "bird",
  "act:caballo": "chess-knight",
  "act:yoga": "flower-2",
  "act:gym": "dumbbell",
  "act:safari": "binoculars",
  "act:playa": "umbrella",
  "act:globo": "balloon",
  "act:foto_t": "camera",
  "act:cocina_c": "chef-hat",
  "act:urbano": "building-2",
  "act:nightlife": "moon",
  "act:otro": "sparkles",
  "museum_type:arte": "palette",
  "museum_type:historia": "scroll",
  "museum_type:contemporaneo": "shapes",
  "museum_type:ciencia": "flask-conical",
  "museum_type:cultural": "globe",
  "museum_type:bellas_artes": "frame",
  "mision_focus:urbano": "building-2",
  "mision_focus:naturaleza": "mountain",
  "mision_focus:cultura": "palette",
  "mision_focus:gastro": "utensils",
  "mision_focus:playa": "umbrella",
  "mision_focus:social": "martini",
  "mision_focus:compras": "shopping-bag",
  "mision_focus:unico": "sparkles",
  "mision_sport:no": "ban",
  "mision_sport:yes": "target",
  "mision_sports:surf": "waves",
  "mision_sports:golf": "flag",
  "mision_sports:tennis": "volleyball",
  "mision_sports:padel": "square-activity",
  "mision_sports:kitesurf": "wind-arrow-down",
  "mision_sports:buceo": "fish",
  "mision_sports:trekking": "footprints",
  "mision_sports:escalada": "mountain",
  "mision_sports:esqui": "snowflake",
  "mision_sports:ciclismo": "bike",
  "mision_sports:running": "sport-shoe",
  "mision_sports:otro": "sparkles",
  "mision_luxury:comodidad": "bed-double",
  "mision_luxury:discretas": "wine",
  "mision_luxury:reconocidos": "camera",
  "mision_luxury:mix": "scale",
  "trip_type:destino": "map-pin",
  "trip_type:zona": "globe",
  "trip_type:nomada": "infinity",
  "trip_type:sorpresa": "gift",
  "zona:europa": "globe",
  "zona:asia": "globe",
  "zona:latam": "globe",
  "zona:africa": "globe",
  "zona:oceania": "globe",
  "zona:me": "globe",
  "zona:na": "map-pin",
  "zona:caribe": "palmtree",
  "zona:polar": "snowflake",
  "nomada_dur:1-3": "calendar",
  "nomada_dur:3-6": "calendar-range",
  "nomada_dur:6plus": "globe",
  "nomada_dur:ilimitado": "infinity",
  "dur:finde": "umbrella",
  "dur:finde_largo": "palmtree",
  "dur:semana": "calendar",
  "dur:dos": "calendar-range",
  "dur:tres": "globe",
  "dur:nomad": "infinity",
  "dur:flex": "shuffle",
  "social:solo": "user",
  "social:pareja": "heart",
  "social:amigos": "users",
  "social:familia": "users-round",
  "social_e:intro": "headphones",
  "social_e:ambiv": "contrast",
  "social_e:extro": "party-popper",
  "budget_r:low": "wallet",
  "budget_r:mid": "credit-card",
  "budget_r:high": "gem",
  "budget_r:ilim": "infinity",
  "budget_monthly_r:under1000": "wallet",
  "budget_monthly_r:1000-2000": "backpack",
  "budget_monthly_r:2000-3500": "plane",
  "budget_monthly_r:over3500": "gem",
  "budget_monthly_r:ilim": "infinity",
  "splurge:hotel": "building-2",
  "splurge:comida": "utensils",
  "splurge:exp": "target",
  "splurge:vuelo": "plane",
  "splurge:compras": "shopping-bag",
  "splurge:optimizo": "puzzle",
};

function toPascalCaseIcon(name) {
  return String(name || "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/** Resolve a Lucide kebab name that exists in the loaded bundle; never return empty. */
function resolveLucideIconName(preferred, fallbacks) {
  const candidates = [preferred, ...(fallbacks || []), "sparkles", "circle"];
  const icons = window.lucide && window.lucide.icons;
  for (const name of candidates) {
    if (!name) continue;
    if (!icons) return name;
    if (icons[toPascalCaseIcon(name)]) return name;
  }
  return "circle";
}

function iconForElement(span) {
  const parent = span.closest("[data-q][data-v]");
  if (parent) {
    const key = `${parent.dataset.q}:${parent.dataset.v}`;
    if (QV_ICONS[key]) {
      return resolveLucideIconName(QV_ICONS[key], ["sparkles"]);
    }
  }
  return resolveLucideIconName("sparkles");
}

function paintIconSpan(span) {
  const name = iconForElement(span);
  span.className = span.classList.contains("search-icon")
    ? "search-icon q-icon"
    : "q-icon";
  span.removeAttribute("data-lucide");
  span.innerHTML = `<i data-lucide="${name}"></i>`;
}

function initQuestionnaireIcons(root) {
  const scope = root || document;
  // Re-paint both first-run emoji shells and already-converted .q-icon spans
  scope.querySelectorAll(".em, .em2, .q-icon").forEach((span) => {
    if (span.classList.contains("search-icon")) return;
    paintIconSpan(span);
  });
  scope.querySelectorAll(".search-icon").forEach((el) => {
    el.className = "search-icon q-icon";
    el.innerHTML = `<i data-lucide="${resolveLucideIconName("search")}"></i>`;
  });
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons({ attrs: { "stroke-width": 1.5 } });
  }
  // Safety: any act option still missing an SVG gets a sparkles icon
  scope.querySelectorAll('#actOptionsGrid [data-q="act"]').forEach((btn) => {
    if (btn.querySelector("svg")) return;
    let span = btn.querySelector(".q-icon, .em");
    if (!span) {
      span = document.createElement("span");
      span.className = "q-icon";
      btn.prepend(span);
    }
    const key = `act:${btn.dataset.v}`;
    const name = resolveLucideIconName(QV_ICONS[key] || "sparkles");
    span.className = "q-icon";
    span.innerHTML = `<i data-lucide="${name}"></i>`;
  });
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons({ attrs: { "stroke-width": 1.5 } });
  }
}

window.initQuestionnaireIcons = initQuestionnaireIcons;
