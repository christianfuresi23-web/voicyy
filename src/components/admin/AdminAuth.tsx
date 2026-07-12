"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Step = "password" | "totp" | "phrase";

type AuthResponse = {
  ok?: boolean;
  next?: Step | "dashboard";
  enrollment?: boolean;
  qrDataUrl?: string;
  error?: string;
};

async function responseJson(response: Response): Promise<AuthResponse> {
  const body = (await response.json().catch(() => ({}))) as AuthResponse;
  if (!response.ok) {
    throw new Error(body.error || "Operazione non riuscita");
  }
  return body;
}

export function AdminAuth() {
  const [step, setStep] = useState<Step>("password");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [phrase, setPhrase] = useState("");
  const [enrollment, setEnrollment] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/auth/status", {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(responseJson)
      .then((body) => {
        if (!active) return;
        if (body.next === "dashboard") {
          window.location.replace("/voicyy-admin-x9k2");
          return;
        }
        if (body.next === "totp" || body.next === "phrase") {
          setStep(body.next);
        }
        setEnrollment(Boolean(body.enrollment));
        setQrDataUrl(body.qrDataUrl);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Errore");
      });
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const endpoint =
      step === "password"
        ? "/api/admin/auth/password"
        : step === "totp"
          ? "/api/admin/auth/totp"
          : "/api/admin/auth/phrase";
    const payload =
      step === "password"
        ? { password }
        : step === "totp"
          ? { code }
          : { phrase };

    try {
      const body = await responseJson(
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        }),
      );

      if (body.next === "dashboard") {
        window.location.replace("/voicyy-admin-x9k2");
        return;
      }
      if (body.next === "totp" || body.next === "phrase") {
        setStep(body.next);
      }
      setEnrollment(Boolean(body.enrollment));
      setQrDataUrl(body.qrDataUrl);
      setPassword("");
      setCode("");
      setPhrase("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Operazione non riuscita");
    } finally {
      setLoading(false);
    }
  }

  const stepNumber = step === "password" ? 1 : step === "totp" ? 2 : 3;

  return (
    <main className="min-h-screen bg-[#080a0d] px-5 py-12 text-white sm:py-20">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-black tracking-[-0.06em] text-white"
            aria-label="Torna alla home Voicyy"
          >
            voicyy<span className="text-emerald-400">.</span>
          </Link>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
            Accesso riservato
          </span>
        </div>

        <section
          className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8"
          aria-labelledby="admin-title"
        >
          <div className="mb-7 flex gap-2" aria-label={`Passaggio ${stepNumber} di 3`}>
            {[1, 2, 3].map((value) => (
              <span
                key={value}
                className={`h-1.5 flex-1 rounded-full ${value <= stepNumber ? "bg-emerald-400" : "bg-white/10"}`}
              />
            ))}
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
            Passaggio {stepNumber} di 3
          </p>
          <h1 id="admin-title" className="text-2xl font-bold tracking-tight">
            {step === "password"
              ? "Verifica la password"
              : step === "totp"
                ? enrollment
                  ? "Configura Google Authenticator"
                  : "Codice Google Authenticator"
                : "Frase di sicurezza"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {step === "password"
              ? "La dashboard contiene dati personali e richiede tutti i fattori di accesso."
              : step === "totp"
                ? enrollment
                  ? "Solo per il primo accesso: scansiona il QR, poi inserisci il codice a 6 cifre generato dall’app."
                  : "Inserisci il codice temporaneo a 6 cifre mostrato nell’app."
                : "Inserisci le 12 parole nell’ordine esatto. Maiuscole e minuscole non fanno differenza."}
          </p>

          {step === "totp" && enrollment && qrDataUrl ? (
            <div className="my-6 rounded-2xl bg-white p-4 text-center">
              {/* A data URL is intentionally returned only after password verification. */}
              <Image
                src={qrDataUrl}
                alt="Codice QR da scansionare con Google Authenticator"
                width={280}
                height={280}
                unoptimized
                className="mx-auto h-auto w-full max-w-[280px]"
              />
              <p className="mt-3 text-xs leading-5 text-zinc-600">
                Non condividere né salvare pubblicamente questo QR.
              </p>
            </div>
          ) : null}

          <form onSubmit={submit} className="mt-7 space-y-5">
            {step === "password" ? (
              <label className="block text-sm font-medium text-zinc-200">
                Password amministratore
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={256}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-base text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                />
              </label>
            ) : step === "totp" ? (
              <label className="block text-sm font-medium text-zinc-200">
                Codice a 6 cifre
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  minLength={6}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="mt-2 h-14 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-center font-mono text-2xl tracking-[0.35em] text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                />
              </label>
            ) : (
              <label className="block text-sm font-medium text-zinc-200">
                Frase di 12 parole
                <textarea
                  autoComplete="off"
                  required
                  maxLength={512}
                  rows={4}
                  value={phrase}
                  onChange={(event) => setPhrase(event.target.value)}
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                />
              </label>
            )}

            <div aria-live="polite" aria-atomic="true" className="min-h-6">
              {error ? (
                <p className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-full bg-emerald-400 px-5 font-bold text-[#07110a] transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60"
            >
              {loading
                ? "Verifica in corso…"
                : step === "phrase"
                  ? "Apri la dashboard"
                  : "Continua"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
