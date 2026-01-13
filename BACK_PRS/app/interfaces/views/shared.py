"""Factory helpers y mixins para conectar vistas con los servicios de aplicacion."""

from __future__ import annotations

from functools import cached_property, wraps

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from ...application.audit_queries import AuditLogQueryService
from ...application.catalogos_service import CatalogosService
from ...application.services import PrestamosService
from ...domain.errors import BusinessRuleViolation, EntityNotFound, InactiveEntity
from ...infrastructure.repositories import (
    DjangoAuditLogQueryRepository,
    DjangoAuditLogRepository,
    DjangoEmpleadoRepository,
    DjangoPrestamoRepository,
    DjangoRadioRepository,
    DjangoSapUsuarioRepository,
    DjangoUnitOfWork,
)


def _build_catalogos_service() -> CatalogosService:
    """Crea una instancia de CatalogosService con las implementaciones Django."""
    empleados_repo = DjangoEmpleadoRepository()
    radios_repo = DjangoRadioRepository()
    sap_repo = DjangoSapUsuarioRepository()
    audit_repo = DjangoAuditLogRepository()
    uow = DjangoUnitOfWork()
    return CatalogosService(empleados_repo, radios_repo, sap_repo, audit_repo, uow, clock=timezone.now)


def _build_prestamos_service() -> PrestamosService:
    """Crea una instancia de PrestamosService lista para usarse en vistas."""
    empleados_repo = DjangoEmpleadoRepository()
    radios_repo = DjangoRadioRepository()
    sap_repo = DjangoSapUsuarioRepository()
    prestamos_repo = DjangoPrestamoRepository()
    uow = DjangoUnitOfWork()
    return PrestamosService(empleados_repo, radios_repo, sap_repo, prestamos_repo, uow)


def _build_audit_query_service() -> AuditLogQueryService:
    """Retorna el servicio de consultas de auditoria."""
    repo = DjangoAuditLogQueryRepository()
    return AuditLogQueryService(repo)


def handle_domain_errors(func):
    """Decorator para traducir errores de dominio a respuestas HTTP."""

    @wraps(func)
    def wrapper(self, request, *args, **kwargs):
        try:
            return func(self, request, *args, **kwargs)
        except InactiveEntity as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        except BusinessRuleViolation as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except EntityNotFound as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)

    return wrapper


class CatalogosServiceMixin:
    """Inyecta CatalogosService lazily."""

    @cached_property
    def catalogos(self) -> CatalogosService:
        return _build_catalogos_service()


class PrestamosServiceMixin:
    """Inyecta PrestamosService lazily."""

    @cached_property
    def prestamos(self) -> PrestamosService:
        return _build_prestamos_service()


class AuditQueryServiceMixin:
    """Inyecta AuditLogQueryService lazily."""

    @cached_property
    def audit_queries(self) -> AuditLogQueryService:
        return _build_audit_query_service()
