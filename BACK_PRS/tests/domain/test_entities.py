import unittest
from dataclasses import FrozenInstanceError, is_dataclass
from datetime import datetime

from app.domain import (
    Empleado,
    EstadoPrestamo,
    Prestamo,
    RadioFrecuencia,
    SapUsuario,
    Turno,
)


class EntityBasicsTests(unittest.TestCase):
    def test_entities_are_frozen_dataclasses(self) -> None:
        for entity in (Empleado, RadioFrecuencia, SapUsuario, Prestamo):
            with self.subTest(entity=entity.__name__):
                self.assertTrue(is_dataclass(entity))
                self.assertTrue(getattr(entity, "__dataclass_params__").frozen)

    def test_prestamo_keeps_turno_value_object(self) -> None:
        prestamo = Prestamo(
            id=1,
            cedula="123",
            empleado_nombre="Test",
            usuario_sap="sap-user",
            codigo_radio="RF1",
            fecha_hora_prestamo=datetime(2024, 1, 1, 8, 0),
            turno=Turno.T2,
            estado=EstadoPrestamo.ASIGNADO,
            usuario_registra_id=10,
        )

        self.assertIs(Turno.T2, prestamo.turno)
        self.assertIsNone(prestamo.usuario_registra_username)

        with self.assertRaises(FrozenInstanceError):
            prestamo.cedula = "456"


if __name__ == "__main__":
    unittest.main()
