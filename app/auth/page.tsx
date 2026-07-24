"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CountrySelector } from "@/components/CountrySelector";
import { AUTH_COPY, detectLang, type AppLang } from "@/lib/lang";
import { BrandWordmark } from "@/components/BrandWordmark";
import { InstallAppButton } from "@/components/InstallAppButton";
import { FunnelEvent, trackFunnel } from "@/lib/analytics";
import { getAuthOrigin, getEmailConfirmRedirectTo } from "@/lib/authRedirect";
import { safeNextPath } from "@/lib/safeNextPath";

type Mode = "login" | "register";

function isEmailNotConfirmedError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("email not confirmed") ||
    m.includes("email_not_confirmed") ||
    m.includes("not confirmed") ||
    m.includes("confirm your email")
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#FFFFFF]"
          aria-busy="true"
        />
      }
    >
      <AuthPageInner />
    </Suspense>
  );
}

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [lang, setLang] = useState<AppLang>("en");
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [nationality, setNationality] = useState("");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [age18, setAge18] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(
    null,
  );
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  /** Post-signup: replace form with confirmation screen */
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false);

  const copy = AUTH_COPY[lang];
  const busy = loading || oauthLoading !== null;

  useEffect(() => {
    const detected = detectLang("en");
    setLang(detected);
    document.documentElement.lang = detected;
    setReady(true);

    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      router.replace(nextPath);
    });
    return () => {
      cancelled = true;
    };
  }, [nextPath, router]);

  function resetMessages() {
    setError(null);
    setInfo(null);
    setPendingEmail(null);
    setAwaitingEmailConfirm(false);
  }

  async function handleOAuth(provider: "google" | "apple") {
    setError(null);
    setInfo(null);
    setOauthLoading(provider);

    if (mode === "register") {
      trackFunnel(FunnelEvent.RegistrationStarted, { provider });
    }

    const redirectTo = `${getAuthOrigin()}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: false,
      },
    });

    if (oauthError) {
      setOauthLoading(null);
      setError(oauthError.message || copy.errors.oauthFailed);
    }
    // On success the browser navigates away to the provider.
  }

  async function saveProfile(userId: string) {
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        name: name.trim(),
        nationality: nationality.trim(),
      },
      { onConflict: "id" }
    );
    if (profileError) console.warn("Profile save:", profileError.message);
  }

  async function handleResendConfirmation() {
    const targetEmail = pendingEmail || email.trim();
    if (!targetEmail) {
      setError(copy.errors.resendNeedEmail);
      return;
    }
    setResending(true);
    setError(null);
    setInfo(null);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: targetEmail,
      options: {
        emailRedirectTo: getEmailConfirmRedirectTo(nextPath),
      },
    });
    setResending(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setInfo(copy.resendSuccess);
  }

  function validateRegistration(): boolean {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedNationality = nationality.trim();

    if (!trimmedName) {
      setError(copy.errors.nameRequired);
      return false;
    }

    if (!trimmedEmail) {
      setError(copy.errors.emailRequired);
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(copy.errors.emailInvalid);
      return false;
    }

    if (!password) {
      setError(copy.errors.passwordRequired);
      return false;
    }

    if (password.length < 8) {
      setError(copy.errors.passwordShort);
      return false;
    }

    if (!trimmedNationality) {
      setError(copy.errors.nationalityRequired);
      return false;
    }

    if (!terms) {
      setError(copy.errors.termsRequired);
      return false;
    }

    if (!privacy) {
      setError(copy.errors.privacyRequired);
      return false;
    }

    if (!age18) {
      setError(copy.errors.ageRequired);
      return false;
    }

    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === "register") {
      if (!validateRegistration()) {
        return;
      }

      setLoading(true);
      console.log("[auth] calling signUp()", { email: email.trim() });

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: getEmailConfirmRedirectTo(nextPath),
          data: {
            name: name.trim(),
            nationality: nationality.trim(),
          },
        },
      });

      setLoading(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      trackFunnel(FunnelEvent.RegistrationCompleted, {
        has_session: Boolean(data.session),
      });

      if (!data.session) {
        setPendingEmail(email.trim());
        setAwaitingEmailConfirm(true);
        setInfo(null);
        setError(null);
        return;
      }

      if (data.user) {
        await saveProfile(data.user.id);
      }
      router.push(nextPath);
      return;
    }

    if (!email.trim()) {
      setError(copy.errors.emailRequired);
      return;
    }
    if (!password) {
      setError(copy.errors.passwordRequired);
      return;
    }

    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email: email.trim(),
        password,
      }
    );

    setLoading(false);

    if (signInError) {
      if (isEmailNotConfirmedError(signInError.message)) {
        setPendingEmail(email.trim());
        setError(copy.errors.emailNotConfirmed);
        return;
      }
      setError(signInError.message);
      return;
    }

    if (data.user) {
      const meta = data.user.user_metadata;
      if (meta?.name || meta?.nationality) {
        await saveProfile(data.user.id);
      }
    }
    router.push(nextPath);
  }

  const showLoginResend =
    !awaitingEmailConfirm &&
    pendingEmail !== null &&
    error === copy.errors.emailNotConfirmed;

  if (!ready) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#FFFFFF]"
        aria-busy="true"
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#1A1A1A]">
      <header className="w-full px-3.5 py-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 border-b border-[#E5E5E5] bg-[#FFFFFF] sticky top-0 z-50 min-w-0">
        <Link
          href="/"
          className="flex items-center gap-2 no-underline text-[#1A1A1A] min-w-0 shrink"
          aria-label="BeTacora"
        >
          <img
            src="/icon-512.png?v=4"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-[6px] object-contain shrink-0"
          />
          <BrandWordmark className="text-base font-medium tracking-tight truncate" />
        </Link>
        <InstallAppButton lang={lang} variant="header" className="shrink-0" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 mb-8 text-[#6B6B6B] text-sm font-normal no-underline hover:text-[#1A1A1A] transition-colors"
        >
          ← {copy.back}
        </Link>

        <div className="rounded-[8px] p-8 sm:p-10 border border-[#E5E5E5] bg-white">
          {awaitingEmailConfirm ? (
            <EmailConfirmScreen
              copy={copy}
              email={pendingEmail}
              info={info}
              error={error}
              resending={resending}
              onResend={handleResendConfirmation}
            />
          ) : (
            <>
              <div className="flex flex-col items-center mb-8">
                <img
                  src="/icon-512.png?v=4"
                  alt="BeTacora — bitácora inteligente de viajes"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-[8px] object-contain"
                />
                <BrandWordmark className="mt-4 text-lg font-medium tracking-tight" />
                <p className="text-[#6B6B6B] text-center text-sm mt-2.5 leading-[1.6] max-w-[280px]">
                  {mode === "login"
                    ? copy.loginSubtitle
                    : copy.registerSubtitle}
                </p>
              </div>

              <div className="flex mb-8 border-b border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    resetMessages();
                  }}
                  className={`flex-1 py-2.5 text-sm font-medium border-0 border-b-[1.5px] -mb-px bg-transparent cursor-pointer transition-colors duration-200 ${
                    mode === "login"
                      ? "text-[#1A1A1A] border-[#E8634A]"
                      : "text-[#6B6B6B] border-transparent hover:text-[#1A1A1A]"
                  }`}
                >
                  {copy.tabLogin}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    resetMessages();
                    trackFunnel(FunnelEvent.RegistrationStarted);
                  }}
                  className={`flex-1 py-2.5 text-sm font-medium border-0 border-b-[1.5px] -mb-px bg-transparent cursor-pointer transition-colors duration-200 ${
                    mode === "register"
                      ? "text-[#1A1A1A] border-[#E8634A]"
                      : "text-[#6B6B6B] border-transparent hover:text-[#1A1A1A]"
                  }`}
                >
                  {copy.tabRegister}
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  disabled={busy}
                  aria-label={copy.continueWithGoogle}
                  className="w-full h-11 px-4 inline-flex items-center justify-center gap-3 rounded-[7px] border border-[#E5E5E5] bg-white text-[#1A1A1A] text-sm font-medium cursor-pointer disabled:opacity-60 hover:bg-[#FAFAFA] hover:border-[#D4D4D4] transition-colors duration-200"
                >
                  <GoogleLogo />
                  <span>
                    {oauthLoading === "google"
                      ? copy.loading
                      : copy.continueWithGoogle}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOAuth("apple")}
                  disabled={busy}
                  aria-label={copy.continueWithApple}
                  className="w-full h-11 px-4 inline-flex items-center justify-center gap-3 rounded-[7px] border border-[#1A1A1A] bg-[#1A1A1A] text-white text-sm font-medium cursor-pointer disabled:opacity-60 hover:bg-[#2a2a2a] hover:border-[#2a2a2a] transition-colors duration-200"
                >
                  <AppleLogo />
                  <span>
                    {oauthLoading === "apple"
                      ? copy.loading
                      : copy.continueWithApple}
                  </span>
                </button>
                <div className="relative flex items-center justify-center py-1">
                  <div
                    className="absolute inset-x-0 top-1/2 h-px bg-[#E5E5E5]"
                    aria-hidden="true"
                  />
                  <span className="relative bg-white px-3 text-xs text-[#6B6B6B]">
                    {copy.orEmail}
                  </span>
                </div>
              </div>

              {error && oauthLoading === null && !showLoginResend ? (
                <p className="mb-4 text-sm rounded-[7px] px-3 py-2.5 bg-white text-[#1A1A1A] border border-[#E5E5E5]">
                  {error}
                </p>
              ) : null}

              <form noValidate onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                        {copy.fullName}
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        className={inputClass}
                        placeholder={copy.namePlaceholder}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                        {copy.nationality}
                      </label>
                      <CountrySelector
                        value={nationality}
                        onChange={setNationality}
                        placeholder={copy.nationalityPlaceholder}
                        clearLabel={copy.clearCountry}
                        lang={lang}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                    {copy.email}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className={inputClass}
                    placeholder={copy.emailPlaceholder}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                    {copy.password}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    className={inputClass}
                    placeholder={
                      mode === "register"
                        ? copy.passwordPlaceholderRegister
                        : copy.passwordPlaceholderLogin
                    }
                  />
                </div>

                {mode === "register" && (
                  <div className="space-y-2.5 pt-1">
                    <LegalCheckbox
                      checked={terms}
                      onChange={setTerms}
                      label={copy.terms}
                    />
                    <LegalCheckbox
                      checked={privacy}
                      onChange={setPrivacy}
                      label={copy.privacy}
                    />
                    <LegalCheckbox
                      checked={age18}
                      onChange={setAge18}
                      label={copy.age18}
                    />
                  </div>
                )}

                {info && (
                  <p className="text-sm rounded-[7px] px-3 py-2.5 bg-white text-[#6B6B6B] border border-[#E5E5E5]">
                    {info}
                  </p>
                )}

                {showLoginResend && (
                  <>
                    {error ? (
                      <p className="text-sm rounded-[7px] px-3 py-2.5 bg-white text-[#1A1A1A] border border-[#E5E5E5]">
                        {error}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={resending}
                      className="w-full py-2.5 rounded-[7px] text-sm font-medium border border-[#E5E5E5] text-[#1A1A1A] bg-transparent cursor-pointer disabled:opacity-60 hover:border-[#D4D4D4] transition-colors duration-200"
                    >
                      {resending ? copy.resending : copy.resend}
                    </button>
                  </>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3.5 rounded-[7px] font-medium text-white border-0 cursor-pointer disabled:opacity-60 transition-opacity duration-200 bg-[#E8634A]"
                >
                  {loading
                    ? copy.loading
                    : mode === "login"
                      ? copy.submitLogin
                      : copy.submitRegister}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

function EmailConfirmScreen({
  copy,
  email,
  info,
  error,
  resending,
  onResend,
}: {
  copy: (typeof AUTH_COPY)[AppLang];
  email: string | null;
  info: string | null;
  error: string | null;
  resending: boolean;
  onResend: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center py-4 sm:py-6">
      <EnvelopeIcon />
      <p className="mt-5 text-lg font-medium tracking-tight text-[#1A1A1A] m-0 leading-snug max-w-[280px]">
        {copy.confirmTitle}
      </p>
      <p className="mt-2 text-sm text-[#6B6B6B] m-0 leading-relaxed max-w-[280px]">
        {copy.confirmHint}
      </p>
      {email ? (
        <p className="mt-3 text-sm font-medium text-[#1A1A1A] m-0 break-all">
          {email}
        </p>
      ) : null}

      {error ? (
        <p className="mt-5 w-full text-sm rounded-[7px] px-3 py-2.5 bg-white text-[#1A1A1A] border border-[#E5E5E5] text-left">
          {error}
        </p>
      ) : null}

      {info ? (
        <p className="mt-5 w-full text-sm rounded-[7px] px-3 py-2.5 bg-white text-[#6B6B6B] border border-[#E5E5E5] text-left">
          {info}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onResend}
        disabled={resending}
        className="mt-8 w-full py-3 rounded-[7px] text-sm font-medium border border-[#E5E5E5] text-[#1A1A1A] bg-transparent cursor-pointer disabled:opacity-60 hover:border-[#D4D4D4] transition-colors duration-200"
      >
        {resending ? copy.resending : copy.resend}
      </button>
    </div>
  );
}

function EnvelopeIcon() {
  return (
    <div
      className="flex h-14 w-14 items-center justify-center rounded-[8px] border border-[#E5E5E5] bg-[#FFFFFF] text-[#1A1A1A]"
      aria-hidden="true"
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 7 9-7" />
      </svg>
    </div>
  );
}

/** Official multicolor Google "G" mark */
function GoogleLogo() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/** Apple logo (monochrome, inherits button text color) */
function AppleLogo() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      <path d="M16.365 1.43c0 1.14-.42 2.23-1.18 3.1-.79.92-2.1 1.63-3.3 1.53-.14-1.1.41-2.25 1.16-3.1.8-.92 2.2-1.62 3.32-1.53zM20.9 17.2c-.55 1.27-.82 1.84-1.53 2.96-.99 1.55-2.39 3.48-4.12 3.49-1.54.02-1.94-.98-4.04-.97-2.1.01-2.54.99-4.08.97-1.73-.01-3.05-1.76-4.04-3.31C1.3 17.1-.2 12.3 1.7 9.05c1.15-1.96 2.97-3.2 4.7-3.2 1.76 0 2.87 1.03 4.33 1.03 1.42 0 2.29-1.04 4.34-1.04 1.55 0 3.19.84 4.34 2.3-3.81 2.09-3.19 7.53.49 9.06z" />
    </svg>
  );
}

function LegalCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer text-sm text-[#6B6B6B]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-[#2D7B7B]"
      />
      <span>{label}</span>
    </label>
  );
}

const inputClass =
  "w-full rounded-[7px] px-4 py-3 text-base border border-[#E5E5E5] outline-none transition-colors focus:border-[#2D7B7B] bg-white text-[#1A1A1A] placeholder:text-[#9CA3AF]";
