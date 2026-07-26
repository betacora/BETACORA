import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export type AuthedRequest = {
  user: User;
  token: string;
  supabase: SupabaseClient;
};

function unauthorized(message?: string): Response {
  return NextResponse.json(
    {
      error: message || "Debes iniciar sesión para usar esta función.",
      code: "unauthorized",
    },
    { status: 401 },
  );
}

/** Extract Bearer token from Authorization header (or null). */
export function bearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.toLowerCase().startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

/**
 * Require a valid Supabase session. Returns 401 Response if missing/invalid.
 * Uses the anon key + user JWT so RLS still applies.
 */
export async function requireSupabaseUser(
  request: Request,
): Promise<AuthedRequest | Response> {
  const token = bearerToken(request);
  if (!token) return unauthorized();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[apiAuth] Supabase env vars missing");
    return NextResponse.json(
      { error: "Servicio de autenticación no configurado.", code: "auth_misconfigured" },
      { status: 503 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return unauthorized("Sesión inválida o expirada. Vuelve a iniciar sesión.");
  }

  return { user, token, supabase };
}

export function isAuthed(
  result: AuthedRequest | Response,
): result is AuthedRequest {
  return !(result instanceof Response) && "user" in result;
}
