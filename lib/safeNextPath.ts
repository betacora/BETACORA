/**
 * Allow only same-origin relative paths for post-auth redirects.
 * Rejects protocol-relative URLs, external absolute URLs, and empty values.
 */
export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/inicio",
): string {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://")) return fallback;
  return trimmed;
}
