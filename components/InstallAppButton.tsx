"use client";

import { useEffect, useState } from "react";
import { INSTALL_COPY, type AppLang } from "@/lib/lang";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS 13+ may report as Mac
  return (
    window.navigator.platform === "MacIntel" &&
    window.navigator.maxTouchPoints > 1
  );
}

type Props = {
  lang: AppLang;
  className?: string;
};

export function InstallAppButton({ lang, className = "" }: Props) {
  const copy = INSTALL_COPY[lang];
  const [installed, setInstalled] = useState(true); // hide until client check
  const [ios, setIos] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [showIosOverlay, setShowIosOverlay] = useState(false);

  useEffect(() => {
    setInstalled(isStandaloneDisplay());
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
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
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

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 px-7 py-3 rounded-[7px] border border-[#E8634A] bg-transparent text-[#E8634A] font-medium text-[0.9375rem] cursor-pointer hover:bg-[#FFF5F2] transition-colors ${className}`}
      >
        <InstallGlyph />
        {copy.button}
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

            <div className="mt-5 flex items-center justify-center gap-3 py-4 rounded-[7px] bg-[#FFF5F2] border border-[rgba(232,99,74,0.2)]">
              <ShareGlyph />
              <span className="text-[#E8634A] font-medium text-sm tracking-tight text-left leading-snug max-w-[11rem]">
                {copy.iosSteps}
              </span>
            </div>

            <p className="mt-4 text-sm text-[#6B6B6B] leading-relaxed m-0">
              {copy.iosHint}
            </p>

            <button
              type="button"
              onClick={() => setShowIosOverlay(false)}
              className="mt-6 w-full py-3 rounded-[7px] bg-[#E8634A] text-white font-medium text-base border-0 cursor-pointer hover:opacity-90 transition-opacity"
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

function ShareGlyph() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-[#E8634A]"
    >
      <path
        d="M12 16V4m0 0l-4 4m4-4l4 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 14v4a2 2 0 002 2h10a2 2 0 002-2v-4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
