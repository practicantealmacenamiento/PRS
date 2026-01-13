from django.test import TestCase

from app.domain.errors import EntityNotFound
from app.infrastructure.repositories import DjangoEmpleadoRepository, DjangoSapUsuarioRepository


class DjangoSapUsuarioRepositoryTests(TestCase):
    def setUp(self) -> None:
        self.empleados = DjangoEmpleadoRepository()
        self.sap = DjangoSapUsuarioRepository()
        self.empleados.crear(cedula="9001", nombre="Empleado Uno", activo=True)

    def test_crear_valida_cedula_existente(self) -> None:
        sap_user = self.sap.crear(username="sap-user", empleado_cedula="9001", activo=True)

        self.assertEqual("sap-user", sap_user.username)
        self.assertEqual("9001", sap_user.empleado_cedula)

    def test_crear_lanza_error_si_cedula_no_existe(self) -> None:
        with self.assertRaises(EntityNotFound):
            self.sap.crear(username="sap-invalid", empleado_cedula="9999", activo=True)

    def test_actualizar_valida_cedula_y_permite_desvincular(self) -> None:
        self.sap.crear(username="sap-update", empleado_cedula="9001", activo=True)

        with self.assertRaises(EntityNotFound):
            self.sap.actualizar(username="sap-update", cambios={"empleado_cedula": "9999"})

        updated = self.sap.actualizar(username="sap-update", cambios={"empleado_cedula": None})
        self.assertIsNone(updated.empleado_cedula)
