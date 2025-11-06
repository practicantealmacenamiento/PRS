from __future__ import annotations
from typing import Dict, List, Optional
from datetime import datetime
from django.db import transaction
from django.db.models import Q

from ..domain.ports.repositories import (
    EmpleadoRepository,
    RadioRepository,
    SapUsuarioRepository,
    PrestamoRepository,
)
from ..domain.ports.audit import AuditLogRepository
from ..domain.ports.uow import UnitOfWork
from ..domain.entities import Empleado, RadioFrecuencia, SapUsuario, Prestamo
from ..domain.errors import EntityNotFound
from ..domain.value_objects import EstadoPrestamo

from .models import (
    EmpleadoModel,
    RadioFrecuenciaModel,
    SapUsuarioModel,
    PrestamoModel,
    AuditEntry,
)
from .mappers import (
    empleado_from_model,
    radio_from_model,
    sap_from_model,
    prestamo_from_model,
    prestamo_to_model_fields,
)


# -----------------------
# Unit Of Work (Adapter)
# -----------------------

class DjangoUnitOfWork(UnitOfWork):
    def __enter__(self) -> "DjangoUnitOfWork":
        self._ctx = transaction.atomic()
        self._ctx.__enter__()
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self._ctx.__exit__(exc_type, exc, tb)

    def commit(self) -> None:
        # No-op: transaction.atomic() se maneja vía __exit__
        pass

    def rollback(self) -> None:
        # No explícito: con raise dentro del bloque atomic se hace rollback
        pass


# -----------------------
# Empleado Repository
# -----------------------

class DjangoEmpleadoRepository(EmpleadoRepository):
    def obtener_por_cedula(self, cedula: str) -> Optional[Empleado]:
        obj = EmpleadoModel.objects.filter(cedula=cedula).first()
        return empleado_from_model(obj) if obj else None

    def listar(self, q: Optional[str] = None) -> List[Empleado]:
        qs = EmpleadoModel.objects.all()
        if q:
            qs = qs.filter(Q(cedula__icontains=q) | Q(nombre__icontains=q))
        return [empleado_from_model(x) for x in qs.order_by("cedula")]

    def crear(self, *, cedula: str, nombre: str, activo: bool = True) -> Empleado:
        obj = EmpleadoModel.objects.create(cedula=cedula, nombre=nombre, activo=activo)
        return empleado_from_model(obj)

    def actualizar(self, *, cedula: str, cambios: Dict[str, object]) -> Empleado:
        obj = EmpleadoModel.objects.filter(cedula=cedula).first()
        if not obj:
            raise EntityNotFound(f"Empleado {cedula} no existe")
        for k, v in cambios.items():
            setattr(obj, k, v)
        obj.save(update_fields=list(cambios.keys()) or None)
        return empleado_from_model(obj)

    def eliminar(self, *, cedula: str) -> None:
        deleted, _ = EmpleadoModel.objects.filter(cedula=cedula).delete()
        if not deleted:
            raise EntityNotFound(f"Empleado {cedula} no existe")


# -----------------------
# Radio Repository
# -----------------------

class DjangoRadioRepository(RadioRepository):
    def obtener_por_codigo(self, codigo: str) -> Optional[RadioFrecuencia]:
        obj = RadioFrecuenciaModel.objects.filter(codigo=codigo).first()
        return radio_from_model(obj) if obj else None

    def listar(self, q: Optional[str] = None) -> List[RadioFrecuencia]:
        qs = RadioFrecuenciaModel.objects.all()
        if q:
            qs = qs.filter(Q(codigo__icontains=q) | Q(descripcion__icontains=q))
        return [radio_from_model(x) for x in qs.order_by("codigo")]

    def crear(self, *, codigo: str, descripcion: Optional[str] = None, activo: bool = True) -> RadioFrecuencia:
        obj = RadioFrecuenciaModel.objects.create(
            codigo=codigo, descripcion=descripcion, activo=activo
        )
        return radio_from_model(obj)

    def actualizar(self, *, codigo: str, cambios: Dict[str, object]) -> RadioFrecuencia:
        obj = RadioFrecuenciaModel.objects.filter(codigo=codigo).first()
        if not obj:
            raise EntityNotFound(f"Radio {codigo} no existe")
        for k, v in cambios.items():
            setattr(obj, k, v)
        obj.save(update_fields=list(cambios.keys()) or None)
        return radio_from_model(obj)

    def eliminar(self, *, codigo: str) -> None:
        deleted, _ = RadioFrecuenciaModel.objects.filter(codigo=codigo).delete()
        if not deleted:
            raise EntityNotFound(f"Radio {codigo} no existe")


