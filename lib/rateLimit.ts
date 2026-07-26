/**
 * Rate limiting via Upstash Redis (@upstash/ratelimit).
 *
 * failMode:
 * - "closed" — if Upstash env missing or Redis errors → block (503). Use for paid APIs.
 * - "open"   — if Upstash unavailable → allow (optionally soft in-memory). Use for free endpoints.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type FailMode = "closed" | "open";

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

type MemoryBucket = { timestamps: number[] };
const memoryStore = new Map<string, MemoryBucket>();

const limiterCache = new Map<string, Ratelimit>();

export function hasUpstashEnv(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

/** Best-effort client IP from Vercel / proxy headers. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export function rateLimitResponse(
  retryAfterSec: number,
  message?: string,
  code = "rate_limited",
): Response {
  return Response.json(
    {
      error:
        message ||
        "Has alcanzado el límite por ahora, inténtalo en unos minutos.",
      code,
      retryAfterSec,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "Cache-Control": "no-store",
      },
    },
  );
}

export function rateLimitUnavailableResponse(message?: string): Response {
  return Response.json(
    {
      error:
        message ||
        "El servicio de protección está temporalmente no disponible. Inténtalo en unos minutos.",
      code: "rate_limit_unavailable",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

/** Soft in-memory fallback (per isolate) — used for fail-open soft backup + anon IP safety. */
export function checkMemoryRateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  const windowStart = now - opts.windowMs;
  let bucket = memoryStore.get(opts.key);
  if (!bucket) {
    bucket = { timestamps: [] };
    memoryStore.set(opts.key, bucket);
  }
  while (bucket.timestamps.length && bucket.timestamps[0]! < windowStart) {
    bucket.timestamps.shift();
  }
  if (bucket.timestamps.length >= opts.limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(
      1,
      Math.ceil((oldest + opts.windowMs - now) / 1000),
    );
    return { ok: false, retryAfterSec };
  }
  bucket.timestamps.push(now);
  return { ok: true, remaining: opts.limit - bucket.timestamps.length };
}

function getLimiter(limit: number, window: `${number} ${"s" | "m" | "h" | "d"}`, prefix: string): Ratelimit {
  const cacheKey = `${prefix}:${limit}:${window}`;
  let limiter = limiterCache.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `@bt/ratelimit/${prefix}`,
      analytics: false,
    });
    limiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

export type EnforceRateLimitOpts = {
  /** Redis identifier, e.g. user:uuid or ip:1.2.3.4 */
  key: string;
  limit: number;
  /** Upstash window string, e.g. "1 h" */
  window: `${number} ${"s" | "m" | "h" | "d"}`;
  failMode: FailMode;
  /** Short label for logs + Redis prefix */
  label: string;
  message?: string;
};

/**
 * Enforce a sliding-window limit. Returns a Response to return to the client,
 * or null if the request may proceed.
 */
export async function enforceRateLimit(
  opts: EnforceRateLimitOpts,
): Promise<Response | null> {
  if (!hasUpstashEnv()) {
    if (opts.failMode === "closed") {
      console.error("[rateLimit] Upstash env missing — fail-closed", {
        label: opts.label,
        key: opts.key,
      });
      return rateLimitUnavailableResponse();
    }
    // fail-open: soft memory backup only
    const mem = checkMemoryRateLimit({
      key: `mem:${opts.label}:${opts.key}`,
      limit: opts.limit,
      windowMs: 60 * 60 * 1000,
    });
    if (!mem.ok) {
      console.warn("[rateLimit] memory soft-limit (Upstash missing, fail-open)", {
        label: opts.label,
        key: opts.key,
      });
      return rateLimitResponse(mem.retryAfterSec, opts.message);
    }
    return null;
  }

  try {
    const limiter = getLimiter(opts.limit, opts.window, opts.label);
    const result = await limiter.limit(opts.key);
    if (!result.success) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000),
      );
      console.warn("[rateLimit] exceeded", {
        label: opts.label,
        key: opts.key,
        retryAfterSec,
      });
      return rateLimitResponse(retryAfterSec, opts.message);
    }
    return null;
  } catch (err) {
    if (opts.failMode === "closed") {
      console.error("[rateLimit] Upstash error — fail-closed", {
        label: opts.label,
        key: opts.key,
        err,
      });
      return rateLimitUnavailableResponse();
    }
    console.warn("[rateLimit] Upstash error — fail-open", {
      label: opts.label,
      key: opts.key,
      err,
    });
    return null;
  }
}

/** Convenience: anonymous IP safety net (5/hour). Always soft-blocks bots. */
export async function enforceAnonIpSafetyNet(
  request: Request,
  label: string,
): Promise<Response | null> {
  const ip = clientIp(request);
  return enforceRateLimit({
    key: `anon-ip:${ip}`,
    limit: 5,
    window: "1 h",
    // Prefer Upstash when available; if missing, memory still caps bots per isolate
    failMode: "open",
    label: `anon-${label}`,
    message:
      "Demasiados intentos sin sesión. Inicia sesión o inténtalo más tarde.",
  });
}
