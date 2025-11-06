"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiDELETE, apiGET, apiPATCH, apiPOST } from "@/lib/api";
import type { AppUser, AuditEntry, Empleado, Radio, SapUsuario } from "@/lib/types";

type CatalogTab = "empleados" | "radios" | "sap";
type MainTab = "catalogos" | "auditoria" | "usuarios";
type FlashMessage = { kind: "ok" | "error"; text: string } | null;
type AuditFilter = (typeof AUDIT_FILTERS)[number]["value"];

const ITEMS_PER_PAGE = 8;
const AUDIT_ENDPOINT = "/audit-log/";
const APP_USERS_ENDPOINT = "/usuarios-app/";
const AUDIT_LIMIT = 20;

const MAIN_TABS: Array<{ key: MainTab; label: string }> = [
  { key: "catalogos", label: "Catalogos" },
  { key: "auditoria", label: "Auditoria" },
  { key: "usuarios", label: "Usuarios del sistema" },
];

const CATALOG_TABS: Array<{ key: CatalogTab; label: string }> = [
  { key: "empleados", label: "Empleados" },
  { key: "radios", label: "Radios" },
  { key: "sap", label: "Usuarios SAP" },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AUDIT_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "Empleado", label: "Empleados" },
  { value: "RadioFrecuencia", label: "Radios" },
  { value: "SapUsuario", label: "Usuarios SAP" },
] as const;

const ACTION_LABELS: Record<string, string> = {
  CREATED: "Creado",
  UPDATED: "Actualizado",
  DELETED: "Eliminado",
};

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  CREATED: { bg: "color-mix(in oklab, var(--surface) 60%, #22c55e 40%)", color: "var(--fg)" },
  UPDATED: { bg: "color-mix(in oklab, var(--surface) 60%, #f59e0b 40%)", color: "var(--fg)" },
  DELETED: { bg: "color-mix(in oklab, var(--surface) 55%, #ef4444 45%)", color: "var(--fg)" },
};

const AGGREGATE_LABELS: Record<string, string> = {
  Empleado: "Empleado",
  RadioFrecuencia: "Radio",
  SapUsuario: "Usuario SAP",
};

const AUDIT_FILTER_OPTIONS: Array<{ value: AuditFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "Empleado", label: "Empleados" },
  { value: "RadioFrecuencia", label: "Radios" },
  { value: "SapUsuario", label: "Usuarios SAP" },
];

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

function valueToText(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value === "number") return `${value}`;
  if (typeof value === "string") return value.trim() === "" ? "-" : value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function diffSummary(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  action: string
) {
  if (action === "CREATED" && after) {
    return Object.entries(after).map(([k, v]) => `${k}: ${valueToText(v)}`).join(", ");
  }
  if (action === "DELETED" && before) {
    return Object.entries(before).map(([k, v]) => `${k}: ${valueToText(v)}`).join(", ");
  }
  if (!before || !after) return "";
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));
  const lines: string[] = [];
  for (const key of keys) {
    const prev = JSON.stringify(before[key]);
    const next = JSON.stringify(after[key]);
    if (prev !== next) {
      lines.push(`${key}: ${valueToText(before[key])} -> ${valueToText(after[key])}`);
    }
  }
  return lines.join(", ");
}

function statusStyle(active: boolean) {
  return active
    ? { background: "color-mix(in oklab, var(--surface) 62%, #22c55e 38%)", color: "var(--fg)" }
    : { background: "color-mix(in oklab, var(--surface) 70%, var(--fg) 30%)", color: "var(--fg)" };
}

function buttonClass(variant: "primary" | "outline" | "ghost", size: "sm" | "md" = "md") {
  if (variant === "primary") {
    return size === "sm"
      ? "btn btn-primary btn-sm"
      : "btn btn-primary";
  }
  return size === "sm"
    ? "btn btn-outline btn-sm"
    : "btn btn-outline";
}

