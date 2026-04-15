"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiDELETE, apiGET, apiPATCH, apiPOST } from "@/lib/api";
import type { Empleado, Radio, SapUsuario } from "@/lib/types";
import {
  ITEMS_PER_PAGE,
  buttonClass,
  statusStyle,
  type NotifyFn,
} from "./shared";
import { useBusyMutation } from "./useBusyMutation";
import { Pagination } from "./Pagination";

type CatalogTab = "empleados" | "radios" | "sap";

const CATALOG_TABS: Array<{ key: CatalogTab; label: string }> = [
  { key: "empleados", label: "Empleados" },
  { key: "radios", label: "Radios" },
  { key: "sap", label: "Usuarios SAP" },
];

type CatalogSectionProps = {
  notify: NotifyFn;
  onCatalogMutated?: () => Promise<unknown> | unknown;
};

export function CatalogSection({ notify, onCatalogMutated }: CatalogSectionProps) {
  const [tab, setTab] = useState<CatalogTab>("empleados");

  const empleados = useEmpleadosCatalog(notify, onCatalogMutated, tab === "empleados");
  const radios = useRadiosCatalog(notify, onCatalogMutated, tab === "radios");
  const saps = useSapCatalog(notify, onCatalogMutated, tab === "sap");

  return (
    <section className="card p-6 space-y-5">
      <div className="flex flex-wrap gap-2">
        {CATALOG_TABS.map((catalogTab) => (
          <button
            key={catalogTab.key}
            className={buttonClass(tab === catalogTab.key ? "primary" : "outline", "sm")}
            onClick={() => setTab(catalogTab.key)}
          >
            {catalogTab.label}
          </button>
        ))}
      </div>

      {tab === "empleados" && <EmployeesCatalog {...empleados} />}
      {tab === "radios" && <RadiosCatalog {...radios} />}
      {tab === "sap" && <SapCatalog {...saps} />}
    </section>
  );
}

const EMPLEADOS_ENDPOINT = "/empleados/";
const RADIOS_ENDPOINT = "/radios/";
const SAP_ENDPOINT = "/sap-usuarios/";

function useEmpleadosCatalog(notify: NotifyFn, onCatalogMutated?: () => Promise<unknown> | unknown, enabled = false) {
  const { busy, runMutation } = useBusyMutation(notify);
  const [items, setItems] = useState<Empleado[]>([]);
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    const data = await apiGET<Empleado[]>(EMPLEADOS_ENDPOINT);
    setItems(data);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load().catch((error) => {
      const message =
        error instanceof Error ? error.message : "No se pudieron cargar los empleados.";
      notify("error", message);
    });
  }, [enabled, load, notify]);

  const filtered = useMemo(() => {
    const value = filter.trim().toLowerCase();
    if (!value) return items;
    return items.filter(
      (item) => item.cedula.toLowerCase().includes(value) || item.nombre.toLowerCase().includes(value)
    );
  }, [filter, items]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE)),
    [filtered.length]
  );

  const pageItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [filter, filtered.length]);

  const create = useCallback(async () => {
    if (!cedula.trim() || !nombre.trim()) {
      notify("error", "Ingresa cedula y nombre.");
      return;
    }
    const ok = await runMutation(async () => {
      await apiPOST(EMPLEADOS_ENDPOINT, {
        cedula: cedula.trim(),
        nombre: nombre.trim(),
        activo: true,
      });
      await load();
    }, "Empleado registrado.");

    if (ok) {
      setCedula("");
      setNombre("");
      if (onCatalogMutated) void onCatalogMutated();
    }
  }, [cedula, nombre, runMutation, notify, load, onCatalogMutated]);

  const update = useCallback(
    (id: string, payload: Partial<Empleado>) =>
      runMutation(async () => {
        await apiPATCH<Empleado>(`${EMPLEADOS_ENDPOINT}${encodeURIComponent(id)}/`, payload);
        await load();
      }, "Empleado actualizado.").then((ok) => {
        if (ok && onCatalogMutated) void onCatalogMutated();
        return ok;
      }),
    [runMutation, load, onCatalogMutated]
  );

  const remove = useCallback(
    (id: string) =>
      runMutation(async () => {
        await apiDELETE(`${EMPLEADOS_ENDPOINT}${encodeURIComponent(id)}/`);
        await load();
      }, "Empleado eliminado.").then((ok) => {
        if (ok && onCatalogMutated) void onCatalogMutated();
        return ok;
      }),
    [runMutation, load, onCatalogMutated]
  );

  return {
    busy,
    items,
    filter,
    setFilter,
    page,
    setPage,
    totalPages,
    pageItems,
    totalCount: items.length,
    create,
    update,
    remove,
    cedula,
    setCedula,
    nombre,
    setNombre,
  };
}

