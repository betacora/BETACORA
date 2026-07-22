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
    return { ok: true, id: data?.id ?? null };
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

  window.btAuth = {
    init,
    getUser,
    checkLimit,
    incrementCount,
    saveItinerary,
    savePostTripFeedback,
  };
})();
