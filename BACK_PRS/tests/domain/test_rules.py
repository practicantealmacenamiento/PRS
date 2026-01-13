import unittest
from datetime import datetime

from app.domain import Turno, calcular_turno, clean_doc, clean_rf, clean_sap


class CalcularTurnoTests(unittest.TestCase):
    def test_turno_1_range(self) -> None:
        self.assertIs(Turno.T1, calcular_turno(datetime(2024, 1, 1, 6, 0)))
        self.assertIs(Turno.T1, calcular_turno(datetime(2024, 1, 1, 13, 59)))

    def test_turno_2_range(self) -> None:
        self.assertIs(Turno.T2, calcular_turno(datetime(2024, 1, 1, 14, 0)))
        self.assertIs(Turno.T2, calcular_turno(datetime(2024, 1, 1, 21, 59)))

    def test_turno_3_range_wraps_midnight(self) -> None:
        self.assertIs(Turno.T3, calcular_turno(datetime(2024, 1, 1, 22, 0)))
        self.assertIs(Turno.T3, calcular_turno(datetime(2024, 1, 1, 5, 59)))

    def test_turno_requires_timestamp(self) -> None:
        with self.assertRaises(ValueError):
            calcular_turno(None)


class CleanersTests(unittest.TestCase):
    def test_clean_doc_keeps_digits_and_limits_length(self) -> None:
        self.assertEqual("123456789012345", clean_doc(" abc12345678901234567890 "))
        self.assertIsNone(clean_doc(""))
        self.assertIsNone(clean_doc(None))

    def test_clean_rf_uppercases_and_trims(self) -> None:
        self.assertEqual("RF-001", clean_rf("  rf-001 "))
        self.assertEqual("A" * 25, clean_rf("a" * 40))
        self.assertIsNone(clean_rf(None))

    def test_clean_sap_strips_and_limits(self) -> None:
        raw = "  sap-user " + "x" * 60
        cleaned = clean_sap(raw)
        self.assertEqual("sap-user " + "x" * 41, cleaned)
        self.assertEqual(50, len(cleaned))
        self.assertIsNone(clean_sap(None))


if __name__ == "__main__":
    unittest.main()
