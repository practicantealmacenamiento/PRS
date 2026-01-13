"""API publica del dominio para imports estables desde capas superiores."""

from .entities import Empleado, RadioFrecuencia, SapUsuario, Prestamo
from .value_objects import Turno, EstadoPrestamo, Cedula, CodigoRF, Username
from .rules import calcular_turno, clean_doc, clean_sap, clean_rf
from .errors import DomainError, EntityNotFound, InactiveEntity, BusinessRuleViolation
from .events import AdminChangeEvent, AuditLogRecord

# Puertos
from .ports.repositories import (
    EmpleadoRepository,
    RadioRepository,
    SapUsuarioRepository,
    PrestamoRepository,
)
from .ports.audit import AuditLogRepository, AuditLogQueryRepository
from .ports.uow import UnitOfWork

__all__ = [
    # Entidades
    "Empleado", "RadioFrecuencia", "SapUsuario", "Prestamo",
    # Value Objects
    "Turno", "EstadoPrestamo", "Cedula", "CodigoRF", "Username",
    # Reglas
    "calcular_turno", "clean_doc", "clean_sap", "clean_rf",
    # Errores
    "DomainError", "EntityNotFound", "InactiveEntity", "BusinessRuleViolation",
    # Eventos
    "AdminChangeEvent", "AuditLogRecord",
    # Puertos
    "EmpleadoRepository", "RadioRepository", "SapUsuarioRepository", "PrestamoRepository",
    "AuditLogRepository", "AuditLogQueryRepository", "UnitOfWork",
]
