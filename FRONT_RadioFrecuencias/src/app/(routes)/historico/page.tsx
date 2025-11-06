/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Menu from "@/components/Menu";
import { apiGET } from "@/lib/api";
import type { PrestamoResp } from "@/lib/types";
import { exportXLSX } from "@/lib/xlsx";
import { rowsToCSV, downloadCSV } from "@/lib/csv";

/* ----------------------------- Helpers ----------------------------- */
type SortKey = keyof Pick<
  PrestamoResp,
  | "id"
  | "cedula"
  | "empleado_nombre"
  | "usuario_sap"
  | "codigo_radio"
  | "turno"
  | "estado"
  | "fecha_hora_prestamo"
  | "fecha_hora_devolucion"
>;
type Order = "asc" | "desc";

const headers: Record<string, string> = {
  id: "ID",
  cedula: "Cédula",
  empleado_nombre: "Empleado",
  usuario_sap: "Usuario SAP",
  codigo_radio: "RF",
  turno: "Turno",
  estado: "Estado",
  fecha_hora_prestamo: "Prestado",
  fecha_hora_devolucion: "Devuelto",
  usuario_registra: "Registrado por",
};

function parseDate(v?: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function fmtDate(v?: string | null) {
  const d = parseDate(v);
  return d ? d.toLocaleString("es-CO") : "—";
}
function compare(a: any, b: any): number {
  const da = parseDate(a)?.getTime();
  const db = parseDate(b)?.getTime();
  if (da || db) return (da ?? 0) - (db ?? 0);
  if (!isNaN(+a) && !isNaN(+b)) return +a - +b;
  return String(a ?? "").localeCompare(String(b ?? ""), "es", { sensitivity: "base" });
}
function sortRows(rows: PrestamoResp[], key: SortKey, order: Order) {
  const f = order === "asc" ? 1 : -1;
  return [...rows].sort((ra, rb) => f * compare((ra as any)[key], (rb as any)[key]));
}
function StatusBadge({ estado }: { estado: string }) {
  const devol = (estado || "").toUpperCase() === "DEVUELTO";
  return (
    <span
      className={`badge transition-all duration-200 ${
        devol ? "status-devuelto" : "status-asignado"
      }`}
      title={devol ? "Devuelto" : "Asignado"}
    >
      {estado ?? "—"}
    </span>
  );
}
function RowSkeleton({ keyId }: { keyId: string | number }) {
  return (
    <tr key={keyId} className="table-row animate-pulse">
      {Array.from({ length: 9 }).map((_, i) => (
        <td key={i} className="table-cell">
          <div className="h-4 w-full max-w-[120px] rounded bg-cloud/60 dark:bg-coffee/40" />
        </td>
      ))}
    </tr>
  );
}

/* ----------------------------- Page ----------------------------- */
export default function HistoricoPage() {
  // filtros
  const [qCedula, setQCedula] = useState("");
  const [qRadio, setQRadio] = useState("");
  const [qSAP, setQSAP] = useState("");
  const [qNombre, setQNombre] = useState("");
  const [qEstado, setQEstado] = useState<"" | "ASIGNADO" | "DEVUELTO">("");
  const [qTurno, setQTurno] = useState<"" | "1" | "2" | "3">("");
  const [qDesde, setQDesde] = useState("");
  const [qHasta, setQHasta] = useState("");

  const [rows, setRows] = useState<PrestamoResp[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // sorting
  const [sortKey, setSortKey] = useState<SortKey>("fecha_hora_prestamo");
  const [sortOrder, setSortOrder] = useState<Order>("desc");

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const params = new URLSearchParams();
      if (qCedula) params.set("cedula", qCedula.trim());
      if (qRadio) params.set("codigo_radio", qRadio.trim());
      const data = await apiGET<PrestamoResp[]>(`/prestamos/?${params.toString()}`);
      setRows(Array.isArray(data) ? data : []);
      setPage(1);
      setLastUpdated(new Date());
    } catch (e: any) {
      setErr(e?.message || "No fue posible cargar los datos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); // primera carga
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoRefresh) {
      timerRef.current = setInterval(load, 30_000);
    }
  }, [autoRefresh]); // eslint-disable-line react-hooks/exhaustive-deps

  // filtros client-side + orden
  const filtered = useMemo(() => {
    let r = rows;
    if (qSAP) r = r.filter((x) => x.usuario_sap?.toLowerCase().includes(qSAP.toLowerCase()));
    if (qNombre) r = r.filter((x) => x.empleado_nombre?.toLowerCase().includes(qNombre.toLowerCase()));
    if (qEstado) r = r.filter((x) => x.estado === qEstado);
    if (qTurno) {
      const t = qTurno === "1" ? "Turno 1" : qTurno === "2" ? "Turno 2" : "Turno 3";
      r = r.filter((x) => x.turno?.startsWith(t));
    }
    if (qDesde) {
      const d = new Date(qDesde);
      r = r.filter((x) => parseDate(x.fecha_hora_prestamo)! >= d);
    }
    if (qHasta) {
      const d = new Date(qHasta);
      d.setHours(23, 59, 59, 999);
      r = r.filter((x) => parseDate(x.fecha_hora_prestamo)! <= d);
    }
    return sortRows(r, sortKey, sortOrder);
  }, [rows, qSAP, qNombre, qEstado, qTurno, qDesde, qHasta, sortKey, sortOrder]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [pages, page]);

  function setSort(k: SortKey) {
    if (k === sortKey) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortOrder("asc");
    }
  }

  const openCount = filtered.filter((r) => (r.estado || "").toUpperCase() !== "DEVUELTO").length;

  /* ----------------------------- Export handlers ----------------------------- */
  async function onExportXLSX() {
    await exportXLSX(filtered, headers, {
      filename: "historico.xlsx",
      sheetName: "Histórico",
      dateKeys: ["fecha_hora_prestamo", "fecha_hora_devolucion"],
    });
  }
  function onExportCSV() {
    const csv = rowsToCSV(filtered, headers, { delimiter: ",", includeBOM: true, excelSepDirective: true });
    downloadCSV(csv, "historico.csv");
  }

  /* ----------------------------- UI ----------------------------- */
  return (
    <>
      {/* Top bar más ancha */}
      <header className="sticky top-14 z-30 bg-bone/80 dark:bg-coffee/80 backdrop-blur border-b border-light-grey/40">
        <div className="mx-auto max-w-screen-2xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl tracking-tight font-semibold">Histórico</h1>
            <div className="hidden md:flex items-center gap-2">
              <span className="badge bg-cloud/60 dark:bg-coffee/40">Total: <b>{total}</b></span>
              <span className="badge bg-cloud/60 dark:bg-coffee/40">Abiertos: <b>{openCount}</b></span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={load} className="btn btn-outline transition-transform hover:scale-[1.02]">
              {loading ? "Cargando…" : "Refrescar"}
            </button>
            <label className="inline-flex items-center gap-2 text-sm select-none">
              <input
                type="checkbox"
                className="accent-brand"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto (30s)
            </label>
            <div className="text-xs muted w-[140px] text-right">
              {lastUpdated ? `Act: ${lastUpdated.toLocaleTimeString("es-CO")}` : "—"}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-4 py-8 grid md:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <Menu />

        {/* Content */}
        <section className="card p-6 overflow-hidden">
          {/* Filtros (sin iconos) */}
          <div className="grid xl:grid-cols-3 gap-3">
            <div className="grid grid-cols-2 gap-3">
              <input value={qCedula} onChange={(e) => setQCedula(e.target.value)} placeholder="Cédula" className="input" />
              <input value={qRadio} onChange={(e) => setQRadio(e.target.value)} placeholder="RF" className="input" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input value={qSAP} onChange={(e) => setQSAP(e.target.value)} placeholder="Usuario SAP" className="input" />
              <input value={qNombre} onChange={(e) => setQNombre(e.target.value)} placeholder="Nombre empleado" className="input" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <select value={qEstado} onChange={(e) => setQEstado(e.target.value as any)} className="input">
                <option value="">Estado</option>
                <option value="ASIGNADO">Asignado</option>
                <option value="DEVUELTO">Devuelto</option>
              </select>
              <select value={qTurno} onChange={(e) => setQTurno(e.target.value as any)} className="input">
                <option value="">Turno</option>
                <option value="1">Turno 1</option>
                <option value="2">Turno 2</option>
                <option value="3">Turno 3</option>
              </select>
              <button onClick={load} className="btn btn-outline transition-transform hover:scale-[1.02]">
                {loading ? "Cargando…" : "Aplicar"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={qDesde} onChange={(e) => setQDesde(e.target.value)} className="input" />
              <input type="date" value={qHasta} onChange={(e) => setQHasta(e.target.value)} className="input" />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setQCedula("");
                  setQRadio("");
                  setQSAP("");
                  setQNombre("");
                  setQEstado("");
                  setQTurno("");
                  setQDesde("");
                  setQHasta("");
                }}
                className="btn btn-outline w-full transition-colors hover:bg-cloud/70 dark:hover:bg-coffee/40"
              >
                Limpiar filtros
              </button>
              <div className="flex gap-2">
                <button className="btn btn-outline" onClick={onExportCSV} title="CSV (interoperable)">
                  CSV
                </button>
                <button className="btn btn-primary" onClick={onExportXLSX} title="Excel con formato">
                  Excel
                </button>
              </div>
            </div>
          </div>

          {/* Tabla más amplia */}
          <div className="mt-5 rounded-2xl ring-1 ring-light-grey/40 overflow-auto max-h-[72vh]">
            <table className="table table-auto w-full">
              <thead className="sticky top-0 z-10 bg-bone/90 dark:bg-coffee/90 backdrop-blur">
                <tr>
                  {[
                    ["id", "ID", "right"],
                    ["cedula", "Cédula", "left"],
                    ["empleado_nombre", "Empleado", "left"],
                    ["usuario_sap", "Usuario SAP", "left"],
                    ["codigo_radio", "RF", "left"],
                    ["turno", "Turno", "left"],
                    ["estado", "Estado", "center"],
                    ["fecha_hora_prestamo", "Prestado", "left"],
                    ["fecha_hora_devolucion", "Devuelto", "left"],
                  ].map(([key, label, align]) => {
                    const k = key as SortKey;
                    const active = sortKey === k;
                    const dir = active ? (sortOrder === "asc" ? "▲" : "▼") : "↕";
                    return (
                      <th
                        key={k}
                        className={`table-cell select-none cursor-pointer transition-colors ${
                          active ? "text-brand" : "hover:text-slate-600 dark:hover:text-slate-300"
                        } ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"}`}
                        aria-sort={active ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
                        onClick={() => setSort(k)}
                        title="Ordenar"
                      >
                        <span className="inline-flex items-center gap-1">
                          {label}
                          <span className={`text-xs ${active ? "opacity-100" : "opacity-40"}`}>{dir}</span>
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="transition-colors">
                {loading &&
                  Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={`s-${i}`} keyId={`s-${i}`} />)}

                {!loading &&
                  pageRows.map((r) => (
                    <tr
                      key={r.id}
                      className="table-row group hover:bg-cloud/50 dark:hover:bg-coffee/30 transition-colors"
                    >
                      <td className="table-cell text-right tabular-nums">{r.id}</td>
                      <td className="table-cell">{r.cedula}</td>
                      <td className="table-cell">{r.empleado_nombre}</td>
                      <td className="table-cell">{r.usuario_sap}</td>
                      <td className="table-cell">{r.codigo_radio}</td>
                      <td className="table-cell">{r.turno}</td>
                      <td className="table-cell text-center">
                        <StatusBadge estado={r.estado} />
                      </td>
                      <td className="table-cell">{fmtDate(r.fecha_hora_prestamo)}</td>
                      <td className="table-cell">{fmtDate(r.fecha_hora_devolucion)}</td>
                    </tr>
                  ))}

                {!loading && pageRows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="table-cell text-center muted py-8">
                      {err ? `⚠️ ${err}` : "Sin resultados"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between mt-4">
            <div className="table-footnote">
              Página {page} de {pages} · Mostrando {pageRows.length} de {total}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-outline"
                onClick={() => setPage(1)}
                disabled={page === 1}
                aria-label="Primera"
              >
                «
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Anterior"
              >
                Anterior
              </button>

              {/* Números de página compactos */}
              <div className="hidden md:flex gap-1">
                {Array.from({ length: pages })
                  .slice(Math.max(0, page - 3), Math.min(pages, page + 2))
                  .map((_, idx) => {
                    const n = Math.max(1, page - 2) + idx;
                    const active = n === page;
                    return (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`px-2.5 h-9 rounded-lg text-sm transition-colors ${
                          active
                            ? "bg-sky-blue text-white"
                            : "hover:bg-cloud/80 dark:hover:bg-coffee/40"
                        }`}
                        aria-current={active ? "page" : undefined}
                      >
                        {n}
                      </button>
                    );
                  })}
              </div>

              <button
                className="btn btn-outline"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                aria-label="Siguiente"
              >
                Siguiente
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setPage(pages)}
                disabled={page === pages}
                aria-label="Última"
              >
                »
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
