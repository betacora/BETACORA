"use client";

import { useEffect, useState } from "react";
import { detectLang, type AppLang } from "@/lib/lang";

const UPDATE_COPY: Record<AppLang, { message: string; action: string }> = {
  es: {
    message: "Nueva versión disponible",
    action: "Actualizar",
  },
  en: {
    message: "New version available",
    action: "Update",
  },
  fr: {
    message: "Nouvelle version disponible",
    action: "Mettre à jour",
  },
};

/**
 * Registers the production service worker, polls for updates, and shows a
 * small banner when a new SW is waiting. Tapping activates skipWaiting + reload.
 */
export function SwRegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null
  );
  const [lang, setLang] = useState<AppLang>("es");

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const forceSw =
      new URLSearchParams(window.location.search).get("forceSw") === "1";

    // Dev: keep SW off so HMR / local changes aren't masked by cache.
    // Opt-in with ?forceSw=1 to verify update UX locally.
    if ((process.env.NODE_ENV !== "production" || isLocal) && !forceSw) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key.startsWith("betacora-")) caches.delete(key);
        });
      });
      return;
    }

    setLang(detectLang("es"));

    let refreshing = false;
    let intervalId = 0;
    let cancelled = false;

    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    const activateWaiting = (worker: ServiceWorker | null | undefined) => {
      worker?.postMessage("SKIP_WAITING");
    };

    const onWaiting = (
      reg: ServiceWorkerRegistration,
      worker: ServiceWorker | null
    ) => {
      if (!worker || cancelled) return;
      // First install (no active controller yet): activate silently.
      if (!navigator.serviceWorker.controller) {
        activateWaiting(worker);
        return;
      }
      setWaitingWorker(worker);
    };

    const watchInstalling = (reg: ServiceWorkerRegistration) => {
      const installing = reg.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed") {
          onWaiting(reg, reg.waiting || installing);
        }
      });
    };

    const checkForUpdate = (reg: ServiceWorkerRegistration) => {
      reg.update().catch(() => {});
      if (reg.waiting) onWaiting(reg, reg.waiting);
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      setLang(detectLang("es"));
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) checkForUpdate(reg);
      });
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        if (cancelled) return;
        if (reg.waiting) onWaiting(reg, reg.waiting);
        reg.addEventListener("updatefound", () => watchInstalling(reg));
        checkForUpdate(reg);
        intervalId = window.setInterval(
          () => checkForUpdate(reg),
          60 * 60 * 1000
        );
      })
      .catch((err) => {
        console.error("Service worker registration failed:", err);
      });

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  function applyUpdate() {
    if (!waitingWorker) return;
    waitingWorker.postMessage("SKIP_WAITING");
    // Fallback if controllerchange doesn't fire
    window.setTimeout(() => {
      window.location.reload();
    }, 1500);
  }

  if (!waitingWorker) return null;

  const copy = UPDATE_COPY[lang];

  return (
    <div
      role="status"
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[9000] w-[min(92vw,22rem)] -translate-x-1/2 rounded-[8px] border border-[#E5E5E5] bg-white px-4 py-3 shadow-[0_8px_28px_rgba(26,26,26,0.12)]"
    >
      <p className="m-0 text-sm text-[#1A1A1A] leading-snug font-medium">
        {copy.message}
      </p>
      <button
        type="button"
        onClick={applyUpdate}
        className="mt-2.5 w-full rounded-[7px] border-0 bg-[#E8634A] px-3 py-2.5 text-sm font-medium text-white cursor-pointer hover:opacity-90 transition-opacity"
      >
        {copy.action}
      </button>
    </div>
  );
}
