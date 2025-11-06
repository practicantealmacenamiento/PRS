/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import Menu from "@/components/Menu";
import { apiGET, apiPOST } from "@/lib/api";
import type { Empleado, Radio, SapUsuario, PrestamoResp } from "@/lib/types";
import { calcularTurno, formatoFecha, formatoHora } from "@/lib/turnos";

const RE_CEDULA = /^[0-9]{5,15}$/;
const RE_SAP = /^[A-Za-z0-9._-]{3,50}$/;
const RE_RADIO = /^[A-Za-z0-9-]{6,25}$/;

export default function PrestamosPage() {
  const ahora = useMemo(() => new Date(), []);
  const [usuario] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("username") || "Usuario" : "Usuario"
  );

  // Estado del formulario
  const [cedula, setCedula] = useState("");
  const [empleadoNombre, setEmpleadoNombre] = useState<string>("");

  const [usuarioSAP, setUsuarioSAP] = useState("");
  const [sapOK, setSapOK] = useState<boolean | null>(null);

  const [codigoRadio, setCodigoRadio] = useState("");
  const [radioOK, setRadioOK] = useState<boolean | null>(null);

  const [estado, setEstado] = useState<"Asignando" | "Asignado">("Asignando");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Derivados
  const fecha = formatoFecha(ahora);
  const hora = formatoHora(ahora);
  const turno = calcularTurno(ahora);

  // Helpers
  function cleanCedula(v: string) {
    return v.replace(/[^\d]/g, "").slice(0, 15);
  }
  function cleanSAP(v: string) {
    return v.trim().slice(0, 50);
  }
  function cleanRF(v: string) {
    return v.trim().toUpperCase().slice(0, 25);
  }

  async function buscarEmpleado() {
    setEmpleadoNombre("");
    setMensaje(null);
    const c = cleanCedula(cedula);
    if (!RE_CEDULA.test(c)) return;
    try {
      const candidatos = await apiGET<Empleado[]>(`/empleados/?q=${encodeURIComponent(c)}`);
      const match = candidatos.find((emp) => emp.cedula === c);
      if (!match) {
        setMensaje("Empleado no encontrado.");
        return;
      }
      if (!match.activo) {
        setMensaje("Empleado registrado pero inactivo.");
        return;
      }
      setMensaje(null);
      setEmpleadoNombre(match.nombre);
    } catch (e: any) {
      setMensaje(e?.message || "No fue posible consultar el empleado.");
    }
  }

  async function validarSAP() {
    setSapOK(null);
    const u = cleanSAP(usuarioSAP);
    if (!RE_SAP.test(u)) return;
    try {
      const candidatos = await apiGET<SapUsuario[]>(`/sap-usuarios/?q=${encodeURIComponent(u)}`);
      const match = candidatos.find(
        (item) => item.username.toLowerCase() === u.toLowerCase()
      );
      if (!match) {
        setSapOK(false);
        return;
      }
      if (!match.activo) {
        setSapOK(false);
        setMensaje("Usuario SAP encontrado pero inactivo.");
        return;
      }
      setMensaje(null);
      setSapOK(true);
    } catch (e: any) {
      setSapOK(false);
      setMensaje(e?.message || "No fue posible validar el usuario SAP.");
    }
  }

  async function validarRadio() {
    setRadioOK(null);
    const rf = cleanRF(codigoRadio);
    if (!RE_RADIO.test(rf)) return;
    try {
      const candidatos = await apiGET<Radio[]>(`/radios/?q=${encodeURIComponent(rf)}`);
      const match = candidatos.find(
        (item) => item.codigo.toUpperCase() === rf
      );
      if (!match) {
        setRadioOK(false);
        return;
      }
      if (!match.activo) {
        setRadioOK(false);
        setMensaje("Equipo registrado pero inactivo.");
        return;
      }
      setMensaje(null);
      setRadioOK(true);
    } catch (e: any) {
      setRadioOK(false);
      setMensaje(e?.message || "No fue posible validar el equipo.");
    }
  }

  const canGuardar =
    RE_CEDULA.test(cedula) &&
    !!empleadoNombre &&
    RE_SAP.test(usuarioSAP) &&
    sapOK === true &&
    RE_RADIO.test(codigoRadio) &&
    radioOK === true &&
    !loading;

  async function onGuardar(e?: React.FormEvent) {
    e?.preventDefault?.();
    setMensaje(null);
    if (!canGuardar) return;
    setLoading(true);
    try {
      const data = await apiPOST<PrestamoResp>("/prestamos/", {
        cedula: cleanCedula(cedula),
        usuario_sap: cleanSAP(usuarioSAP),
        codigo_radio: cleanRF(codigoRadio),
      });
      setEstado("Asignado");
      setMensaje(`✅ Préstamo #${data.id} creado. Empleado: ${data.empleado_nombre} — Radio: ${data.codigo_radio}.`);
      // Reset suave
      setCedula("");
      setEmpleadoNombre("");
      setUsuarioSAP("");
      setSapOK(null);
      setCodigoRadio("");
      setRadioOK(null);
    } catch (err: any) {
      setMensaje(`⚠️ ${err?.message || "Error al guardar"}`);
    } finally {
      setLoading(false);
    }
  }

  // NUEVO: devolución con cualquiera de las 3 entradas
  async function onDevolver() {
    setMensaje(null);

    const rf = cleanRF(codigoRadio);
    const sap = cleanSAP(usuarioSAP);
    const doc = cleanCedula(cedula);

    const payload: Record<string, string> = {};
    if (RE_RADIO.test(rf)) {
      // si hay RF, priorizamos RF
      payload.codigo_radio = rf;
    } else if (RE_SAP.test(sap)) {
      if (sapOK === false) {
        setMensaje("El usuario SAP no existe.");
        return;
      }
      payload.usuario_sap = sap;
    } else if (RE_CEDULA.test(doc)) {
      payload.cedula = doc;
    } else {
      setMensaje("Ingresa una referencia válida: Cédula, Usuario SAP o Código RF.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiPOST<PrestamoResp>("/prestamos/devolver/", payload);
      setMensaje(`✅ Equipo ${data.codigo_radio} devuelto. Préstamo #${data.id}.`);
      setEstado("Asignando");
      setCodigoRadio("");
      setRadioOK(null);
    } catch (err: any) {
      setMensaje(`⚠️ ${err?.message || "Error al devolver"}`);
    } finally {
      setLoading(false);
    }
  }

  // Atajos de teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === "enter") {
        e.preventDefault();
        void onGuardar();
      } else if (e.altKey && (e.key.toLowerCase() === "d" || e.key === "D")) {
        e.preventDefault();
        void onDevolver();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cedula, empleadoNombre, usuarioSAP, sapOK, codigoRadio, radioOK, loading]);

  return (
    <>
      {/* Top bar */}
      <header className="nav">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl tracking-tight font-semibold">PRÉSTAMOS DE RADIOFRECUENCIAS</h1>
          <div className="text-sm">
            <span className="muted">Usuario:&nbsp;</span>
            <span className="font-medium">{usuario}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 grid md:grid-cols-[260px_1fr] gap-6">
        <Menu />

        <section className="card p-6 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold">Operación</h2>
            <span
              className={`badge transition-colors ${
                estado === "Asignando" ? "status-asignado" : "status-devuelto"
              }`}
              title="Estado de la operación"
            >
              {estado.toUpperCase()}
            </span>
          </div>

          {/* Formulario */}
          <form onSubmit={onGuardar} className="space-y-5">
            {/* Cédula */}
            <div className="grid sm:grid-cols-[220px_1fr_auto] items-center gap-3">
              <label className="text-sm muted" htmlFor="cedula">Cédula</label>
              <div className="flex gap-3">
                <input
                  id="cedula"
                  value={cedula}
                  onChange={(e) => setCedula(cleanCedula(e.target.value))}
                  onBlur={buscarEmpleado}
                  inputMode="numeric"
                  maxLength={15}
                  required
                  aria-invalid={!RE_CEDULA.test(cedula)}
                  className="input flex-1 transition-shadow"
                  placeholder="Ingresa documento"
                />
                <button type="button" className="btn btn-outline" onClick={buscarEmpleado}>
                  Buscar
                </button>
              </div>

              {/* Acción rápida: Devolver (ahora acepta doc/SAP/RF) */}
              <button
                type="button"
                onClick={onDevolver}
                disabled={
                  loading ||
                  !(
                    RE_RADIO.test(codigoRadio) ||
                    RE_SAP.test(usuarioSAP) ||
                    RE_CEDULA.test(cedula)
                  )
                }
                title="Registrar Devolución (Alt+D) con Cédula, Usuario SAP o Código RF"
                className="btn btn-outline"
              >
                Devolver
              </button>
            </div>

            {/* Nombre detectado */}
            <div className="grid sm:grid-cols-[220px_1fr] items-center gap-3">
              <span className="text-sm muted">Empleado</span>
              <span className="text-sm font-medium transition-opacity">{empleadoNombre || "—"}</span>
            </div>

            {/* Usuario SAP */}
            <div className="grid sm:grid-cols-[220px_1fr_auto] items-center gap-3">
              <label className="text-sm muted" htmlFor="sap">Usuario SAP</label>
              <input
                id="sap"
                value={usuarioSAP}
                onChange={(e) => {
                  setUsuarioSAP(cleanSAP(e.target.value));
                  setSapOK(null);
                }}
                onBlur={validarSAP}
                maxLength={50}
                required
                aria-invalid={sapOK === false || !RE_SAP.test(usuarioSAP)}
                className="input transition-shadow"
                placeholder="ej. materprima12"
              />
              <span
                className={`text-xs min-w-[70px] text-center rounded px-2 py-1 transition-colors ${
                  sapOK === true
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : sapOK === false
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                    : "muted"
                }`}
              >
                {sapOK === true ? "válido" : sapOK === false ? "no existe" : ""}
              </span>
            </div>

            {/* Código Radio */}
            <div className="grid sm:grid-cols-[220px_1fr_auto] items-center gap-3">
              <label className="text-sm muted" htmlFor="rf">Código RF</label>
              <input
                id="rf"
                value={codigoRadio}
                onChange={(e) => {
                  setCodigoRadio(cleanRF(e.target.value));
                  setRadioOK(null);
                }}
                onBlur={validarRadio}
                maxLength={25}
                required
                aria-invalid={radioOK === false || !RE_RADIO.test(codigoRadio)}
                className="input transition-shadow"
                placeholder="S1XXXXXXXXXXXX"
              />
              <span
                className={`text-xs min-w-[70px] text-center rounded px-2 py-1 transition-colors ${
                  radioOK === true
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : radioOK === false
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                    : "muted"
                }`}
              >
                {radioOK === true ? "válido" : radioOK === false ? "no existe" : ""}
              </span>
            </div>

            {/* Info local */}
            <div className="grid sm:grid-cols-[220px_1fr] items-center gap-3">
              <span className="text-sm muted">Fecha de Préstamo</span>
              <span className="text-sm">{fecha}</span>
            </div>
            <div className="grid sm:grid-cols-[220px_1fr] items-center gap-3">
              <span className="text-sm muted">Hora de Préstamo</span>
              <span className="text-sm">{hora}</span>
            </div>
            <div className="grid sm:grid-cols-[220px_1fr] items-center gap-3">
              <span className="text-sm muted">Turno</span>
              <span className="text-sm font-semibold">{turno}</span>
            </div>
            <div className="grid sm:grid-cols-[220px_1fr] items-center gap-3">
              <span className="text-sm muted">Estado</span>
              <span className="text-sm font-semibold">{estado}</span>
            </div>
            <div className="grid sm:grid-cols-[220px_1fr] items-center gap-3">
              <span className="text-sm muted">Usuario que registra</span>
              <span className="text-sm font-semibold">{usuario}</span>
            </div>

            {/* Acciones */}
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={!canGuardar}
                className={`btn btn-primary transition-transform ${canGuardar ? "hover:scale-[1.02]" : "opacity-60"}`}
                title="Guardar préstamo (Ctrl+Enter)"
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCedula("");
                  setEmpleadoNombre("");
                  setUsuarioSAP("");
                  setSapOK(null);
                  setCodigoRadio("");
                  setRadioOK(null);
                  setMensaje(null);
                  setEstado("Asignando");
                }}
                className="btn btn-outline"
              >
                Cancelar
              </button>
            </div>

            {mensaje && (
              <div
                className="mt-3 p-3 rounded-xl border transition-colors"
                style={{ borderColor: "var(--ring)", background: "var(--surface-muted)" }}
                aria-live="polite"
              >
                <span className="text-sm">{mensaje}</span>
              </div>
            )}
          </form>
        </section>
      </main>
    </>
  );
}
