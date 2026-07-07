"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api, setToken } from "@/lib/api";

export default function RegistroPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [restauranteNombre, setRestauranteNombre] = useState("");
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
      const res = await api.register({
        email,
        password,
        nombre,
        restauranteNombre: restauranteNombre || undefined,
      });
      setToken(res.access_token);
      login(email, password).catch(() => {});
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al registrar",
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
            Crear cuenta
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Registra tu restaurante
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Nombre del restaurante
            </label>
            <input
              type="text"
              className={input}
              value={restauranteNombre}
              onChange={(e) => setRestauranteNombre(e.target.value)}
              placeholder="Ej: Trattoria Bella"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Tu nombre
            </label>
            <input
              type="text"
              className={input}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Email
            </label>
            <input
              type="email"
              className={input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@restaurante.es"
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
              placeholder="Mínimo 6 caracteres"
              minLength={6}
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
            {submitting ? "Creando…" : "Crear restaurante"}
          </button>
        </form>

        <p className="text-center text-xs text-neutral-400 mt-4">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-brand-500 font-medium hover:underline">
            Iniciar sesión
          </a>
        </p>
      </div>
    </div>
  );
}