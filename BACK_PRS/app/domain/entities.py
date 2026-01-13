"""Entidades de negocio para el dominio de radiofrecuencias."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from .value_objects import Turno, EstadoPrestamo


@dataclass(frozen=True)
class Empleado:
    """Representa un colaborador del catalogo maestro."""

    id: Optional[int]
    cedula: str
    nombre: str
    activo: bool = True


@dataclass(frozen=True)
class RadioFrecuencia:
    """Equipo de radio frecuencia disponible para prestar."""

    id: Optional[int]
    codigo: str
    descripcion: Optional[str] = None
    activo: bool = True


@dataclass(frozen=True)
class SapUsuario:
    """Usuario de SAP asociado (opcionalmente) a un empleado."""

    id: Optional[int]
    username: str
    empleado_id: Optional[int] = None
    empleado_cedula: Optional[str] = None
    activo: bool = True


@dataclass(frozen=True)
class Prestamo:
    """Transaccion de prestamo de un radio frecuencia."""

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
