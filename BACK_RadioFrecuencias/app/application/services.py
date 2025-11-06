from __future__ import annotations
from datetime import datetime
from typing import ContextManager, Optional
from contextlib import nullcontext

from ..domain.errors import BusinessRuleViolation, EntityNotFound, InactiveEntity
from ..domain.ports.repositories import (
    EmpleadoRepository,
    RadioRepository,
    SapUsuarioRepository,
    PrestamoRepository,
)
from ..domain.ports.uow import UnitOfWork
from ..domain.entities import Prestamo
from ..domain.rules import calcular_turno
from ..domain.value_objects import EstadoPrestamo


class PrestamosService:
    """
    Casos de uso de préstamos:
    - Asignar radio a empleado (crea préstamo abierto; requiere cédula + código RF + usuario SAP)
    - Devolver préstamo (cierra abierto por exactamente uno de: cédula / usuario_sap / código)
    """

    def __init__(
        self,
        empleados: EmpleadoRepository,
        radios: RadioRepository,
        sap: SapUsuarioRepository,
        prestamos: PrestamoRepository,
        uow: Optional[UnitOfWork] = None,
    ) -> None:
        self.empleados = empleados
        self.radios = radios
        self.sap = sap
        self.prestamos = prestamos
        self.uow = uow

    def _ctx(self) -> ContextManager:
        return self.uow if self.uow is not None else nullcontext()

    # --------- Asignar ---------
    def asignar(
        self,
        *,
        cedula: str,
        codigo_radio: str,
        usuario_sap: str,
        usuario_registra_id: int,
        ahora: datetime,
    ) -> Prestamo:
        """
        Reglas:
        - Empleado activo, Radio activa, Usuario SAP activo.
        - Ningún abierto por la misma cédula / usuario_sap / código.
        """
        with self._ctx():
            empleado = self.empleados.obtener_por_cedula(cedula)
            if not empleado:
                raise EntityNotFound(f"Empleado {cedula} no existe")
            if not empleado.activo:
                raise InactiveEntity(f"Empleado {cedula} inactivo")

            radio = self.radios.obtener_por_codigo(codigo_radio)
            if not radio:
                raise EntityNotFound(f"Radio {codigo_radio} no existe")
            if not radio.activo:
                raise InactiveEntity(f"Radio {codigo_radio} inactiva")

            sapuser = self.sap.obtener_por_username(usuario_sap)
            if not sapuser:
                raise EntityNotFound(f"SAP Usuario {usuario_sap} no existe")
            if not sapuser.activo:
                raise InactiveEntity(f"SAP Usuario {usuario_sap} inactivo")

            # Verificar abiertos por cada dimensión
            if self.prestamos.obtener_prestamo_abierto(cedula=cedula):
                raise BusinessRuleViolation(f"Empleado {cedula} ya tiene préstamo abierto")

            if self.prestamos.obtener_prestamo_abierto(usuario_sap=usuario_sap):
                raise BusinessRuleViolation(f"SAP Usuario {usuario_sap} ya tiene préstamo abierto")

            if self.prestamos.obtener_prestamo_abierto(codigo_radio=codigo_radio):
                raise BusinessRuleViolation(f"Radio {codigo_radio} ya está asignada")

            turno_str = calcular_turno(ahora)

            entity = Prestamo(
                id=None,
                cedula=empleado.cedula,
                empleado_nombre=empleado.nombre,
                usuario_sap=sapuser.username,
                codigo_radio=radio.codigo,
                fecha_hora_prestamo=ahora,
                turno=turno_str,                 # Infra mapper lo convertirá a VO Enum
                estado=EstadoPrestamo.ASIGNADO,  # idem
                usuario_registra_id=usuario_registra_id,
            )
            created = self.prestamos.crear(entity)
            return created

    # --------- Devolver (métodos específicos delegan en el unificado) ---------
    def devolver_por_radio(self, *, codigo_radio: str, ahora: datetime) -> Prestamo:
        return self.devolver(codigo_radio=codigo_radio, ahora=ahora)

    def devolver_por_cedula(self, *, cedula: str, ahora: datetime) -> Prestamo:
        return self.devolver(cedula=cedula, ahora=ahora)

    def devolver_por_usuario_sap(self, *, usuario_sap: str, ahora: datetime) -> Prestamo:
        return self.devolver(usuario_sap=usuario_sap, ahora=ahora)

    def devolver(
        self,
        *,
        codigo_radio: str | None = None,
        cedula: str | None = None,
        usuario_sap: str | None = None,
        ahora: datetime,
    ) -> Prestamo:
        """
        Devuelve por cualquiera de los tres identificadores.
        Regla: exactamente UNO debe venir informado.
        Errores:
        - 0 o >1 identificadores -> BusinessRuleViolation
        - No hay préstamo abierto para el identificador -> EntityNotFound
        """
        keys = [x is not None and str(x).strip() != "" for x in (codigo_radio, cedula, usuario_sap)]
        if sum(keys) != 1:
            raise BusinessRuleViolation("Debe enviar exactamente uno de: codigo_radio, cedula o usuario_sap")

        with self._ctx():
            if codigo_radio:
                abierto = self.prestamos.obtener_prestamo_abierto(codigo_radio=codigo_radio)
                target = f"radio {codigo_radio}"
            elif cedula:
                abierto = self.prestamos.obtener_prestamo_abierto(cedula=cedula)
                target = f"cédula {cedula}"
            else:
                abierto = self.prestamos.obtener_prestamo_abierto(usuario_sap=usuario_sap)
                target = f"usuario SAP {usuario_sap}"

            if not abierto:
                # Puedes cambiar a BusinessRuleViolation si prefieres semántica de "no está prestada".
                raise EntityNotFound(f"No existe préstamo abierto para {target}")

            return self.prestamos.marcar_devolucion(abierto.id, fecha_hora=ahora)
