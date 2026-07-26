/**
 * Duffel Flights — sandbox / test mode only (read: offer search).
 *
 * Uses the official `@duffel/api` SDK.
 * Auth: DUFFEL_API_KEY must be a test token (starts with `duffel_test_`).
 * No order creation or payments.
 *
 * When adding order creation + DNI/passport collection: follow
 * `.cursor/rules/flight-travel-documents.mdc` — prefer pass-through to Duffel
 * with no Supabase persistence; encrypt + short TTL if temporary storage is
 * unavoidable; mask IDs in UI; legal review before launch.
 */

import { Duffel } from "@duffel/api";
import type {
  CreateOfferRequestPassenger,
  CreateOfferRequestSlice,
} from "@duffel/api/booking/OfferRequests/OfferRequestsTypes";

export type DuffelPassengerInput =
  | { type: "adult" | "child" | "infant_without_seat" }
  | { age: number };

export type SearchOffersInput = {
  origin: string;
  destination: string;
  /** ISO date YYYY-MM-DD */
  departureDate: string;
  /** Optional return date for round-trip */
  returnDate?: string | null;
  /** Adult count, or explicit passenger objects */
  passengers?: number | DuffelPassengerInput[];
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
};

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

export type SearchFlightsResult = {
  offerRequestId: string;
  liveMode: boolean;
  offers: SimplifiedFlightOffer[];
};

type OfferLike = {
  id: string;
  total_amount?: string | null;
  total_currency?: string | null;
  cabin_class?: string | null;
  live_mode?: boolean;
  owner?: { name?: string | null; iata_code?: string | null } | null;
  slices?: Array<{
    duration?: string | null;
    segments?: Array<{
      departing_at?: string | null;
      arriving_at?: string | null;
      origin?: { iata_code?: string | null } | null;
      destination?: { iata_code?: string | null } | null;
      operating_carrier?: { name?: string | null; iata_code?: string | null } | null;
      marketing_carrier?: { name?: string | null; iata_code?: string | null } | null;
    }> | null;
  }> | null;
};

function getSandboxApiKey(): string {
  const key = process.env.DUFFEL_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "DUFFEL_API_KEY is not set. Add your Duffel sandbox token (starts with duffel_test_) to .env.local.",
    );
  }
  if (!key.startsWith("duffel_test_")) {
    throw new Error(
      "DUFFEL_API_KEY must be a test/sandbox token (starts with duffel_test_). Refusing live keys.",
    );
  }
  return key;
}

function getClient(): Duffel {
  return new Duffel({ token: getSandboxApiKey() });
}

function normalizePassengers(
  passengers: number | DuffelPassengerInput[] | undefined,
): CreateOfferRequestPassenger[] {
  if (passengers === undefined) {
    return [{ type: "adult" }];
  }
  if (typeof passengers === "number") {
    if (!Number.isInteger(passengers) || passengers < 1 || passengers > 9) {
      throw new Error("passengers must be an integer between 1 and 9");
    }
    return Array.from({ length: passengers }, () => ({ type: "adult" as const }));
  }
  if (!Array.isArray(passengers) || passengers.length === 0) {
    throw new Error("passengers must be a non-empty array");
  }
  return passengers.map((p): CreateOfferRequestPassenger => {
    if ("age" in p && typeof p.age === "number") {
      return { age: p.age };
    }
    if ("type" in p && p.type === "adult") {
      return { type: "adult" };
    }
    if ("type" in p && (p.type === "child" || p.type === "infant_without_seat")) {
      // Under-18 passengers must use age (not type) per Duffel typings
      return { age: p.type === "child" ? 8 : 1 };
    }
    throw new Error("Invalid passenger entry");
  });
}

function assertIata(code: string, label: string): string {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new Error(`${label} must be a 3-letter IATA code (e.g. MAD, LHR)`);
  }
  return normalized;
}

function assertISODate(value: string, label: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must be YYYY-MM-DD`);
  }
  return value;
}

function simplifyOffer(offer: OfferLike): SimplifiedFlightOffer {
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
 * Search flight offers via Duffel sandbox (POST offer_requests only — no booking).
 *
 * Preferred form:
 *   searchFlights({ origin, destination, departureDate, returnDate?, passengers?, cabinClass? })
 *
 * Legacy positional form (kept for convenience):
 *   searchFlights(origin, destination, departureDate, passengers)
 */
export async function searchFlights(
  input: SearchOffersInput,
): Promise<SearchFlightsResult>;
export async function searchFlights(
  origin: string,
  destination: string,
  departureDate: string,
  passengers?: number | DuffelPassengerInput[],
): Promise<SearchFlightsResult>;
export async function searchFlights(
  originOrInput: string | SearchOffersInput,
  destination?: string,
  departureDate?: string,
  passengers?: number | DuffelPassengerInput[],
): Promise<SearchFlightsResult> {
  const input: SearchOffersInput =
    typeof originOrInput === "object"
      ? originOrInput
      : {
          origin: originOrInput,
          destination: destination ?? "",
          departureDate: departureDate ?? "",
          passengers,
        };

  const origin = assertIata(input.origin, "origin");
  const dest = assertIata(input.destination, "destination");
  const outDate = assertISODate(input.departureDate, "departureDate");
  const returnDate = input.returnDate
    ? assertISODate(input.returnDate, "returnDate")
    : null;
  const pax = normalizePassengers(input.passengers);
  const cabinClass = input.cabinClass ?? "economy";

  const slices: CreateOfferRequestSlice[] = [
    {
      origin,
      destination: dest,
      departure_date: outDate,
      arrival_time: null,
      departure_time: null,
    },
  ];

  if (returnDate) {
    slices.push({
      origin: dest,
      destination: origin,
      departure_date: returnDate,
      arrival_time: null,
      departure_time: null,
    });
  }

  const duffel = getClient();
  const response = await duffel.offerRequests.create({
    slices,
    passengers: pax,
    cabin_class: cabinClass,
  });

  const data = response.data;
  const offers = ((data.offers ?? []) as OfferLike[]).map(simplifyOffer);

  return {
    offerRequestId: data.id,
    liveMode: Boolean(data.live_mode),
    offers,
  };
}

/** Alias — same as searchFlights({ ... }) */
export async function searchOffers(
  input: SearchOffersInput,
): Promise<SearchFlightsResult> {
  return searchFlights(input);
}
