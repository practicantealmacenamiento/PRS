/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Menu from "@/components/Menu";
import { apiGET, apiPOST } from "@/lib/api";
import type { Empleado, PrestamoResp } from "@/lib/types";
import { calcularTurno, formatoFecha, formatoHora } from "@/lib/turnos";
import { useDebounce } from "@/hooks/useDebounce";

const RE_CEDULA = /^[0-9]{5,15}$/;

// ─── Tipos de datos de los endpoints ────────────────────────────────────────

type SapDisponible = { id: number; username: string; empleado_id: number | null; empleado_cedula?: string | null; activo: boolean };
type RadioDisponible = { id: number; codigo: string; descripcion: string | null; activo: boolean };
type Disponibles = { sap_usuarios: SapDisponible[]; radios: RadioDisponible[] };

type SapAsignado = { username: string; codigo_radio: string; cedula: string; empleado_nombre: string; prestamo_id: number };
type RadioAsignada = { codigo_radio: string; usuario_sap: string; cedula: string; empleado_nombre: string; prestamo_id: number };
type Asignados = { sap_usuarios: SapAsignado[]; radios: RadioAsignada[] };

// ─── Combobox con búsqueda ────────────────────────────────────────────────────

function Combobox<T>({
  id, label, value, onChange, options, getKey, getLabel,
  placeholder, loading, noOptionsText,
}: {
  id: string; label: string; value: T | ""; onChange: (v: T) => void;
  options: T[]; getKey?: (v: T) => string; getLabel: (v: T) => string;
  placeholder?: string; loading?: boolean; noOptionsText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? options.filter((o) => getLabel(o).toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(""); }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function select(v: T) { onChange(v); setOpen(false); setQuery(""); }

  const displayLabel = value ? getLabel(value as T) : "";

  return (
    <div className="grid sm:grid-cols-[200px_1fr] items-start gap-3 relative" ref={ref}>
      <label className="text-sm muted pt-2" htmlFor={id}>{label}</label>
      <div className="flex flex-col gap-1">
        <button id={id} type="button" disabled={loading}
          onClick={() => setOpen(o => !o)}
          className={`input flex items-center justify-between gap-2 text-left transition-shadow ${!value ? "text-gray-400 dark:text-gray-500" : ""}`}
          aria-haspopup="listbox" aria-expanded={open}>
          <span className="truncate">{loading ? "Cargando…" : value ? displayLabel : (placeholder || "Selecciona…")}</span>
          <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 left-0 right-0 sm:left-[216px] mt-10 rounded-xl border shadow-lg overflow-hidden"
            style={{ background: "var(--surface)", borderColor: "var(--ring)", top: "0" }} role="listbox">
            <div className="p-2 border-b" style={{ borderColor: "var(--ring)" }}>
              <input autoFocus className="input w-full text-sm" placeholder="Buscar…"
                value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <ul className="max-h-52 overflow-y-auto">
              {filtered.length === 0
                ? <li className="px-4 py-3 text-sm muted text-center">{noOptionsText || "Sin opciones"}</li>
                : filtered.map(opt => {
                  const key = getKey ? getKey(opt) : getLabel(opt);
                  const isSelected = (getKey ? getKey(value as T) : getLabel(value as T)) === key;
                  return (
                    <li key={key}>
                      <button type="button" role="option" aria-selected={isSelected}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-opacity-10 hover:bg-current ${isSelected ? "font-semibold" : ""}`}
                        style={isSelected ? { color: "var(--accent)" } : {}}
                        onClick={() => select(opt)}>
                        {getLabel(opt)}
                      </button>
                    </li>
                  );
                })
              }
            </ul>
          </div>
        )}

        {!loading && options.length === 0 && (
          <span className="text-xs text-amber-600 dark:text-amber-400">{noOptionsText || "No hay opciones"}</span>
        )}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

type TabMode = "asignar" | "devolver";

export default function PrestamosPage() {
  const ahora = useMemo(() => new Date(), []);

  const [usuario, setUsuario] = useState<string>("Usuario");
  useEffect(() => { setUsuario(localStorage.getItem("username") || "Usuario"); }, []);

  const [tab, setTab] = useState<TabMode>("asignar");

  // ── Estado "Asignar" ──────────────────────────────────────────
  const [cedula, setCedula] = useState("");
  const [empleadoNombre, setEmpleadoNombre] = useState<string>("");
  const [usuarioSAP, setUsuarioSAP] = useState("");
  const [sapOK, setSapOK] = useState<boolean | null>(null);
  const [codigoRadio, setCodigoRadio] = useState("");
  const [radioOK, setRadioOK] = useState<boolean | null>(null);

  // ── Estado "Devolver" ─────────────────────────────────────────
  const [devRadio, setDevRadio] = useState<RadioAsignada | "">("");
  const [devSap, setDevSap] = useState<SapAsignado | "">("");

  // ── Listas ────────────────────────────────────────────────────
  const [disponibles, setDisponibles] = useState<Disponibles>({ sap_usuarios: [], radios: [] });
  const [asignados, setAsignados] = useState<Asignados>({ sap_usuarios: [], radios: [] });
  const [loadingDisp, setLoadingDisp] = useState(false);
  const [loadingAsig, setLoadingAsig] = useState(false);

  // ── Feedback común ────────────────────────────────────────────
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fecha = formatoFecha(ahora);
  const hora = formatoHora(ahora);
  const turno = calcularTurno(ahora);

  // ── Fetch listas ──────────────────────────────────────────────
  async function fetchDisponibles() {
    setLoadingDisp(true);
    try { setDisponibles(await apiGET<Disponibles>("/prestamos/disponibles/")); }
    catch { /* silencioso */ }
    finally { setLoadingDisp(false); }
  }

  async function fetchAsignados() {
    setLoadingAsig(true);
    try { setAsignados(await apiGET<Asignados>("/prestamos/asignados/")); }
    catch { /* silencioso */ }
    finally { setLoadingAsig(false); }
  }

  async function refreshAll() { await Promise.all([fetchDisponibles(), fetchAsignados()]); }

  useEffect(() => { void refreshAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Selección en dropdowns de Asignar ─────────────────────────
  function onSelectSAP(val: string) { setUsuarioSAP(val); setSapOK(val ? true : null); setMensaje(null); }
  function onSelectRadio(val: string) { setCodigoRadio(val); setRadioOK(val ? true : null); setMensaje(null); }

  // ── Empleado lookup ───────────────────────────────────────────
  function cleanCedula(v: string) { return v.replace(/[^\d]/g, "").slice(0, 15); }

  const buscarEmpleado = useCallback(async (c: string) => {
    setEmpleadoNombre(""); setMensaje(null);
    const cleaned = cleanCedula(c);
    if (!RE_CEDULA.test(cleaned)) return;
    try {
      const candidatos = await apiGET<Empleado[]>(`/empleados/?q=${encodeURIComponent(cleaned)}`);
      const match = candidatos.find(e => e.cedula === cleaned);
      if (!match) { setMensaje("Empleado no encontrado."); return; }
      if (!match.activo) { setMensaje("Empleado registrado pero inactivo."); return; }
      setEmpleadoNombre(match.nombre);
    } catch (e: any) { setMensaje(e?.message || "No fue posible consultar el empleado."); }
  }, []);

  const debouncedCedula = useDebounce(cedula, 500);
  useEffect(() => { void buscarEmpleado(debouncedCedula); }, [debouncedCedula, buscarEmpleado]);

  // ── Validaciones Asignar ──────────────────────────────────────
  const RE_SAP = /^[A-Za-z0-9._-]{3,50}$/;
  const RE_RADIO = /^[A-Za-z0-9-]{6,25}$/;

  const canGuardar =
    RE_CEDULA.test(cedula) && !!empleadoNombre &&
    RE_SAP.test(usuarioSAP) && sapOK === true &&
    RE_RADIO.test(codigoRadio) && radioOK === true && !loading;

  // ── Submit: Asignar ───────────────────────────────────────────
  async function onGuardar(e?: React.FormEvent) {
    e?.preventDefault?.();
    if (!canGuardar) return;
    setMensaje(null); setLoading(true);
    try {
      const data = await apiPOST<PrestamoResp>("/prestamos/", {
        cedula: cleanCedula(cedula),
        usuario_sap: usuarioSAP,
        codigo_radio: codigoRadio,
      });
      setMensaje(`✅ Préstamo #${data.id} creado — Radio: ${data.codigo_radio}, Empleado: ${data.empleado_nombre}.`);
      setCedula(""); setEmpleadoNombre(""); setUsuarioSAP(""); setSapOK(null); setCodigoRadio(""); setRadioOK(null);
      void refreshAll();
    } catch (err: any) { setMensaje(`⚠️ ${err?.message || "Error al guardar"}`); }
    finally { setLoading(false); }
  }

  // ── Submit: Devolver ──────────────────────────────────────────
  async function onDevolver(e?: React.FormEvent) {
    e?.preventDefault?.();
    setMensaje(null);

    // Prioridad: radio seleccionada > SAP seleccionado
    const payload: Record<string, string> = {};
    if (devRadio !== "") {
      payload.codigo_radio = devRadio.codigo_radio;
    } else if (devSap !== "") {
      payload.usuario_sap = devSap.username;
    } else {
      setMensaje("Selecciona un Radio o un Usuario SAP para devolver.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiPOST<PrestamoResp>("/prestamos/devolver/", payload);
      setMensaje(`✅ Equipo ${data.codigo_radio} devuelto. Préstamo #${data.id}.`);
      setDevRadio(""); setDevSap("");
      void refreshAll();
    } catch (err: any) { setMensaje(`⚠️ ${err?.message || "Error al devolver"}`); }
    finally { setLoading(false); }
  }

  // ── Atajos ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "enter") { e.preventDefault(); if (tab === "asignar") void onGuardar(); else void onDevolver(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, cedula, empleadoNombre, usuarioSAP, sapOK, codigoRadio, radioOK, devRadio, devSap, loading]);

  // ─────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="grid sm:grid-cols-[200px_1fr] items-center gap-3">
      <span className="text-sm muted">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <header className="nav">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl tracking-tight font-semibold">PRÉSTAMOS DE RADIOFRECUENCIAS</h1>
          <div className="text-sm"><span className="muted">Usuario:&nbsp;</span><span className="font-medium">{usuario}</span></div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 grid md:grid-cols-[260px_1fr] gap-6">
        <Menu />

        <section className="card p-6 overflow-visible">
          {/* Header con tabs y botón refrescar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            {/* Tabs — segmented pill control */}
            <div
              className="flex rounded-2xl p-1 gap-1"
              style={{ background: "var(--surface-muted)", border: "1px solid var(--outline)" }}
            >
              {([
                ["asignar", "📍", "Asignar"],
                ["devolver", "↩", "Devolver"],
              ] as [TabMode, string, string][]).map(([key, icon, lbl]) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setTab(key); setMensaje(null); }}
                    className="relative flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 select-none"
                    style={active ? {
                      background: "var(--color-skyBlue)",
                      color: "#fff",
                      boxShadow: "0 2px 10px color-mix(in oklab, var(--color-skyBlue) 45%, transparent)",
                    } : {
                      background: "transparent",
                      color: "var(--muted)",
                    }}
                  >
                    <span className={`text-base transition-transform duration-200 ${active ? "scale-110" : "scale-100"}`}>{icon}</span>
                    {lbl}
                  </button>
                );
              })}
            </div>

            {/* Contador + refrescar */}
            <div className="flex items-center gap-2 flex-wrap">
              {tab === "asignar" ? (
                <>
                  <span className="text-xs px-3 py-1 rounded-full border" style={{ borderColor: "var(--ring)", background: "var(--surface-muted)" }}>
                    📶 Disponibles: <strong>{loadingDisp ? "…" : disponibles.radios.length}</strong>
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full border" style={{ borderColor: "var(--ring)", background: "var(--surface-muted)" }}>
                    👤 SAP libres: <strong>{loadingDisp ? "…" : disponibles.sap_usuarios.length}</strong>
                  </span>
                </>
              ) : (
                <span className="text-xs px-3 py-1 rounded-full border" style={{ borderColor: "var(--ring)", background: "var(--surface-muted)" }}>
                  🔴 Asignados: <strong>{loadingAsig ? "…" : asignados.radios.length}</strong>
                </span>
              )}
              <button type="button" onClick={() => void refreshAll()}
                disabled={loadingDisp || loadingAsig}
                className="btn btn-outline text-xs px-3 py-1">
                {(loadingDisp || loadingAsig) ? "⟳ Cargando…" : "⟳ Refrescar"}
              </button>
            </div>
          </div>

          {/* ══ TAB ASIGNAR ══════════════════════════════════════════ */}
          {tab === "asignar" && (
            <form onSubmit={onGuardar} className="space-y-5">
              {/* Cédula */}
              <div className="grid sm:grid-cols-[200px_1fr] items-center gap-3">
                <label className="text-sm muted" htmlFor="cedula">Cédula</label>
                <div className="flex gap-2">
                  <input id="cedula" value={cedula}
                    onChange={e => setCedula(cleanCedula(e.target.value))}
                    inputMode="numeric" maxLength={15} required
                    aria-invalid={!RE_CEDULA.test(cedula)}
                    className="input flex-1" placeholder="Ingresa documento" />
                  <button type="button" className="btn btn-outline" onClick={() => void buscarEmpleado(cedula)}>Buscar</button>
                </div>
              </div>

              <InfoRow label="Empleado" value={empleadoNombre || "—"} />

              {/* SAP dropdown (disponibles) */}
              <Combobox<string>
                id="sap" label="Usuario SAP"
                value={usuarioSAP} onChange={onSelectSAP}
                options={disponibles.sap_usuarios.map(s => s.username)}
                getLabel={v => v}
                placeholder="Selecciona usuario SAP disponible…"
                loading={loadingDisp}
                noOptionsText="No hay usuarios SAP disponibles"
              />
              {usuarioSAP && sapOK === true && (
                <div className="grid sm:grid-cols-[200px_1fr] gap-3">
                  <span />
                  <span className="text-xs w-fit rounded px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    ✓ {usuarioSAP} — disponible
                  </span>
                </div>
              )}

              {/* Radio dropdown (disponibles) */}
              <Combobox<string>
                id="rf" label="Código RF"
                value={codigoRadio} onChange={onSelectRadio}
                options={disponibles.radios.map(r => r.codigo)}
                getLabel={v => { const r = disponibles.radios.find(x => x.codigo === v); return r?.descripcion ? `${v} — ${r.descripcion}` : v; }}
                placeholder="Selecciona radio disponible…"
                loading={loadingDisp}
                noOptionsText="No hay radios disponibles"
              />
              {codigoRadio && radioOK === true && (
                <div className="grid sm:grid-cols-[200px_1fr] gap-3">
                  <span />
                  <span className="text-xs w-fit rounded px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    ✓ {codigoRadio} — disponible
                  </span>
                </div>
              )}

              <InfoRow label="Fecha" value={fecha} />
              <InfoRow label="Hora" value={hora} />
              <InfoRow label="Turno" value={<strong>{turno}</strong>} />
              <InfoRow label="Registra" value={<strong>{usuario}</strong>} />

              <div className="pt-2 flex flex-wrap gap-3">
                <button type="submit" disabled={!canGuardar}
                  className={`btn btn-primary transition-transform ${canGuardar ? "hover:scale-[1.02]" : "opacity-60"}`}
                  title="Guardar préstamo (Ctrl+Enter)">
                  {loading ? "Guardando…" : "Guardar Préstamo"}
                </button>
                <button type="button" className="btn btn-outline"
                  onClick={() => { setCedula(""); setEmpleadoNombre(""); setUsuarioSAP(""); setSapOK(null); setCodigoRadio(""); setRadioOK(null); setMensaje(null); }}>
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* ══ TAB DEVOLVER ══════════════════════════════════════════ */}
          {tab === "devolver" && (
            <form onSubmit={onDevolver} className="space-y-5">
              <p className="text-sm muted">
                Selecciona la <strong>radiofrecuencia</strong> que se va a devolver.
              </p>

              {/* Radio asignado dropdown */}
              <Combobox<RadioAsignada>
                id="dev-rf" label="Radio asignado"
                value={devRadio} onChange={setDevRadio}
                options={asignados.radios}
                getKey={r => r.codigo_radio}
                getLabel={r => `${r.codigo_radio} — ${r.empleado_nombre} (${r.usuario_sap})`}
                placeholder="Selecciona un radio prestado…"
                loading={loadingAsig}
                noOptionsText="No hay radios asignadas actualmente"
              />

              {/* Info del préstamo seleccionado (radio) */}
              {devRadio !== "" && (
                <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: "var(--ring)", background: "var(--surface-muted)" }}>
                  <p className="text-xs font-semibold muted uppercase tracking-wide">Datos del préstamo</p>
                  <InfoRow label="Radio" value={<strong>{devRadio.codigo_radio}</strong>} />
                  <InfoRow label="Usuario SAP" value={devRadio.usuario_sap} />
                  <InfoRow label="Empleado" value={devRadio.empleado_nombre} />
                  <InfoRow label="Cédula" value={devRadio.cedula} />
                  <InfoRow label="Préstamo #" value={devRadio.prestamo_id} />
                </div>
              )}

              <div className="pt-2 flex flex-wrap gap-3">
                <button type="submit" disabled={loading || devRadio === ""}
                  className={`btn btn-primary transition-transform ${devRadio !== "" && !loading ? "hover:scale-[1.02]" : "opacity-60"}`}
                  title="Registrar devolución (Ctrl+Enter)">
                  {loading ? "Procesando…" : "Registrar Devolución"}
                </button>
                <button type="button" className="btn btn-outline"
                  onClick={() => { setDevRadio(""); setMensaje(null); }}>
                  Limpiar
                </button>
              </div>
            </form>
          )}

          {/* Mensaje de feedback */}
          {mensaje && (
            <div className="mt-4 p-3 rounded-xl border transition-colors"
              style={{ borderColor: "var(--ring)", background: "var(--surface-muted)" }}
              aria-live="polite">
              <span className="text-sm">{mensaje}</span>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
