"""Servicios de aplicacion para el flujo de prestamos de radios."""

from __future__ import annotations
from datetime import datetime
from typing import ContextManager, Optional, List
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
from ..domain.rules import calcular_turno, clean_doc, clean_rf, clean_sap
from ..domain.value_objects import EstadoPrestamo


class PrestamosService:
    """Orquesta la asignacion y devolucion de radios garantizando reglas de negocio."""

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
        """Abstrae el UnitOfWork para reusar la misma semantica en pruebas."""
        return self.uow if self.uow is not None else nullcontext()

    def listar(self, *, cedula: Optional[str] = None, codigo_radio: Optional[str] = None) -> List[Prestamo]:
        """Consulta prestamos sin reglas adicionales (read model)."""
        return self.prestamos.listar(cedula=cedula, codigo_radio=codigo_radio)

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
        """Crea un prestamo abierto tras validar entidades activas y duplicados."""
        cedula_clean = clean_doc(cedula)
        codigo_clean = clean_rf(codigo_radio)
        usuario_sap_clean = clean_sap(usuario_sap)

        if not cedula_clean:
            raise BusinessRuleViolation("Cédula inválida.")
        if not codigo_clean:
            raise BusinessRuleViolation("Código de radio inválido.")
        if not usuario_sap_clean:
            raise BusinessRuleViolation("Usuario SAP inválido.")

        cedula = cedula_clean
        codigo_radio = codigo_clean
        usuario_sap = usuario_sap_clean

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

            turno_vo = calcular_turno(ahora)

            entity = Prestamo(
                id=None,
                cedula=empleado.cedula,
                empleado_nombre=empleado.nombre,
                usuario_sap=sapuser.username,
                codigo_radio=radio.codigo,
                fecha_hora_prestamo=ahora,
                turno=turno_vo,
                estado=EstadoPrestamo.ASIGNADO,
                usuario_registra_id=usuario_registra_id,
            )
            created = self.prestamos.crear(entity)
            return created

    # --------- Devolver (métodos específicos delegan en el unificado) ---------
    def devolver_por_radio(self, *, codigo_radio: str, ahora: datetime) -> Prestamo:
        """Cierra el prestamo abierto asociado al codigo de radio."""
        return self.devolver(codigo_radio=codigo_radio, ahora=ahora)

    def devolver_por_cedula(self, *, cedula: str, ahora: datetime) -> Prestamo:
        """Cierra el prestamo segun la cedula del empleado."""
        return self.devolver(cedula=cedula, ahora=ahora)

    def devolver_por_usuario_sap(self, *, usuario_sap: str, ahora: datetime) -> Prestamo:
        """Cierra el prestamo usando el username SAP."""
        return self.devolver(usuario_sap=usuario_sap, ahora=ahora)

    def devolver(
        self,
        *,
        codigo_radio: str | None = None,
        cedula: str | None = None,
        usuario_sap: str | None = None,
        ahora: datetime,
    ) -> Prestamo:
        """Devuelve un prestamo abierto segun un unico identificador recibido."""
        codigo_radio_clean = clean_rf(codigo_radio) if codigo_radio is not None else None
        cedula_clean = clean_doc(cedula) if cedula is not None else None
        usuario_sap_clean = clean_sap(usuario_sap) if usuario_sap is not None else None

        provided = [v for v in (codigo_radio_clean, cedula_clean, usuario_sap_clean) if v]
        if len(provided) != 1:
            raise BusinessRuleViolation("Debe enviar exactamente uno de: codigo_radio, cedula o usuario_sap")

        with self._ctx():
            if codigo_radio_clean:
                abierto = self.prestamos.obtener_prestamo_abierto(codigo_radio=codigo_radio_clean)
                target = f"radio {codigo_radio_clean}"
            elif cedula_clean:
                abierto = self.prestamos.obtener_prestamo_abierto(cedula=cedula_clean)
                target = f"cédula {cedula_clean}"
            else:
                abierto = self.prestamos.obtener_prestamo_abierto(usuario_sap=usuario_sap_clean)
                target = f"usuario SAP {usuario_sap_clean}"

            if not abierto:
                raise EntityNotFound(f"No existe préstamo abierto para {target}")

            return self.prestamos.marcar_devolucion(abierto.id, fecha_hora=ahora)
