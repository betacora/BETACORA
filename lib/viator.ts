/**
 * Viator Partner / Affiliate API — product search (read-only).
 *
 * Auth (docs.viator.com/partner-api):
 *   Header `exp-api-key: <VIATOR_API_KEY>`
 *   Header `Accept: application/json;version=2.0` (required)
 *   Header `Accept-Language: <locale>` (required)
 *
 * Production base: https://api.viator.com/partner
 * Sandbox base:    https://api.sandbox.viator.com/partner
 *   Set VIATOR_API_BASE_URL to override, or VIATOR_SANDBOX=true for sandbox.
 *
 * Key endpoints used here:
 *   GET  /destinations     — taxonomy (name → destinationId)
 *   POST /products/search  — activity/tour summaries by destination
 *
 * Affiliate flow: merchandising only; bookings happen on viator.com via productUrl.
 */

const API_VERSION = "2.0";
const DEFAULT_LANG = "en-US";
const DEFAULT_CURRENCY = "USD";
const PRODUCTION_BASE = "https://api.viator.com/partner";
const SANDBOX_BASE = "https://api.sandbox.viator.com/partner";

export type ViatorSort =
  | "TRAVELER_RATING"
  | "PRICE"
  | "DURATION"
  | "REVIEW_COUNT"
  | "DATE_ADDED";

export type ViatorSortOrder = "ASCENDING" | "DESCENDING";

export type SearchActivitiesInput = {
  /**
   * Destination name (e.g. "Paris", "Barcelona") or numeric Viator destination id
   * as string/number. Names are resolved via GET /destinations.
   */
  destination: string | number;
  /** Optional ISO dates YYYY-MM-DD for availability window */
  startDate?: string | null;
  endDate?: string | null;
  /** Viator tag ids (categories) */
  tags?: number[];
  currency?: string;
  language?: string;
  sort?: ViatorSort;
  order?: ViatorSortOrder;
  /** Pagination start (1-based). Default 1. */
  start?: number;
  /** Page size (max 50 per Viator docs). Default 10. */
  count?: number;
};

export type SimplifiedViatorActivity = {
  productCode: string;
  title: string;
  description: string | null;
  fromPrice: number | null;
  fromPriceBeforeDiscount: number | null;
  currency: string | null;
  rating: number | null;
  reviewCount: number | null;
  durationMinutes: number | null;
  imageUrl: string | null;
  productUrl: string | null;
  flags: string[];
  tags: number[];
  confirmationType: string | null;
};

export type ResolvedDestination = {
  destinationId: number;
  name: string;
  type: string | null;
  parentDestinationId: number | null;
  iataCodes: string[];
};

export type SearchActivitiesResult = {
  destination: ResolvedDestination;
  totalCount: number;
  currency: string;
  language: string;
  activities: SimplifiedViatorActivity[];
};

type DestinationDetails = {
  destinationId?: number;
  name?: string;
  type?: string;
  parentDestinationId?: number | null;
  iataCodes?: string[] | null;
};

type DestinationsResponse = {
  destinations?: DestinationDetails[];
  totalCount?: number;
};

type ProductImageVariant = {
  height?: number;
  width?: number;
  url?: string;
};

type ProductSummary = {
  productCode?: string;
  title?: string;
  description?: string;
  images?: Array<{
    isCover?: boolean;
    variants?: ProductImageVariant[];
  }>;
  reviews?: {
    totalReviews?: number;
    combinedAverageRating?: number;
  };
  duration?: {
    fixedDurationInMinutes?: number;
    variableDurationFromMinutes?: number;
    variableDurationToMinutes?: number;
  };
  confirmationType?: string;
  pricing?: {
    summary?: {
      fromPrice?: number;
      fromPriceBeforeDiscount?: number;
    };
    currency?: string;
  };
  productUrl?: string;
  tags?: number[];
  flags?: string[];
};

type ProductsSearchResponse = {
  products?: ProductSummary[];
  totalCount?: number;
};

let destinationsCache: {
  fetchedAt: number;
  byId: Map<number, DestinationDetails>;
  list: DestinationDetails[];
} | null = null;

