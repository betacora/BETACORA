"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { safeNextPath } from "@/lib/safeNextPath";
import { AUTH_COPY, detectLang, type AppLang } from "@/lib/lang";
import { FunnelEvent, trackFunnel } from "@/lib/analytics";
import { BrandWordmark } from "@/components/BrandWordmark";

type CallbackStatus = "working" | "confirmed" | "error";

/**
 * OAuth + email-confirm return URL.
 * Establishes the session (code / token_hash / hash tokens), shows a clear
 * "¡Cuenta confirmada!" state when coming from signup email, then redirects.
 */
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#FFFFFF]"
          aria-busy="true"
        />
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const isEmailConfirm = searchParams.get("confirmed") === "1";
  const [lang] = useState<AppLang>(() => detectLang("en"));
  const [status, setStatus] = useState<CallbackStatus>("working");
  const [error, setError] = useState<string | null>(null);
  const copy = AUTH_COPY[lang];

  useEffect(() => {
    let cancelled = false;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    async function finishAuth() {
      const authError =
        searchParams.get("error_description") || searchParams.get("error");

      if (authError) {
        if (!cancelled) {
          setError(authError);
          setStatus("error");
        }
        return;
      }

      const tokenHash = searchParams.get("token_hash");
      const otpType = searchParams.get("type") as EmailOtpType | null;
      const code = searchParams.get("code");

      let sessionReady = false;
      let userCreatedAt: string | null = null;
      let provider: string | undefined;

      if (tokenHash && otpType) {
        const { data, error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: otpType,
        });
        if (cancelled) return;
        if (otpError) {
          setError(otpError.message || copy.errors.confirmFailed);
          setStatus("error");
          return;
        }
        sessionReady = Boolean(data.session);
        userCreatedAt = data.user?.created_at ?? null;
        provider = data.user?.app_metadata?.provider;
      } else if (code) {
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (exchangeError) {
          setError(
            exchangeError.message ||
              (isEmailConfirm
                ? copy.errors.confirmFailed
                : copy.errors.oauthFailed),
          );
          setStatus("error");
          return;
        }
        sessionReady = Boolean(data.session);
        userCreatedAt = data.user?.created_at ?? null;
        provider = data.user?.app_metadata?.provider;
      } else {
        // Implicit / hash tokens: wait for detectSessionInUrl to settle.
        let { data } = await supabase.auth.getSession();
        if (!data.session) {
          await new Promise((r) => setTimeout(r, 400));
          ({ data } = await supabase.auth.getSession());
        }
        if (cancelled) return;
        sessionReady = Boolean(data.session);
        userCreatedAt = data.session?.user?.created_at ?? null;
        provider = data.session?.user?.app_metadata?.provider;
      }

      if (!sessionReady) {
        setError(
          isEmailConfirm ? copy.errors.confirmFailed : copy.errors.oauthFailed,
        );
        setStatus("error");
        return;
      }

      // Ensure profiles row exists (OAuth + email confirm never hit signup upsert)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          const meta = user.user_metadata || {};
          await supabase.from("profiles").upsert(
            {
              id: user.id,
              email: user.email || `${user.id}@users.invalid`,
              full_name:
                (typeof meta.full_name === "string" && meta.full_name) ||
                (typeof meta.name === "string" && meta.name) ||
                null,
              nationality:
                (typeof meta.nationality === "string" && meta.nationality) ||
                null,
            },
            { onConflict: "id" },
          );
        }
      } catch (e) {
        console.warn("[BeTacora] callback profile ensure skipped:", e);
      }

      const createdAt = userCreatedAt ? new Date(userCreatedAt).getTime() : 0;
      const isNewUser = createdAt > 0 && Date.now() - createdAt < 120_000;
      if (isNewUser || isEmailConfirm) {
        trackFunnel(FunnelEvent.RegistrationCompleted, {
          provider: provider ?? (isEmailConfirm ? "email" : "oauth"),
          has_session: true,
          email_confirmed: isEmailConfirm,
        });
      }

      if (isEmailConfirm) {
        setStatus("confirmed");
        redirectTimer = setTimeout(() => {
          if (!cancelled) router.replace(nextPath);
        }, 1800);
        return;
      }

      router.replace(nextPath);
    }

    void finishAuth();
    return () => {
      cancelled = true;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [
    copy.errors.confirmFailed,
    copy.errors.oauthFailed,
    isEmailConfirm,
    nextPath,
    router,
    searchParams,
  ]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#FFFFFF] text-[#1A1A1A]">
        <div className="w-full max-w-md rounded-[8px] p-8 border border-[#E5E5E5] bg-white text-center">
          <p className="text-sm m-0 leading-relaxed">
            {error ?? copy.errors.confirmFailed}
          </p>
          <button
            type="button"
            onClick={() =>
              router.replace(`/auth?next=${encodeURIComponent(nextPath)}`)
            }
            className="mt-6 w-full py-3 rounded-[7px] font-medium text-white border-0 cursor-pointer bg-[#E8634A]"
          >
            {copy.tabLogin}
          </button>
        </div>
      </div>
    );
  }

  if (status === "confirmed") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#FFFFFF] text-[#1A1A1A]">
        <div className="w-full max-w-md rounded-[8px] p-8 sm:p-10 border border-[#E5E5E5] bg-white text-center">
          <div className="flex flex-col items-center">
            <img
              src="/icon-512.png?v=4"
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded-[8px] object-contain"
            />
            <BrandWordmark className="mt-4 text-lg font-medium tracking-tight" />
            <CheckIcon />
            <p className="mt-5 text-lg font-medium tracking-tight text-[#1A1A1A] m-0 leading-snug">
              {copy.confirmedTitle}
            </p>
            <p className="mt-2 text-sm text-[#6B6B6B] m-0 leading-relaxed">
              {copy.confirmedHint}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#FFFFFF]"
      aria-busy="true"
    >
      <p className="text-sm text-[#6B6B6B] m-0">{copy.loading}</p>
    </div>
  );
}

function CheckIcon() {
  return (
    <div
      className="mt-6 flex h-14 w-14 items-center justify-center rounded-[8px] border border-[#E5E5E5] bg-[#FFFFFF] text-[#2D7B7B]"
      aria-hidden="true"
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </div>
  );
}
