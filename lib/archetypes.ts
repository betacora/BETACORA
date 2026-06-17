export type Archetype = {
  id: number;
  nombre: string;
  esencia: string;
  frase_insignia: string;
  nota: string;
};

export type TravelerProfileInput = Record<string, unknown>;

const ARCHETYPES: Archetype[] = [
  {
    id: 1,
    nombre: "El Descubridor de Horizontes",
    esencia:
      "Naces con brújula invisible. Para ti, el siguiente horizonte existe siempre. El destino importa menos que la certeza de que hay otro esperando.",
    frase_insignia: "No coleccionas países. Coleccionas versiones de ti mismo.",
    nota: "exploración, movimiento, curiosidad amplia; pace balanced/slow",
  },
  {
    id: 2,
    nombre: "El Aventurero",
    esencia:
      "Tu pulso acelera ante lo imposible. Ves peligro como oportunidad. La verdadera aventura no está en el lugar, sino en lo que debes superar para llegar.",
    frase_insignia: "El miedo es tu combustible, no tu freno.",
    nota: "alta energía, pace packed; exp nat_ext",
  },
  {
    id: 3,
    nombre: "El Nómada Libre",
    esencia:
      "Movimiento perpetuo es tu paz. No escapas de la vida, construyes una donde la impermanencia es libertad. Tu hogar cabe en una mochila.",
    frase_insignia: "Tu verdadero equipaje es lo que llevas en el corazón.",
    nota: "libertad, budget low/mid, pace slow/zero",
  },
  {
    id: 4,
    nombre: "El Filósofo Viajero",
    esencia:
      "Tus viajes son peregrinaje interior. Lees filosofía en cafés, meditas en templos, reflexionas en playas. Para ti, viajar es universidad y terapia simultáneamente.",
    frase_insignia:
      "Cada viaje es viaje adentro. Los lugares son solo mapas del territorio interno.",
    nota: "introspección, pace slow/zero; social solo/pareja",
  },
  {
    id: 5,
    nombre: "El Lobo Solitario",
    esencia:
      "Eres completo solo. Tu compañía es lujo, no ausencia. Disfrutas el silencio tanto como otros disfrutan la multitud.",
    frase_insignia: "La mejor compañía es la tuya propia. Todo lo demás es bonus.",
    nota: "social solo; social_e intro",
  },
  {
    id: 6,
    nombre: "El Conector",
    esencia:
      "Conviertes extraños en amigos en horas. El viaje es colaborativo, no pasivo. La mejor parte de cualquier destino son las personas que conoces.",
    frase_insignia: "Un viaje sin amigos nuevos es un viaje a medias.",
    nota: "social amigos/familia; exp gente; social_e extro",
  },
  {
    id: 7,
    nombre: "El Observador",
    esencia:
      "Tu poder es ver lo que otros no notan. No participas, registras. Comprendes las dinámicas invisibles de cualquier lugar.",
    frase_insignia: "La verdad es visible si simplemente observas lo suficiente.",
    nota: "foto, pace slow; social solo; exp local",
  },
  {
    id: 9,
    nombre: "El Historiador",
    esencia:
      "Viajas a través de épocas, no solo de espacio. Cada ruina es puerta a mundos que ya no existen.",
    frase_insignia: "La historia no se repite, pero el pasado es prólogo.",
    nota: "cultura historia/museos; motiv historia/culturas",
  },
  {
    id: 10,
    nombre: "El Cronista Cultural",
    esencia:
      "Antropólogo por instinto. Buscas la mesa donde comen los locales antes de los monumentos. La verdadera cultura vive en cocinas y conversaciones.",
    frase_insignia: "La mejor lección es la que comes en la casa de alguien.",
    nota: "cultura, exp local/gente; gastronomía secundaria",
  },
  {
    id: 11,
    nombre: "El Navegante Gastronómico",
    esencia:
      "El sabor es tu brújula. Perdonas un hotel mediocre pero nunca una comida sin alma.",
    frase_insignia: "Un viaje es recordado por los sabores que dejó en tu paladar.",
    nota: "motiv gastronomia; food prioritario",
  },
  {
    id: 12,
    nombre: "El Viajero de Élite",
    esencia:
      "Pocos viajes pero perfectos. Cada detalle cuidadosamente diseñado. Tu viaje no es cantidad de lugares, es calidad de experiencias.",
    frase_insignia: "La excelencia no es lujo. Es respeto por tu propio tiempo.",
    nota: "budget high/ilim; motiv lujo; luxury_style",
  },
  {
    id: 15,
    nombre: "El Guardián Natural",
    esencia:
      "El horizonte no es destino, es respiración. La naturaleza es tu iglesia. Cada montaña, cada costa, es llamada que contestas.",
    frase_insignia: "La naturaleza no es escenario. Es compañía.",
    nota: "motiv naturaleza; exp nat_ext; act outdoor",
  },
  {
    id: 16,
    nombre: "El Arqueólogo del Tiempo",
    esencia:
      "Lees las placas, preguntas por leyendas, cada ruina tiene historia que contar. Eres detective del tiempo.",
    frase_insignia: "Cada piedra es un libro. Solo necesitas aprender a leerla.",
    nota: "cultura arqueologia/historia; exp icono con profundidad",
  },
  {
    id: 17,
    nombre: "El Fugitivo del Ruido",
    esencia:
      "Necesitas silencio real, no ausencia de sonido. Tu viaje perfecto comienza desactivando notificaciones.",
    frase_insignia: "El silencio no es vacío. Es plenitud.",
    nota: "desconectar/espiritual; pace slow/zero; social_e intro",
  },
  {
    id: 18,
    nombre: "El Embajador del Mundo",
    esencia:
      "Tu lista de contactos es mapa del mundo. Cada viaje suma personas. Eres puente entre culturas.",
    frase_insignia: "Las fronteras existen en mapas. Las personas existen en corazones.",
    nota: "social/conectar; budget high; exp gente",
  },
  {
    id: 20,
    nombre: "El Nómada Digital",
    esencia:
      "Tu oficina es donde está tu laptop. El viaje no es vacation, es modo de vida.",
    frase_insignia: "Tu libertad es la productividad. Tu oficina es el mundo.",
    nota: "motiv nomad; trip_type nomada; libertad",
  },
  {
    id: 21,
    nombre: "El Cazador de Vértigo",
    esencia:
      "Necesitas sentir el peso del mundo bajo tus botas. Viajar es despertar, no descansar.",
    frase_insignia: "La altura te recuerda que estás vivo.",
    nota: "aventura extrema; pace packed; exp nat_ext",
  },
  {
    id: 22,
    nombre: "El Trotamundos Inquieto",
    esencia:
      "Aventura ligera, mucho movimiento. Prioriza cantidad de experiencias sobre profundidad en una sola.",
    frase_insignia: "El siguiente lugar es siempre mejor que el anterior.",
    nota: "pace packed/balanced; exp variado; social amigos",
  },
  {
    id: 23,
    nombre: "El Esteta del Detalle",
    esencia:
      "Prefieres lo excelente y silencioso a lo reconocible. Calidad discreta sobre ostentación. Tu viaje es para ti, no para Instagram.",
    frase_insignia: "La belleza verdadera no grita. Susurra.",
    nota: "foto, lujo discreto; exp arte; budget mid/high",
  },
  {
    id: 25,
    nombre: "El Explorador de Fronteras",
    esencia:
      "Tu orgullo es llegar donde casi nadie ha estado. No buscas lo reconocible, buscas lo virgen.",
    frase_insignia: "Los mejores lugares son los que no aparecen en las guías.",
    nota: "exp nadie; unico; descubrir",
  },
];

