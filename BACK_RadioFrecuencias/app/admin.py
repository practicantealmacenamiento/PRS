from django.contrib import admin

# Register your models here.
from django.contrib import admin
from django.utils import timezone

from .infrastructure.models import (
    EmpleadoModel,
    RadioFrecuenciaModel,
    SapUsuarioModel,
    PrestamoModel,
)

# ---------- Inlines ----------
class SapUsuarioInline(admin.TabularInline):
    model = SapUsuarioModel
    extra = 0
    fields = ("username", "activo")
    show_change_link = True

# ---------- Empleado ----------
@admin.register(EmpleadoModel)
class EmpleadoAdmin(admin.ModelAdmin):
    list_display = ("cedula", "nombre", "activo", "total_prestamos")
    search_fields = ("cedula", "nombre")
    list_filter = ("activo",)
    inlines = [SapUsuarioInline]

    @admin.display(description="Préstamos")
    def total_prestamos(self, obj):
        return PrestamoModel.objects.filter(cedula=obj.cedula).count()

# ---------- RadioFrecuencia ----------
@admin.register(RadioFrecuenciaModel)
class RadioFrecuenciaAdmin(admin.ModelAdmin):
    list_display = ("codigo", "descripcion", "activo", "prestamos_abiertos")
    search_fields = ("codigo", "descripcion")
    list_filter = ("activo",)

    @admin.display(description="Abiertos")
    def prestamos_abiertos(self, obj):
        return PrestamoModel.objects.filter(
            codigo_radio=obj.codigo,
            fecha_hora_devolucion__isnull=True,
        ).count()

# ---------- SAP Usuario ----------
@admin.register(SapUsuarioModel)
class SapUsuarioAdmin(admin.ModelAdmin):
    list_display = ("username", "empleado", "activo")
    search_fields = ("username", "empleado__nombre", "empleado__cedula")
    list_filter = ("activo",)
    autocomplete_fields = ("empleado",)

# ---------- Acciones para Préstamos ----------
@admin.action(description="Marcar seleccionados como DEVUELTO (fecha ahora)")
def marcar_como_devuelto(modeladmin, request, queryset):
    qs = queryset.filter(fecha_hora_devolucion__isnull=True)
    n = qs.update(fecha_hora_devolucion=timezone.now(), estado="DEVUELTO")
    modeladmin.message_user(request, f"{n} préstamo(s) marcados como devueltos.")

# ---------- Préstamo ----------
@admin.register(PrestamoModel)
class PrestamoAdmin(admin.ModelAdmin):
    date_hierarchy = "fecha_hora_prestamo"
    list_display = (
        "id",
        "codigo_radio",
        "cedula",
        "empleado_nombre",
        "usuario_sap",
        "turno",
        "estado",
        "fecha_hora_prestamo",
        "fecha_hora_devolucion",
        "usuario_registra",
    )
    list_filter = ("estado", "turno", ("fecha_hora_prestamo", admin.DateFieldListFilter))
    search_fields = ("codigo_radio", "cedula", "empleado_nombre", "usuario_sap")
    readonly_fields = ()  # puedes poner ("fecha_hora_prestamo",) si no quieres editarlo desde admin
    autocomplete_fields = ("usuario_registra",)
    actions = [marcar_como_devuelto]

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("usuario_registra")
