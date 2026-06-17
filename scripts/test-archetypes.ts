import { selectArchetype, type TravelerProfileInput } from "../lib/archetypes";

const testProfiles: { label: string; profile: TravelerProfileInput }[] = [
  {
    label: "aventura + packed + solo",
    profile: {
      motiv: ["aventura"],
      pace: "packed",
      social: "solo",
      budget_r: "mid",
    },
  },
  {
    label: "aventura + slow",
    profile: {
      motiv: ["aventura"],
      pace: "slow",
      social: "amigos",
      budget_r: "mid",
    },
  },
  {
    label: "cultura + solo",
    profile: {
      motiv: ["culturas"],
      pace: "balanced",
      social: "solo",
      budget_r: "mid",
    },
  },
  {
    label: "cultura + low budget",
    profile: {
      motiv: ["historia"],
      pace: "balanced",
      social: "pareja",
      budget_r: "low",
    },
  },
  {
    label: "gastronomia + default",
    profile: {
      motiv: ["gastronomia"],
      pace: "balanced",
      social: "pareja",
      budget_r: "mid",
    },
  },
  {
    label: "naturaleza + slow",
    profile: {
      motiv: ["naturaleza"],
      pace: "slow",
      social: "pareja",
      budget_r: "mid",
    },
  },
  {
    label: "foto + slow + solo",
    profile: {
      motiv: ["foto"],
      pace: "slow",
      social: "solo",
      budget_r: "low",
    },
  },
  {
    label: "social + packed + high budget",
    profile: {
      motiv: ["social"],
      pace: "packed",
      social: "amigos",
      budget_r: "high",
    },
  },
  {
    label: "libertad/nomad + low budget",
    profile: {
      motiv: ["nomad"],
      pace: "slow",
      social: "solo",
      budget_r: "low",
    },
  },
  {
    label: "introspeccion + slow",
    profile: {
      motiv: ["desconectar"],
      pace: "slow",
      social: "pareja",
      budget_r: "mid",
    },
  },
  {
    label: "solo traveler (no motiv)",
    profile: {
      motiv: [],
      pace: "slow",
      social: "solo",
      budget_r: "mid",
    },
  },
  {
    label: "lujo + high budget",
    profile: {
      motiv: ["lujo"],
      pace: "balanced",
      social: "pareja",
      budget_r: "high",
    },
  },
];

console.log("=== selectArchetype() deterministic test ===\n");

const seenNames = new Set<string>();

for (const { label, profile } of testProfiles) {
  const archetype = selectArchetype(profile);
  seenNames.add(archetype.nombre);
  console.log(`Case: ${label}`);
  console.log(`  → ID ${archetype.id}: ${archetype.nombre}`);
  console.log();
}

console.log(`Unique archetype names: ${seenNames.size} / ${testProfiles.length}`);
console.log(`Names: ${[...seenNames].join(", ")}`);
