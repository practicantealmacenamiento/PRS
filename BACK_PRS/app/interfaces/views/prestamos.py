"""Viewset para asignar y devolver radios de frecuencia."""

from __future__ import annotations

from typing import Optional

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema

from ..permissions import IsAdmin
from ..serializers import (
    AsignarPrestamoRequestSerializer,
    DevolverPrestamoRequestSerializer,
    PrestamoResponseSerializer,
    RadioResponseSerializer,
    SapUsuarioResponseSerializer,
)
from ...application.use_cases import (
    AsignarPrestamoCmd,
    DevolverPorCedulaCmd,
    DevolverPorRadioCmd,
    DevolverPorUsuarioSapCmd,
)
from .shared import CatalogosServiceMixin, PrestamosServiceMixin, handle_domain_errors
from ...domain.value_objects import EstadoPrestamo


class PrestamoViewSet(CatalogosServiceMixin, PrestamosServiceMixin, viewsets.GenericViewSet):
    """Operaciones de asignacion y devolucion de radios."""

    permission_classes = [IsAdmin]

    def get_permissions(self):  # type: ignore[override]
        """Permite acceso de lectura/escritura a usuarios autenticados para acciones publicas."""
        if self.action in {"list", "create", "devolver"}:
            return [IsAuthenticated()]
        return super().get_permissions()

    @extend_schema(
        parameters=[
            OpenApiParameter("cedula", OpenApiTypes.STR, OpenApiParameter.QUERY, description="Filtrar por cedula"),
            OpenApiParameter("codigo_radio", OpenApiTypes.STR, OpenApiParameter.QUERY, description="Filtrar por codigo de radio"),
        ],
        responses={200: PrestamoResponseSerializer(many=True)},
        tags=["Prestamos"],
        description="Lista prestamos. Si no se filtra, devuelve los mas recientes primero.",
    )
    def list(self, request):
        """Lista prestamos abiertos o historicos segun los filtros recibidos."""
        cedula: Optional[str] = request.query_params.get("cedula")
        codigo_radio: Optional[str] = request.query_params.get("codigo_radio")
        prestamos = self.prestamos.listar(cedula=cedula, codigo_radio=codigo_radio)
        payload = [prestamo.__dict__ for prestamo in prestamos]
        data = PrestamoResponseSerializer(payload, many=True).data
        return Response(data)

    @extend_schema(
        request=AsignarPrestamoRequestSerializer,
        responses={201: PrestamoResponseSerializer},
        tags=["Prestamos"],
        description="Crear un prestamo. Determina turno y usuario que registra automaticamente.",
    )
    @handle_domain_errors
    def create(self, request):
        """Abre un prestamo validando entidades y calculando el turno actual."""
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
        prestamo = self.prestamos.asignar(**cmd.__dict__)
        return Response(PrestamoResponseSerializer(prestamo.__dict__).data, status=201)

    @extend_schema(
        request=DevolverPrestamoRequestSerializer,
        responses={200: PrestamoResponseSerializer, 400: OpenApiResponse(description="Peticion invalida")},
        tags=["Prestamos"],
        description="Registrar devolucion por cedula, usuario SAP o codigo de radio.",
    )
    @handle_domain_errors
    @action(detail=False, methods=["post"], url_path="devolver")
    def devolver(self, request):
        """Cierra un prestamo abierto identificando al titular por un unico campo."""
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
            prestamo = self.prestamos.devolver_por_radio(**cmd.__dict__)
        elif cedula:
            cmd = DevolverPorCedulaCmd(cedula=cedula, ahora=ahora)
            prestamo = self.prestamos.devolver_por_cedula(**cmd.__dict__)
        else:
            cmd = DevolverPorUsuarioSapCmd(usuario_sap=usuario_sap, ahora=ahora)
            prestamo = self.prestamos.devolver_por_usuario_sap(**cmd.__dict__)

        return Response(PrestamoResponseSerializer(prestamo.__dict__).data)

    @extend_schema(
        responses={
            200: OpenApiResponse(description="Listas de SAP usuarios y radios disponibles para prestar."),
        },
        tags=["Prestamos"],
        description="Devuelve usuarios SAP y radios que NO tienen un prestamo abierto actualmente.",
    )
    @action(detail=False, methods=["get"], url_path="disponibles", permission_classes=[IsAuthenticated])
    def disponibles(self, request):
        """Retorna los SAP usuarios y radios disponibles (sin prestamo abierto)."""
        # Obtener codigos/usernames actualmente prestados
        prestamos_abiertos = self.prestamos.listar()
        sap_en_uso = {
            p.usuario_sap
            for p in prestamos_abiertos
            if p.estado == EstadoPrestamo.ASIGNADO
        }
        radios_en_uso = {
            p.codigo_radio
            for p in prestamos_abiertos
            if p.estado == EstadoPrestamo.ASIGNADO
        }

        # Filtrar catálogos
        todos_sap = self.catalogos.sap.listar()
        sap_disponibles = [
            s for s in todos_sap
            if s.activo and s.username not in sap_en_uso
        ]

        todas_radios = self.catalogos.radios.listar()
        radios_disponibles = [
            r for r in todas_radios
            if r.activo and r.codigo not in radios_en_uso
        ]

        return Response({
            "sap_usuarios": SapUsuarioResponseSerializer(
                [s.__dict__ for s in sap_disponibles], many=True
            ).data,
            "radios": RadioResponseSerializer(
                [r.__dict__ for r in radios_disponibles], many=True
            ).data,
        })

    @extend_schema(
        responses={
            200: OpenApiResponse(description="Listas de SAP usuarios y radios actualmente prestados (ASIGNADO)."),
        },
        tags=["Prestamos"],
        description="Devuelve usuarios SAP y radios que tienen un prestamo abierto actualmente, con datos del prestamo.",
    )
    @action(detail=False, methods=["get"], url_path="asignados", permission_classes=[IsAuthenticated])
    def asignados(self, request):
        """Retorna los SAP usuarios y radios con prestamo abierto (para formulario de devolucion)."""
        prestamos_abiertos = [
            p for p in self.prestamos.listar()
            if p.estado == EstadoPrestamo.ASIGNADO
        ]

        # Construir lista enriquecida: codigo_radio + info del prestamo
        radios_asignadas = [
            {
                "codigo_radio": p.codigo_radio,
                "usuario_sap": p.usuario_sap,
                "cedula": p.cedula,
                "empleado_nombre": p.empleado_nombre,
                "prestamo_id": p.id,
            }
            for p in prestamos_abiertos
        ]

        # SAP usuarios asignados
        sap_asignados = [
            {
                "username": p.usuario_sap,
                "codigo_radio": p.codigo_radio,
                "cedula": p.cedula,
                "empleado_nombre": p.empleado_nombre,
                "prestamo_id": p.id,
            }
            for p in prestamos_abiertos
        ]

        return Response({
            "sap_usuarios": sap_asignados,
            "radios": radios_asignadas,
        })
