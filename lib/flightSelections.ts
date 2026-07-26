import type { SupabaseClient } from "@supabase/supabase-js";
import type { SimplifiedFlightOffer } from "@/lib/duffel";

export type FlightSelectionPayload = {
  /** Itinerary this selection belongs to */
  itinerary_id: string;
  /** Duffel offer id (e.g. off_...) */
  duffel_offer_id: string;
  /** Total amount as returned by Duffel (string, e.g. "350.00") */
  price: string;
  currency: string;
  airline?: string | null;
};

export type FlightSelectionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Persist a Duffel offer selection for the current user.
 * Does NOT create a Duffel order or process payment.
 * Must never store DNI/passport — see `.cursor/rules/flight-travel-documents.mdc`.
 */
export async function saveFlightSelection(
  supabase: SupabaseClient,
  payload: FlightSelectionPayload,
): Promise<FlightSelectionResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "not_logged_in" };
  }

  const itineraryId = payload.itinerary_id?.trim();
  if (!itineraryId) {
    return { ok: false, error: "itinerary_id_required" };
  }

  const offerId = payload.duffel_offer_id?.trim();
  if (!offerId) {
    return { ok: false, error: "duffel_offer_id_required" };
  }

  const price = String(payload.price ?? "").trim();
  if (!price) {
    return { ok: false, error: "price_required" };
  }

  const currency = (payload.currency || "USD").trim().toUpperCase();

  const { data: itinerary, error: itineraryError } = await supabase
    .from("itineraries")
    .select("id")
    .eq("id", itineraryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (itineraryError) {
    return { ok: false, error: itineraryError.message };
  }
  if (!itinerary) {
    return { ok: false, error: "itinerary_not_found" };
  }

  const { data, error } = await supabase
    .from("flight_selections")
    .insert({
      user_id: user.id,
      itinerary_id: itineraryId,
      duffel_offer_id: offerId,
      airline: payload.airline ?? null,
      price,
      currency,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data.id };
}

/** Build a selection payload from a simplified Duffel offer. */
export function selectionFromOffer(
  offer: SimplifiedFlightOffer,
  itineraryId: string,
): FlightSelectionPayload {
  return {
    itinerary_id: itineraryId,
    duffel_offer_id: offer.id,
    price: offer.price,
    currency: offer.currency,
    airline: offer.airline,
  };
}