export default function AdminPage() {
  const [mainTab, setMainTab] = useState<MainTab>("catalogos");
  const [catalogTab, setCatalogTab] = useState<CatalogTab>("empleados");
  const [flash, setFlash] = useState<FlashMessage>(null);
  const [busy, setBusy] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [eCedula, setECedula] = useState("");
  const [eNombre, setENombre] = useState("");
  const [eFiltro, setEFiltro] = useState("");
  const [ePagina, setEPagina] = useState(1);

  const [radios, setRadios] = useState<Radio[]>([]);
  const [rCodigo, setRCodigo] = useState("");
  const [rDesc, setRDesc] = useState("");
  const [rFiltro, setRFiltro] = useState("");
  const [rPagina, setRPagina] = useState(1);

  const [saps, setSaps] = useState<SapUsuario[]>([]);
  const [sUser, setSUser] = useState("");
  const [sCedula, setSCedula] = useState("");
  const [sFiltro, setSFiltro] = useState("");
  const [sPagina, setSPagina] = useState(1);

  const [auditItems, setAuditItems] = useState<AuditEntry[]>([]);
  const [auditFilter, setAuditFilter] = useState<AuditFilter>("all");

  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [nuevoUser, setNuevoUser] = useState("");
  const [nuevoPass, setNuevoPass] = useState("");
  const [nuevoPass2, setNuevoPass2] = useState("");
  const [nuevoRol, setNuevoRol] = useState<"operador" | "admin">("operador");
  const [userFiltro, setUserFiltro] = useState("");
  const [userPagina, setUserPagina] = useState(1);

  const notify = useCallback((kind: "ok" | "error", text: string) => setFlash({ kind, text }), []);

  const loadEmpleados = useCallback(async () => {
    setEmpleados(await apiGET<Empleado[]>("/empleados/"));
  }, []);

  const loadRadios = useCallback(async () => {
    setRadios(await apiGET<Radio[]>("/radios/"));
  }, []);

  const loadSaps = useCallback(async () => {
    setSaps(await apiGET<SapUsuario[]>("/sap-usuarios/"));
  }, []);

  const loadAudit = useCallback(
    async (silent = false) => {
      if (!silent) setLoadingAudit(true);
      try {
        setAuditItems(await apiGET<AuditEntry[]>(`${AUDIT_ENDPOINT}?limit=${AUDIT_LIMIT}`));
      } catch (error) {
        if (!silent) {
          notify("error", error instanceof Error ? error.message : "No se pudo cargar la auditoria.");
        }
        throw error;
      } finally {
        if (!silent) setLoadingAudit(false);
      }
    },
    [notify]
  );

  const loadAppUsers = useCallback(
    async (silent = false) => {
      if (!silent) setLoadingUsers(true);
      try {
        setAppUsers(await apiGET<AppUser[]>(APP_USERS_ENDPOINT));
      } catch (error) {
        if (!silent) {
          notify("error", error instanceof Error ? error.message : "No se pudieron cargar los usuarios.");
        }
        throw error;
      } finally {
        if (!silent) setLoadingUsers(false);
      }
    },
    [notify]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      const tasks: Array<[string, Promise<unknown>]> = [
        ["empleados", loadEmpleados()],
        ["radios", loadRadios()],
        ["usuarios SAP", loadSaps()],
        ["auditoria", loadAudit(true)],
        ["usuarios del sistema", loadAppUsers(true)],
      ];
      const settled = await Promise.allSettled(tasks.map(([, promise]) => promise));
      if (!mounted) return;
      const errors = settled
        .map((result, idx) => (result.status === "rejected" ? tasks[idx][0] : null))
        .filter(Boolean) as string[];
      if (errors.length) {
        notify("error", `Error cargando: ${errors.join(", ")}`);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [loadEmpleados, loadRadios, loadSaps, loadAudit, loadAppUsers, notify]);

  const runMutation = useCallback(
    async (fn: () => Promise<void>, success?: string) => {
      setBusy(true);
      try {
        await fn();
        if (success) notify("ok", success);
        return true;
      } catch (error) {
        notify("error", error instanceof Error ? error.message : "Ocurrio un error inesperado.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [notify]
  );

  async function crearEmpleado() {
    if (!eCedula.trim() || !eNombre.trim()) {
      notify("error", "Ingresa cedula y nombre.");
      return;
    }
    const ok = await runMutation(async () => {
      await apiPOST("/empleados/", { cedula: eCedula.trim(), nombre: eNombre.trim(), activo: true });
      await loadEmpleados();
      await loadAudit(true);
    }, "Empleado registrado.");
    if (ok) {
      setECedula("");
      setENombre("");
    }
  }

  const guardarEmpleado = useCallback(
    (cedula: string, payload: Partial<Empleado>) =>
      runMutation(async () => {
        await apiPATCH<Empleado>(`/empleados/${encodeURIComponent(cedula)}/`, payload);
        await loadEmpleados();
        await loadAudit(true);
      }, "Empleado actualizado."),
    [loadEmpleados, loadAudit, runMutation]
  );

  const eliminarEmpleado = useCallback(
    (cedula: string) =>
      runMutation(async () => {
        await apiDELETE(`/empleados/${encodeURIComponent(cedula)}/`);
        await loadEmpleados();
        await loadAudit(true);
      }, "Empleado eliminado."),
    [loadEmpleados, loadAudit, runMutation]
  );

  async function crearRadio() {
    if (!rCodigo.trim()) {
      notify("error", "Ingresa el codigo.");
      return;
    }
    const ok = await runMutation(async () => {
      await apiPOST("/radios/", { codigo: rCodigo.trim(), descripcion: rDesc.trim() || null, activo: true });
      await loadRadios();
      await loadAudit(true);
    }, "Radio registrado.");
    if (ok) {
      setRCodigo("");
      setRDesc("");
    }
  }

  const guardarRadio = useCallback(
    (codigo: string, payload: Partial<Radio>) =>
      runMutation(async () => {
        await apiPATCH<Radio>(`/radios/${encodeURIComponent(codigo)}/`, payload);
        await loadRadios();
        await loadAudit(true);
      }, "Radio actualizado."),
    [loadRadios, loadAudit, runMutation]
  );

  const eliminarRadio = useCallback(
    (codigo: string) =>
      runMutation(async () => {
        await apiDELETE(`/radios/${encodeURIComponent(codigo)}/`);
        await loadRadios();
        await loadAudit(true);
      }, "Radio eliminado."),
    [loadRadios, loadAudit, runMutation]
  );

  async function crearSap() {
    if (!sUser.trim()) {
      notify("error", "Ingresa el usuario SAP.");
      return;
    }
    const ok = await runMutation(async () => {
      await apiPOST("/sap-usuarios/", {
        username: sUser.trim(),
        empleado_cedula: sCedula.trim() || null,
        activo: true,
      });
      await loadSaps();
      await loadAudit(true);
    }, "Usuario SAP registrado.");
    if (ok) {
      setSUser("");
      setSCedula("");
    }
  }

  const guardarSap = useCallback(
    (username: string, payload: Partial<SapUsuario> & { empleado_cedula?: string | null }) =>
      runMutation(async () => {
        await apiPATCH<SapUsuario>(`/sap-usuarios/${encodeURIComponent(username)}/`, payload);
        await loadSaps();
        await loadAudit(true);
      }, "Usuario SAP actualizado."),
    [loadSaps, loadAudit, runMutation]
  );

  const eliminarSap = useCallback(
    (username: string) =>
      runMutation(async () => {
        await apiDELETE(`/sap-usuarios/${encodeURIComponent(username)}/`);
        await loadSaps();
        await loadAudit(true);
      }, "Usuario SAP eliminado."),
    [loadSaps, loadAudit, runMutation]
  );

  async function crearUsuarioSistema() {
    if (!nuevoUser.trim() || !nuevoPass) {
      notify("error", "Completa usuario y contrasena.");
      return;
    }
    if (nuevoPass !== nuevoPass2) {
      notify("error", "Las contrasenas no coinciden.");
      return;
    }
    const ok = await runMutation(async () => {
      await apiPOST(APP_USERS_ENDPOINT, {
        username: nuevoUser.trim(),
        password: nuevoPass,
        is_staff: nuevoRol === "admin",
      });
      await loadAppUsers(true);
    }, "Usuario creado.");
    if (ok) {
      setNuevoUser("");
      setNuevoPass("");
      setNuevoPass2("");
      setNuevoRol("operador");
    }
  }

  const actualizarUsuarioSistema = useCallback(
    (id: number, payload: Partial<AppUser> & { password?: string }) =>
      runMutation(async () => {
        await apiPATCH<AppUser>(`${APP_USERS_ENDPOINT}${id}/`, payload);
        await loadAppUsers(true);
      }, "Usuario actualizado."),
    [loadAppUsers, runMutation]
  );

  const eliminarUsuarioSistema = useCallback(
    (id: number) =>
      runMutation(async () => {
        await apiDELETE(`${APP_USERS_ENDPOINT}${id}/`);
        await loadAppUsers(true);
      }, "Usuario eliminado."),
    [loadAppUsers, runMutation]
  );

  const empleadosFiltrados = useMemo(() => {
    const q = eFiltro.trim().toLowerCase();
    if (!q) return empleados;
    return empleados.filter(
      (e) => e.cedula.toLowerCase().includes(q) || e.nombre.toLowerCase().includes(q)
    );
  }, [eFiltro, empleados]);

  const radiosFiltrados = useMemo(() => {
    const q = rFiltro.trim().toLowerCase();
    if (!q) return radios;
    return radios.filter(
      (r) => r.codigo.toLowerCase().includes(q) || (r.descripcion ?? "").toLowerCase().includes(q)
    );
  }, [rFiltro, radios]);

  const sapsFiltrados = useMemo(() => {
    const q = sFiltro.trim().toLowerCase();
    if (!q) return saps;
    return saps.filter((s) => {
      const cedula = ((s as unknown as { empleado_cedula?: string | null }).empleado_cedula ?? "").toLowerCase();
      return s.username.toLowerCase().includes(q) || cedula.includes(q);
    });
  }, [sFiltro, saps]);

  const usuariosFiltrados = useMemo(() => {
    const q = userFiltro.trim().toLowerCase();
    if (!q) return appUsers;
    return appUsers.filter((u) => u.username.toLowerCase().includes(q));
  }, [appUsers, userFiltro]);

  const empleadosTotal = Math.max(1, Math.ceil(empleadosFiltrados.length / ITEMS_PER_PAGE));
  const radiosTotal = Math.max(1, Math.ceil(radiosFiltrados.length / ITEMS_PER_PAGE));
  const sapsTotal = Math.max(1, Math.ceil(sapsFiltrados.length / ITEMS_PER_PAGE));
  const usuariosTotal = Math.max(1, Math.ceil(usuariosFiltrados.length / ITEMS_PER_PAGE));

  const empleadosPaginaData = useMemo(() => {
    const start = (ePagina - 1) * ITEMS_PER_PAGE;
    return empleadosFiltrados.slice(start, start + ITEMS_PER_PAGE);
  }, [ePagina, empleadosFiltrados]);

  const radiosPaginaData = useMemo(() => {
    const start = (rPagina - 1) * ITEMS_PER_PAGE;
    return radiosFiltrados.slice(start, start + ITEMS_PER_PAGE);
  }, [rPagina, radiosFiltrados]);

  const sapsPaginaData = useMemo(() => {
    const start = (sPagina - 1) * ITEMS_PER_PAGE;
    return sapsFiltrados.slice(start, start + ITEMS_PER_PAGE);
  }, [sPagina, sapsFiltrados]);

  const usuariosPaginaData = useMemo(() => {
    const start = (userPagina - 1) * ITEMS_PER_PAGE;
    return usuariosFiltrados.slice(start, start + ITEMS_PER_PAGE);
  }, [userPagina, usuariosFiltrados]);

  useEffect(() => setEPagina(1), [eFiltro, empleadosFiltrados.length]);
  useEffect(() => setRPagina(1), [rFiltro, radiosFiltrados.length]);
  useEffect(() => setSPagina(1), [sFiltro, sapsFiltrados.length]);
  useEffect(() => setUserPagina(1), [userFiltro, usuariosFiltrados.length]);

  const auditFiltrada = useMemo(() => {
    if (auditFilter === "all") return auditItems;
    return auditItems.filter((item) => item.aggregate === auditFilter);
  }, [auditFilter, auditItems]);

  return (
    <>
      <main className="min-h-screen pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Panel de administracion</h1>
              <p className="text-sm muted">
                Gestiona catalogos, auditoria y usuarios del software en un solo lugar.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {MAIN_TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={buttonClass(mainTab === tab.key ? "primary" : "outline", "sm")}
                  onClick={() => setMainTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </header>

          {flash && (
            <div
              className="card px-4 py-3 text-sm"
              style={
                flash.kind === "ok"
                  ? { background: "color-mix(in oklab, #22c55e 18%, var(--surface))", color: "#0b3219" }
                  : { background: "color-mix(in oklab, #ef4444 20%, var(--surface))", color: "#451010" }
              }
            >
              <div className="flex items-start justify-between gap-4">
                <span>{flash.text}</span>
                <button className={`${buttonClass("outline", "sm")} uppercase tracking-wide`} onClick={() => setFlash(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          )}

          {mainTab === "catalogos" && (
            <section className="card p-6 space-y-5">
              <div className="flex flex-wrap gap-2">
                {CATALOG_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    className={buttonClass(catalogTab === tab.key ? "primary" : "outline", "sm")}
                    onClick={() => setCatalogTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {catalogTab === "empleados" && (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,260px)_1fr]">
                  <div className="card p-4 space-y-3">
                    <h2 className="text-sm font-semibold">Nuevo empleado</h2>
                    <input className="input" placeholder="Cedula" value={eCedula} onChange={(e) => setECedula(e.target.value)} />
                    <input className="input" placeholder="Nombre completo" value={eNombre} onChange={(e) => setENombre(e.target.value)} />
                    <button className={`${buttonClass("primary")} w-full`} disabled={busy} onClick={crearEmpleado}>
                      Guardar
                    </button>
                  </div>
                  <div className="card p-4 space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <span className="text-sm muted">{empleados.length} registros</span>
                      <input className="input md:max-w-xs" placeholder="Buscar..." value={eFiltro} onChange={(e) => setEFiltro(e.target.value)} />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Cedula</th>
                            <th>Nombre</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {empleadosPaginaData.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="table-cell text-center text-sm muted">
                                Sin registros
                              </td>
                            </tr>
                          ) : (
                            empleadosPaginaData.map((item) => (
                              <EmpleadoRow
                                key={item.cedula}
                                item={item}
                                disabled={busy}
                                onSave={guardarEmpleado}
                                onDelete={eliminarEmpleado}
                              />
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <Pagination page={ePagina} totalPages={empleadosTotal} onChange={setEPagina} />
                  </div>
                </div>
              )}

              {catalogTab === "radios" && (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,260px)_1fr]">
                  <div className="card p-4 space-y-3">
                    <h2 className="text-sm font-semibold">Nuevo radio</h2>
                    <input className="input" placeholder="Codigo" value={rCodigo} onChange={(e) => setRCodigo(e.target.value)} />
                    <input className="input" placeholder="Descripcion (opcional)" value={rDesc} onChange={(e) => setRDesc(e.target.value)} />
                    <button className={`${buttonClass("primary")} w-full`} disabled={busy} onClick={crearRadio}>
                      Guardar
                    </button>
                  </div>
                  <div className="card p-4 space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <span className="text-sm muted">{radios.length} registros</span>
                      <input className="input md:max-w-xs" placeholder="Buscar..." value={rFiltro} onChange={(e) => setRFiltro(e.target.value)} />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Codigo</th>
                            <th>Descripcion</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {radiosPaginaData.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="table-cell text-center text-sm muted">
                                Sin registros
                              </td>
                            </tr>
                          ) : (
                            radiosPaginaData.map((item) => (
                              <RadioRow
                                key={item.codigo}
                                item={item}
                                disabled={busy}
                                onSave={guardarRadio}
                                onDelete={eliminarRadio}
                              />
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <Pagination page={rPagina} totalPages={radiosTotal} onChange={setRPagina} />
                  </div>
                </div>
              )}
              {catalogTab === "sap" && (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,260px)_1fr]">
                  <div className="card p-4 space-y-3">
                    <h2 className="text-sm font-semibold">Nuevo usuario SAP</h2>
                    <input className="input" placeholder="Usuario" value={sUser} onChange={(e) => setSUser(e.target.value)} />
                    <input className="input" placeholder="Cedula vinculada (opcional)" value={sCedula} onChange={(e) => setSCedula(e.target.value)} />
                    <button className={`${buttonClass("primary")} w-full`} disabled={busy} onClick={crearSap}>
                      Guardar
                    </button>
                  </div>
                  <div className="card p-4 space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <span className="text-sm muted">{saps.length} registros</span>
                      <input className="input md:max-w-xs" placeholder="Buscar..." value={sFiltro} onChange={(e) => setSFiltro(e.target.value)} />
                    </div>
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Usuario</th>
                            <th>Cedula asociada</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sapsPaginaData.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="table-cell text-center text-sm muted">
                                Sin registros
                              </td>
                            </tr>
                          ) : (
                            sapsPaginaData.map((item) => (
                              <SapRow
                                key={item.username}
                                item={item}
                                disabled={busy}
                                onSave={guardarSap}
                                onDelete={eliminarSap}
                              />
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <Pagination page={sPagina} totalPages={sapsTotal} onChange={setSPagina} />
                  </div>
                </div>
              )}
            </section>
          )}

          {mainTab === "auditoria" && (
            <section className="card p-6 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Registro de auditoria</h2>
                  <p className="text-sm muted">Consulta los ultimos cambios en los catalogos.</p>
                </div>
                <div className="flex gap-2">
                  <select className="input" value={auditFilter} onChange={(e) => setAuditFilter(e.target.value as AuditFilter)}>
                    {AUDIT_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button className={buttonClass("outline", "sm")} disabled={loadingAudit} onClick={() => loadAudit()}>
                    Refrescar
                  </button>
                </div>
              </div>
              <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
                {loadingAudit && <p className="text-sm muted">Cargando auditoria...</p>}
                {!loadingAudit && auditFiltrada.length === 0 && (
                  <p className="text-sm muted">Sin registros recientes.</p>
                )}
                {auditFiltrada.map((entry, idx) => (
                  <AuditItem key={entry.id ?? `${entry.aggregate}-${entry.at}-${idx}`} entry={entry} />
                ))}
              </div>
            </section>
          )}

          {mainTab === "usuarios" && (
            <section className="card p-6 space-y-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Usuarios del software</h2>
                  <p className="text-sm muted">
                    Crea operadores y administradores que puedan registrar prestamos.
                  </p>
                </div>
                <button className={buttonClass("outline", "sm")} disabled={loadingUsers} onClick={() => loadAppUsers()}>
                  Recargar
                </button>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,280px)_1fr]">
                <div className="card p-4 space-y-3">
                  <h3 className="text-sm font-semibold">Nuevo usuario</h3>
                  <input className="input" placeholder="Usuario" value={nuevoUser} onChange={(e) => setNuevoUser(e.target.value)} />
                  <input className="input" placeholder="Contrasena" type="password" value={nuevoPass} onChange={(e) => setNuevoPass(e.target.value)} />
                  <input className="input" placeholder="Confirmar contrasena" type="password" value={nuevoPass2} onChange={(e) => setNuevoPass2(e.target.value)} />
                  <select className="input" value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value as typeof nuevoRol)}>
                    <option value="operador">Operador: registra prestamos</option>
                    <option value="admin">Administrador: acceso completo</option>
                  </select>
                  <button className={`${buttonClass("primary")} w-full`} disabled={busy} onClick={crearUsuarioSistema}>
                    Guardar
                  </button>
                </div>
                <div className="card p-4 space-y-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <span className="text-sm muted">{appUsers.length} usuarios</span>
                    <input className="input md:max-w-xs" placeholder="Buscar..." value={userFiltro} onChange={(e) => setUserFiltro(e.target.value)} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Usuario</th>
                          <th>Rol</th>
                          <th>Ultimo acceso</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usuariosPaginaData.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="table-cell text-center text-sm muted">
                              Sin usuarios
                            </td>
                          </tr>
                        ) : (
                          usuariosPaginaData.map((user) => (
                            <AppUserRow
                              key={user.id}
                              user={user}
                              disabled={busy}
                              onSave={actualizarUsuarioSistema}
                              onDelete={eliminarUsuarioSistema}
                            />
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={userPagina} totalPages={usuariosTotal} onChange={setUserPagina} />
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
function EmpleadoRow({
  item,
  onSave,
  onDelete,
  disabled,
}: {
  item: Empleado;
  onSave: (cedula: string, payload: Partial<Empleado>) => Promise<boolean>;
  onDelete: (cedula: string) => Promise<boolean>;
  disabled: boolean;
}) {
  const [edit, setEdit] = useState(false);
  const [nombre, setNombre] = useState(item.nombre);
  const [activo, setActivo] = useState(item.activo);

  return (
    <tr className="table-row">
      <td className="table-cell font-medium">{item.cedula}</td>
      <td className="table-cell">
        {edit ? <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} /> : item.nombre}
      </td>
      <td className="table-cell">
        {edit ? (
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-brand" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            Activo
          </label>
        ) : (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={statusStyle(item.activo)}
          >
            {item.activo ? "Activo" : "Inactivo"}
          </span>
        )}
      </td>
      <td className="table-cell">
        <div className="flex flex-wrap gap-2">
          {edit ? (
            <>
              <button
                className={buttonClass("primary", "sm")}
                disabled={disabled}
                onClick={async () => {
                  const ok = await onSave(item.cedula, { nombre, activo });
                  if (ok) setEdit(false);
                }}
              >
                Guardar
              </button>
              <button
                className={buttonClass("outline", "sm")}
                onClick={() => {
                  setNombre(item.nombre);
                  setActivo(item.activo);
                  setEdit(false);
                }}
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button className={buttonClass("outline", "sm")} onClick={() => setEdit(true)}>
                Editar
              </button>
              <button
                className={buttonClass("outline", "sm")}
                disabled={disabled}
                onClick={async () => {
                  if (confirm(`Eliminar empleado ${item.nombre}?`)) {
                    await onDelete(item.cedula);
                  }
                }}
              >
                Eliminar
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function RadioRow({
  item,
  onSave,
  onDelete,
  disabled,
}: {
  item: Radio;
  onSave: (codigo: string, payload: Partial<Radio>) => Promise<boolean>;
  onDelete: (codigo: string) => Promise<boolean>;
  disabled: boolean;
}) {
  const [edit, setEdit] = useState(false);
  const [descripcion, setDescripcion] = useState(item.descripcion ?? "");
  const [activo, setActivo] = useState(item.activo);

  return (
    <tr className="table-row">
      <td className="table-cell font-medium">{item.codigo}</td>
      <td className="table-cell">
        {edit ? <input className="input" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /> : item.descripcion ?? "-"}
      </td>
      <td className="table-cell">
        {edit ? (
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-brand" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            Activo
          </label>
        ) : (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={statusStyle(item.activo)}
          >
            {item.activo ? "Activo" : "Inactivo"}
          </span>
        )}
      </td>
      <td className="table-cell">
        <div className="flex flex-wrap gap-2">
          {edit ? (
            <>
              <button
                className={buttonClass("primary", "sm")}
                disabled={disabled}
                onClick={async () => {
                  const ok = await onSave(item.codigo, { descripcion: descripcion.trim() || null, activo });
                  if (ok) setEdit(false);
                }}
              >
                Guardar
              </button>
              <button
                className={buttonClass("outline", "sm")}
                onClick={() => {
                  setDescripcion(item.descripcion ?? "");
                  setActivo(item.activo);
                  setEdit(false);
                }}
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button className={buttonClass("outline", "sm")} onClick={() => setEdit(true)}>
                Editar
              </button>
              <button
                className={buttonClass("outline", "sm")}
                disabled={disabled}
                onClick={async () => {
                  if (confirm(`Eliminar radio ${item.codigo}?`)) {
                    await onDelete(item.codigo);
                  }
                }}
              >
                Eliminar
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function SapRow({
  item,
  onSave,
  onDelete,
  disabled,
}: {
  item: SapUsuario;
  onSave: (username: string, payload: Partial<SapUsuario> & { empleado_cedula?: string | null }) => Promise<boolean>;
  onDelete: (username: string) => Promise<boolean>;
  disabled: boolean;
}) {
  const [edit, setEdit] = useState(false);
  const baseCedula = (item as unknown as { empleado_cedula?: string | null }).empleado_cedula ?? "";
  const [cedula, setCedula] = useState(baseCedula);
  const [activo, setActivo] = useState(item.activo);

  return (
    <tr className="table-row">
      <td className="table-cell font-medium">{item.username}</td>
      <td className="table-cell">
        {edit ? <input className="input" value={cedula} onChange={(e) => setCedula(e.target.value)} /> : baseCedula || "-"}
      </td>
      <td className="table-cell">
        {edit ? (
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-brand" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            Activo
          </label>
        ) : (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={statusStyle(item.activo)}
          >
            {item.activo ? "Activo" : "Inactivo"}
          </span>
        )}
      </td>
      <td className="table-cell">
        <div className="flex flex-wrap gap-2">
          {edit ? (
            <>
              <button
                className={buttonClass("primary", "sm")}
                disabled={disabled}
                onClick={async () => {
                  const ok = await onSave(item.username, { empleado_cedula: cedula.trim() || null, activo });
                  if (ok) setEdit(false);
                }}
              >
                Guardar
              </button>
              <button
                className={buttonClass("outline", "sm")}
                onClick={() => {
                  setCedula(baseCedula);
                  setActivo(item.activo);
                  setEdit(false);
                }}
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button className={buttonClass("outline", "sm")} onClick={() => setEdit(true)}>
                Editar
              </button>
              <button
                className={buttonClass("outline", "sm")}
                disabled={disabled}
                onClick={async () => {
                  if (confirm(`Eliminar usuario SAP ${item.username}?`)) {
                    await onDelete(item.username);
                  }
                }}
              >
                Eliminar
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function AppUserRow({
  user,
  onSave,
  onDelete,
  disabled,
}: {
  user: AppUser;
  onSave: (id: number, payload: Partial<AppUser> & { password?: string }) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  disabled: boolean;
}) {
  const [edit, setEdit] = useState(false);
  const [activo, setActivo] = useState(user.is_active);
  const [admin, setAdmin] = useState(user.is_staff || user.is_superuser || false);
  const [password, setPassword] = useState("");

  return (
    <tr className="table-row">
      <td className="table-cell font-medium">{user.username}</td>
      <td className="table-cell">
        {edit ? (
          <select className="input" value={admin ? "admin" : "operador"} onChange={(e) => setAdmin(e.target.value === "admin")}>
            <option value="operador">Operador</option>
            <option value="admin">Administrador</option>
          </select>
        ) : admin || user.is_staff || user.is_superuser ? (
          "Administrador"
        ) : (
          "Operador"
        )}
      </td>
      <td className="table-cell text-sm muted">{formatDate(user.last_login)}</td>
      <td className="table-cell">
        {edit ? (
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-brand" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
            Activo
          </label>
        ) : (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={statusStyle(user.is_active)}
          >
            {user.is_active ? "Activo" : "Inactivo"}
          </span>
        )}
      </td>
      <td className="table-cell">
        <div className="flex flex-wrap gap-2">
          {edit ? (
            <>
              <input
                className="input input-sm"
                type="password"
                placeholder="Contrasena (opcional)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className={buttonClass("primary", "sm")}
                disabled={disabled}
                onClick={async () => {
                  const payload: Partial<AppUser> & { password?: string } = { is_active: activo, is_staff: admin };
                  if (password.trim()) payload.password = password;
                  const ok = await onSave(user.id, payload);
                  if (ok) {
                    setPassword("");
                    setEdit(false);
                  }
                }}
              >
                Guardar
              </button>
              <button
                className={buttonClass("outline", "sm")}
                onClick={() => {
                  setActivo(user.is_active);
                  setAdmin(user.is_staff || user.is_superuser || false);
                  setPassword("");
                  setEdit(false);
                }}
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button className={buttonClass("outline", "sm")} onClick={() => setEdit(true)}>
                Editar
              </button>
              <button
                className={buttonClass("outline", "sm")}
                disabled={disabled}
                onClick={async () => {
                  if (confirm(`Eliminar usuario ${user.username}?`)) {
                    await onDelete(user.id);
                  }
                }}
              >
                Eliminar
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function AuditItem({ entry }: { entry: AuditEntry }) {
  const actionLabel = ACTION_LABELS[entry.action] ?? entry.action;
  const palette = ACTION_COLORS[entry.action] ?? {
    bg: "color-mix(in oklab, var(--ring) 20%, transparent)",
    color: "var(--fg)",
  };
  const aggregateLabel = AGGREGATE_LABELS[entry.aggregate] ?? entry.aggregate;
  const actorName = (entry as unknown as { actor_username?: string | null }).actor_username ?? null;

  return (
    <article className="card space-y-2 text-sm p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: palette.bg, color: palette.color }}
          >
            {actionLabel}
          </span>
          <span className="font-medium">{aggregateLabel}</span>
        </div>
        <time className="text-xs muted">{formatDate(entry.at)}</time>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs muted">
        <span className="font-mono">{entry.id_ref}</span>
        <span>|</span>
        <span>Usuario #{entry.actor_user_id}</span>
        {actorName && (
          <>
            <span>|</span>
            <span className="font-medium">{actorName}</span>
          </>
        )}
      </div>
      <p className="text-sm muted">
        {diffSummary(
          (entry.before ?? null) as Record<string, unknown> | null,
          (entry.after ?? null) as Record<string, unknown> | null,
          entry.action
        ) || "Sin detalles adicionales."}
      </p>
      {entry.reason && <p className="text-xs italic muted">Motivo: {entry.reason}</p>}
    </article>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const buttons: Array<number | "ellipsis"> = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
      buttons.push(i);
    } else if (
      (i === page - 2 && page > 3) ||
      (i === page + 2 && page < totalPages - 2)
    ) {
      buttons.push("ellipsis");
    }
  }
  return (
    <div className="flex flex-wrap items-center justify-end gap-1 pt-2">
      <button className={buttonClass("outline", "sm")} onClick={() => onChange(page - 1)} disabled={page === 1}>
        Anterior
      </button>
      {buttons.map((value, idx) =>
        value === "ellipsis" ? (
          <span key={`ellipsis-${idx}`} className="px-1 muted">
            ...
          </span>
        ) : (
          <button
            key={value}
            className={buttonClass(page === value ? "primary" : "outline", "sm")}
            onClick={() => onChange(value)}
            disabled={page === value}
          >
            {value}
          </button>
        )
      )}
      <button className={buttonClass("outline", "sm")} onClick={() => onChange(page + 1)} disabled={page === totalPages}>
        Siguiente
      </button>
    </div>
  );
}




