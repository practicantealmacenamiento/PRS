from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, Optional, ContextManager
from contextlib import nullcontext

from ..domain.errors import EntityNotFound, BusinessRuleViolation
from ..domain.events import AdminChangeEvent
from ..domain.ports.repositories import (
    EmpleadoRepository,
    RadioRepository,
    SapUsuarioRepository,
)
from ..domain.ports.audit import AuditLogRepository
from ..domain.ports.uow import UnitOfWork
from ..domain.entities import Empleado, RadioFrecuencia, SapUsuario


class CatalogosService:
    """
    Servicio de aplicación para administrar catálogos:
    - Empleado
    - RadioFrecuencia
    - SapUsuario

    Emite eventos de auditoría (AdminChangeEvent) y usa UoW para atomicidad.
    """

    def __init__(
        self,
        empleados: EmpleadoRepository,
        radios: RadioRepository,
        sap_usuarios: SapUsuarioRepository,
        audit: AuditLogRepository,
        uow: Optional[UnitOfWork] = None,
    ) -> None:
        self.empleados = empleados
        self.radios = radios
        self.sap = sap_usuarios
        self.audit = audit
        self.uow = uow

    # -------- Helpers --------
    def _ctx(self) -> ContextManager:
        return self.uow if self.uow is not None else nullcontext()

    # -------- Empleado --------
    def crear_empleado(self, *, cedula: str, nombre: str, activo: bool, actor_user_id: int, reason: Optional[str] = None) -> Empleado:
        with self._ctx():
            existing = self.empleados.obtener_por_cedula(cedula)
            if existing:
                raise BusinessRuleViolation(f"Ya existe un empleado con cédula {cedula}")

            created = self.empleados.crear(cedula=cedula, nombre=nombre, activo=activo)

            self.audit.append(AdminChangeEvent(
                aggregate="Empleado",
                action="CREATED",
                id_ref=cedula,
                at=datetime.utcnow(),
                actor_user_id=actor_user_id,
                before=None,
                after={"cedula": created.cedula, "nombre": created.nombre, "activo": created.activo},
                reason=reason,
            ))
            return created

    def actualizar_empleado(self, *, cedula: str, cambios: Dict[str, Any], actor_user_id: int, reason: Optional[str] = None) -> Empleado:
        with self._ctx():
            before = self.empleados.obtener_por_cedula(cedula)
            if not before:
                raise EntityNotFound(f"Empleado {cedula} no existe")

            updated = self.empleados.actualizar(cedula=cedula, cambios=cambios)

            self.audit.append(AdminChangeEvent(
                aggregate="Empleado",
                action="UPDATED",
                id_ref=cedula,
                at=datetime.utcnow(),
                actor_user_id=actor_user_id,
                before={"nombre": before.nombre, "activo": before.activo},
                after={"nombre": updated.nombre, "activo": updated.activo},
                reason=reason,
            ))
            return updated

    def eliminar_empleado(self, *, cedula: str, actor_user_id: int, reason: Optional[str] = None) -> None:
        with self._ctx():
            before = self.empleados.obtener_por_cedula(cedula)
            if not before:
                raise EntityNotFound(f"Empleado {cedula} no existe")

            self.empleados.eliminar(cedula=cedula)

            self.audit.append(AdminChangeEvent(
                aggregate="Empleado",
                action="DELETED",
                id_ref=cedula,
                at=datetime.utcnow(),
                actor_user_id=actor_user_id,
                before={"nombre": before.nombre, "activo": before.activo},
                after=None,
                reason=reason,
            ))

    # -------- Radio --------
    def crear_radio(self, *, codigo: str, descripcion: Optional[str], activo: bool, actor_user_id: int, reason: Optional[str] = None) -> RadioFrecuencia:
        with self._ctx():
            existing = self.radios.obtener_por_codigo(codigo)
            if existing:
                raise BusinessRuleViolation(f"Ya existe radio con código {codigo}")

            created = self.radios.crear(codigo=codigo, descripcion=descripcion, activo=activo)

            self.audit.append(AdminChangeEvent(
                aggregate="RadioFrecuencia",
                action="CREATED",
                id_ref=codigo,
                at=datetime.utcnow(),
                actor_user_id=actor_user_id,
                before=None,
                after={"codigo": created.codigo, "descripcion": created.descripcion, "activo": created.activo},
                reason=reason,
            ))
            return created

    def actualizar_radio(self, *, codigo: str, cambios: Dict[str, Any], actor_user_id: int, reason: Optional[str] = None) -> RadioFrecuencia:
        with self._ctx():
            before = self.radios.obtener_por_codigo(codigo)
            if not before:
                raise EntityNotFound(f"Radio {codigo} no existe")

            updated = self.radios.actualizar(codigo=codigo, cambios=cambios)

            self.audit.append(AdminChangeEvent(
                aggregate="RadioFrecuencia",
                action="UPDATED",
                id_ref=codigo,
                at=datetime.utcnow(),
                actor_user_id=actor_user_id,
                before={"descripcion": before.descripcion, "activo": before.activo},
                after={"descripcion": updated.descripcion, "activo": updated.activo},
                reason=reason,
            ))
            return updated

    def eliminar_radio(self, *, codigo: str, actor_user_id: int, reason: Optional[str] = None) -> None:
        with self._ctx():
            before = self.radios.obtener_por_codigo(codigo)
            if not before:
                raise EntityNotFound(f"Radio {codigo} no existe")

            self.radios.eliminar(codigo=codigo)

            self.audit.append(AdminChangeEvent(
                aggregate="RadioFrecuencia",
                action="DELETED",
                id_ref=codigo,
                at=datetime.utcnow(),
                actor_user_id=actor_user_id,
                before={"descripcion": before.descripcion, "activo": before.activo},
                after=None,
                reason=reason,
            ))

    # -------- SapUsuario --------
    def crear_sap_usuario(self, *, username: str, empleado_cedula: Optional[str], activo: bool, actor_user_id: int, reason: Optional[str] = None) -> SapUsuario:
        with self._ctx():
            existing = self.sap.obtener_por_username(username)
            if existing:
                raise BusinessRuleViolation(f"Ya existe usuario SAP {username}")

            created = self.sap.crear(username=username, empleado_cedula=empleado_cedula, activo=activo)

            self.audit.append(AdminChangeEvent(
                aggregate="SapUsuario",
                action="CREATED",
                id_ref=username,
                at=datetime.utcnow(),
                actor_user_id=actor_user_id,
                before=None,
                after={
                    "username": created.username,
                    "empleado_id": created.empleado_id,
                    "empleado_cedula": created.empleado_cedula,
                    "activo": created.activo,
                },
                reason=reason,
            ))
            return created

    def actualizar_sap_usuario(self, *, username: str, cambios: Dict[str, Any], actor_user_id: int, reason: Optional[str] = None) -> SapUsuario:
        with self._ctx():
            before = self.sap.obtener_por_username(username)
            if not before:
                raise EntityNotFound(f"SAP Usuario {username} no existe")

            updated = self.sap.actualizar(username=username, cambios=cambios)

            self.audit.append(AdminChangeEvent(
                aggregate="SapUsuario",
                action="UPDATED",
                id_ref=username,
                at=datetime.utcnow(),
                actor_user_id=actor_user_id,
                before={
                    "empleado_id": before.empleado_id,
                    "empleado_cedula": before.empleado_cedula,
                    "activo": before.activo,
                },
                after={
                    "empleado_id": updated.empleado_id,
                    "empleado_cedula": updated.empleado_cedula,
                    "activo": updated.activo,
                },
                reason=reason,
            ))
            return updated

    def eliminar_sap_usuario(self, *, username: str, actor_user_id: int, reason: Optional[str] = None) -> None:
        with self._ctx():
            before = self.sap.obtener_por_username(username)
            if not before:
                raise EntityNotFound(f"SAP Usuario {username} no existe")

            self.sap.eliminar(username=username)

            self.audit.append(AdminChangeEvent(
                aggregate="SapUsuario",
                action="DELETED",
                id_ref=username,
                at=datetime.utcnow(),
                actor_user_id=actor_user_id,
                before={
                    "empleado_id": before.empleado_id,
                    "empleado_cedula": before.empleado_cedula,
                    "activo": before.activo,
                },
                after=None,
                reason=reason,
            ))
