"""DRF viewset para consultar el log de auditoria."""

from __future__ import annotations

from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema

from ..permissions import IsAdmin
from ..serializers import AuditEntryResponseSerializer
from .shared import AuditQueryServiceMixin


class AuditLogViewSet(AuditQueryServiceMixin, viewsets.GenericViewSet):
    """Expone solo lectura sobre los eventos de auditoria registrados."""

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
        """Devuelve registros de auditoria respetando limites y filtros validados."""
        limit_raw = request.query_params.get("limit")
        try:
            limit = int(limit_raw) if limit_raw is not None else 20
        except (TypeError, ValueError):
            raise ValidationError({"limit": "Debe ser un entero valido."})
        limit = max(1, min(limit, 200))

        aggregate = request.query_params.get("aggregate")
        records = self.audit_queries.listar(limit=limit, aggregate=aggregate)
        serializer = AuditEntryResponseSerializer(records, many=True)
        return Response(serializer.data)
