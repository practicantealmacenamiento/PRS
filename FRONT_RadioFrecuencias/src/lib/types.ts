export type PrestamoResp = {
  id: number;
  cedula: string;
  empleado_nombre: string;
  usuario_sap: string;
  codigo_radio: string;
  fecha_hora_prestamo: string;
  turno: string;
  estado: "ASIGNADO" | "DEVUELTO" | string;
  usuario_registra_id: number | null;
  usuario_registra_username: string | null;
  fecha_hora_devolucion: string | null;
};

export type Empleado = { cedula: string; nombre: string; activo: boolean };
export type Radio    = { codigo: string; descripcion: string | null; activo: boolean };
export type SapUsuario = {
  username: string;
  empleado_id: number | null;
  empleado_cedula?: string | null;
  activo: boolean;
};

export type AuditEntry = {
  id?: number;
  aggregate: string;
  action: string;
  id_ref: string;
  at: string;
  actor_user_id: number;
  actor_username?: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
};

export type AppUser = {
  id: number;
  username: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser?: boolean;
  last_login: string | null;
};
