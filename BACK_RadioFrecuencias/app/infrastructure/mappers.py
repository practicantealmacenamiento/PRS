"""
Infraestructura :: Mapeadores ORM <-> Entidades de dominio
"""
from __future__ import annotations
from typing import Optional
from django.contrib.auth import get_user_model

from ..domain.entities import Empleado, RadioFrecuencia, SapUsuario, Prestamo
from ..domain.value_objects import Turno, EstadoPrestamo
from .models import EmpleadoModel, RadioFrecuenciaModel, SapUsuarioModel, PrestamoModel


# --- Empleado ---

def empleado_from_model(obj: EmpleadoModel) -> Empleado:
    return Empleado(
        id=obj.id,
        cedula=obj.cedula,
        nombre=obj.nombre,
        activo=obj.activo,
    )


# --- Radio ---

def radio_from_model(obj: RadioFrecuenciaModel) -> RadioFrecuencia:
    return RadioFrecuencia(
        id=obj.id,
        codigo=obj.codigo,
        descripcion=obj.descripcion,
        activo=obj.activo,
    )


# --- SAP Usuario ---

def sap_from_model(obj: SapUsuarioModel) -> SapUsuario:
    empleado_id = obj.empleado_id if obj.empleado_id else None
    empleado_cedula = None
    if getattr(obj, "empleado", None):
        empleado_cedula = getattr(obj.empleado, "cedula", None)
    return SapUsuario(
        id=obj.id,
        username=obj.username,
        empleado_id=empleado_id,
        empleado_cedula=empleado_cedula,
        activo=obj.activo,
    )


# --- Prestamo ---

def prestamo_from_model(obj: PrestamoModel) -> Prestamo:
    """
    Inyecta usuario_registra_username para evitar queries desde interfaces.
    """
    username: Optional[str] = None
    # Como el modelo usa FK a AUTH_USER_MODEL, podemos traer el username directamente.
    # Se recomienda que el repositorio haga select_related('usuario_registra') para evitar N+1.
    if getattr(obj, "usuario_registra", None):
        username = getattr(obj.usuario_registra, "username", None)

    return Prestamo(
        id=obj.id,
        cedula=obj.cedula,
        empleado_nombre=obj.empleado_nombre,
        usuario_sap=obj.usuario_sap,
        codigo_radio=obj.codigo_radio,
        fecha_hora_prestamo=obj.fecha_hora_prestamo,
        turno=Turno(obj.turno),
        estado=EstadoPrestamo(obj.estado),
        usuario_registra_id=obj.usuario_registra_id,
        fecha_hora_devolucion=obj.fecha_hora_devolucion,
        usuario_registra_username=username,
    )


def prestamo_to_model_fields(entity: Prestamo) -> dict:
    """
    Convierte una entidad Prestamo a dict de campos para el ORM (create/update).
    """
    return {
        "cedula": entity.cedula,
        "empleado_nombre": entity.empleado_nombre,
        "usuario_sap": entity.usuario_sap,
        "codigo_radio": entity.codigo_radio,
        "fecha_hora_prestamo": entity.fecha_hora_prestamo,
        "turno": entity.turno.value if hasattr(entity.turno, "value") else str(entity.turno),
        "estado": entity.estado.value if hasattr(entity.estado, "value") else str(entity.estado),
        "usuario_registra_id": entity.usuario_registra_id,
        "fecha_hora_devolucion": entity.fecha_hora_devolucion,
    }
