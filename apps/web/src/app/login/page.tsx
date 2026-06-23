"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.push("/");
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.includes("Credenciales")
            ? "Email o contraseña incorrectos"
            : err.message
          : "Error al iniciar sesión",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const input =
    "w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500";

  return (
    <div className="min-h-screen grid place-items-center bg-neutral-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white grid place-items-center text-2xl font-bold mx-auto mb-3">
            GR
          </div>
          <h1 className="text-xl font-semibold text-neutral-800">
            Gestión Restaurante
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Inventario y escandallos
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Email
            </label>
            <input
              type="email"
              className={input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cocina@mirestaurante.es"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              className={input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2.5 rounded-lg bg-brand-500 text-white text-sm font-medium disabled:opacity-60"
          >
            {submitting ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-center text-xs text-neutral-400 mt-4">
          Contacta con el administrador para obtener credenciales
        </p>
      </div>
    </div>
  );
}