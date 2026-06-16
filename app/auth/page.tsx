"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Mode = "register" | "login";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("register");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nationality, setNationality] = useState("");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [age18, setAge18] = useState(false);

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (!terms || !privacy || !age18) {
      setError("Debes aceptar los términos, la privacidad y confirmar que tienes más de 18 años.");
      return;
    }

    setLoading(true);
    try {
      const now = new Date().toISOString();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, nationality },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email,
          full_name: fullName,
          nationality,
          language: "es",
          terms_accepted_at: now,
          privacy_accepted_at: now,
        });

        if (profileError) {
          console.error("Profile insert error:", profileError);
        }
      }

      if (data.session) {
        router.push("/questionnaire");
        return;
      }

      setMessage(
        "Cuenta creada. Revisa tu email para confirmar, o inicia sesión si ya está activa."
      );
      setMode("login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      router.push("/questionnaire");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Email o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-full flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "#F5EFE6", fontFamily: '"DM Sans", sans-serif' }}
    >
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-block mb-8 text-2xl font-bold no-underline"
        >
          <span style={{ color: "#2D7B7B" }}>Be</span>
          <span style={{ color: "#E8634A" }}>Tacora</span>
        </Link>

        <div
          className="rounded-2xl p-8 shadow-lg"
          style={{ background: "#fff", border: "1px solid rgba(45,123,123,0.15)" }}
        >
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: "#2D7B7B" }}
          >
            {mode === "register" ? "Crear cuenta" : "Iniciar sesión"}
          </h1>
          <p className="text-sm mb-6" style={{ color: "#666" }}>
            {mode === "register"
              ? "Guarda tus viajes y genera más itinerarios"
              : "Entra a tu bitácora personal"}
          </p>

          {error && (
            <div
              className="mb-4 rounded-lg px-4 py-3 text-sm"
              style={{ background: "rgba(232,99,74,0.12)", color: "#c0392b" }}
            >
              {error}
            </div>
          )}
          {message && (
            <div
              className="mb-4 rounded-lg px-4 py-3 text-sm"
              style={{ background: "rgba(45,123,123,0.12)", color: "#2D7B7B" }}
            >
              {message}
            </div>
          )}

          {mode === "register" ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <Field label="Nombre completo">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Contraseña (mín. 8 caracteres)">
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Nacionalidad">
                <input
                  type="text"
                  required
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="Ej: España, México, Argentina..."
                  className={inputClass}
                />
              </Field>

              <Checkbox
                checked={terms}
                onChange={setTerms}
                label="Acepto los términos y condiciones"
              />
              <Checkbox
                checked={privacy}
                onChange={setPrivacy}
                label="Acepto la política de privacidad"
              />
              <Checkbox
                checked={age18}
                onChange={setAge18}
                label="Tengo más de 18 años"
              />

              <button
                type="submit"
                disabled={loading}
                className={btnClass}
                style={{ background: "#2D7B7B" }}
              >
                {loading ? "Creando cuenta..." : "Crear mi cuenta"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Email">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Contraseña">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className={btnClass}
                style={{ background: "#2D7B7B" }}
              >
                {loading ? "Entrando..." : "Entrar a mi bitácora"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm" style={{ color: "#666" }}>
            {mode === "register" ? (
              <>
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setMessage(null);
                  }}
                  className="font-semibold underline bg-transparent border-0 cursor-pointer"
                  style={{ color: "#E8634A" }}
                >
                  Iniciar sesión
                </button>
              </>
            ) : (
              <>
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                    setMessage(null);
                  }}
                  className="font-semibold underline bg-transparent border-0 cursor-pointer"
                  style={{ color: "#E8634A" }}
                >
                  Crear cuenta
                </button>
              </>
            )}
          </p>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "#999" }}>
          <Link href="/questionnaire" style={{ color: "#2D7B7B" }}>
            ← Volver al cuestionario
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="block text-sm font-medium mb-1.5"
        style={{ color: "#2D7B7B" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer text-sm" style={{ color: "#444" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-[#2D7B7B]"
        required
      />
      <span>{label}</span>
    </label>
  );
}

const inputClass =
  "w-full rounded-xl px-4 py-3 text-base border outline-none transition-colors focus:border-[#2D7B7B] border-gray-200 bg-[#FAFAF8]";

const btnClass =
  "w-full rounded-xl py-3.5 text-white font-semibold text-base border-0 cursor-pointer disabled:opacity-60 transition-opacity hover:opacity-90";
