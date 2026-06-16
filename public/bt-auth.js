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

    const { error } = await client.from("itineraries").insert({
      user_id: user.id,
      destination: payload.destination ?? null,
      profile_type: payload.profile_type ?? null,
      profile_essence: payload.profile_essence ?? null,
      questionnaire_answers: payload.questionnaire_answers,
      itinerary_html: payload.itinerary_html,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  window.btAuth = {
    init,
    getUser,
    checkLimit,
    incrementCount,
    saveItinerary,
  };
})();
