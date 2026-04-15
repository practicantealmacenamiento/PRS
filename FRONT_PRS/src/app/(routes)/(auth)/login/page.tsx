"use client";

import { useState, type FormEvent } from "react";
import { login } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      await login(username, password);
      router.replace("/prestamos");
    } catch (error) {
      const fallback = "Error de autenticación";
      const errorMessage = error instanceof Error ? error.message || fallback : fallback;
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold">Iniciar sesión</h1>
          <p className="text-sm muted">Usa tus credenciales previamente entregadas.</p>
        </header>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="username">
              Usuario
            </label>
            <input
              id="username"
              className="input"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              className="input"
              placeholder="********"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Entrar"}
          </button>
          {message && <p className="text-sm text-rose-800 dark:text-rose-200">{message}</p>}
        </form>
      </div>
    </main>
  );
}
