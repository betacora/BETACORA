import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ACCOUNT_DELETE_CONFIRM_PHRASE } from "@/lib/accountDelete";
import { isAuthed, requireSupabaseUser } from "@/lib/apiAuth";
import {
  checkMemoryRateLimit,
  clientIp,
  rateLimitResponse,
} from "@/lib/rateLimit";

export const runtime = "nodejs";

/**
 * Typed confirmation required in the request body.
 * Prefer hard-delete over anonymize: no paid bookings / legal archives yet,
 * and Apple/Google + GDPR erasure expect real removal when retention is not required.
 */
export { ACCOUNT_DELETE_CONFIRM_PHRASE };

function getServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * POST /api/account/delete
 * Authorization: Bearer <supabase access_token>
 * Body: { confirm: "ELIMINAR" }
 *
 * Deletes only the authenticated user's data + Auth user.
 * Never accepts a target user id from the client.
 */
export async function POST(request: Request) {
  const limited = checkMemoryRateLimit({
    key: `account-delete:${clientIp(request)}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  const auth = await requireSupabaseUser(request);
  if (!isAuthed(auth)) return auth;

  let body: { confirm?: string } = {};
  try {
    body = (await request.json()) as { confirm?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json", code: "invalid_json" },
      { status: 400 },
    );
  }

  const confirm = String(body.confirm ?? "").trim().toUpperCase();
  if (confirm !== ACCOUNT_DELETE_CONFIRM_PHRASE) {
    return NextResponse.json(
      {
        ok: false,
        error: `Debes confirmar escribiendo ${ACCOUNT_DELETE_CONFIRM_PHRASE}.`,
        code: "confirm_required",
      },
      { status: 400 },
    );
  }

  const userId = auth.user.id;
  const { supabase } = auth;

  // 1) Own-row deletes under RLS (user JWT) — cannot touch other users' rows
  const { error: flightsErr } = await supabase
    .from("flight_selections")
    .delete()
    .eq("user_id", userId);
  if (flightsErr) {
    console.error("[account/delete] flight_selections:", flightsErr.message);
    return NextResponse.json(
      { ok: false, error: flightsErr.message, code: "delete_flights_failed" },
      { status: 500 },
    );
  }

  const { error: tripsErr } = await supabase
    .from("itineraries")
    .delete()
    .eq("user_id", userId);
  if (tripsErr) {
    console.error("[account/delete] itineraries:", tripsErr.message);
    return NextResponse.json(
      { ok: false, error: tripsErr.message, code: "delete_itineraries_failed" },
      { status: 500 },
    );
  }

  // shared_trips may lack user_id on older rows; delete owned ones when column exists
  const { error: sharesErr } = await supabase
    .from("shared_trips")
    .delete()
    .eq("user_id", userId);
  if (sharesErr && !/user_id|column/i.test(sharesErr.message)) {
    console.error("[account/delete] shared_trips:", sharesErr.message);
    return NextResponse.json(
      { ok: false, error: sharesErr.message, code: "delete_shares_failed" },
      { status: 500 },
    );
  }

  const { error: profileErr } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);
  if (profileErr) {
    console.error("[account/delete] profiles:", profileErr.message);
    return NextResponse.json(
      { ok: false, error: profileErr.message, code: "delete_profile_failed" },
      { status: 500 },
    );
  }

  // 2) Auth user — admin API only; always the JWT subject, never a body userId
  const admin = getServiceRoleClient();
  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. No se puede borrar la cuenta de Auth.",
        code: "service_role_missing",
        partial: true,
        note: "Datos de app borrados; la cuenta de Auth sigue existiendo hasta configurar la service role.",
      },
      { status: 503 },
    );
  }

  const { error: authDeleteErr } = await admin.auth.admin.deleteUser(userId);
  if (authDeleteErr) {
    console.error("[account/delete] auth.admin.deleteUser:", authDeleteErr.message);
    return NextResponse.json(
      {
        ok: false,
        error: authDeleteErr.message,
        code: "delete_auth_failed",
        partial: true,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    deleted: {
      userId,
      flight_selections: true,
      itineraries: true,
      shared_trips: true,
      profiles: true,
      auth: true,
    },
  });
}
