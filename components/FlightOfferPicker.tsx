"use client";

import { useEffect, useState } from "react";
import type { SimplifiedFlightOffer } from "@/lib/duffel";
import {
  formatFlightDuration,
  formatFlightPrice,
  formatFlightTime,
  formatStops,
} from "@/lib/flightFormat";
import { supabase } from "@/lib/supabase";

export type FlightPickerCopy = {
  title: string;
  subtitle: string;
  loading: string;
  empty: string;
  error: string;
  select: string;
  selected: string;
  direct: string;
  stop: string;
  stops: string;
  sandboxNote: string;
  missingParams: string;
  saving: string;
  saved: string;
  saveError: string;
};

type SearchResponse = {
  ok: boolean;
  error?: string;
  offerRequestId?: string;
  offers?: SimplifiedFlightOffer[];
  search?: { origin: string; destination: string };
  note?: string;
};

type Props = {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  passengers?: number;
  itineraryId?: string | null;
  copy: FlightPickerCopy;
  /** Called when user selects an offer (local selection; booking not implemented). */
  onSelect?: (offer: SimplifiedFlightOffer) => void;
};

export function FlightOfferPicker({
  origin,
  destination,
  departureDate,
  returnDate,
  passengers = 1,
  itineraryId,
  copy,
  onSelect,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<SimplifiedFlightOffer[]>([]);
  const [offerRequestId, setOfferRequestId] = useState<string | null>(null);
  const [routeLabel, setRouteLabel] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!origin || !destination || !departureDate) {
        setLoading(false);
        setError(copy.missingParams);
        return;
      }

      setLoading(true);
      setError(null);
      setOffers([]);
      setSelectedId(null);
      setSaveState("idle");

      try {
        const res = await fetch("/api/duffel/search-offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin,
            destination,
            departureDate,
            returnDate: returnDate || null,
            passengers,
            limit: 8,
          }),
        });
        const data = (await res.json()) as SearchResponse;
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setError(data.error || copy.error);
          setOffers([]);
          return;
        }
        setOffers(data.offers || []);
        setOfferRequestId(data.offerRequestId || null);
        if (data.search) {
          setRouteLabel(`${data.search.origin} → ${data.search.destination}`);
        }
        if (!(data.offers && data.offers.length)) {
          setError(copy.empty);
        }
      } catch {
        if (!cancelled) setError(copy.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [
    origin,
    destination,
    departureDate,
    returnDate,
    passengers,
    copy.empty,
    copy.error,
    copy.missingParams,
  ]);

  async function handleSelect(offer: SimplifiedFlightOffer) {
    setSelectedId(offer.id);
    onSelect?.(offer);

    if (!itineraryId) {
      setSaveState("idle");
      return;
    }

    setSaveState("saving");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setSaveState("idle");
        return;
      }

      const res = await fetch("/api/flights/select", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          itinerary_id: itineraryId,
          offer,
          offer_request_id: offerRequestId,
        }),
      });
      const data = await res.json();
      setSaveState(res.ok && data.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
  }

  return (
    <section
      className="bt-flight-offers"
      aria-label={copy.title}
      data-bt-flight-mounted="1"
    >
      <header className="bt-flight-offers__head">
        <h3 className="bt-flight-offers__title">{copy.title}</h3>
        <p className="bt-flight-offers__sub">
          {routeLabel
            ? `${copy.subtitle} · ${routeLabel}`
            : copy.subtitle}
        </p>
      </header>

      {loading ? (
        <p className="bt-flight-offers__status" aria-busy="true">
          {copy.loading}
        </p>
      ) : error && !offers.length ? (
        <p className="bt-flight-offers__status bt-flight-offers__status--err">
          {error}
        </p>
      ) : (
        <ul className="bt-flight-offers__list">
          {offers.map((offer) => {
            const selected = selectedId === offer.id;
            return (
              <li key={offer.id}>
                <button
                  type="button"
                  className={`bt-flight-offer${selected ? " is-selected" : ""}`}
                  onClick={() => handleSelect(offer)}
                  aria-pressed={selected}
                >
                  <div className="bt-flight-offer__main">
                    <span className="bt-flight-offer__airline">
                      {offer.airline}
                      {offer.airlineCode ? (
                        <span className="bt-flight-offer__code">
                          {" "}
                          {offer.airlineCode}
                        </span>
                      ) : null}
                    </span>
                    <span className="bt-flight-offer__times">
                      {formatFlightTime(offer.departureAt)}
                      <span aria-hidden="true"> → </span>
                      {formatFlightTime(offer.arrivalAt)}
                    </span>
                    <span className="bt-flight-offer__meta">
                      {formatFlightDuration(offer.duration)}
                      {" · "}
                      {formatStops(offer.stops, {
                        direct: copy.direct,
                        stop: copy.stop,
                        stops: copy.stops,
                      })}
                    </span>
                  </div>
                  <div className="bt-flight-offer__side">
                    <span className="bt-flight-offer__price">
                      {formatFlightPrice(offer.price, offer.currency)}
                    </span>
                    <span className="bt-flight-offer__cta">
                      {selected ? copy.selected : copy.select}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selectedId ? (
        <p className="bt-flight-offers__status bt-flight-offers__status--ok">
          {saveState === "saving"
            ? copy.saving
            : saveState === "saved"
              ? copy.saved
              : saveState === "error"
                ? copy.saveError
                : copy.selected}
        </p>
      ) : null}

      <p className="bt-flight-offers__note">{copy.sandboxNote}</p>
    </section>
  );
}
