from __future__ import annotations

from typing import Any, Dict, Optional, Sequence
from functools import wraps

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiExample, OpenApiParameter, OpenApiResponse, extend_schema

from .permissions import IsAdmin, IsAuthenticatedReadOnlyOrAdmin
from .serializers import (
    AsignarPrestamoRequestSerializer,
    DevolverPrestamoRequestSerializer,
    EmpleadoRequestSerializer,
    EmpleadoResponseSerializer,
    EmpleadoUpdateSerializer,
    PrestamoResponseSerializer,
    RadioRequestSerializer,
    RadioResponseSerializer,
    RadioUpdateSerializer,
    SapUsuarioRequestSerializer,
    SapUsuarioResponseSerializer,
    SapUsuarioUpdateSerializer,
    AuditEntryResponseSerializer,
    AppUserCreateSerializer,
    AppUserResponseSerializer,
    AppUserUpdateSerializer,
)
from ..application.catalogos_service import CatalogosService
from ..application.services import PrestamosService
from ..application.use_cases import (
    ActualizarEmpleadoCmd,
    ActualizarRadioCmd,
    ActualizarSapUsuarioCmd,
    AsignarPrestamoCmd,
    CatalogosUseCases,
    CrearEmpleadoCmd,
    CrearRadioCmd,
    CrearSapUsuarioCmd,
    DevolverPorCedulaCmd,
    DevolverPorRadioCmd,
    DevolverPorUsuarioSapCmd,
    EliminarEmpleadoCmd,
    EliminarRadioCmd,
    EliminarSapUsuarioCmd,
    PrestamoUseCases,
)
from ..domain.errors import BusinessRuleViolation, EntityNotFound, InactiveEntity
from ..infrastructure.repositories import (
    DjangoAuditLogRepository,
    DjangoEmpleadoRepository,
    DjangoPrestamoRepository,
    DjangoRadioRepository,
    DjangoSapUsuarioRepository,
    DjangoUnitOfWork,
)
from ..infrastructure.models import AuditEntry


empleados_repo = DjangoEmpleadoRepository()
radios_repo = DjangoRadioRepository()
sap_repo = DjangoSapUsuarioRepository()
prestamos_repo = DjangoPrestamoRepository()
audit_repo = DjangoAuditLogRepository()
uow = DjangoUnitOfWork()

prestamos_svc = PrestamosService(empleados_repo, radios_repo, sap_repo, prestamos_repo, uow)
catalogos_svc = CatalogosService(empleados_repo, radios_repo, sap_repo, audit_repo, uow)

prestamo_uc = PrestamoUseCases(prestamos_svc)
catalogos_uc = CatalogosUseCases(catalogos_svc)
UserModel = get_user_model()


def _handle_domain_errors(func):
    """Traducir errores de dominio a respuestas HTTP."""

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


# ----------------- Empleados -----------------


class EmpleadoViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticatedReadOnlyOrAdmin]
    lookup_field = "cedula"

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="q",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filtrar por nombre o cédula",
            )
        ],
        responses={200: EmpleadoResponseSerializer(many=True)},
        tags=["Empleados"],
    )
    def list(self, request):
        q = request.query_params.get("q")
        empleados = empleados_repo.listar(q=q)
        data = [EmpleadoResponseSerializer(emp.__dict__).data for emp in empleados]
        return Response(data)

    @extend_schema(
        parameters=[OpenApiParameter("cedula", OpenApiTypes.STR, OpenApiParameter.PATH)],
        responses={200: EmpleadoResponseSerializer, 404: OpenApiResponse(description="No encontrado")},
        tags=["Empleados"],
    )
    def retrieve(self, request, cedula: Optional[str] = None):
        empleado = empleados_repo.obtener_por_cedula(cedula)
        if not empleado:
            return Response({"detail": "No encontrado"}, status=404)
        return Response(EmpleadoResponseSerializer(empleado.__dict__).data)

    @extend_schema(
        request=EmpleadoRequestSerializer,
        responses={201: EmpleadoResponseSerializer, 400: OpenApiResponse(description="Error")},
        tags=["Empleados"],
        description="Crear empleado (solo admin).",
    )
    @_handle_domain_errors
    def create(self, request):
        self.check_permissions(request)
        if not IsAdmin().has_permission(request, self):
            return Response({"detail": "Solo admin puede crear"}, status=403)

        serializer = EmpleadoRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cmd = CrearEmpleadoCmd(
            cedula=serializer.validated_data["cedula"],
            nombre=serializer.validated_data["nombre"],
            activo=serializer.validated_data.get("activo", True),
            actor_user_id=request.user.id,
        )
        empleado = catalogos_uc.crear_empleado(cmd)
        return Response(EmpleadoResponseSerializer(empleado.__dict__).data, status=201)

    @extend_schema(
        parameters=[OpenApiParameter("cedula", OpenApiTypes.STR, OpenApiParameter.PATH)],
        request=EmpleadoUpdateSerializer,
        responses={200: EmpleadoResponseSerializer, 400: OpenApiResponse(description="Error"), 404: OpenApiResponse(description="No encontrado")},
        tags=["Empleados"],
        description="Actualizar parcialmente un empleado (solo admin).",
    )
    @_handle_domain_errors
    def partial_update(self, request, cedula: Optional[str] = None):
        self.check_permissions(request)
        if not IsAdmin().has_permission(request, self):
            return Response({"detail": "Solo admin puede actualizar"}, status=403)

        serializer = EmpleadoUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        cmd = ActualizarEmpleadoCmd(
            cedula=cedula,
            cambios=serializer.validated_data,
            actor_user_id=request.user.id,
        )
        empleado = catalogos_uc.actualizar_empleado(cmd)
        return Response(EmpleadoResponseSerializer(empleado.__dict__).data)

    @extend_schema(
        parameters=[OpenApiParameter("cedula", OpenApiTypes.STR, OpenApiParameter.PATH)],
        responses={204: OpenApiResponse(description="Eliminado"), 400: OpenApiResponse(description="Error"), 404: OpenApiResponse(description="No encontrado")},
        tags=["Empleados"],
        description="Eliminar empleado (solo admin).",
    )
    @_handle_domain_errors
    def destroy(self, request, cedula: Optional[str] = None):
        self.check_permissions(request)
        if not IsAdmin().has_permission(request, self):
            return Response({"detail": "Solo admin puede eliminar"}, status=403)

        cmd = EliminarEmpleadoCmd(cedula=cedula, actor_user_id=request.user.id)
        catalogos_uc.eliminar_empleado(cmd)
        return Response(status=204)


# ----------------- Radios -----------------


class RadioViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticatedReadOnlyOrAdmin]
    lookup_field = "codigo"

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="q",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filtrar por código o descripción",
            )
        ],
        responses={200: RadioResponseSerializer(many=True)},
        tags=["Radios"],
    )
    def list(self, request):
        q = request.query_params.get("q")
        radios = radios_repo.listar(q=q)
        data = [RadioResponseSerializer(radio.__dict__).data for radio in radios]
        return Response(data)

    @extend_schema(
        parameters=[OpenApiParameter("codigo", OpenApiTypes.STR, OpenApiParameter.PATH)],
        responses={200: RadioResponseSerializer, 404: OpenApiResponse(description="No encontrado")},
        tags=["Radios"],
    )
    def retrieve(self, request, codigo: Optional[str] = None):
        radio = radios_repo.obtener_por_codigo(codigo)
        if not radio:
            return Response({"detail": "No encontrado"}, status=404)
        return Response(RadioResponseSerializer(radio.__dict__).data)

    @extend_schema(
        request=RadioRequestSerializer,
        responses={201: RadioResponseSerializer, 400: OpenApiResponse(description="Error")},
        tags=["Radios"],
        description="Crear radio (solo admin).",
    )
    @_handle_domain_errors
    def create(self, request):
        self.check_permissions(request)
        if not IsAdmin().has_permission(request, self):
            return Response({"detail": "Solo admin puede crear"}, status=403)

        serializer = RadioRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cmd = CrearRadioCmd(
            codigo=serializer.validated_data["codigo"],
            descripcion=serializer.validated_data.get("descripcion"),
            activo=serializer.validated_data.get("activo", True),
            actor_user_id=request.user.id,
        )
        radio = catalogos_uc.crear_radio(cmd)
        return Response(RadioResponseSerializer(radio.__dict__).data, status=201)

    @extend_schema(
        parameters=[OpenApiParameter("codigo", OpenApiTypes.STR, OpenApiParameter.PATH)],
        request=RadioUpdateSerializer,
        responses={200: RadioResponseSerializer, 400: OpenApiResponse(description="Error"), 404: OpenApiResponse(description="No encontrado")},
        tags=["Radios"],
        description="Actualizar parcialmente un radio (solo admin).",
    )
    @_handle_domain_errors
    def partial_update(self, request, codigo: Optional[str] = None):
        self.check_permissions(request)
        if not IsAdmin().has_permission(request, self):
            return Response({"detail": "Solo admin puede actualizar"}, status=403)

        serializer = RadioUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        cmd = ActualizarRadioCmd(
            codigo=codigo,
            cambios=serializer.validated_data,
            actor_user_id=request.user.id,
        )
        radio = catalogos_uc.actualizar_radio(cmd)
        return Response(RadioResponseSerializer(radio.__dict__).data)

    @extend_schema(
        parameters=[OpenApiParameter("codigo", OpenApiTypes.STR, OpenApiParameter.PATH)],
        responses={204: OpenApiResponse(description="Eliminado"), 400: OpenApiResponse(description="Error"), 404: OpenApiResponse(description="No encontrado")},
        tags=["Radios"],
        description="Eliminar radio (solo admin).",
    )
    @_handle_domain_errors
    def destroy(self, request, codigo: Optional[str] = None):
        self.check_permissions(request)
        if not IsAdmin().has_permission(request, self):
            return Response({"detail": "Solo admin puede eliminar"}, status=403)

        cmd = EliminarRadioCmd(codigo=codigo, actor_user_id=request.user.id)
        catalogos_uc.eliminar_radio(cmd)
        return Response(status=204)


