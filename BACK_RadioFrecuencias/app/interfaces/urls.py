from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmpleadoViewSet,
    RadioViewSet,
    SapUsuarioViewSet,
    PrestamoViewSet,
    AuditLogViewSet,
    AppUserViewSet,
)

router = DefaultRouter()
router.register(r"empleados", EmpleadoViewSet, basename="empleado")
router.register(r"radios", RadioViewSet, basename="radio")
router.register(r"sap-usuarios", SapUsuarioViewSet, basename="sapusuario")
router.register(r"prestamos", PrestamoViewSet, basename="prestamo")
router.register(r"audit-log", AuditLogViewSet, basename="auditlog")
router.register(r"usuarios-app", AppUserViewSet, basename="usuariosapp")

urlpatterns = [
    path("", include(router.urls)),
]

