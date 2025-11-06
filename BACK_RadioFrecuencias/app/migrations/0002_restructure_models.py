from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


def populate_prestamo_plain_fields(apps, schema_editor):
    Prestamo = apps.get_model("app", "PrestamoModel")

    for prestamo in Prestamo.objects.all().select_related(
        "empleado_fk", "radio_fk", "usuario_sap_fk"
    ):
        cedula = ""
        nombre = ""
        usuario = ""
        codigo = ""

        empleado = getattr(prestamo, "empleado_fk", None)
        if empleado:
            cedula = empleado.cedula or ""
            nombre = empleado.nombre or ""

        usuario_sap = getattr(prestamo, "usuario_sap_fk", None)
        if usuario_sap:
            usuario = usuario_sap.username or ""

        radio = getattr(prestamo, "radio_fk", None)
        if radio:
            codigo = radio.codigo or ""

        Prestamo.objects.filter(pk=prestamo.pk).update(
            cedula=cedula,
            empleado_nombre=nombre,
            usuario_sap=usuario,
            codigo_radio=codigo,
        )


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0001_initial"),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name="prestamomodel",
            name="rf_prestamo_radio_i_9f7857_idx",
        ),
        migrations.RemoveIndex(
            model_name="prestamomodel",
            name="rf_prestamo_emplead_43b95a_idx",
        ),
        migrations.RenameField(
            model_name="prestamomodel",
            old_name="empleado",
            new_name="empleado_fk",
        ),
        migrations.RenameField(
            model_name="prestamomodel",
            old_name="radio",
            new_name="radio_fk",
        ),
        migrations.RenameField(
            model_name="prestamomodel",
            old_name="usuario_sap",
            new_name="usuario_sap_fk",
        ),
        migrations.AddField(
            model_name="empleadomodel",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                db_index=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="empleadomodel",
            name="updated_at",
            field=models.DateTimeField(
                auto_now=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="radiofrecuenciamodel",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                db_index=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="radiofrecuenciamodel",
            name="updated_at",
            field=models.DateTimeField(
                auto_now=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="sapusuariomodel",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                db_index=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="sapusuariomodel",
            name="updated_at",
            field=models.DateTimeField(
                auto_now=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="prestamomodel",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                db_index=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="prestamomodel",
            name="updated_at",
            field=models.DateTimeField(
                auto_now=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="prestamomodel",
            name="cedula",
            field=models.CharField(
                db_index=True,
                default="",
                max_length=15,
            ),
        ),
        migrations.AddField(
            model_name="prestamomodel",
            name="codigo_radio",
            field=models.CharField(
                db_index=True,
                default="",
                max_length=25,
            ),
        ),
        migrations.AddField(
            model_name="prestamomodel",
            name="empleado_nombre",
            field=models.CharField(default="", max_length=150),
        ),
        migrations.AddField(
            model_name="prestamomodel",
            name="usuario_sap",
            field=models.CharField(
                db_index=True,
                default="",
                max_length=50,
            ),
        ),
        migrations.AlterField(
            model_name="radiofrecuenciamodel",
            name="descripcion",
            field=models.CharField(
                blank=True,
                max_length=255,
                null=True,
            ),
        ),
        migrations.RunPython(
            populate_prestamo_plain_fields,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="prestamomodel",
            name="cedula",
            field=models.CharField(db_index=True, max_length=15),
        ),
        migrations.AlterField(
            model_name="prestamomodel",
            name="codigo_radio",
            field=models.CharField(db_index=True, max_length=25),
        ),
        migrations.AlterField(
            model_name="prestamomodel",
            name="empleado_nombre",
            field=models.CharField(max_length=150),
        ),
        migrations.AlterField(
            model_name="prestamomodel",
            name="usuario_sap",
            field=models.CharField(db_index=True, max_length=50),
        ),
        migrations.RemoveField(
            model_name="prestamomodel",
            name="empleado_fk",
        ),
        migrations.RemoveField(
            model_name="prestamomodel",
            name="radio_fk",
        ),
        migrations.RemoveField(
            model_name="prestamomodel",
            name="usuario_sap_fk",
        ),
        migrations.AlterField(
            model_name="prestamomodel",
            name="estado",
            field=models.CharField(max_length=12),
        ),
        migrations.AlterField(
            model_name="prestamomodel",
            name="usuario_registra",
            field=models.ForeignKey(
                db_index=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="prestamos_registrados",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterModelTable(
            name="empleadomodel",
            table="empleados",
        ),
        migrations.AlterModelTable(
            name="radiofrecuenciamodel",
            table="radios",
        ),
        migrations.AlterModelTable(
            name="sapusuariomodel",
            table="sap_usuarios",
        ),
        migrations.AlterModelTable(
            name="prestamomodel",
            table="prestamos",
        ),
        migrations.CreateModel(
            name="AuditEntry",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("aggregate", models.CharField(db_index=True, max_length=64)),
                ("action", models.CharField(db_index=True, max_length=16)),
                ("id_ref", models.CharField(db_index=True, max_length=128)),
                ("at", models.DateTimeField(db_index=True)),
                ("actor_user_id", models.IntegerField(db_index=True)),
                ("before", models.JSONField(blank=True, null=True)),
                ("after", models.JSONField(blank=True, null=True)),
                ("reason", models.TextField(blank=True, null=True)),
            ],
            options={
                "db_table": "audit_log",
                "ordering": ["-at"],
            },
        ),
        migrations.AddIndex(
            model_name="empleadomodel",
            index=models.Index(
                fields=["cedula"],
                name="empleados_cedula_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="empleadomodel",
            index=models.Index(
                fields=["activo"],
                name="empleados_activo_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="radiofrecuenciamodel",
            index=models.Index(
                fields=["codigo"],
                name="radios_codigo_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="radiofrecuenciamodel",
            index=models.Index(
                fields=["activo"],
                name="radios_activo_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="sapusuariomodel",
            index=models.Index(
                fields=["username"],
                name="sap_usuarios_username_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="sapusuariomodel",
            index=models.Index(
                fields=["activo"],
                name="sap_usuarios_activo_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="prestamomodel",
            index=models.Index(
                fields=["cedula", "estado"],
                name="prestamos_cedula_estado_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="prestamomodel",
            index=models.Index(
                fields=["codigo_radio", "estado"],
                name="prestamos_codigo_estado_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="prestamomodel",
            index=models.Index(
                fields=["usuario_sap", "estado"],
                name="prestamos_usuario_estado_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="prestamomodel",
            index=models.Index(
                fields=["usuario_registra"],
                name="prestamos_usuario_registra_idx",
            ),
        ),
    ]
