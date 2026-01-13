from datetime import datetime, timezone

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from app.infrastructure.models import (
    EmpleadoModel,
    RadioFrecuenciaModel,
    SapUsuarioModel,
)


class PrestamoViewsTests(APITestCase):
    def setUp(self) -> None:
        EmpleadoModel.objects.all().delete()
        RadioFrecuenciaModel.objects.all().delete()
        SapUsuarioModel.objects.all().delete()

        User = get_user_model()
        self.user = User.objects.create_user(username="operador", password="pass", is_staff=True)
        self.client.force_authenticate(self.user)

        self.empleado = EmpleadoModel.objects.create(cedula="9001", nombre="Empleado Prestamo", activo=True)
        self.radio = RadioFrecuenciaModel.objects.create(codigo="RF-200", descripcion="Radio 200", activo=True)
        self.sap = SapUsuarioModel.objects.create(username="sap-prestamo", activo=True)

    def test_asignar_y_devolver_prestamo(self) -> None:
        url = reverse("prestamo-list")
        payload = {
            "cedula": self.empleado.cedula,
            "codigo_radio": self.radio.codigo,
            "usuario_sap": self.sap.username,
            "ahora": datetime.now(timezone.utc).isoformat(),
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(201, response.status_code)
        self.assertEqual(self.empleado.cedula, response.data["cedula"])

        devolver_url = reverse("prestamo-devolver")
        devolver_resp = self.client.post(
            devolver_url,
            {"cedula": self.empleado.cedula, "ahora": datetime.now(timezone.utc).isoformat()},
            format="json",
        )
        self.assertEqual(200, devolver_resp.status_code)
        self.assertEqual("DEVUELTO", devolver_resp.data["estado"])
