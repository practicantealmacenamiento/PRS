"""Permisos reutilizables para los viewsets de la aplicacion."""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """Permite acceso a superusuarios o miembros del grupo admin."""

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and (u.is_superuser or u.groups.filter(name="admin").exists()))


class IsAuthenticatedReadOnlyOrAdmin(BasePermission):
    """Lectura para autenticados y escritura solo para administradores."""

    def has_permission(self, request, view):
        u = request.user
        if request.method in SAFE_METHODS:
            return bool(u and u.is_authenticated)
        return bool(u and u.is_authenticated and (u.is_superuser or u.groups.filter(name="admin").exists()))
