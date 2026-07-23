import type { SupabaseClient } from "@supabase/supabase-js";

export type SavedItinerary = {
  id: string;
  destination: string | null;
  profile_type: string | null;
  profile_essence: string | null;
  itinerary_html: string | null;
  questionnaire_answers: Record<string, unknown> | null;
  created_at: string;
};

export async function listUserItineraries(
  supabase: SupabaseClient,
): Promise<SavedItinerary[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("itineraries")
    .select(
      "id, destination, profile_type, profile_essence, itinerary_html, questionnaire_answers, created_at",
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[BeTacora] list itineraries failed:", error.message);
    return [];
  }
  return (data || []) as SavedItinerary[];
}

export async function getItineraryById(
  supabase: SupabaseClient,
  id: string,
): Promise<SavedItinerary | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("itineraries")
    .select(
      "id, destination, profile_type, profile_essence, itinerary_html, questionnaire_answers, created_at",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("[BeTacora] get itinerary failed:", error.message);
    return null;
  }
  return data as SavedItinerary | null;
}

/** Latest itinerary that has an archetype name — used for Inicio greeting + Perfil. */
export async function getLatestTravelerProfile(
  supabase: SupabaseClient,
): Promise<{
  profile_type: string;
  profile_essence: string | null;
  destination: string | null;
  created_at: string;
} | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("itineraries")
    .select("profile_type, profile_essence, destination, created_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .not("profile_type", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.profile_type) {
    if (error) console.warn("[BeTacora] latest profile failed:", error.message);
    return null;
  }

  return {
    profile_type: data.profile_type,
    profile_essence: data.profile_essence,
    destination: data.destination,
    created_at: data.created_at,
  };
}