# ----------------- SAP Usuarios -----------------


class SapUsuarioViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticatedReadOnlyOrAdmin]
    lookup_field = "username"

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="q",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filtrar por usuario o cédula asociada",
            )
        ],
        responses={200: SapUsuarioResponseSerializer(many=True)},
        tags=["SAP Usuarios"],
    )
    def list(self, request):
        q = request.query_params.get("q")
        users = sap_repo.listar(q=q)
        data = [SapUsuarioResponseSerializer(user.__dict__).data for user in users]
        return Response(data)

    @extend_schema(
        parameters=[OpenApiParameter("username", OpenApiTypes.STR, OpenApiParameter.PATH)],
        responses={200: SapUsuarioResponseSerializer, 404: OpenApiResponse(description="No encontrado")},
        tags=["SAP Usuarios"],
    )
    def retrieve(self, request, username: Optional[str] = None):
        user = sap_repo.obtener_por_username(username)
        if not user:
            return Response({"detail": "No encontrado"}, status=404)
        return Response(SapUsuarioResponseSerializer(user.__dict__).data)

    @extend_schema(
        request=SapUsuarioRequestSerializer,
        responses={201: SapUsuarioResponseSerializer, 400: OpenApiResponse(description="Error")},
        tags=["SAP Usuarios"],
        description="Crear usuario SAP (solo admin).",
    )
    @_handle_domain_errors
    def create(self, request):
        self.check_permissions(request)
        if not IsAdmin().has_permission(request, self):
            return Response({"detail": "Solo admin puede crear"}, status=403)

        serializer = SapUsuarioRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cmd = CrearSapUsuarioCmd(
            username=serializer.validated_data["username"],
            empleado_cedula=serializer.validated_data.get("empleado_cedula") or None,
            activo=serializer.validated_data.get("activo", True),
            actor_user_id=request.user.id,
        )
        user = catalogos_uc.crear_sap_usuario(cmd)
        return Response(SapUsuarioResponseSerializer(user.__dict__).data, status=201)

    @extend_schema(
        parameters=[OpenApiParameter("username", OpenApiTypes.STR, OpenApiParameter.PATH)],
        request=SapUsuarioUpdateSerializer,
        responses={200: SapUsuarioResponseSerializer, 400: OpenApiResponse(description="Error"), 404: OpenApiResponse(description="No encontrado")},
        tags=["SAP Usuarios"],
        description="Actualizar parcialmente un usuario SAP (solo admin).",
    )
    @_handle_domain_errors
    def partial_update(self, request, username: Optional[str] = None):
        self.check_permissions(request)
        if not IsAdmin().has_permission(request, self):
            return Response({"detail": "Solo admin puede actualizar"}, status=403)

        serializer = SapUsuarioUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        cambios = dict(serializer.validated_data)
        if "empleado_cedula" in cambios and cambios["empleado_cedula"] in ("", None):
            cambios["empleado_cedula"] = None

        cmd = ActualizarSapUsuarioCmd(
            username=username,
            cambios=cambios,
            actor_user_id=request.user.id,
        )
        user = catalogos_uc.actualizar_sap_usuario(cmd)
        return Response(SapUsuarioResponseSerializer(user.__dict__).data)

    @extend_schema(
        parameters=[OpenApiParameter("username", OpenApiTypes.STR, OpenApiParameter.PATH)],
        responses={204: OpenApiResponse(description="Eliminado"), 400: OpenApiResponse(description="Error"), 404: OpenApiResponse(description="No encontrado")},
        tags=["SAP Usuarios"],
        description="Eliminar usuario SAP (solo admin).",
    )
    @_handle_domain_errors
    def destroy(self, request, username: Optional[str] = None):
        self.check_permissions(request)
        if not IsAdmin().has_permission(request, self):
            return Response({"detail": "Solo admin puede eliminar"}, status=403)

        cmd = EliminarSapUsuarioCmd(username=username, actor_user_id=request.user.id)
        catalogos_uc.eliminar_sap_usuario(cmd)
        return Response(status=204)