const ARCHETYPE_BY_ID = new Map(ARCHETYPES.map((a) => [a.id, a]));

/** Matrix category → candidate archetype IDs (14 aliased to 25 — not in canon list) */
export const MOTIVATION_MATRIX: Record<string, number[]> = {
  aventura: [2, 21, 25],
  "descubrir/explorar": [1, 25, 22],
  "libertad/sin-destino": [3, 20, 1],
  "introspeccion/relax": [4, 17],
  "solo/soledad": [5, 17, 7],
  "social/conectar": [6, 18, 22],
  "cultura/historia": [9, 16, 10],
  gastronomia: [11, 10, 12],
  naturaleza: [15, 1, 25],
  "fotografia/visual": [23, 7],
  "lujo/experiencias-disenadas": [12, 23, 18],
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value) return [value];
  return [];
}

function resolveArchetypeId(id: number): number {
  if (id === 14) return 25;
  return ARCHETYPE_BY_ID.has(id) ? id : 25;
}

export function getArchetypeById(id: number): Archetype {
  const resolved = resolveArchetypeId(id);
  return ARCHETYPE_BY_ID.get(resolved)!;
}

function getPrimaryPace(profile: TravelerProfileInput): string {
  const pace = asStringArray(profile.pace);
  return pace[0] ?? "balanced";
}

