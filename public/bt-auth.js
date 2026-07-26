/**
 * BeTacora auth + generation limits for questionnaire.html (browser)
 * Mirrors lib/generationLimit.ts
 */
(function () {
  "use strict";

  const ANON_KEY = "bt_gen_count";
  const ANON_LIMIT = 1;
  const LOGGED_IN_LIMIT = 2;

  let supabase = null;
  let initPromise = null;

  async function init() {
    if (supabase) return supabase;
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        const res = await fetch("/api/config");
        const cfg = await res.json();
        if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
          console.warn("[BeTacora] Supabase not configured");
          return null;
        }
        const { createClient } = await import(
          "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
        );
        supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
        return supabase;
      } catch (e) {
        console.error("[BeTacora] bt-auth init failed:", e);
        return null;
      }
    })();

    return initPromise;
  }

  async function getUser() {
    const client = await init();
    if (!client) return null;
    const { data } = await client.auth.getUser();
    return data.user ?? null;
  }

  async function getAccessToken() {
    const client = await init();
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data?.session?.access_token || null;
  }

  async function checkLimit() {
    const client = await init();
    if (client) {
      const user = await getUser();
      if (user) {
        const { data: profile } = await client
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
    }

    const count = parseInt(localStorage.getItem(ANON_KEY) || "0", 10);
    if (count >= ANON_LIMIT) {
      return { allowed: false, reason: "not_logged_in" };
    }
    return { allowed: true };
  }

  async function incrementCount() {
    const client = await init();
    if (client) {
      const user = await getUser();
      if (user) {
        const { data: profile } = await client
          .from("profiles")
          .select("generations_count")
          .eq("id", user.id)
          .maybeSingle();
        const count = (profile?.generations_count ?? 0) + 1;
        await client
          .from("profiles")
          .update({
            generations_count: count,
            last_generation_at: new Date().toISOString(),
          })
          .eq("id", user.id);
        return;
      }
    }

    const count = parseInt(localStorage.getItem(ANON_KEY) || "0", 10);
    localStorage.setItem(ANON_KEY, String(count + 1));
  }

  async function saveItinerary(payload) {
    const client = await init();
    if (!client) return { ok: false, error: "no_client" };

    const user = await getUser();
    if (!user) return { ok: false, error: "not_logged_in" };

    const { data, error } = await client
      .from("itineraries")
      .insert({
        user_id: user.id,
        destination: payload.destination ?? null,
        profile_type: payload.profile_type ?? null,
        profile_essence: payload.profile_essence ?? null,
        questionnaire_answers: payload.questionnaire_answers,
        itinerary_html: payload.itinerary_html,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    await saveTravelerProfile(client, user.id, payload);

    return { ok: true, id: data?.id ?? null };
  }

  /**
   * Persist a Duffel offer selection (no payment / no Duffel order).
   * payload: { itinerary_id, duffel_offer_id, price, currency, airline? }
   * or { itinerary_id, offer: SimplifiedFlightOffer }
   */
  async function saveFlightSelection(payload) {
    const client = await init();
    if (!client) return { ok: false, error: "no_client" };

    const user = await getUser();
    if (!user) return { ok: false, error: "not_logged_in" };

    const offer = payload?.offer && typeof payload.offer === "object" ? payload.offer : null;
    const itineraryId = String(payload?.itinerary_id || "").trim();
    const offerId = String(
      payload?.duffel_offer_id || payload?.offer_id || offer?.id || "",
    ).trim();
    const price = String(payload?.price ?? offer?.price ?? "").trim();
    const currency = String(payload?.currency || offer?.currency || "USD")
      .trim()
      .toUpperCase();
    const airline = payload?.airline ?? offer?.airline ?? null;

    if (!itineraryId) return { ok: false, error: "itinerary_id_required" };
    if (!offerId) return { ok: false, error: "duffel_offer_id_required" };
    if (!price) return { ok: false, error: "price_required" };

    const { data: itinerary, error: itineraryError } = await client
      .from("itineraries")
      .select("id")
      .eq("id", itineraryId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (itineraryError) return { ok: false, error: itineraryError.message };
    if (!itinerary) return { ok: false, error: "itinerary_not_found" };

    const { data, error } = await client
      .from("flight_selections")
      .insert({
        user_id: user.id,
        itinerary_id: itineraryId,
        duffel_offer_id: offerId,
        airline,
        price,
        currency,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id ?? null };
  }

  const PERSONALITY_KEYS = [
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
  ];

  function extractPersonality(answers) {
    if (!answers || typeof answers !== "object") return {};
    const out = {};
    for (const key of PERSONALITY_KEYS) {
      const val = answers[key];
      if (val !== undefined && val !== null && val !== "") out[key] = val;
    }
    const mision = answers.mision_viaje;
    if (
      mision &&
      typeof mision === "object" &&
      Array.isArray(mision.museum_type) &&
      mision.museum_type.length &&
      out.museum_type === undefined
    ) {
      out.museum_type = mision.museum_type;
    }
    return out;
  }

  async function saveTravelerProfile(client, userId, payload) {
    const traveler_answers = extractPersonality(
      payload.questionnaire_answers || {},
    );
    if (!payload.profile_type && Object.keys(traveler_answers).length === 0) {
      return;
    }
    const { error } = await client
      .from("profiles")
      .update({
        profile_type: payload.profile_type ?? null,
        profile_essence: payload.profile_essence ?? null,
        traveler_answers,
        profile_updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (error) {
      const missing =
        error.code === "PGRST204" ||
        error.code === "42703" ||
        /profile_type|traveler_answers|profile_essence|profile_updated_at/i.test(
          error.message || "",
        );
      if (!missing) {
        console.warn("[BeTacora] save traveler profile:", error.message);
      }
    }
  }

  async function getTravelerProfile() {
    const client = await init();
    if (!client) return null;
    const user = await getUser();
    if (!user) return null;

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select(
        "profile_type, profile_essence, traveler_answers, profile_updated_at",
      )
      .eq("id", user.id)
      .maybeSingle();

    const { data: lastTrip } = await client
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
        ? lastTrip.questionnaire_answers
        : {};

    const tripDefaults = {
      origin: lastAnswers.origin ?? null,
      currency: lastAnswers.currency ?? null,
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
        traveler_answers: extractPersonality(profile.traveler_answers),
        source: "profiles",
        trip_defaults: tripDefaults,
      };
    }

    const { data: itinerary, error: itineraryError } = await client
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

    if (itineraryError || !itinerary?.profile_type) return null;

    const answers =
      itinerary.questionnaire_answers &&
      typeof itinerary.questionnaire_answers === "object"
        ? itinerary.questionnaire_answers
        : {};

    return {
      profile_type: itinerary.profile_type,
      profile_essence: itinerary.profile_essence ?? null,
      traveler_answers: extractPersonality(answers),
      source: "itineraries",
      trip_defaults: {
        origin: answers.origin ?? tripDefaults.origin,
        currency: answers.currency ?? tripDefaults.currency,
      },
    };
  }

  async function savePostTripFeedback(itineraryId, feedback) {
    const client = await init();
    if (!client) return { ok: false, error: "no_client" };

    const user = await getUser();
    if (!user) return { ok: false, error: "not_logged_in" };
    if (!itineraryId) return { ok: false, error: "no_itinerary" };

    const would = feedback?.would_return;
    if (!["yes", "no", "maybe"].includes(would)) {
      return { ok: false, error: "invalid_would_return" };
    }

    const liked = (feedback.liked || "").trim() || null;
    const avoid = (feedback.avoid || "").trim() || null;
    const payload = {
      post_trip_liked: liked,
      post_trip_avoid: avoid,
      post_trip_would_return: would,
    };

    const { error } = await client
      .from("itineraries")
      .update(payload)
      .eq("id", itineraryId)
      .eq("user_id", user.id);

    if (!error) return { ok: true };

    // Columns not migrated yet: nest under questionnaire_answers until DDL is applied
    const missingCol =
      error.code === "PGRST204" ||
      error.code === "42703" ||
      /post_trip_/i.test(error.message || "");
    if (!missingCol) return { ok: false, error: error.message };

    const { data: row, error: readErr } = await client
      .from("itineraries")
      .select("questionnaire_answers")
      .eq("id", itineraryId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (readErr) return { ok: false, error: readErr.message };

    const prev =
      row?.questionnaire_answers && typeof row.questionnaire_answers === "object"
        ? row.questionnaire_answers
        : {};
    const { error: fbErr } = await client
      .from("itineraries")
      .update({
        questionnaire_answers: {
          ...prev,
          post_trip: {
            liked,
            avoid,
            would_return: would,
            saved_at: new Date().toISOString(),
          },
        },
      })
      .eq("id", itineraryId)
      .eq("user_id", user.id);

    if (fbErr) return { ok: false, error: fbErr.message };
    return { ok: true, via: "questionnaire_answers" };
  }

  window.btAuth = Object.assign(
    {
      init,
      getUser,
      checkLimit,
      incrementCount,
      saveItinerary,
      saveFlightSelection,
      savePostTripFeedback,
      getTravelerProfile,
      getAccessToken,
    },
    window.btAuth || {},
  );
})();
