"use client";

import { useEffect } from "react";
import {
  ANALYTICS_MESSAGE_TYPE,
  trackFunnel,
  type AnalyticsProps,
} from "@/lib/analytics";

/**
 * Receives analytics events from the questionnaire iframe (same-origin)
 * and forwards them to Vercel Analytics via track().
 */
export function AnalyticsBridge() {
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const payload = event.data;
      if (!payload || payload.type !== ANALYTICS_MESSAGE_TYPE) return;
      const name = typeof payload.event === "string" ? payload.event : null;
      if (!name) return;
      const data =
        payload.data && typeof payload.data === "object"
          ? (payload.data as AnalyticsProps)
          : undefined;
      trackFunnel(name, data);
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
