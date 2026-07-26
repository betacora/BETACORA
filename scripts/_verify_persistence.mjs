/**
 * Persistence smoke check — run with:
 *   node --env-file=.env.local scripts/_verify_persistence.mjs
 *
 * Optional: BT_TEST_EMAIL + BT_TEST_PASSWORD for a real logged-in round-trip.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.BT_TEST_EMAIL;
const password = process.env.BT_TEST_PASSWORD;

if (!url || !anon) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, anon);

async function main() {
  if (!email || !password) {
    console.log(
      "SKIP DB round-trip: set BT_TEST_EMAIL and BT_TEST_PASSWORD to verify inserts.",
    );
    console.log("Code-path checks only.");
    return;
  }

  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (authErr || !auth.user) {
    console.error("Login failed:", authErr?.message);
    process.exit(1);
  }
  const user = auth.user;
  console.log("Logged in as", user.id);

  // ensure profile
  const { error: upErr } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email || `${user.id}@users.invalid`,
    },
    { onConflict: "id" },
  );
  if (upErr) {
    console.error("ensure profile failed:", upErr.message);
    process.exit(1);
  }

  const stamp = new Date().toISOString();
  const { data: trip, error: tripErr } = await supabase
    .from("itineraries")
    .insert({
      user_id: user.id,
      destination: `Persistence Test ${stamp}`,
      profile_type: "El Persistente",
      profile_essence: "Smoke test essence",
      questionnaire_answers: { wake: "early", pace: ["slow"], social: "solo" },
      itinerary_html: `<article><h2>Test trip ${stamp}</h2></article>`,
      is_active: true,
    })
    .select("id")
    .single();

  if (tripErr) {
    console.error("itinerary insert failed:", tripErr.message, tripErr.code);
    process.exit(1);
  }
  console.log("itinerary inserted:", trip.id);

  const { error: dnaErr } = await supabase
    .from("profiles")
    .update({
      profile_type: "El Persistente",
      profile_essence: "Smoke test essence",
      traveler_answers: { wake: "early", pace: ["slow"], social: "solo" },
      profile_updated_at: stamp,
    })
    .eq("id", user.id);

  if (dnaErr) {
    console.error("profile DNA update failed:", dnaErr.message, dnaErr.code);
    process.exit(1);
  }
  console.log("profile DNA updated");

  const { data: listed, error: listErr } = await supabase
    .from("itineraries")
    .select("id, destination, profile_type")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .eq("id", trip.id)
    .maybeSingle();

  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("profile_type, profile_essence, traveler_answers, profile_updated_at")
    .eq("id", user.id)
    .maybeSingle();

  console.log("VERIFY itinerary row:", listErr || listed);
  console.log("VERIFY profile row:", pErr || {
    profile_type: profile?.profile_type,
    has_answers: Boolean(profile?.traveler_answers),
    profile_updated_at: profile?.profile_updated_at,
  });

  if (!listed?.id || profile?.profile_type !== "El Persistente") {
    process.exit(1);
  }
  console.log("OK persistence round-trip");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
