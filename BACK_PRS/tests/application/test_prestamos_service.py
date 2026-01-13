import unittest
from datetime import datetime, timezone

from app.application.services import PrestamosService
from app.domain.entities import Empleado, Prestamo, RadioFrecuencia, SapUsuario
from app.domain.errors import BusinessRuleViolation, EntityNotFound, InactiveEntity
from app.domain.value_objects import EstadoPrestamo, Turno


class FakeEmpleadoRepo:
    def __init__(self, empleado: Empleado | None):
        self.empleado = empleado
        self.last_lookup = None

    def obtener_por_cedula(self, cedula: str):
        self.last_lookup = cedula
        return self.empleado


class FakeRadioRepo:
    def __init__(self, radio: RadioFrecuencia | None):
        self.radio = radio
        self.last_lookup = None

    def obtener_por_codigo(self, codigo: str):
        self.last_lookup = codigo
        return self.radio


class FakeSapRepo:
    def __init__(self, sapuser: SapUsuario | None):
        self.sapuser = sapuser
        self.last_lookup = None

    def obtener_por_username(self, username: str):
        self.last_lookup = username
        return self.sapuser


class FakePrestamoRepo:
    def __init__(self):
        self.created: Prestamo | None = None
        self.marcar_devolucion_calls: list[tuple[int, datetime]] = []
        self.abiertos: dict[str, Prestamo] = {}
        self._storage: dict[int, Prestamo] = {}

    def crear(self, prestamo: Prestamo):
        self.created = prestamo
        if prestamo.id is not None:
            self._storage[prestamo.id] = prestamo
        return prestamo

    def obtener_prestamo_abierto(self, **kwargs):
        for key, value in kwargs.items():
            if value is None:
                continue
            return self.abiertos.get(f"{key}:{value}")
        return None

    def marcar_devolucion(self, id_: int, fecha_hora: datetime):
        self.marcar_devolucion_calls.append((id_, fecha_hora))
        target = self._storage.get(id_) or self.created
        if target:
            updated = Prestamo(
                **{**target.__dict__, "estado": EstadoPrestamo.DEVUELTO, "fecha_hora_devolucion": fecha_hora}
            )
            self._storage[id_] = updated
            return updated
        raise EntityNotFound("Prestamo no existe")


class PrestamosServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.empleado = Empleado(id=1, cedula="1234567890", nombre="Alice", activo=True)
        self.radio = RadioFrecuencia(id=1, codigo="RF-001", descripcion="Radio", activo=True)
        self.sapuser = SapUsuario(id=1, username="sap-user", empleado_id=1, empleado_cedula=self.empleado.cedula, activo=True)
        self.prestamo_repo = FakePrestamoRepo()

    def _service(self, *, empleado=... , radio=... , sap=...):
        empleado_obj = self.empleado if empleado is ... else empleado
        radio_obj = self.radio if radio is ... else radio
        sap_obj = self.sapuser if sap is ... else sap
        return PrestamosService(
            empleados=FakeEmpleadoRepo(empleado_obj),
            radios=FakeRadioRepo(radio_obj),
            sap=FakeSapRepo(sap_obj),
            prestamos=self.prestamo_repo,
            uow=None,
        )

    def test_asignar_normaliza_inputs_y_persiste(self) -> None:
        svc = self._service()

        result = svc.asignar(
            cedula=" 123.456.789-0 ",
            codigo_radio=" rf-001 ",
            usuario_sap=" SAP-USER ",
            usuario_registra_id=99,
            ahora=datetime(2024, 1, 1, 8, 0, tzinfo=timezone.utc),
        )

        self.assertIsNotNone(self.prestamo_repo.created)
        self.assertEqual(EstadoPrestamo.ASIGNADO, result.estado)
        self.assertIsInstance(result.turno, Turno)
        self.assertEqual("1234567890", self.prestamo_repo.created.cedula)
        self.assertEqual("RF-001", self.prestamo_repo.created.codigo_radio)
        self.assertEqual(self.sapuser.username, self.prestamo_repo.created.usuario_sap)

    def test_asignar_lanza_inactive_o_not_found(self) -> None:
        svc = self._service(empleado=Empleado(id=1, cedula="1", nombre="x", activo=False))
        with self.assertRaises(InactiveEntity):
            svc.asignar(cedula="1", codigo_radio="RF", usuario_sap="SAP", usuario_registra_id=1, ahora=datetime.now(timezone.utc))

        svc = self._service(empleado=None)
        with self.assertRaises(EntityNotFound):
            svc.asignar(cedula="1", codigo_radio="RF", usuario_sap="SAP", usuario_registra_id=1, ahora=datetime.now(timezone.utc))

    def test_asignar_rechaza_input_invalido(self) -> None:
        svc = self._service()
        with self.assertRaises(BusinessRuleViolation):
            svc.asignar(cedula="", codigo_radio="RF", usuario_sap="SAP", usuario_registra_id=1, ahora=datetime.now(timezone.utc))

    def test_devolver_require_one_identifier(self) -> None:
        svc = self._service()
        with self.assertRaises(BusinessRuleViolation):
            svc.devolver(ahora=datetime.now(timezone.utc))

    def test_devolver_por_radio_usa_repo(self) -> None:
        svc = self._service()
        prestamo = Prestamo(
            id=10,
            cedula=self.empleado.cedula,
            empleado_nombre=self.empleado.nombre,
            usuario_sap=self.sapuser.username,
            codigo_radio=self.radio.codigo,
            fecha_hora_prestamo=datetime.now(timezone.utc),
            turno=Turno.T1,
            estado=EstadoPrestamo.ASIGNADO,
            usuario_registra_id=99,
        )
        self.prestamo_repo.abiertos["codigo_radio:RF-001"] = prestamo
        self.prestamo_repo._storage[prestamo.id] = prestamo

        result = svc.devolver(codigo_radio=" RF-001 ", ahora=datetime.now(timezone.utc))

        self.assertEqual(EstadoPrestamo.DEVUELTO, result.estado)
        self.assertEqual(1, len(self.prestamo_repo.marcar_devolucion_calls))


if __name__ == "__main__":
    unittest.main()
