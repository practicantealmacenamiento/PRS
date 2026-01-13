"""DTOs y casos de uso expuestos por la capa de aplicacion."""

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
    """DTO para solicitar la creacion de un prestamo de radio."""
    cedula: str
    codigo_radio: str
    usuario_sap: str
    usuario_registra_id: int
    ahora: datetime

@dataclass(frozen=True)
class DevolverPorRadioCmd:
    """DTO para devolver un prestamo usando el codigo de radio."""
    codigo_radio: str
    ahora: datetime

@dataclass(frozen=True)
class DevolverPorCedulaCmd:
    """DTO para devolver usando la cedula del empleado."""
    cedula: str
    ahora: datetime

@dataclass(frozen=True)
class DevolverPorUsuarioSapCmd:
    """DTO para devolver usando el usuario de SAP."""
    usuario_sap: str
    ahora: datetime


# -------- Use Cases: thin wrappers sobre Services --------

class PrestamoUseCases:
    """Facade del dominio para exponer comandos de prestamos hacia interfaces."""
    def __init__(self, service: PrestamosService) -> None:
        self.svc = service

    def asignar(self, cmd: AsignarPrestamoCmd) -> Prestamo:
        """Dispara PrestamosService.asignar usando el DTO tipado."""
        return self.svc.asignar(
            cedula=cmd.cedula,
            codigo_radio=cmd.codigo_radio,
            usuario_sap=cmd.usuario_sap,
            usuario_registra_id=cmd.usuario_registra_id,
            ahora=cmd.ahora,
        )

    def devolver_por_radio(self, cmd: DevolverPorRadioCmd) -> Prestamo:
        """Enruta la devolucion por codigo de radio."""
        return self.svc.devolver_por_radio(codigo_radio=cmd.codigo_radio, ahora=cmd.ahora)

    def devolver_por_cedula(self, cmd: DevolverPorCedulaCmd) -> Prestamo:
        """Enruta la devolucion usando la cedula."""
        return self.svc.devolver_por_cedula(cedula=cmd.cedula, ahora=cmd.ahora)

    def devolver_por_usuario_sap(self, cmd: DevolverPorUsuarioSapCmd) -> Prestamo:
        """Enruta la devolucion usando el usuario SAP."""
        return self.svc.devolver_por_usuario_sap(usuario_sap=cmd.usuario_sap, ahora=cmd.ahora)


# -------- Use Cases de Catálogos --------

@dataclass(frozen=True)
class CrearEmpleadoCmd:
    """DTO para crear un registro en el catalogo de empleados."""
    cedula: str
    nombre: str
    activo: bool
    actor_user_id: int
    reason: Optional[str] = None

@dataclass(frozen=True)
class ActualizarEmpleadoCmd:
    """DTO para actualizar campos de un empleado."""
    cedula: str
    cambios: Dict[str, Any]
    actor_user_id: int
    reason: Optional[str] = None

@dataclass(frozen=True)
class EliminarEmpleadoCmd:
    """DTO para eliminar un empleado existente."""
    cedula: str
    actor_user_id: int
    reason: Optional[str] = None


@dataclass(frozen=True)
class CrearRadioCmd:
    """DTO para dar de alta una radio de frecuencia."""
    codigo: str
    descripcion: Optional[str]
    activo: bool
    actor_user_id: int
    reason: Optional[str] = None

@dataclass(frozen=True)
class ActualizarRadioCmd:
    """DTO para modificar atributos de una radio."""
    codigo: str
    cambios: Dict[str, Any]
    actor_user_id: int
    reason: Optional[str] = None

@dataclass(frozen=True)
class EliminarRadioCmd:
    """DTO para eliminar una radio del catalogo."""
    codigo: str
    actor_user_id: int
    reason: Optional[str] = None


@dataclass(frozen=True)
class CrearSapUsuarioCmd:
    """DTO para crear un usuario SAP y vincularlo opcionalmente a un empleado."""
    username: str
    empleado_cedula: Optional[str]
    activo: bool
    actor_user_id: int
    reason: Optional[str] = None

@dataclass(frozen=True)
class ActualizarSapUsuarioCmd:
    """DTO para actualizar los datos de un usuario SAP."""
    username: str
    cambios: Dict[str, Any]
    actor_user_id: int
    reason: Optional[str] = None

@dataclass(frozen=True)
class EliminarSapUsuarioCmd:
    """DTO para eliminar un usuario SAP del catalogo."""
    username: str
    actor_user_id: int
    reason: Optional[str] = None


class CatalogosUseCases:
    """Expone operaciones CRUD de catalogos con DTOs expresivos."""
    def __init__(self, service: CatalogosService) -> None:
        self.svc = service

    def crear_empleado(self, cmd: CrearEmpleadoCmd) -> Empleado:
        """Crea un empleado en el catalogo maestro."""
        return self.svc.crear_empleado(**cmd.__dict__)

    def actualizar_empleado(self, cmd: ActualizarEmpleadoCmd) -> Empleado:
        """Actualiza los campos permitidos de un empleado."""
        return self.svc.actualizar_empleado(**cmd.__dict__)

    def eliminar_empleado(self, cmd: EliminarEmpleadoCmd) -> None:
        """Elimina un empleado existente."""
        return self.svc.eliminar_empleado(**cmd.__dict__)

    def crear_radio(self, cmd: CrearRadioCmd) -> RadioFrecuencia:
        """Crea una nueva radio."""
        return self.svc.crear_radio(**cmd.__dict__)

    def actualizar_radio(self, cmd: ActualizarRadioCmd) -> RadioFrecuencia:
        """Actualiza una radio existente."""
        return self.svc.actualizar_radio(**cmd.__dict__)

    def eliminar_radio(self, cmd: EliminarRadioCmd) -> None:
        """Elimina una radio del catalogo."""
        return self.svc.eliminar_radio(**cmd.__dict__)

    def crear_sap_usuario(self, cmd: CrearSapUsuarioCmd) -> SapUsuario:
        """Crea un usuario SAP."""
        return self.svc.crear_sap_usuario(**cmd.__dict__)

    def actualizar_sap_usuario(self, cmd: ActualizarSapUsuarioCmd) -> SapUsuario:
        """Actualiza un usuario SAP."""
        return self.svc.actualizar_sap_usuario(**cmd.__dict__)

    def eliminar_sap_usuario(self, cmd: EliminarSapUsuarioCmd) -> None:
        """Elimina un usuario SAP."""
        return self.svc.eliminar_sap_usuario(**cmd.__dict__)
