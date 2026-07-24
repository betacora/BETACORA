import { SITE_URL } from "@/lib/site";
import { safeNextPath } from "@/lib/safeNextPath";

/**
 * Canonical origin for auth email redirects.
 * Localhost keeps the current origin; everywhere else (incl. Vercel previews)
 * uses production so confirmation links open on beta-cora.com.
 */
export function getAuthOrigin(): string {
  if (typeof window === "undefined") return SITE_URL;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return window.location.origin;
  }
  return SITE_URL;
}

/** Post-confirm landing: same-tab callback with success UI, then /inicio. */
export function getEmailConfirmRedirectTo(nextPath?: string | null): string {
  const next = safeNextPath(nextPath);
  const params = new URLSearchParams({
    confirmed: "1",
    next,
  });
  return `${getAuthOrigin()}/auth/callback?${params.toString()}`;
}
