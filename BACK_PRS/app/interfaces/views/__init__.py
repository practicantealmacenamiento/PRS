"""Convenience exports for DRF routers."""

from .catalogos import EmpleadoViewSet, RadioViewSet, SapUsuarioViewSet
from .prestamos import PrestamoViewSet
from .audit import AuditLogViewSet
from .users import AppUserViewSet

__all__ = [
    "EmpleadoViewSet",
    "RadioViewSet",
    "SapUsuarioViewSet",
    "PrestamoViewSet",
    "AuditLogViewSet",
    "AppUserViewSet",
]
