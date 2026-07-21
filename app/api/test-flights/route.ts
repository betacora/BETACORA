import { NextResponse } from "next/server";
import { searchFlights } from "@/lib/duffel";

/**
 * Isolated sandbox probe for Duffel flight search.
 * Not wired into the main itinerary flow.
 *
 * GET /api/test-flights
 * Hardcoded sample: LHR → JFK, ~45 days out, 1 adult.
 */
export async function GET() {
  try {
    const departureDate = futureDateISO(45);

    const result = await searchFlights("LHR", "JFK", departureDate, 1);

    return NextResponse.json({
      ok: true,
      mode: "test",
      note: "Sandbox results often include Duffel Airways (ZZ). Unrealistic schedules/prices are normal in test mode.",
      search: {
        origin: "LHR",
        destination: "JFK",
        departureDate,
        passengers: 1,
      },
      offerRequestId: result.offerRequestId,
      liveMode: result.liveMode,
      count: result.offers.length,
      offers: result.offers.slice(0, 10),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const missingKey = message.includes("DUFFEL_TEST_API_KEY is not set");

    return NextResponse.json(
      {
        ok: false,
        mode: "test",
        error: message,
        hint: missingKey
          ? "Add DUFFEL_TEST_API_KEY=duffel_test_... to .env.local (from Duffel dashboard → Developer test mode), then restart next dev."
          : undefined,
      },
      { status: missingKey ? 503 : 502 },
    );
  }
}

function futureDateISO(daysFromNow: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}
