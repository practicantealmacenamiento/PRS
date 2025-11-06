/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiGET } from "@/lib/api";
import type { PrestamoResp } from "@/lib/types";

/** Utilidades */
function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}
function fmtDate(value?: string | null) {
  const d = parseDate(value);
  return d ? d.toLocaleString("es-CO") : "—";
}

/** Componentes pequeños */
function Stat({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="card p-5">
      <div className="text-sm muted">{label}</div>
      <div className="mt-1 text-3xl font-semibold">{loading ? "—" : value}</div>
    </div>
  );
}
function RowSkeleton({ idx }: { idx: number }) {
  return (
    <tr className="table-row" key={`s-${idx}`}>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="table-cell">
          <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-cloud/60 dark:bg-coffee/40" />
        </td>
      ))}
    </tr>
  );
}

export default function Home() {
  const [rows, setRows] = useState<PrestamoResp[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    setErr(null);
    try {
      const data = await apiGET<PrestamoResp[]>("/prestamos/");
      setRows(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (e: any) {
      setErr(e?.message || "No fue posible cargar los datos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Auto-actualizar cada 30s
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoRefresh) {
      timerRef.current = setInterval(load, 30_000);
    }
  }, [autoRefresh]);

  /** Cálculos */
  const total = rows.length;

  // Consideramos "abierto" si NO hay fecha de devolución,
  // o si el estado no es "DEVUELTO" por si el backend cambia el flag.
  const abiertos = useMemo(
    () =>
      rows.filter(
        (r) =>
          !r.fecha_hora_devolucion ||
          (typeof r.estado === "string" && r.estado.toUpperCase() !== "DEVUELTO")
      ).length,
    [rows]
  );

  const prestadosHoy = useMemo(() => {
    const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const d1 = new Date(d0); d1.setDate(d1.getDate() + 1);
    return rows.filter((r) => {
      const t = parseDate(r.fecha_hora_prestamo);
      return t && t >= d0 && t < d1;
    }).length;
  }, [rows]);

  const devueltosHoy = useMemo(() => {
    const d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const d1 = new Date(d0); d1.setDate(d1.getDate() + 1);
    return rows.filter((r) => {
      const t = parseDate(r.fecha_hora_devolucion);
      return t && t >= d0 && t < d1;
    }).length;
  }, [rows]);

  const ultimos = useMemo(() => {
    const sorted = [...rows].sort((a, b) => {
      const ta = parseDate(a.fecha_hora_prestamo)?.getTime() ?? 0;
      const tb = parseDate(b.fecha_hora_prestamo)?.getTime() ?? 0;
      return tb - ta || (b.id ?? 0) - (a.id ?? 0);
    });
    // Búsqueda rápida por cédula, nombre, usuario SAP o código de radio
    const q = query.trim().toLowerCase();
    const filtered = q
      ? sorted.filter((r) => {
          const hay = [
            r.cedula,
            r.empleado_nombre,
            r.usuario_sap,
            r.codigo_radio,
            r.estado,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        })
      : sorted;
    return filtered.slice(0, 10);
  }, [rows, query]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Hero */}
      <section className="card p-7 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-semibold">
              <span className="text-brand">Radio</span>Frecuencias
            </h1>
            <p className="max-w-2xl">
              Gestión de <strong>préstamos</strong> y <strong>devoluciones</strong> de equipos,
              con trazabilidad por empleado, turno y estado.
            </p>
            <div className="pt-2 flex gap-3">
              <Link href="/prestamos" className="btn btn-primary">Ir a Préstamos</Link>
              <Link href="/historico" className="btn btn-outline">Ver Histórico</Link>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button onClick={load} className="btn btn-outline">Recargar</button>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-brand"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                Auto-actualizar (30s)
              </label>
            </div>
            <div className="text-xs muted">
              {lastUpdated ? `Actualizado: ${lastUpdated.toLocaleTimeString("es-CO")}` : "—"}
            </div>
          </div>
        </div>
      </section>

      {/* Métricas */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Abiertos" value={abiertos} loading={loading} />
        <Stat label="Prestados hoy" value={prestadosHoy} loading={loading} />
        <Stat label="Devueltos hoy" value={devueltosHoy} loading={loading} />
        <Stat label="Total registros" value={total} loading={loading} />
      </section>

      {/* Últimos movimientos */}
      <section className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold">Últimos movimientos</h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por cédula, empleado, SAP o radio…"
              className="input flex-1 sm:w-[320px]"
            />
            <Link href="/historico" className="btn btn-outline">Ir al histórico</Link>
          </div>
        </div>

        {err && (
          <div className="mt-2 p-3 rounded-xl border" style={{ borderColor: "var(--ring)", background: "var(--surface-muted)" }}>
            <span className="text-sm">⚠️ {err}</span>
          </div>
        )}

        <div className="overflow-x-auto mt-2">
          <table className="table">
            <thead>
              <tr>
                <th className="table-cell">ID</th>
                <th className="table-cell">Cédula</th>
                <th className="table-cell">Empleado</th>
                <th className="table-cell">Usuario SAP</th>
                <th className="table-cell">Radio</th>
                <th className="table-cell">Estado</th>
                <th className="table-cell">Prestado</th>
                <th className="table-cell">Devuelto</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} idx={i} />)
                : ultimos.length > 0
                ? ultimos.map((r) => (
                    <tr key={r.id} className="table-row">
                      <td className="table-cell">{r.id}</td>
                      <td className="table-cell">{r.cedula ?? "—"}</td>
                      <td className="table-cell">{r.empleado_nombre ?? "—"}</td>
                      <td className="table-cell">{r.usuario_sap ?? "—"}</td>
                      <td className="table-cell">{r.codigo_radio ?? "—"}</td>
                      <td className="table-cell">
                        <span
                          className={`badge ${
                            (r.estado || "").toUpperCase() === "DEVUELTO" ? "status-devuelto" : "status-asignado"
                          }`}
                        >
                          {r.estado ?? "—"}
                        </span>
                      </td>
                      <td className="table-cell">{fmtDate(r.fecha_hora_prestamo)}</td>
                      <td className="table-cell">{fmtDate(r.fecha_hora_devolucion)}</td>
                    </tr>
                  ))
                : (
                  <tr>
                    <td colSpan={8} className="table-cell muted text-center">
                      {query ? "Sin resultados para la búsqueda" : "Sin movimientos todavía"}
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="card p-6">
        <h3 className="text-base font-semibold mb-3">Accesos rápidos</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/prestamos" className="btn btn-primary">Registrar préstamo</Link>
          <Link href="/historico" className="btn btn-outline">Consultar histórico</Link>
          <Link href="/admin" className="btn btn-outline">Panel de administración</Link>
          <a href="/api/docs" className="btn btn-outline">Documentación API</a>
        </div>
        <p className="mt-3 text-sm muted">
          Tip: cambia entre tema claro/oscuro desde la esquina superior derecha.
        </p>
      </section>
    </main>
  );
}