function useRadiosCatalog(notify: NotifyFn, onCatalogMutated?: () => Promise<unknown> | unknown, enabled = false) {
  const { busy, runMutation } = useBusyMutation(notify);
  const [items, setItems] = useState<Radio[]>([]);
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    const data = await apiGET<Radio[]>(RADIOS_ENDPOINT);
    setItems(data);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load().catch((error) => {
      const message = error instanceof Error ? error.message : "No se pudieron cargar los radios.";
      notify("error", message);
    });
  }, [enabled, load, notify]);

  const filtered = useMemo(() => {
    const value = filter.trim().toLowerCase();
    if (!value) return items;
    return items.filter(
      (item) =>
        item.codigo.toLowerCase().includes(value) ||
        (item.descripcion ?? "").toLowerCase().includes(value)
    );
  }, [filter, items]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE)),
    [filtered.length]
  );

  const pageItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [filter, filtered.length]);

  const create = useCallback(async () => {
    if (!codigo.trim()) {
      notify("error", "Ingresa el codigo.");
      return;
    }
    const ok = await runMutation(async () => {
      await apiPOST(RADIOS_ENDPOINT, {
        codigo: codigo.trim(),
        descripcion: descripcion.trim() || null,
        activo: true,
      });
      await load();
    }, "Radio registrado.");

    if (ok) {
      setCodigo("");
      setDescripcion("");
      if (onCatalogMutated) void onCatalogMutated();
    }
  }, [codigo, descripcion, runMutation, notify, load, onCatalogMutated]);

  const update = useCallback(
    (id: string, payload: Partial<Radio>) =>
      runMutation(async () => {
        await apiPATCH<Radio>(`${RADIOS_ENDPOINT}${encodeURIComponent(id)}/`, payload);
        await load();
      }, "Radio actualizado.").then((ok) => {
        if (ok && onCatalogMutated) void onCatalogMutated();
        return ok;
      }),
    [runMutation, load, onCatalogMutated]
  );

  const remove = useCallback(
    (id: string) =>
      runMutation(async () => {
        await apiDELETE(`${RADIOS_ENDPOINT}${encodeURIComponent(id)}/`);
        await load();
      }, "Radio eliminado.").then((ok) => {
        if (ok && onCatalogMutated) void onCatalogMutated();
        return ok;
      }),
    [runMutation, load, onCatalogMutated]
  );

  return {
    busy,
    items,
    filter,
    setFilter,
    page,
    setPage,
    totalPages,
    pageItems,
    totalCount: items.length,
    create,
    update,
    remove,
    codigo,
    setCodigo,
    descripcion,
    setDescripcion,
  };
}

function useSapCatalog(notify: NotifyFn, onCatalogMutated?: () => Promise<unknown> | unknown, enabled = false) {
  const { busy, runMutation } = useBusyMutation(notify);
  const [items, setItems] = useState<SapUsuario[]>([]);
  const [username, setUsername] = useState("");
  const [cedula, setCedula] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    const data = await apiGET<SapUsuario[]>(SAP_ENDPOINT);
    setItems(data);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load().catch((error) => {
      const message =
        error instanceof Error ? error.message : "No se pudieron cargar los usuarios SAP.";
      notify("error", message);
    });
  }, [enabled, load, notify]);

  const filtered = useMemo(() => {
    const value = filter.trim().toLowerCase();
    if (!value) return items;
    return items.filter((item) => {
      const cedulaValue = (item as unknown as { empleado_cedula?: string | null }).empleado_cedula ?? "";
      return (
        item.username.toLowerCase().includes(value) ||
        cedulaValue.toLowerCase().includes(value)
      );
    });
  }, [filter, items]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE)),
    [filtered.length]
  );

  const pageItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [filter, filtered.length]);

  const create = useCallback(async () => {
    if (!username.trim()) {
      notify("error", "Ingresa el usuario SAP.");
      return;
    }
    const ok = await runMutation(async () => {
      await apiPOST(SAP_ENDPOINT, {
        username: username.trim(),
        empleado_cedula: cedula.trim() || null,
        activo: true,
      });
      await load();
    }, "Usuario SAP registrado.");

    if (ok) {
      setUsername("");
      setCedula("");
      if (onCatalogMutated) void onCatalogMutated();
    }
  }, [username, cedula, runMutation, notify, load, onCatalogMutated]);

  const update = useCallback(
    (id: string, payload: Partial<SapUsuario> & { empleado_cedula?: string | null }) =>
      runMutation(async () => {
        await apiPATCH<SapUsuario>(`${SAP_ENDPOINT}${encodeURIComponent(id)}/`, payload);
        await load();
      }, "Usuario SAP actualizado.").then((ok) => {
        if (ok && onCatalogMutated) void onCatalogMutated();
        return ok;
      }),
    [runMutation, load, onCatalogMutated]
  );

  const remove = useCallback(
    (id: string) =>
      runMutation(async () => {
        await apiDELETE(`${SAP_ENDPOINT}${encodeURIComponent(id)}/`);
        await load();
      }, "Usuario SAP eliminado.").then((ok) => {
        if (ok && onCatalogMutated) void onCatalogMutated();
        return ok;
      }),
    [runMutation, load, onCatalogMutated]
  );

  return {
    busy,
    items,
    filter,
    setFilter,
    page,
    setPage,
    totalPages,
    pageItems,
    totalCount: items.length,
    create,
    update,
    remove,
    username,
    setUsername,
    cedula,
    setCedula,
  };
}

