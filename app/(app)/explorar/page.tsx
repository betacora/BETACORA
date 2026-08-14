"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FunnelEvent, trackFunnel } from "@/lib/analytics";
import { useAuth } from "@/lib/useAuth";
import { getTravelerProfile } from "@/lib/travelerProfile";
import { supabase } from "@/lib/supabase";

type FlowMode = "discover" | "trip";

function resolveMode(
  raw: string | null,
  hasProfile: boolean,
): FlowMode {
  if (raw === "discover" || raw === "force") return "discover";
  if (raw === "trip") return "trip";
  return hasProfile ? "trip" : "discover";
}

function ExplorarInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<FlowMode>("discover");

  const requestedMode = searchParams.get("mode");
  const forceUpdate =
    searchParams.get("force") === "1" || requestedMode === "discover";

  useEffect(() => {
    let cancelled = false;
    async function gate() {
      if (authLoading) return;

      if (!isLoggedIn) {
        const next = forceUpdate
          ? "/explorar?mode=discover"
          : "/explorar";
        router.replace(`/auth?next=${encodeURIComponent(next)}`);
        return;
      }

      const profile = await getTravelerProfile(supabase);
      if (cancelled) return;
      const hasProfile = Boolean(profile?.profile_type);
      const nextMode = resolveMode(
        forceUpdate ? "discover" : requestedMode,
        hasProfile,
      );
      setMode(nextMode);
      setReady(true);
      trackFunnel(FunnelEvent.QuestionnaireStarted, {
        source: "explorar",
        mode: nextMode,
        has_profile: hasProfile,
      });
    }
    gate();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn, router, requestedMode, forceUpdate]);

  const iframeSrc = useMemo(
    () => `/questionnaire.html?mode=${mode}`,
    [mode],
  );

  if (authLoading || !ready) {
    return (
      <main
        className="bg-[#F9FAFB] flex items-center justify-center"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: "calc(3.75rem + env(safe-area-inset-bottom, 0px))",
        }}
        aria-busy="true"
      >
        <p className="text-sm text-[#6B7280] m-0">…</p>
      </main>
    );
  }

  return (
    <main
      className="bg-[#F9FAFB]"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: "calc(3.75rem + env(safe-area-inset-bottom, 0px))",
        margin: 0,
        padding: 0,
      }}
    >
      <iframe
        src={iframeSrc}
        title="BeTacora Explore"
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
        onLoad={() => {
          console.log("[BeTacora] explorar iframe loaded", mode);
        }}
      />
    </main>
  );
}

/** Questionnaire under Explorar — auth-gated; trip mode if profile exists. */
export default function ExplorarPage() {
  return (
    <Suspense
      fallback={
        <main
          className="bg-[#F9FAFB]"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: "calc(3.75rem + env(safe-area-inset-bottom, 0px))",
          }}
          aria-busy="true"
        />
      }
    >
      <ExplorarInner />
    </Suspense>
  );
}