# ----------------- Auditoria -----------------


class AuditLogViewSet(viewsets.ViewSet):
    permission_classes = [IsAdmin]
    http_method_names = ["get"]

    @extend_schema(
        parameters=[
            OpenApiParameter("limit", OpenApiTypes.INT, OpenApiParameter.QUERY, description="Cantidad maxima de eventos a retornar (1-200)."),
            OpenApiParameter("aggregate", OpenApiTypes.STR, OpenApiParameter.QUERY, description="Filtrar por aggregate (Empleado|RadioFrecuencia|SapUsuario)."),
        ],
        responses={200: AuditEntryResponseSerializer(many=True)},
        tags=["Auditoria"],
        description="Obtiene los eventos de auditoria mas recientes.",
    )
    def list(self, request):
        limit_raw = request.query_params.get("limit")
        try:
            limit = int(limit_raw) if limit_raw is not None else 20
        except (TypeError, ValueError):
            raise ValidationError({"limit": "Debe ser un entero valido."})
        limit = max(1, min(limit, 200))

        aggregate = request.query_params.get("aggregate")
        qs = AuditEntry.objects.all().order_by("-at")
        if aggregate:
            qs = qs.filter(aggregate=aggregate)
        entries: Sequence[AuditEntry] = list(qs[:limit])

        actor_ids = {entry.actor_user_id for entry in entries}
        user_map = {user.id: user.username for user in UserModel.objects.filter(id__in=actor_ids)}
        for entry in entries:
            setattr(entry, "actor_username", user_map.get(entry.actor_user_id))

        serializer = AuditEntryResponseSerializer(entries, many=True)
        return Response(serializer.data)


# ----------------- Usuarios de aplicacion -----------------


class AppUserViewSet(viewsets.ViewSet):
    permission_classes = [IsAdmin]

    @extend_schema(
        parameters=[
            OpenApiParameter("q", OpenApiTypes.STR, OpenApiParameter.QUERY, description="Filtrar por username."),
        ],
        responses={200: AppUserResponseSerializer(many=True)},
        tags=["UsuariosApp"],
        description="Lista los usuarios que pueden ingresar a la aplicacion.",
    )
    def list(self, request):
        q = request.query_params.get("q")
        qs = UserModel.objects.all().order_by("username")
        if q:
            qs = qs.filter(username__icontains=q)
        serializer = AppUserResponseSerializer(qs, many=True)
        return Response(serializer.data)

    @extend_schema(
        request=AppUserCreateSerializer,
        responses={201: AppUserResponseSerializer, 400: OpenApiResponse(description="Error de validacion")},
        tags=["UsuariosApp"],
        description="Crea un usuario del sistema.",
    )
    def create(self, request):
        serializer = AppUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]
        is_staff = serializer.validated_data.get("is_staff", False)

        if UserModel.objects.filter(username=username).exists():
            raise ValidationError({"username": "Ya existe un usuario con ese nombre."})

        user = UserModel.objects.create_user(username=username, password=password)
        user.is_staff = is_staff
        user.save(update_fields=["is_staff"])

        response = AppUserResponseSerializer(user).data
        return Response(response, status=201)

    @extend_schema(
        request=AppUserUpdateSerializer,
        responses={200: AppUserResponseSerializer, 400: OpenApiResponse(description="Error de validacion"), 404: OpenApiResponse(description="No encontrado")},
        tags=["UsuariosApp"],
        description="Actualiza parcialmente un usuario del sistema.",
    )
    def partial_update(self, request, pk: Optional[str] = None):
        serializer = AppUserUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            user = UserModel.objects.get(pk=pk)
        except UserModel.DoesNotExist:
            return Response({"detail": "No encontrado"}, status=404)

        data = serializer.validated_data
        updated = False
        if "is_active" in data:
            user.is_active = data["is_active"]
            updated = True
        if "is_staff" in data:
            user.is_staff = data["is_staff"]
            updated = True
        password = data.get("password")
        if password:
            user.set_password(password)
            updated = True

        if updated:
            user.save()

        response = AppUserResponseSerializer(user).data
        return Response(response)

    @extend_schema(
        responses={204: OpenApiResponse(description="Eliminado"), 400: OpenApiResponse(description="No permitido"), 404: OpenApiResponse(description="No encontrado")},
        tags=["UsuariosApp"],
        description="Elimina un usuario del sistema.",
    )
    def destroy(self, request, pk: Optional[str] = None):
        try:
            user = UserModel.objects.get(pk=pk)
        except UserModel.DoesNotExist:
            return Response({"detail": "No encontrado"}, status=404)

        if user.pk == request.user.pk:
            return Response({"detail": "No puedes eliminar tu propio usuario."}, status=400)

        user.delete()
        return Response(status=204)


