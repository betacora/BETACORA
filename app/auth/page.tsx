"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CountrySelector } from "@/components/CountrySelector";

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
      setError("Introduce tu email para reenviar la confirmación.");
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
    setInfo("Te hemos reenviado el email de confirmación. Revisa tu bandeja de entrada.");
  }

  function validateRegistration(): boolean {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedNationality = nationality.trim();

    if (!trimmedName) {
      console.error("[auth validation] BLOCKED: name — empty or whitespace only");
      setError("Introduce tu nombre.");
      return false;
    }

    if (!trimmedEmail) {
      console.error("[auth validation] BLOCKED: email — empty");
      setError("Introduce tu email.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      console.error("[auth validation] BLOCKED: email — invalid format", trimmedEmail);
      setError("Introduce un email válido.");
      return false;
    }

    if (!password) {
      console.error("[auth validation] BLOCKED: password — empty");
      setError("Introduce una contraseña.");
      return false;
    }

    if (password.length < 8) {
      console.error(
        "[auth validation] BLOCKED: password — too short",
        password.length,
        "chars (min 8)"
      );
      setError("La contraseña debe tener al menos 8 caracteres.");
      return false;
    }

    if (!trimmedNationality) {
      console.error(
        "[auth validation] BLOCKED: nationality — no country selected from list"
      );
      setError("Selecciona tu nacionalidad.");
      return false;
    }

    if (!terms) {
      console.error("[auth validation] BLOCKED: terms — checkbox not checked");
      setError("Debes aceptar los términos y condiciones.");
      return false;
    }

    if (!privacy) {
      console.error("[auth validation] BLOCKED: privacy — checkbox not checked");
      setError("Debes aceptar la política de privacidad.");
      return false;
    }

    if (!age18) {
      console.error("[auth validation] BLOCKED: age18 — checkbox not checked");
      setError("Debes confirmar que tienes más de 18 años.");
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

      if (!data.session) {
        setPendingEmail(email.trim());
        setInfo(
          `Revisa tu email y confirma tu cuenta para continuar. Te hemos enviado un enlace a ${email.trim()}.`
        );
        return;
      }

      if (data.user) {
        await saveProfile(data.user.id);
      }
      router.push("/questionnaire");
      return;
    }

    if (!email.trim()) {
      console.error("[auth validation] BLOCKED: email — empty (login)");
      setError("Introduce tu email.");
      return;
    }
    if (!password) {
      console.error("[auth validation] BLOCKED: password — empty (login)");
      setError("Introduce tu contraseña.");
      return;
    }

    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      if (isEmailNotConfirmedError(signInError.message)) {
        setPendingEmail(email.trim());
        setError("Tu email aún no está confirmado. Revisa tu bandeja de entrada.");
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

  const showResend =
    pendingEmail !== null ||
    (error !== null && error.includes("no está confirmado")) ||
    (info !== null && info.includes("confirma tu cuenta"));

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "#F5EFE6" }}
    >
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-block mb-6 text-[#2D7B7B] font-semibold no-underline hover:underline"
        >
          ← Volver
        </Link>

        <div
          className="rounded-2xl p-8 shadow-lg border"
          style={{ background: "#fff", borderColor: "rgba(45,123,123,0.15)" }}
        >
          <div className="flex justify-center mb-4">
            <img
              src="/icon-512.png"
              alt="BeTacora"
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
            />
          </div>
          <p className="text-gray-500 text-center text-sm mb-6">
            {mode === "login"
              ? "Inicia sesión para guardar tus itinerarios"
              : "Crea tu cuenta y desbloquea más generaciones"}
          </p>

          <div className="flex rounded-xl overflow-hidden mb-6 border border-gray-200">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setInfo(null);
                setPendingEmail(null);
              }}
              className={`flex-1 py-2.5 text-sm font-semibold border-0 cursor-pointer transition-colors ${
                mode === "login"
                  ? "bg-[#2D7B7B] text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
                setInfo(null);
                setPendingEmail(null);
              }}
              className={`flex-1 py-2.5 text-sm font-semibold border-0 cursor-pointer transition-colors ${
                mode === "register"
                  ? "bg-[#2D7B7B] text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              Registrarse
            </button>
          </div>

          <form noValidate onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className={inputClass}
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nacionalidad
                  </label>
                  <CountrySelector
                    value={nationality}
                    onChange={setNationality}
                    placeholder="Busca tu país..."
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className={inputClass}
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
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
                    ? "Mínimo 8 caracteres"
                    : "Tu contraseña"
                }
              />
            </div>

            {mode === "register" && (
              <div className="space-y-2.5">
                <LegalCheckbox
                  checked={terms}
                  onChange={setTerms}
                  label="Acepto los términos y condiciones"
                />
                <LegalCheckbox
                  checked={privacy}
                  onChange={setPrivacy}
                  label="Acepto la política de privacidad"
                />
                <LegalCheckbox
                  checked={age18}
                  onChange={setAge18}
                  label="Tengo más de 18 años"
                />
              </div>
            )}

            {error && (
              <p
                className="text-sm rounded-lg px-3 py-2"
                style={{ background: "rgba(232,99,74,0.1)", color: "#c0392b" }}
              >
                {error}
              </p>
            )}

            {info && (
              <p
                className="text-sm rounded-lg px-3 py-2"
                style={{ background: "rgba(45,123,123,0.1)", color: "#2D7B7B" }}
              >
                {info}
              </p>
            )}

            {showResend && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resending}
                className="w-full py-2.5 rounded-xl text-sm font-semibold border-2 border-[#2D7B7B] text-[#2D7B7B] bg-transparent cursor-pointer disabled:opacity-60"
              >
                {resending ? "Enviando…" : "Reenviar email de confirmación"}
              </button>
            )}

            <button
              type="submit"
              disabled={loading || (info !== null && info.includes("confirma tu cuenta"))}
              className="w-full py-3 rounded-xl font-bold text-white border-0 cursor-pointer disabled:opacity-60 transition-opacity"
              style={{ background: "#E8634A" }}
            >
              {loading
                ? "…"
                : mode === "login"
                  ? "Entrar"
                  : info?.includes("confirma tu cuenta")
                    ? "Revisa tu email"
                    : "Crear cuenta"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Sin cuenta: 1 itinerario · Con cuenta: 2 por mes
          </p>
        </div>
      </div>
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
    <label className="flex items-start gap-2.5 cursor-pointer text-sm text-gray-600">
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
  "w-full rounded-xl px-4 py-3 text-base border outline-none transition-colors focus:border-[#2D7B7B] border-gray-200 bg-[#FAFAF8]";