const DESTINATIONS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // weekly refresh per Viator guidance

function getApiKey(): string {
  const key = process.env.VIATOR_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "VIATOR_API_KEY is not set. Add your Viator Partner/Affiliate API key to .env.local.",
    );
  }
  return key;
}

function getBaseUrl(): string {
  const override = process.env.VIATOR_API_BASE_URL?.trim();
  if (override) return override.replace(/\/$/, "");
  if (process.env.VIATOR_SANDBOX === "true" || process.env.VIATOR_SANDBOX === "1") {
    return SANDBOX_BASE;
  }
  return PRODUCTION_BASE;
}

function assertISODate(value: string, label: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must be YYYY-MM-DD`);
  }
  return value;
}

async function viatorFetch<T>(
  path: string,
  init: {
    method: "GET" | "POST";
    language?: string;
    body?: unknown;
    searchParams?: Record<string, string>;
  },
): Promise<T> {
  const language = init.language?.trim() || DEFAULT_LANG;
  const url = new URL(`${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`);
  if (init.searchParams) {
    for (const [k, v] of Object.entries(init.searchParams)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    method: init.method,
    headers: {
      "exp-api-key": getApiKey(),
      Accept: `application/json;version=${API_VERSION}`,
      "Accept-Language": language,
      ...(init.method === "POST"
        ? { "Content-Type": "application/json" }
        : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = { raw: text };
    }
  }

  if (!res.ok) {
    const detail =
      typeof json === "object" && json && "message" in json
        ? String((json as { message: unknown }).message)
        : text.slice(0, 400);
    throw new Error(
      `Viator ${init.method} ${path} failed (${res.status}): ${detail || res.statusText}`,
    );
  }

  return json as T;
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function loadDestinations(language: string): Promise<{
  byId: Map<number, DestinationDetails>;
  list: DestinationDetails[];
}> {
  const now = Date.now();
  if (
    destinationsCache &&
    now - destinationsCache.fetchedAt < DESTINATIONS_TTL_MS
  ) {
    return destinationsCache;
  }

  const data = await viatorFetch<DestinationsResponse>("/destinations", {
    method: "GET",
    language,
  });

  const list = (data.destinations ?? []).filter(
    (d): d is DestinationDetails & { destinationId: number; name: string } =>
      typeof d.destinationId === "number" && Boolean(d.name),
  );
  const byId = new Map<number, DestinationDetails>();
  for (const d of list) byId.set(d.destinationId, d);

  destinationsCache = { fetchedAt: now, byId, list };
  return destinationsCache;
}

/**
 * Resolve a destination name or numeric id to a Viator destination.
 * Prefers CITY matches when multiple names collide; then exact name, then starts-with.
 */
export async function resolveDestination(
  destination: string | number,
  language: string = DEFAULT_LANG,
): Promise<ResolvedDestination> {
  const { byId, list } = await loadDestinations(language);

  if (typeof destination === "number" || /^\d+$/.test(String(destination).trim())) {
    const id = Number(destination);
    const hit = byId.get(id);
    if (!hit || typeof hit.destinationId !== "number" || !hit.name) {
      throw new Error(`Unknown Viator destinationId: ${id}`);
    }
    return {
      destinationId: hit.destinationId,
      name: hit.name,
      type: hit.type ?? null,
      parentDestinationId: hit.parentDestinationId ?? null,
      iataCodes: hit.iataCodes ?? [],
    };
  }

  const query = String(destination).trim();
  if (!query) throw new Error("destination is required");
  const needle = normalizeName(query);

  const scored = list
    .map((d) => {
      const name = d.name ?? "";
      const n = normalizeName(name);
      let score = 0;
      if (n === needle) score = 100;
      else if (n.startsWith(needle)) score = 80;
      else if (n.includes(needle)) score = 50;
      else return null;
      if ((d.type || "").toUpperCase() === "CITY") score += 10;
      return { d, score };
    })
    .filter((x): x is { d: DestinationDetails; score: number } => Boolean(x))
    .sort((a, b) => b.score - a.score);

  const best = scored[0]?.d;
  if (!best || typeof best.destinationId !== "number" || !best.name) {
    throw new Error(
      `Could not resolve destination "${query}" against Viator taxonomy. Pass a numeric destinationId or a clearer city name.`,
    );
  }

  return {
    destinationId: best.destinationId,
    name: best.name,
    type: best.type ?? null,
    parentDestinationId: best.parentDestinationId ?? null,
    iataCodes: best.iataCodes ?? [],
  };
}

function pickImageUrl(product: ProductSummary): string | null {
  const images = product.images ?? [];
  const cover = images.find((i) => i.isCover) ?? images[0];
  const variants = cover?.variants ?? [];
  if (!variants.length) return null;
  // Prefer ~400px-wide variant when available
  const preferred =
    variants.find((v) => v.width === 400) ||
    variants.find((v) => (v.width ?? 0) >= 360) ||
    variants[variants.length - 1];
  return preferred?.url ?? null;
}

function durationMinutes(product: ProductSummary): number | null {
  const d = product.duration;
  if (!d) return null;
  if (typeof d.fixedDurationInMinutes === "number") return d.fixedDurationInMinutes;
  if (
    typeof d.variableDurationFromMinutes === "number" &&
    typeof d.variableDurationToMinutes === "number"
  ) {
    return Math.round((d.variableDurationFromMinutes + d.variableDurationToMinutes) / 2);
  }
  return d.variableDurationFromMinutes ?? d.variableDurationToMinutes ?? null;
}

function simplifyProduct(product: ProductSummary): SimplifiedViatorActivity | null {
  const productCode = product.productCode?.trim();
  const title = product.title?.trim();
  if (!productCode || !title) return null;

  return {
    productCode,
    title,
    description: product.description?.trim() || null,
    fromPrice: product.pricing?.summary?.fromPrice ?? null,
    fromPriceBeforeDiscount:
      product.pricing?.summary?.fromPriceBeforeDiscount ?? null,
    currency: product.pricing?.currency ?? null,
    rating: product.reviews?.combinedAverageRating ?? null,
    reviewCount: product.reviews?.totalReviews ?? null,
    durationMinutes: durationMinutes(product),
    imageUrl: pickImageUrl(product),
    productUrl: product.productUrl ?? null,
    flags: product.flags ?? [],
    tags: product.tags ?? [],
    confirmationType: product.confirmationType ?? null,
  };
}

/**
 * Search Viator activities/tours for a destination via POST /products/search.
 */
export async function searchActivities(
  input: SearchActivitiesInput,
): Promise<SearchActivitiesResult> {
  const language = input.language?.trim() || DEFAULT_LANG;
  const currency = (input.currency?.trim() || DEFAULT_CURRENCY).toUpperCase();
  const count = Math.min(50, Math.max(1, input.count ?? 10));
  const start = Math.max(1, input.start ?? 1);

  const resolved = await resolveDestination(input.destination, language);

  const filtering: Record<string, unknown> = {
    destination: String(resolved.destinationId),
  };

  if (input.startDate) {
    filtering.startDate = assertISODate(input.startDate, "startDate");
  }
  if (input.endDate) {
    filtering.endDate = assertISODate(input.endDate, "endDate");
  }
  if (input.tags?.length) {
    filtering.tags = input.tags.filter((t) => Number.isFinite(t));
  }

  const body = {
    filtering,
    sorting: {
      sort: input.sort ?? "TRAVELER_RATING",
      order: input.order ?? "DESCENDING",
    },
    pagination: { start, count },
    currency,
  };

  const data = await viatorFetch<ProductsSearchResponse>("/products/search", {
    method: "POST",
    language,
    body,
  });

  const activities = (data.products ?? [])
    .map(simplifyProduct)
    .filter((a): a is SimplifiedViatorActivity => Boolean(a));

  return {
    destination: resolved,
    totalCount: data.totalCount ?? activities.length,
    currency,
    language,
    activities,
  };
}