# -----------------------
# SapUsuario Repository
# -----------------------

class DjangoSapUsuarioRepository(SapUsuarioRepository):
    def obtener_por_username(self, username: str) -> Optional[SapUsuario]:
        obj = SapUsuarioModel.objects.filter(username=username).first()
        return sap_from_model(obj) if obj else None

    def listar(self, q: Optional[str] = None) -> List[SapUsuario]:
        qs = SapUsuarioModel.objects.select_related("empleado").all()
        if q:
            qs = qs.filter(
                Q(username__icontains=q)
                | Q(empleado__cedula__icontains=q)
                | Q(empleado__nombre__icontains=q)
            )
        return [sap_from_model(x) for x in qs.order_by("username")]

    def crear(self, *, username: str, empleado_cedula: Optional[str] = None, activo: bool = True) -> SapUsuario:
        empleado = None
        if empleado_cedula:
            empleado = EmpleadoModel.objects.filter(cedula=empleado_cedula).first()
        obj = SapUsuarioModel.objects.create(username=username, empleado=empleado, activo=activo)
        return sap_from_model(obj)

    def actualizar(self, *, username: str, cambios: Dict[str, object]) -> SapUsuario:
        obj = SapUsuarioModel.objects.select_related("empleado").filter(username=username).first()
        if not obj:
            raise EntityNotFound(f"SAP Usuario {username} no existe")

        # Permitir vincular por cedula
        if "empleado_cedula" in cambios:
            ced = cambios.pop("empleado_cedula")
            empleado = EmpleadoModel.objects.filter(cedula=ced).first() if ced else None
            obj.empleado = empleado

        for k, v in cambios.items():
            setattr(obj, k, v)
        obj.save()
        return sap_from_model(obj)

    def eliminar(self, *, username: str) -> None:
        deleted, _ = SapUsuarioModel.objects.filter(username=username).delete()
        if not deleted:
            raise EntityNotFound(f"SAP Usuario {username} no existe")


# -----------------------
# Prestamo Repository
# -----------------------

class DjangoPrestamoRepository(PrestamoRepository):
    def crear(self, prestamo: Prestamo) -> Prestamo:
        fields = prestamo_to_model_fields(prestamo)
        obj = PrestamoModel.objects.create(**fields)
        # select_related para garantizar username
        obj = PrestamoModel.objects.select_related("usuario_registra").get(id=obj.id)
        return prestamo_from_model(obj)

    def obtener_prestamo_abierto(
        self,
        *,
        cedula: Optional[str] = None,
        usuario_sap: Optional[str] = None,
        codigo_radio: Optional[str] = None,
    ) -> Optional[Prestamo]:
        qs = PrestamoModel.objects.select_related("usuario_registra").filter(estado=EstadoPrestamo.ASIGNADO.value)
        if cedula:
            qs = qs.filter(cedula=cedula)
        if usuario_sap:
            qs = qs.filter(usuario_sap=usuario_sap)
        if codigo_radio:
            qs = qs.filter(codigo_radio=codigo_radio)
        obj = qs.order_by("-fecha_hora_prestamo").first()
        return prestamo_from_model(obj) if obj else None

    def marcar_devolucion(self, id_: int, fecha_hora: datetime) -> Prestamo:
        obj = PrestamoModel.objects.select_related("usuario_registra").filter(id=id_).first()
        if not obj:
            raise EntityNotFound(f"Préstamo {id_} no existe")
        obj.estado = EstadoPrestamo.DEVUELTO.value
        obj.fecha_hora_devolucion = fecha_hora
        obj.save(update_fields=["estado", "fecha_hora_devolucion", "updated_at"])
        return prestamo_from_model(obj)

    def listar(self, *, cedula: Optional[str] = None, codigo_radio: Optional[str] = None) -> List[Prestamo]:
        qs = PrestamoModel.objects.select_related("usuario_registra").all()
        if cedula:
            qs = qs.filter(cedula=cedula)
        if codigo_radio:
            qs = qs.filter(codigo_radio=codigo_radio)
        return [prestamo_from_model(x) for x in qs.order_by("-fecha_hora_prestamo")]
    

# -----------------------
# AuditLog Repository
# -----------------------

class DjangoAuditLogRepository(AuditLogRepository):
    def append(self, event) -> None:
        AuditEntry.objects.create(
            aggregate=event.aggregate,
            action=event.action,
            id_ref=event.id_ref,
            at=event.at,
            actor_user_id=event.actor_user_id,
            before=event.before,
            after=event.after,
            reason=event.reason,
        )
