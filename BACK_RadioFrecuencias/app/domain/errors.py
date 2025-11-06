class DomainError(Exception):
    """Base para errores de dominio (reglas de negocio y consistencia)."""

class EntityNotFound(DomainError):
    """Entidad no encontrada (catálogos o préstamo)."""

class InactiveEntity(DomainError):
    """Entidad encontrada pero marcada como inactiva."""

class BusinessRuleViolation(DomainError):
    """Violación de una regla de negocio."""