import type { SupabaseClient } from "@supabase/supabase-js";
import { getTravelerProfile } from "@/lib/travelerProfile";

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

/** Traveler archetype for Inicio / Perfil — prefers profiles, falls back to itineraries. */
export async function getLatestTravelerProfile(
  supabase: SupabaseClient,
): Promise<{
  profile_type: string;
  profile_essence: string | null;
  destination: string | null;
  created_at: string;
  traveler_answers?: Record<string, unknown>;
} | null> {
  const profile = await getTravelerProfile(supabase);
  if (!profile) return null;

  let destination: string | null = null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data } = await supabase
      .from("itineraries")
      .select("destination")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .not("profile_type", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    destination = data?.destination ?? null;
  }

  return {
    profile_type: profile.profile_type,
    profile_essence: profile.profile_essence,
    destination,
    created_at: profile.updated_at || new Date().toISOString(),
    traveler_answers: profile.traveler_answers,
  };
}
