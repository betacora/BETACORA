import type { SupabaseClient } from "@supabase/supabase-js";

const ANON_STORAGE_KEY = "bt_gen_count";
const ANON_LIMIT = 1;
const LOGGED_IN_LIMIT = 2;

export type LimitReason = "limit" | "not_logged_in";

export type LimitResult =
  | { allowed: true }
  | { allowed: false; reason: LimitReason };

export async function checkLimit(
  supabase: SupabaseClient
): Promise<LimitResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("generations_count")
      .eq("id", user.id)
      .maybeSingle();

    const count = profile?.generations_count ?? 0;
    if (count >= LOGGED_IN_LIMIT) {
      return { allowed: false, reason: "limit" };
    }
    return { allowed: true };
  }

  if (typeof window !== "undefined") {
    const count = parseInt(localStorage.getItem(ANON_STORAGE_KEY) || "0", 10);
    if (count >= ANON_LIMIT) {
      return { allowed: false, reason: "not_logged_in" };
    }
  }

  return { allowed: true };
}

export async function incrementCount(
  supabase: SupabaseClient
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("generations_count")
      .eq("id", user.id)
      .maybeSingle();

    const count = (profile?.generations_count ?? 0) + 1;
    await supabase
      .from("profiles")
      .update({
        generations_count: count,
        last_generation_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    return;
  }

  if (typeof window !== "undefined") {
    const count = parseInt(localStorage.getItem(ANON_STORAGE_KEY) || "0", 10);
    localStorage.setItem(ANON_STORAGE_KEY, String(count + 1));
  }
}

export async function saveItinerary(
  supabase: SupabaseClient,
  payload: {
    destination?: string | null;
    profile_type?: string | null;
    profile_essence?: string | null;
    questionnaire_answers: Record<string, unknown>;
    itinerary_html: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "not_logged_in" };
  }

  const { error } = await supabase.from("itineraries").insert({
    user_id: user.id,
    destination: payload.destination ?? null,
    profile_type: payload.profile_type ?? null,
    profile_essence: payload.profile_essence ?? null,
    questionnaire_answers: payload.questionnaire_answers,
    itinerary_html: payload.itinerary_html,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
