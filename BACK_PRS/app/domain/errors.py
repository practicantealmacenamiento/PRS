"""Excepciones de dominio compartidas por las distintas capas."""


class DomainError(Exception):
    """Base para errores de dominio (reglas de negocio y consistencia)."""


class EntityNotFound(DomainError):
    """Entidad no encontrada (catalogos o prestamo)."""


class InactiveEntity(DomainError):
    """Entidad encontrada pero marcada como inactiva."""


class BusinessRuleViolation(DomainError):
    """Violacion de una regla de negocio."""
