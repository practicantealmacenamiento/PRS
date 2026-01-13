import unittest
from importlib import import_module

import app.domain as domain
from app.domain import Prestamo
from app.domain.entities import Prestamo as PrestamoFromEntities


class PublicApiTests(unittest.TestCase):
    def test_expected_symbols_are_exported(self) -> None:
        exported = set(domain.__all__)
        expected = {
            "Empleado",
            "RadioFrecuencia",
            "SapUsuario",
            "Prestamo",
            "Turno",
            "EstadoPrestamo",
            "Cedula",
            "CodigoRF",
            "Username",
            "calcular_turno",
            "clean_doc",
            "clean_sap",
            "clean_rf",
            "DomainError",
            "EntityNotFound",
            "InactiveEntity",
            "BusinessRuleViolation",
            "AdminChangeEvent",
            "AuditLogRecord",
            "EmpleadoRepository",
            "RadioRepository",
            "SapUsuarioRepository",
            "PrestamoRepository",
            "AuditLogRepository",
            "AuditLogQueryRepository",
            "UnitOfWork",
        }
        self.assertTrue(expected.issubset(exported))

    def test_public_prestamo_matches_internal_definition(self) -> None:
        self.assertIs(Prestamo, PrestamoFromEntities)

    def test_module_is_importable_via_python_path(self) -> None:
        mod = import_module("app.domain")
        self.assertIs(domain, mod)


if __name__ == "__main__":
    unittest.main()
