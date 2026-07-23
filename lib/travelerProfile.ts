import type { SupabaseClient } from "@supabase/supabase-js";

/** Stable traveler DNA — reused across trips; not re-asked in short trip flow. */
export const PERSONALITY_KEYS = [
  "wake",
  "pace",
  "energy",
  "motiv",
  "exp",
  "guide",
  "accom",
  "accom_location",
  "accom_priority",
  "amenity",
  "food",
  "diet",
  "cultura",
  "museum_type",
  "act",
  "social",
  "social_e",
  "splurge",
] as const;

export type TravelerProfile = {
  profile_type: string;
  profile_essence: string | null;
  traveler_answers: Record<string, unknown>;
  source: "profiles" | "itineraries";
  updated_at: string | null;
  trip_defaults?: {
    origin?: unknown;
    currency?: string | null;
  };
};

export function extractPersonalityAnswers(
  answers: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!answers || typeof answers !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const key of PERSONALITY_KEYS) {
    const val = answers[key];
    if (val !== undefined && val !== null && val !== "") {
      out[key] = val;
    }
  }
  const mision = answers.mision_viaje;
  if (mision && typeof mision === "object") {
    const mv = mision as Record<string, unknown>;
    if (
      Array.isArray(mv.museum_type) &&
      mv.museum_type.length &&
      out.museum_type === undefined
    ) {
      out.museum_type = mv.museum_type;
    }
  }
  return out;
}

/**
 * Prefer columns on `profiles` (once migrated); fall back to latest itinerary
 * with a profile_type so existing users keep working without a schema change.
 */
export async function getTravelerProfile(
  supabase: SupabaseClient,
): Promise<TravelerProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "profile_type, profile_essence, traveler_answers, profile_updated_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  const { data: lastTrip } = await supabase
    .from("itineraries")
    .select("questionnaire_answers, created_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastAnswers =
    lastTrip?.questionnaire_answers &&
    typeof lastTrip.questionnaire_answers === "object"
      ? (lastTrip.questionnaire_answers as Record<string, unknown>)
      : {};

  const trip_defaults = {
    origin: lastAnswers.origin ?? null,
    currency:
      typeof lastAnswers.currency === "string" ? lastAnswers.currency : null,
  };

  if (
    !profileError &&
    profile?.profile_type &&
    profile.traveler_answers &&
    typeof profile.traveler_answers === "object"
  ) {
    return {
      profile_type: profile.profile_type,
      profile_essence: profile.profile_essence ?? null,
      traveler_answers: extractPersonalityAnswers(
        profile.traveler_answers as Record<string, unknown>,
      ),
      source: "profiles",
      updated_at: profile.profile_updated_at ?? null,
      trip_defaults,
    };
  }

  const { data: itinerary, error: itineraryError } = await supabase
    .from("itineraries")
    .select(
      "profile_type, profile_essence, questionnaire_answers, created_at",
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .not("profile_type", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (itineraryError || !itinerary?.profile_type) {
    if (itineraryError) {
      console.warn(
        "[BeTacora] traveler profile fallback failed:",
        itineraryError.message,
      );
    }
    return null;
  }

  const answers =
    itinerary.questionnaire_answers &&
    typeof itinerary.questionnaire_answers === "object"
      ? (itinerary.questionnaire_answers as Record<string, unknown>)
      : {};

  return {
    profile_type: itinerary.profile_type,
    profile_essence: itinerary.profile_essence ?? null,
    traveler_answers: extractPersonalityAnswers(answers),
    source: "itineraries",
    updated_at: itinerary.created_at ?? null,
    trip_defaults: {
      origin: answers.origin ?? trip_defaults.origin,
      currency:
        typeof answers.currency === "string"
          ? answers.currency
          : trip_defaults.currency,
    },
  };
}

export async function hasTravelerProfile(
  supabase: SupabaseClient,
): Promise<boolean> {
  const profile = await getTravelerProfile(supabase);
  return Boolean(profile?.profile_type);
}

/** Upsert traveler DNA onto profiles (no-op if columns not migrated yet). */
export async function saveTravelerProfileToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: {
    profile_type?: string | null;
    profile_essence?: string | null;
    questionnaire_answers: Record<string, unknown>;
  },
): Promise<void> {
  const traveler_answers = extractPersonalityAnswers(
    payload.questionnaire_answers,
  );
  if (!payload.profile_type && Object.keys(traveler_answers).length === 0) {
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      profile_type: payload.profile_type ?? null,
      profile_essence: payload.profile_essence ?? null,
      traveler_answers,
      profile_updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    const missingCol =
      error.code === "PGRST204" ||
      error.code === "42703" ||
      /profile_type|traveler_answers|profile_essence|profile_updated_at/i.test(
        error.message || "",
      );
    if (!missingCol) {
      console.warn("[BeTacora] save traveler profile failed:", error.message);
    }
  }
}
