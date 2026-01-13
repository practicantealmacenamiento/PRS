"""Viewsets de catalogos (empleados, radios y usuarios SAP)."""

from __future__ import annotations

from typing import Any, Dict, Optional

from rest_framework import viewsets
from rest_framework.response import Response
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema

from ..permissions import IsAuthenticatedReadOnlyOrAdmin
from ..serializers import (
    EmpleadoRequestSerializer,
    EmpleadoResponseSerializer,
    EmpleadoUpdateSerializer,
    RadioRequestSerializer,
    RadioResponseSerializer,
    RadioUpdateSerializer,
    SapUsuarioRequestSerializer,
    SapUsuarioResponseSerializer,
    SapUsuarioUpdateSerializer,
)
from ...application.use_cases import (
    ActualizarEmpleadoCmd,
    ActualizarRadioCmd,
    ActualizarSapUsuarioCmd,
    CrearEmpleadoCmd,
    CrearRadioCmd,
    CrearSapUsuarioCmd,
    EliminarEmpleadoCmd,
    EliminarRadioCmd,
    EliminarSapUsuarioCmd,
)
from .shared import CatalogosServiceMixin, handle_domain_errors


def _serialize(serializer_cls, entity) -> Dict[str, Any]:
    """Convierte la entidad del dominio en payload usando el serializer indicado."""
    return serializer_cls(entity.__dict__).data


class EmpleadoViewSet(CatalogosServiceMixin, viewsets.GenericViewSet):
    """CRUD del catalogo de empleados con validaciones de dominio."""

    permission_classes = [IsAuthenticatedReadOnlyOrAdmin]
    lookup_field = "cedula"

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="q",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filtrar por nombre o cedula",
            )
        ],
        responses={200: EmpleadoResponseSerializer(many=True)},
        tags=["Empleados"],
    )
    def list(self, request):
        """Lista empleados permitiendo filtrar por nombre o cedula."""
        q = request.query_params.get("q")
        empleados = self.catalogos.empleados.listar(q=q)
        data = [_serialize(EmpleadoResponseSerializer, emp) for emp in empleados]
        return Response(data)

    @extend_schema(
        parameters=[OpenApiParameter("cedula", OpenApiTypes.STR, OpenApiParameter.PATH)],
        responses={200: EmpleadoResponseSerializer, 404: OpenApiResponse(description="No encontrado")},
        tags=["Empleados"],
    )
    def retrieve(self, request, cedula: Optional[str] = None):
        """Obtiene un empleado especifico por su cedula."""
        empleado = self.catalogos.empleados.obtener_por_cedula(cedula)
        if not empleado:
            return Response({"detail": "No encontrado"}, status=404)
        return Response(_serialize(EmpleadoResponseSerializer, empleado))

    @extend_schema(
        request=EmpleadoRequestSerializer,
        responses={201: EmpleadoResponseSerializer, 400: OpenApiResponse(description="Error")},
        tags=["Empleados"],
        description="Crear empleado (solo admin).",
    )
    @handle_domain_errors
    def create(self, request):
        """Crea un empleado nuevo usando el servicio de catalogos."""
        serializer = EmpleadoRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cmd = CrearEmpleadoCmd(
            cedula=serializer.validated_data["cedula"],
            nombre=serializer.validated_data["nombre"],
            activo=serializer.validated_data.get("activo", True),
            actor_user_id=request.user.id,
        )
        empleado = self.catalogos.crear_empleado(**cmd.__dict__)
        return Response(_serialize(EmpleadoResponseSerializer, empleado), status=201)

    @extend_schema(
        parameters=[OpenApiParameter("cedula", OpenApiTypes.STR, OpenApiParameter.PATH)],
        request=EmpleadoUpdateSerializer,
        responses={200: EmpleadoResponseSerializer, 400: OpenApiResponse(description="Error"), 404: OpenApiResponse(description="No encontrado")},
        tags=["Empleados"],
        description="Actualizar parcialmente un empleado (solo admin).",
    )
    @handle_domain_errors
    def partial_update(self, request, cedula: Optional[str] = None):
        """Actualiza campos permitidos de un empleado existente."""
        serializer = EmpleadoUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        cmd = ActualizarEmpleadoCmd(
            cedula=cedula,
            cambios=serializer.validated_data,
            actor_user_id=request.user.id,
        )
        empleado = self.catalogos.actualizar_empleado(**cmd.__dict__)
        return Response(_serialize(EmpleadoResponseSerializer, empleado))

    @extend_schema(
        parameters=[OpenApiParameter("cedula", OpenApiTypes.STR, OpenApiParameter.PATH)],
        responses={204: OpenApiResponse(description="Eliminado"), 400: OpenApiResponse(description="Error"), 404: OpenApiResponse(description="No encontrado")},
        tags=["Empleados"],
        description="Eliminar empleado (solo admin).",
    )
    @handle_domain_errors
    def destroy(self, request, cedula: Optional[str] = None):
        """Elimina un empleado por cedula."""
        cmd = EliminarEmpleadoCmd(cedula=cedula, actor_user_id=request.user.id)
        self.catalogos.eliminar_empleado(**cmd.__dict__)
        return Response(status=204)


