from __future__ import annotations
from dataclasses import dataclass, replace
from datetime import datetime
from typing import Optional
from .value_objects import Turno, EstadoPrestamo

@dataclass(frozen=True)
class Empleado:
    id: Optional[int]
    cedula: str
    nombre: str
    activo: bool = True

@dataclass(frozen=True)
class RadioFrecuencia:
    id: Optional[int]
    codigo: str
    descripcion: Optional[str] = None
    activo: bool = True

@dataclass(frozen=True)
class SapUsuario:
    id: Optional[int]
    username: str
    empleado_id: Optional[int] = None
    empleado_cedula: Optional[str] = None
    activo: bool = True

@dataclass(frozen=True)
class Prestamo:
    id: Optional[int]
    cedula: str
    empleado_nombre: str
    usuario_sap: str
    codigo_radio: str
    fecha_hora_prestamo: datetime
    turno: Turno
    estado: EstadoPrestamo
    usuario_registra_id: int
    fecha_hora_devolucion: Optional[datetime] = None
    # Campo de conveniencia: lo inyecta infraestructura para evitar query en serializers
    usuario_registra_username: Optional[str] = None

    # --- Reglas intrínsecas del agregado (sin repos/ORM) ---
    def puede_devolver(self) -> bool:
        return self.estado == EstadoPrestamo.ASIGNADO and self.fecha_hora_devolucion is None

    def devolver(self, *, ahora: datetime) -> "Prestamo":
        if not self.puede_devolver():
            return self
        return replace(self, estado=EstadoPrestamo.DEVUELTO, fecha_hora_devolucion=ahora)
