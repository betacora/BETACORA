"use client";

import { useEffect, useState } from "react";
import { INSTALL_COPY, type AppLang } from "@/lib/lang";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/** True when running as installed PWA (Android/desktop standalone or iOS home-screen). */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

/**
 * Robust iOS / iPadOS detection (Safari, Chrome, Firefox on iOS;
 * iPadOS 13+ desktop-class UA).
 */
export function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator;
  const ua = nav.userAgent || "";
  const platform = nav.platform || "";

  if (/iPhone|iPod/i.test(ua)) return true;
  if (/iPad/i.test(ua)) return true;
  // iPadOS 13+ reports as Macintosh with touch
  if (/Macintosh/i.test(ua) && nav.maxTouchPoints > 1) return true;
  if (platform === "MacIntel" && nav.maxTouchPoints > 1) return true;
  // Explicit iOS browser tokens when model string is missing
  if (/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua) && /Mobile/i.test(ua)) return true;

  return false;
}

type Variant = "hero" | "header";

type Props = {
  lang: AppLang;
  className?: string;
  /** hero = prominent near CTA; header = compact in nav */
  variant?: Variant;
};

export function InstallAppButton({
  lang,
  className = "",
  variant = "hero",
}: Props) {
  const copy = INSTALL_COPY[lang];
  const [installed, setInstalled] = useState(true); // hide until client check
  const [ios, setIos] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [showIosOverlay, setShowIosOverlay] = useState(false);

  useEffect(() => {
    const syncInstalled = () => setInstalled(isStandaloneDisplay());
    syncInstalled();
    setIos(isIosDevice());

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setShowIosOverlay(false);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);

    const mq = window.matchMedia("(display-mode: standalone)");
    const onMq = () => syncInstalled();
    if (mq.addEventListener) mq.addEventListener("change", onMq);
    else mq.addListener(onMq);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
      if (mq.removeEventListener) mq.removeEventListener("change", onMq);
      else mq.removeListener(onMq);
    };
  }, []);

  const visible = !installed && (ios || deferred !== null);
  if (!visible) return null;

  async function handleClick() {
    if (ios) {
      setShowIosOverlay(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  // Ghost/secondary only — one coral primary CTA per screen (landing hero / auth submit)
  const btnClass =
    variant === "header"
      ? `inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-[6px] border border-[#E5E2DC] bg-transparent text-[#1A1A1A] font-medium text-[0.68rem] tracking-wide cursor-pointer hover:border-[#d5d0c8] transition-colors duration-200 whitespace-nowrap shrink-0 ${className}`
      : `inline-flex items-center justify-center gap-2 w-full max-w-xs px-7 py-3.5 rounded-[7px] border border-[#E5E2DC] bg-transparent text-[#1A1A1A] font-medium text-base cursor-pointer hover:border-[#d5d0c8] transition-colors duration-200 ${className}`;

  return (
    <>
      <button type="button" onClick={handleClick} className={btnClass}>
        <InstallGlyph />
        {variant === "header" ? copy.buttonShort : copy.button}
      </button>

      {showIosOverlay ? (
        <div
          className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/40 px-4 pb-8 sm:pb-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
          onClick={() => setShowIosOverlay(false)}
        >
          <div
            className="w-full max-w-sm rounded-[8px] bg-[#FAF8F4] border border-[#E5E2DC] p-6 shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            <p
              id="ios-install-title"
              className="text-lg font-medium text-[#1A1A1A] tracking-tight m-0"
            >
              {copy.iosTitle}
            </p>

            <div className="mt-6 flex items-center justify-center gap-3 py-6 px-3 rounded-[8px] bg-white border border-[#E5E2DC]">
              <div className="flex flex-col items-center gap-1.5 min-w-[4.5rem]">
                <span className="flex h-11 w-11 items-center justify-center rounded-[8px] border border-[#E5E2DC] bg-[#FAF8F4] text-[#1A1A1A]">
                  <IosShareGlyph />
                </span>
                <span className="text-[0.65rem] text-[#6B6B6B] font-normal text-center leading-tight">
                  {copy.iosShareLabel}
                </span>
              </div>

              <ArrowGlyph />

              <div className="flex flex-col items-center gap-1.5 min-w-[4.5rem]">
                <span className="flex h-11 w-11 items-center justify-center rounded-[8px] border border-[#E5E2DC] bg-[#FAF8F4] text-[#1A1A1A]">
                  <HomeAddGlyph />
                </span>
                <span className="text-[0.65rem] text-[#6B6B6B] font-normal text-center leading-tight">
                  {copy.iosHomeLabel}
                </span>
              </div>
            </div>

            <p className="mt-5 text-sm font-medium text-[#1A1A1A] text-center leading-snug m-0">
              {copy.iosSteps}
            </p>

            <p className="mt-3 text-sm text-[#6B6B6B] leading-relaxed m-0 text-center">
              {copy.iosHint}
            </p>

            <button
              type="button"
              onClick={() => setShowIosOverlay(false)}
              className="mt-7 w-full py-3 rounded-[7px] bg-[#E8634A] text-white font-medium text-base border-0 cursor-pointer hover:opacity-90 transition-opacity duration-200"
            >
              {copy.close}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function InstallGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3v12m0 0l-4-4m4 4l4-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** iOS-style Share: square with upward arrow */
function IosShareGlyph() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 16V4m0 0l-3.5 3.5M12 4l3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10v8a2 2 0 002 2h8a2 2 0 002-2v-8"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HomeAddGlyph() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 11v4m-2-2h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowGlyph() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-[#6B6B6B]"
    >
      <path
        d="M5 12h14m0 0l-5-5m5 5l-5 5"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