function getSocial(profile: TravelerProfileInput): string {
  return typeof profile.social === "string" ? profile.social : "";
}

function getBudget(profile: TravelerProfileInput): string {
  return typeof profile.budget_r === "string" ? profile.budget_r : "";
}

function getSocialEnergy(profile: TravelerProfileInput): string {
  return typeof profile.social_e === "string" ? profile.social_e : "";
}

function findArchetype(id: number): Archetype {
  return getArchetypeById(id);
}

/** True if any questionnaire motiv value matches (supports culturas/historia → cultura). */
function motivHas(motiv: string[], key: string): boolean {
  if (key === "cultura") {
    return motiv.some(
      (m) => m === "culturas" || m === "historia" || m.includes("cultura")
    );
  }
  return motiv.includes(key);
}

/**
 * Pure deterministic archetype selection — explicit decision tree only.
 * No scoring, no randomness, no AI. First matching motivation branch wins.
 */
export function selectArchetype(profile: TravelerProfileInput): Archetype {
  const motiv = asStringArray(profile.motiv);
  const pace = getPrimaryPace(profile);
  const social = getSocial(profile);
  const budget = getBudget(profile);

  if (motivHas(motiv, "aventura")) {
    if (pace === "packed" && social === "solo") {
      return findArchetype(21);
    }
    if (pace === "slow" || pace === "zero") {
      return findArchetype(25);
    }
    if (budget === "low") {
      return findArchetype(25);
    }
    return findArchetype(2);
  }

  if (motivHas(motiv, "cultura")) {
    if (social === "solo") {
      return findArchetype(9);
    }
    if (budget === "low") {
      return findArchetype(10);
    }
    if (pace === "slow" || pace === "zero") {
      return findArchetype(9);
    }
    return findArchetype(16);
  }

  if (motiv.includes("nomad")) {
    if (budget === "low") {
      return findArchetype(3);
    }
    if (profile.trip_type === "nomada" || pace === "balanced") {
      return findArchetype(20);
    }
    if (pace === "packed") {
      return findArchetype(1);
    }
    return findArchetype(3);
  }

  if (motiv.includes("desconectar") || motiv.includes("espiritual")) {
    if (pace === "slow" || pace === "zero") {
      return findArchetype(4);
    }
    if (social === "solo") {
      return findArchetype(17);
    }
    if (getSocialEnergy(profile) === "intro") {
      return findArchetype(17);
    }
    return findArchetype(4);
  }

  if (social === "solo") {
    if (pace === "slow" || pace === "zero") {
      return findArchetype(7);
    }
    if (getSocialEnergy(profile) === "intro") {
      return findArchetype(17);
    }
    if (pace === "packed") {
      return findArchetype(5);
    }
    return findArchetype(5);
  }

  if (motiv.includes("social")) {
    if (budget === "high" || budget === "ilim") {
      return findArchetype(18);
    }
    if (pace === "packed") {
      return findArchetype(22);
    }
    if (social === "amigos" || social === "familia") {
      return findArchetype(6);
    }
    return findArchetype(6);
  }

  if (motiv.includes("gastronomia")) {
    if (budget === "high" || budget === "ilim") {
      return findArchetype(12);
    }
    if (budget === "low" || pace === "slow") {
      return findArchetype(10);
    }
    if (social === "solo") {
      return findArchetype(11);
    }
    return findArchetype(11);
  }

  if (motiv.includes("naturaleza")) {
    if (pace === "packed") {
      return findArchetype(1);
    }
    if (budget === "low") {
      return findArchetype(25);
    }
    if (pace === "slow" || pace === "zero") {
      return findArchetype(15);
    }
    return findArchetype(15);
  }

  if (motiv.includes("foto")) {
    if (budget === "high" || budget === "ilim" || budget === "mid") {
      return findArchetype(23);
    }
    if (pace === "slow" && social === "solo") {
      return findArchetype(7);
    }
    if (social === "solo") {
      return findArchetype(7);
    }
    return findArchetype(23);
  }

  if (motiv.includes("lujo")) {
    if (budget === "high" || budget === "ilim") {
      return findArchetype(12);
    }
    if (social === "amigos" || social === "familia" || social === "pareja") {
      return findArchetype(18);
    }
    if (pace === "slow" || pace === "zero") {
      return findArchetype(23);
    }
    return findArchetype(12);
  }

  if (motiv.includes("unico")) {
    if (pace === "packed") {
      return findArchetype(22);
    }
    if (budget === "low") {
      return findArchetype(25);
    }
    return findArchetype(1);
  }

  return findArchetype(1);
}