type EmpleadosCatalogState = ReturnType<typeof useEmpleadosCatalog>;
type RadiosCatalogState = ReturnType<typeof useRadiosCatalog>;
type SapCatalogState = ReturnType<typeof useSapCatalog>;

function EmployeesCatalog({
  busy,
  totalCount,
  filter,
  setFilter,
  pageItems,
  page,
  setPage,
  totalPages,
  create,
  update,
  remove,
  cedula,
  setCedula,
  nombre,
  setNombre,
}: EmpleadosCatalogState) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,260px)_1fr]">
      <div className="card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Nuevo empleado</h2>
        <input
          className="input"
          placeholder="Cedula"
          value={cedula}
          onChange={(event) => setCedula(event.target.value)}
        />
        <input
          className="input"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
        />
        <button className={`${buttonClass("primary")} w-full`} disabled={busy} onClick={create}>
          Guardar
        </button>
      </div>
      <div className="card p-4 space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span className="text-sm muted">{totalCount} registros</span>
          <input
            className="input md:max-w-xs"
            placeholder="Buscar..."
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
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
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-cell text-center text-sm muted">
                    Sin registros
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => (
                  <EmpleadoRow
                    key={item.cedula}
                    item={item}
                    disabled={busy}
                    onSave={update}
                    onDelete={remove}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}

function RadiosCatalog({
  busy,
  totalCount,
  filter,
  setFilter,
  pageItems,
  page,
  setPage,
  totalPages,
  create,
  update,
  remove,
  codigo,
  setCodigo,
  descripcion,
  setDescripcion,
}: RadiosCatalogState) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,260px)_1fr]">
      <div className="card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Nuevo radio</h2>
        <input
          className="input"
          placeholder="Codigo"
          value={codigo}
          onChange={(event) => setCodigo(event.target.value)}
        />
        <input
          className="input"
          placeholder="Descripcion (opcional)"
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
        />
        <button className={`${buttonClass("primary")} w-full`} disabled={busy} onClick={create}>
          Guardar
        </button>
      </div>
      <div className="card p-4 space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span className="text-sm muted">{totalCount} registros</span>
          <input
            className="input md:max-w-xs"
            placeholder="Buscar..."
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
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
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-cell text-center text-sm muted">
                    Sin registros
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => (
                  <RadioRow key={item.codigo} item={item} disabled={busy} onSave={update} onDelete={remove} />
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}

