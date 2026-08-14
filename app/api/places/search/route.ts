import { NextRequest, NextResponse } from "next/server";
import {
  PlacesConfigError,
  PlacesUpstreamError,
  PlacesValidationError,
  scrubSecrets,
  searchPlacesText,
} from "@/lib/places";
import { clientIp, enforceRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

/** Hourly rate limit per client IP (Places is paid). */
const IP_HOURLY_LIMIT = 30;
/** Global emergency cap across the whole app */
const GLOBAL_HOURLY_LIMIT = 300;

function missingKeyResponse(): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      error:
        "GOOGLE_PLACES_API_KEY is not set. Add it as a server-only env var (never NEXT_PUBLIC_*).",
      code: "misconfigured",
      hint: "Add GOOGLE_PLACES_API_KEY to Vercel (Production + Preview) or .env.local as a server-only secret — never NEXT_PUBLIC_*. Redeploy after setting it.",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * GET /api/places/search?q=...&lang=es&limit=8
 *
 * Server-only Google Places Text Search (Legacy — matches keys restricted to
 * "Places API", not only "Places API (New)").
 * Rate limits are fail-closed (same pattern as generate-itinerary / assistant-chat):
 * if Upstash is missing or errors, the request is blocked — never burn Places quota.
 *
 * GOOGLE_PLACES_API_KEY is read only on the server (outbound request to Google) and
 * never included in the JSON body returned to the browser.
 */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const lang =
      req.nextUrl.searchParams.get("lang") ??
      req.nextUrl.searchParams.get("language") ??
      undefined;
    const limitRaw = req.nextUrl.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : undefined;

    // Clear config error before rate-limit gate so missing key is never masked
    // by rate_limit_unavailable when Upstash is down.
    if (!process.env.GOOGLE_PLACES_API_KEY?.trim()) {
      return missingKeyResponse();
    }

    const ip = clientIp(req);

    // Fail-closed IP limit — never burn Places if Redis is down
    const ipLimited = await enforceRateLimit({
      key: `ip:${ip}`,
      limit: IP_HOURLY_LIMIT,
      window: "1 h",
      failMode: "closed",
      label: "places-search-ip",
      message:
        "Has alcanzado el límite de búsquedas de lugares por ahora, inténtalo en unos minutos.",
    });
    if (ipLimited) return ipLimited;

    // Fail-closed global emergency cap
    const globalLimited = await enforceRateLimit({
      key: "global",
      limit: GLOBAL_HOURLY_LIMIT,
      window: "1 h",
      failMode: "closed",
      label: "places-search-global",
      message:
        "El servicio está temporalmente saturado. Inténtalo de nuevo en unos minutos.",
    });
    if (globalLimited) return globalLimited;

    const result = await searchPlacesText({
      query: q,
      language: lang,
      limit,
    });

    const payload = {
      ok: true as const,
      note: "Places Text Search — server proxy only (New, with Legacy fallback). Attribution required when shown in UI (Piece 2+).",
      query: result.query,
      language: result.language,
      provider: result.provider,
      count: result.count,
      places: result.places,
    };

    // Defense in depth: never echo the API key even if a field were polluted
    const body = scrubSecrets(JSON.stringify(payload));
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown) {
  const message = scrubSecrets(
    error instanceof Error ? error.message : "Unknown error",
  );

  if (error instanceof PlacesValidationError) {
    return NextResponse.json(
      { ok: false, error: message, code: "validation_error" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (error instanceof PlacesConfigError) {
    return missingKeyResponse();
  }

  if (error instanceof PlacesUpstreamError) {
    const unauthorized =
      /not authorized|blocked|REQUEST_DENIED|API key/i.test(message);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        code: "places_upstream",
        hint: unauthorized
          ? "GOOGLE_PLACES_API_KEY está configurada, pero Google rechaza New y Legacy. En Cloud Console: (1) habilita «Places API (New)» y/o «Places API»; (2) API restrictions de la clave debe incluir al menos una; (3) Application restrictions no puede ser HTTP referrers — para Vercel (server) usa None o IPs."
          : undefined,
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  console.error("[places/search]", scrubSecrets(String(error)));
  return NextResponse.json(
    {
      ok: false,
      error: message || "Places search failed",
      code: "places_error",
    },
    { status: 502, headers: { "Cache-Control": "no-store" } },
  );
}
