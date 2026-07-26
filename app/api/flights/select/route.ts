import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  saveFlightSelection,
  selectionFromOffer,
  type FlightSelectionPayload,
} from "@/lib/flightSelections";
import type { SimplifiedFlightOffer } from "@/lib/duffel";
import {
  checkRateLimit,
  clientIp,
  rateLimitResponse,
} from "@/lib/rateLimit";

/**
 * Save a Duffel flight offer selection for the authenticated user.
 * Does NOT create a Duffel order or process payment.
 *
 * POST /api/flights/select
 * Authorization: Bearer <supabase access_token>
 *
 * Body (either shape):
 * 1) { itinerary_id, duffel_offer_id, price, currency, airline? }
 * 2) { itinerary_id, offer: SimplifiedFlightOffer }
 */
export async function POST(request: Request) {
  try {
    const limited = checkRateLimit({
      key: `flights-select:${clientIp(request)}`,
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (!limited.ok) {
      return rateLimitResponse(limited.retryAfterSec);
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { ok: false, error: "missing_authorization" },
        { status: 401 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { ok: false, error: "supabase_not_configured" },
        { status: 503 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = (await request.json()) as FlightSelectionPayload & {
      offer?: SimplifiedFlightOffer;
      /** @deprecated use duffel_offer_id */
      offer_id?: string;
    };

    const itineraryId = String(body.itinerary_id ?? "").trim();
    if (!itineraryId) {
      return NextResponse.json(
        { ok: false, error: "itinerary_id_required" },
        { status: 400 },
      );
    }

    const payload: FlightSelectionPayload =
      body.offer && typeof body.offer === "object" && body.offer.id
        ? {
            ...selectionFromOffer(body.offer, itineraryId),
            ...(body.price != null ? { price: body.price } : {}),
            ...(body.currency != null ? { currency: body.currency } : {}),
            ...(body.airline != null ? { airline: body.airline } : {}),
          }
        : {
            itinerary_id: itineraryId,
            duffel_offer_id: String(
              body.duffel_offer_id || body.offer_id || "",
            ).trim(),
            price: String(body.price ?? "").trim(),
            currency: body.currency || "USD",
            airline: body.airline ?? null,
          };

    const result = await saveFlightSelection(supabase, payload);

    if (!result.ok) {
      const status =
        result.error === "not_logged_in"
          ? 401
          : result.error === "itinerary_not_found"
            ? 404
            : result.error === "itinerary_id_required" ||
                result.error === "duffel_offer_id_required" ||
                result.error === "price_required"
              ? 400
              : 400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json({
      ok: true,
      id: result.id,
      note: "Selection saved. No Duffel order or payment was created.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
