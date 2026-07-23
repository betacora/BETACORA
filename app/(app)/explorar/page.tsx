"use client";

import { useEffect } from "react";
import { FunnelEvent, trackFunnel } from "@/lib/analytics";

/** Questionnaire lives under Explorar tab with room for the fixed bottom nav. */
export default function ExplorarPage() {
  useEffect(() => {
    trackFunnel(FunnelEvent.QuestionnaireStarted, { source: "explorar" });
  }, []);

  return (
    <main
      className="bg-[#FAF8F4]"
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
        src="/questionnaire.html"
        title="BeTacora Explore"
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
        onLoad={() => {
          console.log("[BeTacora] explorar iframe loaded");
        }}
      />
    </main>
  );
}
