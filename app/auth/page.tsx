"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CountrySelector } from "@/components/CountrySelector";
import { AUTH_COPY, detectLang, type AppLang } from "@/lib/lang";
import { InstallAppButton } from "@/components/InstallAppButton";
import { FunnelEvent, trackFunnel } from "@/lib/analytics";

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
  const router = useRouter();
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
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  /** Post-signup: replace form with confirmation screen */
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false);

  const copy = AUTH_COPY[lang];

  useEffect(() => {
    const detected = detectLang("en");
    setLang(detected);
    document.documentElement.lang = detected;
    setReady(true);
  }, []);

  function resetMessages() {
    setError(null);
    setInfo(null);
    setPendingEmail(null);
    setAwaitingEmailConfirm(false);
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
      router.push("/questionnaire");
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
    router.push("/questionnaire");
  }

  const showLoginResend =
    !awaitingEmailConfirm &&
    pendingEmail !== null &&
    error === copy.errors.emailNotConfirmed;

  if (!ready) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#FAF8F4]"
        aria-busy="true"
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#1A1A1A]">
      <header className="w-full px-3.5 py-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 border-b border-[#E5E2DC] bg-[#FAF8F4] sticky top-0 z-50 min-w-0">
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
          <span className="text-base font-medium tracking-tight truncate">
            Be<span className="text-[#E8634A]">Tacora</span>
          </span>
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

        <div className="rounded-[8px] p-7 sm:p-8 border border-[#E5E2DC] bg-white">
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
              <div className="flex flex-col items-center mb-6">
                <img
                  src="/icon-512.png?v=4"
                  alt="BeTacora"
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-[8px] object-contain"
                />
                <p className="mt-3 text-lg font-medium tracking-tight">
                  Be<span className="text-[#E8634A]">Tacora</span>
                </p>
                <p className="text-[#6B6B6B] text-center text-sm mt-2 leading-relaxed max-w-[280px]">
                  {mode === "login"
                    ? copy.loginSubtitle
                    : copy.registerSubtitle}
                </p>
              </div>

              <div className="flex rounded-[7px] overflow-hidden mb-6 border border-[#E5E2DC]">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    resetMessages();
                  }}
                  className={`flex-1 py-2.5 text-sm font-medium border-0 cursor-pointer transition-colors ${
                    mode === "login"
                      ? "bg-[#E8634A] text-white"
                      : "bg-white text-[#6B6B6B] hover:text-[#1A1A1A]"
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
                  className={`flex-1 py-2.5 text-sm font-medium border-0 cursor-pointer transition-colors ${
                    mode === "register"
                      ? "bg-[#E8634A] text-white"
                      : "bg-white text-[#6B6B6B] hover:text-[#1A1A1A]"
                  }`}
                >
                  {copy.tabRegister}
                </button>
              </div>

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

                {error && (
                  <p className="text-sm rounded-[7px] px-3 py-2.5 bg-[#FFF5F2] text-[#E8634A] border border-[rgba(232,99,74,0.25)]">
                    {error}
                  </p>
                )}

                {info && (
                  <p className="text-sm rounded-[7px] px-3 py-2.5 bg-white text-[#2D7B7B] border border-[#E5E2DC]">
                    {info}
                  </p>
                )}

                {showLoginResend && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resending}
                    className="w-full py-2.5 rounded-[7px] text-sm font-medium border border-[#2D7B7B] text-[#2D7B7B] bg-transparent cursor-pointer disabled:opacity-60"
                  >
                    {resending ? copy.resending : copy.resend}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-[7px] font-medium text-white border-0 cursor-pointer disabled:opacity-60 transition-opacity bg-[#E8634A]"
                >
                  {loading
                    ? copy.loading
                    : mode === "login"
                      ? copy.submitLogin
                      : copy.submitRegister}
                </button>
              </form>

              <p className="text-center text-xs text-[#6B6B6B] mt-6 leading-relaxed">
                {copy.footer}
              </p>
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
        <p className="mt-2 text-sm font-medium text-[#2D7B7B] m-0 break-all">
          {email}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 w-full text-sm rounded-[7px] px-3 py-2.5 bg-[#FFF5F2] text-[#E8634A] border border-[rgba(232,99,74,0.25)] text-left">
          {error}
        </p>
      ) : null}

      {info ? (
        <p className="mt-4 w-full text-sm rounded-[7px] px-3 py-2.5 bg-white text-[#2D7B7B] border border-[#E5E2DC] text-left">
          {info}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onResend}
        disabled={resending}
        className="mt-6 w-full py-3 rounded-[7px] text-sm font-medium border border-[#2D7B7B] text-[#2D7B7B] bg-transparent cursor-pointer disabled:opacity-60 hover:bg-[#f0f7f7] transition-colors"
      >
        {resending ? copy.resending : copy.resend}
      </button>
    </div>
  );
}

function EnvelopeIcon() {
  return (
    <div
      className="flex h-16 w-16 items-center justify-center rounded-[8px] bg-[#FFF5F2] text-[#E8634A]"
      aria-hidden="true"
    >
      <svg
        width="32"
        height="32"
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
  "w-full rounded-[7px] px-4 py-3 text-base border border-[#E5E2DC] outline-none transition-colors focus:border-[#2D7B7B] bg-white text-[#1A1A1A] placeholder:text-[#9a9590]";