const PACE_MODIFIERS: Record<string, string> = {
  packed:
    "Añade urgencia: cada hora cuenta, más actividades, lenguaje energético",
  balanced:
    "Tono equilibrado, espacio para improvisar",
  slow: "Lenguaje contemplativo, menos lugares vividos intensamente",
  zero: "Lenguaje contemplativo, menos lugares vividos intensamente",
};

const SOCIAL_MODIFIERS: Record<string, string> = {
  solo: "Énfasis en autonomía y autoconocimiento",
  pareja: "Énfasis en conexión compartida, momentos a dos",
  amigos: "Énfasis en experiencias colectivas",
  familia: "Énfasis en experiencias colectivas",
};

const BUDGET_MODIFIERS: Record<string, string> = {
  high: "Lenguaje de sofisticación, calidad premium",
  ilim: "Lenguaje de sofisticación, calidad premium",
  mid: "Calidad sensata sin excesos",
  low: "Bajo presupuesto = libertad de movimiento, no limitación",
};

const SOCIAL_E_MODIFIERS: Record<string, string> = {
  intro: "Tono introspectivo",
  extro: "Tono de celebración y energía grupal",
};

const EXP_MODIFIERS: Record<string, string> = {
  nadie: "Prioriza lo oculto y poco documentado en la narrativa",
  local: "Prioriza inmersión local y rutinas auténticas",
  icono: "Equilibra iconos con contexto personal",
  nat_ext: "Énfasis en naturaleza extrema y desafío físico",
  arte: "Énfasis en estética, creatividad y detalle visual",
  gente: "Énfasis en encuentros humanos como eje del viaje",
};

const CULTURA_MODIFIERS: Record<string, string> = {
  arqueologia: "Profundiza en capas históricas y misterio del pasado",
  museos: "Curaduría cultural y contexto intelectual",
  historia: "Narrativa histórica como hilo conductor",
  mercados: "Cultura vivida en mercados y artesanía local",
};

