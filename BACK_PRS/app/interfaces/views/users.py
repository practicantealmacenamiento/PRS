"""Viewset para administrar los usuarios internos de la aplicacion."""

from __future__ import annotations

from typing import Optional

from django.contrib.auth import get_user_model
from django.db.models import ProtectedError
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema

from ..permissions import IsAdmin
from ..serializers import (
    AppUserCreateSerializer,
    AppUserResponseSerializer,
    AppUserUpdateSerializer,
)


class AppUserViewSet(viewsets.GenericViewSet):
    """CRUD de usuarios de Django expuestos a la UI administrativa."""

    permission_classes = [IsAdmin]
    UserModel = get_user_model()

    @extend_schema(
        parameters=[
            OpenApiParameter("q", OpenApiTypes.STR, OpenApiParameter.QUERY, description="Filtrar por username."),
        ],
        responses={200: AppUserResponseSerializer(many=True)},
        tags=["UsuariosApp"],
        description="Lista los usuarios que pueden ingresar a la aplicacion.",
    )
    def list(self, request):
        """Lista usuarios del sistema con filtro parcial por username."""
        q = request.query_params.get("q")
        qs = self.UserModel.objects.all().order_by("username")
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
        """Crea un nuevo usuario (solo administradores)."""
        serializer = AppUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]
        is_staff = serializer.validated_data.get("is_staff", False)

        if self.UserModel.objects.filter(username=username).exists():
            raise ValidationError({"username": "Ya existe un usuario con ese nombre."})

        user = self.UserModel.objects.create_user(username=username, password=password)
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
        """Actualiza flags (activo/staff) o el password del usuario."""
        serializer = AppUserUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            user = self.UserModel.objects.get(pk=pk)
        except self.UserModel.DoesNotExist:
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
        """Elimina un usuario distinto al solicitante actual."""
        try:
            user = self.UserModel.objects.get(pk=pk)
        except self.UserModel.DoesNotExist:
            return Response({"detail": "No encontrado"}, status=404)

        if user.pk == request.user.pk:
            return Response({"detail": "No puedes eliminar tu propio usuario."}, status=400)

        try:
            user.delete()
        except ProtectedError:
            return Response(
                {"detail": "No es posible eliminar el usuario porque tiene registros asociados."},
                status=409,
            )
        return Response(status=204)
