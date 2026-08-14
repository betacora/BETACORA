import type { SupabaseClient } from "@supabase/supabase-js";
import { hasTravelerProfile } from "@/lib/travelerProfile";
import { safeNextPath } from "@/lib/safeNextPath";

const STORAGE_PREFIX = "bt_onboarding_welcome_seen:";

/** Default destination after the first-time welcome screen. */
export const ONBOARDING_CONTINUE_PATH = "/explorar?mode=discover";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

/** True if this browser already showed the post-signup welcome for this user. */
export function hasSeenOnboardingWelcome(userId: string): boolean {
  if (typeof window === "undefined" || !userId) return false;
  try {
    return window.localStorage.getItem(storageKey(userId)) === "1";
  } catch {
    return false;
  }
}

/** Persist that the welcome was shown (once per user on this device). */
export function markOnboardingWelcomeSeen(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.setItem(storageKey(userId), "1");
  } catch {
    // Private mode / quota — ignore; worst case they see welcome again
  }
}

/**
 * DNA exists when profiles has an archetype (`profile_type`) and/or
 * `profile_updated_at` (saved traveler DNA). Falls back to itinerary DNA
 * via hasTravelerProfile.
 */
export async function hasTravelerDna(
  supabase: SupabaseClient,
): Promise<boolean> {
  if (await hasTravelerProfile(supabase)) return true;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("profile_type, profile_updated_at")
    .eq("id", user.id)
    .maybeSingle();

  return Boolean(data?.profile_type || data?.profile_updated_at);
}

/**
 * After a successful login/signup session: new users without DNA who have
 * not seen the welcome yet go to /bienvenida; everyone else keeps `intendedNext`.
 */
export async function resolvePostAuthPath(
  supabase: SupabaseClient,
  intendedNext: string,
): Promise<string> {
  const next = safeNextPath(intendedNext);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return next;

  if (await hasTravelerDna(supabase)) return next;
  if (hasSeenOnboardingWelcome(user.id)) return next;

  const continueTo =
    next.startsWith("/explorar") ? next : ONBOARDING_CONTINUE_PATH;
  return `/bienvenida?next=${encodeURIComponent(continueTo)}`;
}