class RadioViewSet(CatalogosServiceMixin, viewsets.GenericViewSet):
    """CRUD del catalogo de radios de frecuencia."""

    permission_classes = [IsAuthenticatedReadOnlyOrAdmin]
    lookup_field = "codigo"

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="q",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filtrar por codigo o descripcion parcial",
            )
        ],
        responses={200: RadioResponseSerializer(many=True)},
        tags=["Radios"],
    )
    def list(self, request):
        """Lista radios permitiendo filtro por codigo o descripcion."""
        q = request.query_params.get("q")
        radios = self.catalogos.radios.listar(q=q)
        data = [_serialize(RadioResponseSerializer, radio) for radio in radios]
        return Response(data)

    @extend_schema(
        parameters=[OpenApiParameter("codigo", OpenApiTypes.STR, OpenApiParameter.PATH)],
        responses={200: RadioResponseSerializer, 404: OpenApiResponse(description="No encontrado")},
        tags=["Radios"],
    )
    def retrieve(self, request, codigo: Optional[str] = None):
        """Obtiene una radio especifica por su codigo."""
        radio = self.catalogos.radios.obtener_por_codigo(codigo)
        if not radio:
            return Response({"detail": "No encontrado"}, status=404)
        return Response(_serialize(RadioResponseSerializer, radio))

    @extend_schema(
        request=RadioRequestSerializer,
        responses={201: RadioResponseSerializer, 400: OpenApiResponse(description="Error")},
        tags=["Radios"],
        description="Crear radio (solo admin).",
    )
    @handle_domain_errors
    def create(self, request):
        """Crea una radio nueva en el catalogo."""
        serializer = RadioRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cmd = CrearRadioCmd(
            codigo=serializer.validated_data["codigo"],
            descripcion=serializer.validated_data.get("descripcion"),
            activo=serializer.validated_data.get("activo", True),
            actor_user_id=request.user.id,
        )
        radio = self.catalogos.crear_radio(**cmd.__dict__)
        return Response(_serialize(RadioResponseSerializer, radio), status=201)

    @extend_schema(
        parameters=[OpenApiParameter("codigo", OpenApiTypes.STR, OpenApiParameter.PATH)],
        request=RadioUpdateSerializer,
        responses={200: RadioResponseSerializer, 400: OpenApiResponse(description="Error"), 404: OpenApiResponse(description="No encontrado")},
        tags=["Radios"],
        description="Actualizar parcialmente una radio (solo admin).",
    )
    @handle_domain_errors
    def partial_update(self, request, codigo: Optional[str] = None):
        """Actualiza la descripcion o estado de una radio."""
        serializer = RadioUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        cmd = ActualizarRadioCmd(
            codigo=codigo,
            cambios=serializer.validated_data,
            actor_user_id=request.user.id,
        )
        radio = self.catalogos.actualizar_radio(**cmd.__dict__)
        return Response(_serialize(RadioResponseSerializer, radio))

    @extend_schema(
        parameters=[OpenApiParameter("codigo", OpenApiTypes.STR, OpenApiParameter.PATH)],
        responses={204: OpenApiResponse(description="Eliminado"), 400: OpenApiResponse(description="Error"), 404: OpenApiResponse(description="No encontrado")},
        tags=["Radios"],
        description="Eliminar radio (solo admin).",
    )
    @handle_domain_errors
    def destroy(self, request, codigo: Optional[str] = None):
        """Elimina una radio existente."""
        cmd = EliminarRadioCmd(
            codigo=codigo,
            actor_user_id=request.user.id,
        )
        self.catalogos.eliminar_radio(**cmd.__dict__)
        return Response(status=204)


