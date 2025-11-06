from __future__ import annotations
from typing import Optional
from rest_framework import serializers

# ---- Empleado ----

class EmpleadoRequestSerializer(serializers.Serializer):
    cedula = serializers.CharField(max_length=15)
    nombre = serializers.CharField(max_length=150)
    activo = serializers.BooleanField(default=True)

class EmpleadoUpdateSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=150, required=False)
    activo = serializers.BooleanField(required=False)

class EmpleadoResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    cedula = serializers.CharField()
    nombre = serializers.CharField()
    activo = serializers.BooleanField()


# ---- Radio ----

class RadioRequestSerializer(serializers.Serializer):
    codigo = serializers.CharField(max_length=25)
    descripcion = serializers.CharField(max_length=255, allow_null=True, allow_blank=True, required=False)
    activo = serializers.BooleanField(default=True)

class RadioUpdateSerializer(serializers.Serializer):
    descripcion = serializers.CharField(max_length=255, allow_null=True, allow_blank=True, required=False)
    activo = serializers.BooleanField(required=False)

class RadioResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    codigo = serializers.CharField()
    descripcion = serializers.CharField(allow_null=True, allow_blank=True)
    activo = serializers.BooleanField()


# ---- SAP Usuario ----

class SapUsuarioRequestSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50)
    empleado_cedula = serializers.CharField(max_length=15, required=False, allow_null=True, allow_blank=True)
    activo = serializers.BooleanField(default=True)

class SapUsuarioUpdateSerializer(serializers.Serializer):
    empleado_cedula = serializers.CharField(max_length=15, required=False, allow_null=True, allow_blank=True)
    activo = serializers.BooleanField(required=False)

class SapUsuarioResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    empleado_id = serializers.IntegerField(allow_null=True)
    empleado_cedula = serializers.CharField(allow_null=True)
    activo = serializers.BooleanField()


# ---- Auditoria ----

class AuditEntryResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    aggregate = serializers.CharField()
    action = serializers.CharField()
    id_ref = serializers.CharField()
    at = serializers.DateTimeField()
    actor_user_id = serializers.IntegerField()
    actor_username = serializers.CharField(allow_null=True)
    before = serializers.JSONField(allow_null=True)
    after = serializers.JSONField(allow_null=True)
    reason = serializers.CharField(allow_null=True)


# ---- Usuarios de aplicacion ----

class AppUserResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    is_active = serializers.BooleanField()
    is_staff = serializers.BooleanField()
    is_superuser = serializers.BooleanField()
    last_login = serializers.DateTimeField(allow_null=True)


class AppUserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(max_length=128, write_only=True)
    is_staff = serializers.BooleanField(default=False)


class AppUserUpdateSerializer(serializers.Serializer):
    is_active = serializers.BooleanField(required=False)
    is_staff = serializers.BooleanField(required=False)
    password = serializers.CharField(max_length=128, allow_blank=True, required=False, write_only=True)


# ---- Prestamos ----

class AsignarPrestamoRequestSerializer(serializers.Serializer):
    cedula = serializers.CharField(max_length=15)
    codigo_radio = serializers.CharField(max_length=25)
    usuario_sap = serializers.CharField(max_length=50)
    ahora = serializers.DateTimeField(required=False)  # si no llega, se tomará hora local del servidor

class DevolverPrestamoRequestSerializer(serializers.Serializer):
    """
    Debe venir EXACTAMENTE uno de los siguientes campos:
    - codigo_radio
    - cedula
    - usuario_sap
    """
    codigo_radio = serializers.CharField(max_length=25, required=False, allow_blank=True)
    cedula = serializers.CharField(max_length=15, required=False, allow_blank=True)
    usuario_sap = serializers.CharField(max_length=50, required=False, allow_blank=True)
    ahora = serializers.DateTimeField(required=False)

class PrestamoResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    cedula = serializers.CharField()
    empleado_nombre = serializers.CharField()
    usuario_sap = serializers.CharField()
    codigo_radio = serializers.CharField()
    fecha_hora_prestamo = serializers.DateTimeField()
    turno = serializers.CharField(source="turno.value")
    estado = serializers.CharField(source="estado.value")
    usuario_registra_id = serializers.IntegerField()
    fecha_hora_devolucion = serializers.DateTimeField(allow_null=True)
    usuario_registra_username = serializers.CharField(allow_null=True)
