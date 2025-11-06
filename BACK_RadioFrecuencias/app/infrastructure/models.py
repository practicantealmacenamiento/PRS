from django.conf import settings
from django.db import models


class TimeStampedMixin(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class EmpleadoModel(TimeStampedMixin):
    id = models.BigAutoField(primary_key=True)
    cedula = models.CharField(max_length=15, unique=True, db_index=True)
    nombre = models.CharField(max_length=150)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "empleados"
        indexes = [
            models.Index(fields=["cedula"]),
            models.Index(fields=["activo"]),
        ]

    def __str__(self):
        return f"{self.cedula} - {self.nombre}"


class RadioFrecuenciaModel(TimeStampedMixin):
    id = models.BigAutoField(primary_key=True)
    codigo = models.CharField(max_length=25, unique=True, db_index=True)
    descripcion = models.CharField(max_length=255, null=True, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "radios"
        indexes = [
            models.Index(fields=["codigo"]),
            models.Index(fields=["activo"]),
        ]

    def __str__(self):
        return self.codigo


class SapUsuarioModel(TimeStampedMixin):
    id = models.BigAutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True, db_index=True)
    empleado = models.ForeignKey(
        EmpleadoModel, null=True, blank=True, on_delete=models.SET_NULL, related_name="usuarios_sap"
    )
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "sap_usuarios"
        indexes = [
            models.Index(fields=["username"]),
            models.Index(fields=["activo"]),
        ]

    def __str__(self):
        return self.username


class PrestamoModel(TimeStampedMixin):
    id = models.BigAutoField(primary_key=True)
    cedula = models.CharField(max_length=15, db_index=True)
    empleado_nombre = models.CharField(max_length=150)
    usuario_sap = models.CharField(max_length=50, db_index=True)
    codigo_radio = models.CharField(max_length=25, db_index=True)

    fecha_hora_prestamo = models.DateTimeField()
    turno = models.CharField(max_length=40)  # "Turno 1 (6 am - 2 pm)" etc.
    estado = models.CharField(max_length=12)  # "ASIGNADO" | "DEVUELTO"

    usuario_registra = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="prestamos_registrados",
        db_index=True,
    )
    fecha_hora_devolucion = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "prestamos"
        indexes = [
            models.Index(fields=["cedula", "estado"]),
            models.Index(fields=["codigo_radio", "estado"]),
            models.Index(fields=["usuario_sap", "estado"]),
        ]

    def __str__(self):
        return f"{self.codigo_radio} -> {self.cedula} ({self.estado})"


# --- Auditoría (Infraestructura para AdminChangeEvent) ---

class AuditEntry(models.Model):
    aggregate = models.CharField(max_length=64, db_index=True)  # Empleado | RadioFrecuencia | SapUsuario
    action = models.CharField(max_length=16, db_index=True)     # CREATED | UPDATED | DELETED
    id_ref = models.CharField(max_length=128, db_index=True)    # cedula | codigo | username
    at = models.DateTimeField(db_index=True)                    # UTC recomendado
    actor_user_id = models.IntegerField(db_index=True)
    before = models.JSONField(null=True, blank=True)
    after = models.JSONField(null=True, blank=True)
    reason = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "audit_log"
        ordering = ["-at"]
        indexes = [
            models.Index(fields=["aggregate", "action"]),
            models.Index(fields=["at"]),
            models.Index(fields=["actor_user_id"]),
        ]

    def __str__(self):
        return f"[{self.at}] {self.aggregate}:{self.action} ({self.id_ref})"