function SapCatalog({
  busy,
  totalCount,
  filter,
  setFilter,
  pageItems,
  page,
  setPage,
  totalPages,
  create,
  update,
  remove,
  username,
  setUsername,
  cedula,
  setCedula,
}: SapCatalogState) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,260px)_1fr]">
      <div className="card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Nuevo usuario SAP</h2>
        <input
          className="input"
          placeholder="Usuario"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <input
          className="input"
          placeholder="Cedula vinculada (opcional)"
          value={cedula}
          onChange={(event) => setCedula(event.target.value)}
        />
        <button className={`${buttonClass("primary")} w-full`} disabled={busy} onClick={create}>
          Guardar
        </button>
      </div>
      <div className="card p-4 space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span className="text-sm muted">{totalCount} registros</span>
          <input
            className="input md:max-w-xs"
            placeholder="Buscar..."
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
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
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-cell text-center text-sm muted">
                    Sin registros
                  </td>
                </tr>
              ) : (
                pageItems.map((item) => (
                  <SapRow key={item.username} item={item} disabled={busy} onSave={update} onDelete={remove} />
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}

type EmpleadoRowProps = {
  item: Empleado;
  onSave: (cedula: string, payload: Partial<Empleado>) => Promise<boolean>;
  onDelete: (cedula: string) => Promise<boolean>;
  disabled: boolean;
};

function EmpleadoRow({ item, onSave, onDelete, disabled }: EmpleadoRowProps) {
  const [edit, setEdit] = useState(false);
  const [nombre, setNombre] = useState(item.nombre);
  const [active, setActive] = useState(item.activo);

  useEffect(() => {
    setNombre(item.nombre);
    setActive(item.activo);
  }, [item]);

  return (
    <tr className="table-row">
      <td className="table-cell font-medium">{item.cedula}</td>
      <td className="table-cell">
        {edit ? <input className="input" value={nombre} onChange={(event) => setNombre(event.target.value)} /> : item.nombre}
      </td>
      <td className="table-cell">
        {edit ? (
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-brand"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
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
                  const ok = await onSave(item.cedula, { nombre, activo: active });
                  if (ok) setEdit(false);
                }}
              >
                Guardar
              </button>
              <button
                className={buttonClass("outline", "sm")}
                onClick={() => {
                  setNombre(item.nombre);
                  setActive(item.activo);
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

type RadioRowProps = {
  item: Radio;
  onSave: (codigo: string, payload: Partial<Radio>) => Promise<boolean>;
  onDelete: (codigo: string) => Promise<boolean>;
  disabled: boolean;
};

function RadioRow({ item, onSave, onDelete, disabled }: RadioRowProps) {
  const [edit, setEdit] = useState(false);
  const [description, setDescription] = useState(item.descripcion ?? "");
  const [active, setActive] = useState(item.activo);

  useEffect(() => {
    setDescription(item.descripcion ?? "");
    setActive(item.activo);
  }, [item]);

  return (
    <tr className="table-row">
      <td className="table-cell font-medium">{item.codigo}</td>
      <td className="table-cell">
        {edit ? (
          <input className="input" value={description} onChange={(event) => setDescription(event.target.value)} />
        ) : (
          item.descripcion ?? "-"
        )}
      </td>
      <td className="table-cell">
        {edit ? (
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-brand"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
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
                  const ok = await onSave(item.codigo, {
                    descripcion: description.trim() || null,
                    activo: active,
                  });
                  if (ok) setEdit(false);
                }}
              >
                Guardar
              </button>
              <button
                className={buttonClass("outline", "sm")}
                onClick={() => {
                  setDescription(item.descripcion ?? "");
                  setActive(item.activo);
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

type SapRowProps = {
  item: SapUsuario;
  onSave: (username: string, payload: Partial<SapUsuario> & { empleado_cedula?: string | null }) => Promise<boolean>;
  onDelete: (username: string) => Promise<boolean>;
  disabled: boolean;
};

function SapRow({ item, onSave, onDelete, disabled }: SapRowProps) {
  const [edit, setEdit] = useState(false);
  const baseCedula = (item as unknown as { empleado_cedula?: string | null }).empleado_cedula ?? "";
  const [cedula, setCedula] = useState(baseCedula);
  const [active, setActive] = useState(item.activo);

  useEffect(() => {
    const cedulaValue = (item as unknown as { empleado_cedula?: string | null }).empleado_cedula ?? "";
    setCedula(cedulaValue);
    setActive(item.activo);
  }, [item]);

  return (
    <tr className="table-row">
      <td className="table-cell font-medium">{item.username}</td>
      <td className="table-cell">
        {edit ? (
          <input className="input" value={cedula} onChange={(event) => setCedula(event.target.value)} />
        ) : (
          baseCedula || "-"
        )}
      </td>
      <td className="table-cell">
        {edit ? (
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="accent-brand"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
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
                  const ok = await onSave(item.username, {
                    empleado_cedula: cedula.trim() || null,
                    activo: active,
                  });
                  if (ok) setEdit(false);
                }}
              >
                Guardar
              </button>
              <button
                className={buttonClass("outline", "sm")}
                onClick={() => {
                  setCedula(baseCedula);
                  setActive(item.activo);
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