export function getModifiers(profile: TravelerProfileInput): string[] {
  const modifiers: string[] = [];
  const pace = getPrimaryPace(profile);
  if (PACE_MODIFIERS[pace]) modifiers.push(PACE_MODIFIERS[pace]);

  const social = getSocial(profile);
  if (social && SOCIAL_MODIFIERS[social]) {
    modifiers.push(SOCIAL_MODIFIERS[social]);
  }

  const budget = getBudget(profile);
  if (budget && BUDGET_MODIFIERS[budget]) {
    modifiers.push(BUDGET_MODIFIERS[budget]);
  }

  const socialE = getSocialEnergy(profile);
  if (socialE && SOCIAL_E_MODIFIERS[socialE] && modifiers.length < 3) {
    modifiers.push(SOCIAL_E_MODIFIERS[socialE]);
  }

  const exp = asStringArray(profile.exp);
  for (const e of exp) {
    if (EXP_MODIFIERS[e] && modifiers.length < 3) {
      modifiers.push(EXP_MODIFIERS[e]);
    }
  }

  const cultura = asStringArray(profile.cultura);
  for (const c of cultura) {
    if (CULTURA_MODIFIERS[c] && modifiers.length < 3) {
      modifiers.push(CULTURA_MODIFIERS[c]);
    }
  }

  return modifiers.slice(0, 3);
}

export function buildArchetypeProfilePrompt(
  archetype: Archetype,
  modifiers: string[]
): string {
  const modifierBlock = modifiers
    .map((m, i) => `${i + 1}. ${m}`)
    .join("\n");

  return `PERFIL PSICOLÓGICO DEL VIAJERO — ARQUETIPO ASIGNADO (solo este viajero):

Arquetipo base: ${archetype.nombre}
Esencia DNA (inspiración, no copiar literal): ${archetype.esencia}
Frase insignia de referencia: "${archetype.frase_insignia}"

Modificadores de tono — aplica OBLIGATORIAMENTE estos ${modifiers.length}:
${modifierBlock}

REGLAS DE PERSONALIZACIÓN:
1. Usa el arquetipo como ADN emocional; NO copies la esencia palabra por palabra.
2. Escribe esencia final de 80-120 palabras combinando ADN + modificadores + detalles REALES del cuestionario (destino, act, accom, food, diet, extra, mision_viaje, exp, cultura).
3. Dos viajeros del mismo arquetipo con modificadores distintos DEBEN sonar notablemente diferentes.
4. El nombre puede adaptarse ligeramente al destino (ej. "El Cazador de Vértigo Austral").
5. La frase insignia puede inspirarse en la del arquetipo pero debe incorporar un detalle específico del viajero cuando sea posible.
6. Genera superpoder (10-15 palabras), animal con 2-3 razones específicas (sin clichés obvios), y 5-6 stats Travel DNA (0-100) desde campos diversos del cuestionario — no solo motiv/energy.
7. Tono: perceptivo y cálido, nunca adulador ni horóscopo. No empieces siempre con "Eres alguien que...".

FORMATO DE SALIDA (HTML, ANTES del itinerario):
<div class="profile-result">
<h2>[Nombre del tipo]</h2>
<p class="profile-essence">[Esencia]</p>
<p><strong>Tu superpoder:</strong> [superpoder]</p>
<p class="profile-quote">"[Frase insignia]"</p>
<p><strong>Si fueras un animal:</strong> [animal y razones]</p>
<div class="profile-stats">
<p><strong>[Stat 1]:</strong> [0-100]</p>
(5-6 stats total)
</div>
</div>`;
}

export function getDurationDays(profile: TravelerProfileInput): number | null {
  if (typeof profile.duration_days === "number" && profile.duration_days > 0) {
    return profile.duration_days;
  }

  const dur = typeof profile.dur === "string" ? profile.dur : "";
  const durMap: Record<string, number> = {
    finde: 3,
    finde_largo: 4,
    semana: 7,
    dos: 14,
    tres: 21,
    nomad: 45,
    flex: 10,
  };
  if (dur && durMap[dur]) return durMap[dur];

  if (profile.trip_type === "nomada") return 60;

  return null;
}

export function getMaxTokens(durationDays: number | null): number {
  if (durationDays === null) return 6000;
  if (durationDays <= 7) return 4000;
  if (durationDays <= 21) return 6000;
  return 8000;
}

export function getWebSearchInstruction(durationDays: number | null): string {
  if (durationDays !== null && durationDays <= 7) {
    return "Para viajes de hasta 7 días, limita la búsqueda web a 2-3 consultas esenciales.";
  }
  return "Para viajes más largos, usa hasta 4-5 búsquedas web.";
}
