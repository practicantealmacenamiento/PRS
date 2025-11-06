/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { login } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setLoading(true);
    try {
      await login(username, password);
      router.replace("/prestamos");
    } catch (e: any) {
      setMsg(e.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="card w-full max-w-md p-6">
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Iniciar sesión</h1>
        <p className="text-sm text-slate-600 mb-4">Usa tus credenciales de Django.</p>

        <form onSubmit={onSubmit} className="space-y-3">
          <input className="input" placeholder="Usuario" value={username} onChange={(e)=>setU(e.target.value)} required />
          <input className="input" placeholder="Contraseña" type="password" value={password} onChange={(e)=>setP(e.target.value)} required />
          <button className="btn btn-primary w-full" disabled={loading}>{loading ? "Ingresando..." : "Entrar"}</button>
          {msg && <div className="text-sm text-red-700">{msg}</div>}
        </form>
      </div>
    </main>
  );
}
