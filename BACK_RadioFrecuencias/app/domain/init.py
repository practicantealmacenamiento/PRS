# API pública del dominio para imports estables desde capas superiores.

from .ports import value_objects as _vo
from .entities import Empleado, RadioFrecuencia, SapUsuario, Prestamo
from .value_objects import Turno, EstadoPrestamo, Cedula, CodigoRF, Username
from .rules import calcular_turno, clean_doc, clean_sap, clean_rf
from .errors import DomainError, EntityNotFound, InactiveEntity, BusinessRuleViolation
from .events import AdminChangeEvent

# Puertos
from .ports.repositories import (
    EmpleadoRepository,
    RadioRepository,
    SapUsuarioRepository,
    PrestamoRepository,
)
from .ports.audit import AuditLogRepository
from .ports.uow import UnitOfWork

__all__ = [
    # Entities
    "Empleado", "RadioFrecuencia", "SapUsuario", "Prestamo",
    # Value Objects
    "Turno", "EstadoPrestamo", "Cedula", "CodigoRF", "Username",
    # Rules
    "calcular_turno", "clean_doc", "clean_sap", "clean_rf",
    # Errors
    "DomainError", "EntityNotFound", "InactiveEntity", "BusinessRuleViolation",
    # Events
    "AdminChangeEvent",
    # Ports
    "EmpleadoRepository", "RadioRepository", "SapUsuarioRepository", "PrestamoRepository",
    "AuditLogRepository", "UnitOfWork",
]
