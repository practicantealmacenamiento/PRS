from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from app.infrastructure.models import EmpleadoModel, RadioFrecuenciaModel, SapUsuarioModel


class CatalogosViewsTests(APITestCase):
    def setUp(self) -> None:
        EmpleadoModel.objects.all().delete()
        RadioFrecuenciaModel.objects.all().delete()
        SapUsuarioModel.objects.all().delete()

        User = get_user_model()
        self.admin = User.objects.create_user(username="admin", password="pass", is_superuser=True)
        self.client.force_authenticate(self.admin)

    def test_crear_y_listar_empleado(self) -> None:
        url = reverse("empleado-list")
        payload = {"cedula": "1234567890", "nombre": "Empleado Uno", "activo": True}

        response = self.client.post(url, payload, format="json")
        self.assertEqual(201, response.status_code)
        self.assertEqual("Empleado Uno", response.data["nombre"])

        list_response = self.client.get(url)
        self.assertEqual(200, list_response.status_code)
        self.assertEqual(1, len(list_response.data))
        self.assertEqual("1234567890", list_response.data[0]["cedula"])

    def test_actualizar_parcial_radio(self) -> None:
        # Crear radio
        radio_url = reverse("radio-list")
        create_resp = self.client.post(
            radio_url,
            {"codigo": "RF-100", "descripcion": "Radio 100", "activo": True},
            format="json",
        )
        self.assertEqual(201, create_resp.status_code)

        detail_url = reverse("radio-detail", kwargs={"codigo": "RF-100"})
        patch_resp = self.client.patch(detail_url, {"descripcion": "Actualizada"}, format="json")
        self.assertEqual(200, patch_resp.status_code)
        self.assertEqual("Actualizada", patch_resp.data["descripcion"])

    def test_crear_sap_usuario_valida_cedula_vacia(self) -> None:
        sap_url = reverse("sapusuario-list")
        resp = self.client.post(
            sap_url,
            {"username": "sap-user", "empleado_cedula": "", "activo": True},
            format="json",
        )
        self.assertEqual(201, resp.status_code)
        self.assertIsNone(resp.data["empleado_cedula"])
