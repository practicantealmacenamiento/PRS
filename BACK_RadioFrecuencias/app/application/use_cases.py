from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any

from .services import PrestamosService
from .catalogos_service import CatalogosService
from ..domain.entities import Prestamo, Empleado, RadioFrecuencia, SapUsuario


# -------- Commands / DTOs (simples) --------

@dataclass(frozen=True)
class AsignarPrestamoCmd:
    cedula: str
    codigo_radio: str
    usuario_sap: str
    usuario_registra_id: int
    ahora: datetime

@dataclass(frozen=True)
class DevolverPorRadioCmd:
    codigo_radio: str
    ahora: datetime

@dataclass(frozen=True)
class DevolverPorCedulaCmd:
    cedula: str
    ahora: datetime

@dataclass(frozen=True)
class DevolverPorUsuarioSapCmd:
    usuario_sap: str
    ahora: datetime


# -------- Use Cases: thin wrappers sobre Services --------

class PrestamoUseCases:
    def __init__(self, service: PrestamosService) -> None:
        self.svc = service

    def asignar(self, cmd: AsignarPrestamoCmd) -> Prestamo:
        return self.svc.asignar(
            cedula=cmd.cedula,
            codigo_radio=cmd.codigo_radio,
            usuario_sap=cmd.usuario_sap,
            usuario_registra_id=cmd.usuario_registra_id,
            ahora=cmd.ahora,
        )

    def devolver_por_radio(self, cmd: DevolverPorRadioCmd) -> Prestamo:
        return self.svc.devolver_por_radio(codigo_radio=cmd.codigo_radio, ahora=cmd.ahora)

    def devolver_por_cedula(self, cmd: DevolverPorCedulaCmd) -> Prestamo:
        return self.svc.devolver_por_cedula(cedula=cmd.cedula, ahora=cmd.ahora)

    def devolver_por_usuario_sap(self, cmd: DevolverPorUsuarioSapCmd) -> Prestamo:
        return self.svc.devolver_por_usuario_sap(usuario_sap=cmd.usuario_sap, ahora=cmd.ahora)


# -------- Use Cases de Catálogos --------

@dataclass(frozen=True)
class CrearEmpleadoCmd:
    cedula: str
    nombre: str
    activo: bool
    actor_user_id: int
    reason: Optional[str] = None

@dataclass(frozen=True)
class ActualizarEmpleadoCmd:
    cedula: str
    cambios: Dict[str, Any]
    actor_user_id: int
    reason: Optional[str] = None

@dataclass(frozen=True)
class EliminarEmpleadoCmd:
    cedula: str
    actor_user_id: int
    reason: Optional[str] = None


@dataclass(frozen=True)
class CrearRadioCmd:
    codigo: str
    descripcion: Optional[str]
    activo: bool
    actor_user_id: int
    reason: Optional[str] = None

@dataclass(frozen=True)
class ActualizarRadioCmd:
    codigo: str
    cambios: Dict[str, Any]
    actor_user_id: int
    reason: Optional[str] = None

@dataclass(frozen=True)
class EliminarRadioCmd:
    codigo: str
    actor_user_id: int
    reason: Optional[str] = None


@dataclass(frozen=True)
class CrearSapUsuarioCmd:
    username: str
    empleado_cedula: Optional[str]
    activo: bool
    actor_user_id: int
    reason: Optional[str] = None

@dataclass(frozen=True)
class ActualizarSapUsuarioCmd:
    username: str
    cambios: Dict[str, Any]
    actor_user_id: int
    reason: Optional[str] = None

@dataclass(frozen=True)
class EliminarSapUsuarioCmd:
    username: str
    actor_user_id: int
    reason: Optional[str] = None


class CatalogosUseCases:
    def __init__(self, service: CatalogosService) -> None:
        self.svc = service

    def crear_empleado(self, cmd: CrearEmpleadoCmd) -> Empleado:
        return self.svc.crear_empleado(**cmd.__dict__)

    def actualizar_empleado(self, cmd: ActualizarEmpleadoCmd) -> Empleado:
        return self.svc.actualizar_empleado(**cmd.__dict__)

    def eliminar_empleado(self, cmd: EliminarEmpleadoCmd) -> None:
        return self.svc.eliminar_empleado(**cmd.__dict__)

    def crear_radio(self, cmd: CrearRadioCmd) -> RadioFrecuencia:
        return self.svc.crear_radio(**cmd.__dict__)

    def actualizar_radio(self, cmd: ActualizarRadioCmd) -> RadioFrecuencia:
        return self.svc.actualizar_radio(**cmd.__dict__)

    def eliminar_radio(self, cmd: EliminarRadioCmd) -> None:
        return self.svc.eliminar_radio(**cmd.__dict__)

    def crear_sap_usuario(self, cmd: CrearSapUsuarioCmd) -> SapUsuario:
        return self.svc.crear_sap_usuario(**cmd.__dict__)

    def actualizar_sap_usuario(self, cmd: ActualizarSapUsuarioCmd) -> SapUsuario:
        return self.svc.actualizar_sap_usuario(**cmd.__dict__)

    def eliminar_sap_usuario(self, cmd: EliminarSapUsuarioCmd) -> None:
        return self.svc.eliminar_sap_usuario(**cmd.__dict__)
