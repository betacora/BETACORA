/**
 * Duffel Flights API client — TEST MODE ONLY.
 *
 * Search uses POST /air/offer_requests (creating an offer request returns offers).
 * GET /air/offer_requests lists prior requests; GET /air/offer_requests/{id} retrieves one.
 * Auth: Bearer token from DUFFEL_TEST_API_KEY (tokens start with duffel_test_).
 * Sandbox airline: Duffel Airways (IATA ZZ) — expected in test mode, not real carriers.
 */

const DUFFEL_API_BASE = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

export type DuffelPassengerInput =
  | { type: "adult" | "child" | "infant_without_seat" }
  | { age: number };

export type SimplifiedFlightOffer = {
  id: string;
  airline: string;
  airlineCode: string;
  price: string;
  currency: string;
  duration: string | null;
  stops: number;
  departureAt: string | null;
  arrivalAt: string | null;
  origin: string | null;
  destination: string | null;
  cabinClass: string | null;
  liveMode: boolean;
};

type DuffelAirline = {
  name?: string | null;
  iata_code?: string | null;
};

type DuffelPlace = {
  iata_code?: string | null;
};

type DuffelSegment = {
  departing_at?: string | null;
  arriving_at?: string | null;
  origin?: DuffelPlace | null;
  destination?: DuffelPlace | null;
  operating_carrier?: DuffelAirline | null;
  marketing_carrier?: DuffelAirline | null;
};

type DuffelSlice = {
  duration?: string | null;
  segments?: DuffelSegment[] | null;
};

type DuffelOffer = {
  id: string;
  total_amount?: string | null;
  total_currency?: string | null;
  cabin_class?: string | null;
  live_mode?: boolean;
  owner?: DuffelAirline | null;
  slices?: DuffelSlice[] | null;
};

type DuffelOfferRequestResponse = {
  data?: {
    id?: string;
    live_mode?: boolean;
    offers?: DuffelOffer[] | null;
  };
  errors?: Array<{ message?: string; title?: string; code?: string }>;
};

function getTestApiKey(): string {
  const key = process.env.DUFFEL_TEST_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "DUFFEL_TEST_API_KEY is not set. Add your Duffel sandbox token (starts with duffel_test_) to .env.local.",
    );
  }
  if (!key.startsWith("duffel_test_")) {
    throw new Error(
      "DUFFEL_TEST_API_KEY must be a test token (starts with duffel_test_). Refusing to call with a non-test key.",
    );
  }
  return key;
}

function normalizePassengers(
  passengers: number | DuffelPassengerInput[],
): DuffelPassengerInput[] {
  if (typeof passengers === "number") {
    if (!Number.isInteger(passengers) || passengers < 1) {
      throw new Error("passengers must be a positive integer or an array");
    }
    return Array.from({ length: passengers }, () => ({ type: "adult" as const }));
  }
  if (!Array.isArray(passengers) || passengers.length === 0) {
    throw new Error("passengers must be a non-empty array");
  }
  return passengers;
}

function simplifyOffer(offer: DuffelOffer): SimplifiedFlightOffer {
  const firstSlice = offer.slices?.[0];
  const segments = firstSlice?.segments ?? [];
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  const airline =
    offer.owner?.name ||
    firstSegment?.operating_carrier?.name ||
    firstSegment?.marketing_carrier?.name ||
    "Unknown";

  const airlineCode =
    offer.owner?.iata_code ||
    firstSegment?.operating_carrier?.iata_code ||
    firstSegment?.marketing_carrier?.iata_code ||
    "";

  return {
    id: offer.id,
    airline,
    airlineCode,
    price: offer.total_amount ?? "0",
    currency: offer.total_currency ?? "USD",
    duration: firstSlice?.duration ?? null,
    stops: Math.max(0, segments.length - 1),
    departureAt: firstSegment?.departing_at ?? null,
    arrivalAt: lastSegment?.arriving_at ?? null,
    origin: firstSegment?.origin?.iata_code ?? null,
    destination: lastSegment?.destination?.iata_code ?? null,
    cabinClass: offer.cabin_class ?? null,
    liveMode: offer.live_mode ?? false,
  };
}

/**
 * Search one-way flights via Duffel's test API.
 * Creates an offer request (POST /air/offer_requests) and returns simplified offers.
 */
export async function searchFlights(
  origin: string,
  destination: string,
  date: string,
  passengers: number | DuffelPassengerInput[],
): Promise<{
  offerRequestId: string;
  liveMode: boolean;
  offers: SimplifiedFlightOffer[];
}> {
  const apiKey = getTestApiKey();
  const passengerList = normalizePassengers(passengers);

  const response = await fetch(`${DUFFEL_API_BASE}/air/offer_requests`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Duffel-Version": DUFFEL_VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
      "Accept-Encoding": "gzip",
    },
    body: JSON.stringify({
      data: {
        slices: [
          {
            origin: origin.toUpperCase(),
            destination: destination.toUpperCase(),
            departure_date: date,
          },
        ],
        passengers: passengerList,
        cabin_class: "economy",
      },
    }),
  });

  const payload = (await response.json()) as DuffelOfferRequestResponse;

  if (!response.ok) {
    const detail =
      payload.errors?.map((e) => e.message || e.title || e.code).join("; ") ||
      response.statusText;
    throw new Error(`Duffel offer request failed (${response.status}): ${detail}`);
  }

  const offers = (payload.data?.offers ?? []).map(simplifyOffer);

  return {
    offerRequestId: payload.data?.id ?? "",
    liveMode: payload.data?.live_mode ?? false,
    offers,
  };
}
