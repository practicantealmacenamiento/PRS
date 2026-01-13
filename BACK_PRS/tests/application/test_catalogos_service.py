import unittest
from datetime import datetime
from typing import Any, Dict, Optional

from app.application.catalogos_service import CatalogosService
from app.domain.entities import Empleado
from app.domain.events import AdminChangeEvent
from app.domain.errors import BusinessRuleViolation, EntityNotFound


class StubRepo:
    def __init__(self, lookup: Optional[Any] = None):
        self.lookup = lookup
        self.created = None
        self.updated_args: Optional[Dict[str, Any]] = None
        self.deleted_key = None

    def obtener_por_cedula(self, cedula):
        return self.lookup

    def obtener_por_codigo(self, codigo):
        return self.lookup

    def obtener_por_username(self, username):
        return self.lookup

    def crear(self, **kwargs):
        self.created = kwargs
        return self.lookup or Empleado(id=1, cedula=kwargs.get("cedula", ""), nombre=kwargs.get("nombre", ""), activo=True)

    def actualizar(self, **kwargs):
        self.updated_args = kwargs
        return self.lookup

    def eliminar(self, **kwargs):
        self.deleted_key = kwargs


class StubAudit:
    def __init__(self):
        self.events: list[AdminChangeEvent] = []

    def append(self, event: AdminChangeEvent) -> None:
        self.events.append(event)


class DummyUoW:
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


class CatalogosServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.audit = StubAudit()
        self.clock_value = datetime(2024, 1, 1, 12, 0)

    def _service(self, *, empleados=None, radios=None, sap=None, uow=None):
        return CatalogosService(
            empleados=empleados or StubRepo(),
            radios=radios or StubRepo(),
            sap_usuarios=sap or StubRepo(),
            audit=self.audit,
            uow=uow,
            clock=lambda: self.clock_value,
        )

    def test_crear_empleado_emite_evento_con_clock(self) -> None:
        empleados = StubRepo()
        svc = self._service(empleados=empleados, uow=DummyUoW())

        svc.crear_empleado(cedula="1", nombre="Test", activo=True, actor_user_id=10)

        self.assertEqual(1, len(self.audit.events))
        event = self.audit.events[0]
        self.assertEqual(self.clock_value, event.at)
        self.assertEqual("Empleado", event.aggregate)

    def test_crear_empleado_rechaza_duplicados(self) -> None:
        empleados = StubRepo(lookup=Empleado(id=1, cedula="1", nombre="X", activo=True))
        svc = self._service(empleados=empleados)
        with self.assertRaises(BusinessRuleViolation):
            svc.crear_empleado(cedula="1", nombre="Test", activo=True, actor_user_id=10)

    def test_actualizar_radio_requiere_existente(self) -> None:
        svc = self._service(radios=StubRepo(lookup=None))
        with self.assertRaises(EntityNotFound):
            svc.actualizar_radio(codigo="RF", cambios={"activo": False}, actor_user_id=1)

    def test_eliminar_sap_usuario_requiere_existente(self) -> None:
        svc = self._service(sap=StubRepo(lookup=None))
        with self.assertRaises(EntityNotFound):
            svc.eliminar_sap_usuario(username="sap", actor_user_id=1)


if __name__ == "__main__":
    unittest.main()