# ----------------- Prestamos -----------------


class PrestamoViewSet(viewsets.ViewSet):
    permission_classes = [IsAdmin]

    def get_permissions(self):  # type: ignore[override]
        if self.action in {"list", "create", "asignar", "devolver"}:
            from rest_framework.permissions import IsAuthenticated

            return [IsAuthenticated()]
        return super().get_permissions()

    @extend_schema(
        parameters=[
            OpenApiParameter("cedula", OpenApiTypes.STR, OpenApiParameter.QUERY, description="Filtrar por cédula"),
            OpenApiParameter("codigo_radio", OpenApiTypes.STR, OpenApiParameter.QUERY, description="Filtrar por código de radio"),
        ],
        responses={200: PrestamoResponseSerializer(many=True)},
        tags=["Prestamos"],
        description="Lista préstamos. Si no se filtra, devuelve los más recientes primero.",
    )
    def list(self, request):
        cedula: Optional[str] = request.query_params.get("cedula")
        codigo_radio: Optional[str] = request.query_params.get("codigo_radio")
        prestamos = prestamos_repo.listar(cedula=cedula, codigo_radio=codigo_radio)
        payload = [prestamo.__dict__ for prestamo in prestamos]
        data = PrestamoResponseSerializer(payload, many=True).data
        return Response(data)

    @extend_schema(
        request=AsignarPrestamoRequestSerializer,
        responses={201: PrestamoResponseSerializer},
        tags=["Prestamos"],
        description="Crear un préstamo. Determina turno y usuario que registra automáticamente.",
    )
    @_handle_domain_errors
    def create(self, request):
        serializer = AsignarPrestamoRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ahora = serializer.validated_data.get("ahora") or timezone.localtime()
        cmd = AsignarPrestamoCmd(
            cedula=serializer.validated_data["cedula"],
            codigo_radio=serializer.validated_data["codigo_radio"],
            usuario_sap=serializer.validated_data["usuario_sap"],
            usuario_registra_id=request.user.id,
            ahora=ahora,
        )
        prestamo = prestamo_uc.asignar(cmd)
        return Response(PrestamoResponseSerializer(prestamo.__dict__).data, status=201)

    @extend_schema(
        request=DevolverPrestamoRequestSerializer,
        responses={200: PrestamoResponseSerializer, 400: OpenApiResponse(description="Petición inválida")},
        tags=["Prestamos"],
        description="Registrar devolución por cédula, usuario SAP o código de radio.",
    )
    @_handle_domain_errors
    @action(detail=False, methods=["post"], url_path="devolver")
    def devolver(self, request):
        serializer = DevolverPrestamoRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        provided = [
            bool(serializer.validated_data.get("codigo_radio")),
            bool(serializer.validated_data.get("cedula")),
            bool(serializer.validated_data.get("usuario_sap")),
        ]
        if sum(provided) != 1:
            return Response(
                {"detail": "Debe enviar exactamente uno de: codigo_radio, cedula o usuario_sap"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ahora = serializer.validated_data.get("ahora") or timezone.localtime()
        codigo_radio = serializer.validated_data.get("codigo_radio")
        cedula = serializer.validated_data.get("cedula")
        usuario_sap = serializer.validated_data.get("usuario_sap")

        if codigo_radio:
            cmd = DevolverPorRadioCmd(codigo_radio=codigo_radio, ahora=ahora)
            prestamo = prestamo_uc.devolver_por_radio(cmd)
        elif cedula:
            cmd = DevolverPorCedulaCmd(cedula=cedula, ahora=ahora)
            prestamo = prestamo_uc.devolver_por_cedula(cmd)
        else:
            cmd = DevolverPorUsuarioSapCmd(usuario_sap=usuario_sap, ahora=ahora)
            prestamo = prestamo_uc.devolver_por_usuario_sap(cmd)

        return Response(PrestamoResponseSerializer(prestamo.__dict__).data)
