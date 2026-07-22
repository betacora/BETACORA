export type Archetype = {
  id: number;
  nombre: string;
  esencia: string;
  frase_insignia: string;
  nota: string;
};

export type TravelerProfileInput = Record<string, unknown>;

export {
  selectArchetype,
  getModifiers,
  getArchetypeById,
  MOTIVATION_MATRIX,
} from "./archetypes-core.js";

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
  if (durationDays === null) return 7000;
  // Extra headroom for the trailing bt-places JSON map block
  if (durationDays <= 7) return 5500;
  if (durationDays <= 21) return 7000;
  return 9000;
}

export function getWebSearchInstruction(durationDays: number | null): string {
  if (durationDays !== null && durationDays <= 7) {
    return "Para viajes de hasta 7 días, limita la búsqueda web a 2-3 consultas esenciales.";
  }
  return "Para viajes más largos, usa hasta 4-5 búsquedas web.";
}