class SapUsuarioViewSet(CatalogosServiceMixin, viewsets.GenericViewSet):
    """CRUD del catalogo de usuarios SAP."""

    permission_classes = [IsAuthenticatedReadOnlyOrAdmin]
    lookup_field = "username"

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="q",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Filtrar por username o cedula vinculada",
            )
        ],
        responses={200: SapUsuarioResponseSerializer(many=True)},
        tags=["SapUsuarios"],
    )
    def list(self, request):
        """Lista usuarios SAP con filtro opcional por username."""
        q = request.query_params.get("q")
        sap_usuarios = self.catalogos.sap.listar(q=q)
        data = [_serialize(SapUsuarioResponseSerializer, sap) for sap in sap_usuarios]
        return Response(data)

    @extend_schema(
        parameters=[OpenApiParameter("username", OpenApiTypes.STR, OpenApiParameter.PATH)],
        responses={200: SapUsuarioResponseSerializer, 404: OpenApiResponse(description="No encontrado")},
        tags=["SapUsuarios"],
    )
    def retrieve(self, request, username: Optional[str] = None):
        """Obtiene un usuario SAP por su username."""
        sap_usuario = self.catalogos.sap.obtener_por_username(username)
        if not sap_usuario:
            return Response({"detail": "No encontrado"}, status=404)
        return Response(_serialize(SapUsuarioResponseSerializer, sap_usuario))

    @extend_schema(
        request=SapUsuarioRequestSerializer,
        responses={201: SapUsuarioResponseSerializer, 400: OpenApiResponse(description="Error")},
        tags=["SapUsuarios"],
        description="Crear usuario SAP (solo admin).",
    )
    @handle_domain_errors
    def create(self, request):
        """Crea un usuario SAP y opcionalmente lo asocia a un empleado."""
        serializer = SapUsuarioRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cmd = CrearSapUsuarioCmd(
            username=serializer.validated_data["username"],
            empleado_cedula=serializer.validated_data.get("empleado_cedula"),
            activo=serializer.validated_data.get("activo", True),
            actor_user_id=request.user.id,
        )
        sap_usuario = self.catalogos.crear_sap_usuario(**cmd.__dict__)
        return Response(_serialize(SapUsuarioResponseSerializer, sap_usuario), status=201)

    @extend_schema(
        parameters=[OpenApiParameter("username", OpenApiTypes.STR, OpenApiParameter.PATH)],
        request=SapUsuarioUpdateSerializer,
        responses={200: SapUsuarioResponseSerializer, 400: OpenApiResponse(description="Error"), 404: OpenApiResponse(description="No encontrado")},
        tags=["SapUsuarios"],
        description="Actualizar parcialmente un usuario SAP (solo admin).",
    )
    @handle_domain_errors
    def partial_update(self, request, username: Optional[str] = None):
        """Actualiza datos del usuario SAP (estado o empleado asociado)."""
        serializer = SapUsuarioUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        cmd = ActualizarSapUsuarioCmd(
            username=username,
            cambios=serializer.validated_data,
            actor_user_id=request.user.id,
        )
        sap_usuario = self.catalogos.actualizar_sap_usuario(**cmd.__dict__)
        return Response(_serialize(SapUsuarioResponseSerializer, sap_usuario))

    @extend_schema(
        parameters=[OpenApiParameter("username", OpenApiTypes.STR, OpenApiParameter.PATH)],
        responses={204: OpenApiResponse(description="Eliminado"), 400: OpenApiResponse(description="Error"), 404: OpenApiResponse(description="No encontrado")},
        tags=["SapUsuarios"],
        description="Eliminar usuario SAP (solo admin).",
    )
    @handle_domain_errors
    def destroy(self, request, username: Optional[str] = None):
        """Elimina un usuario SAP del catalogo."""
        cmd = EliminarSapUsuarioCmd(username=username, actor_user_id=request.user.id)
        self.catalogos.eliminar_sap_usuario(**cmd.__dict__)
        return Response(status=204)
