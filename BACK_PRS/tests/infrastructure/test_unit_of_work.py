from django.test import TestCase

from app.infrastructure.models import EmpleadoModel
from app.infrastructure.repositories import DjangoEmpleadoRepository, DjangoUnitOfWork


class DjangoUnitOfWorkTests(TestCase):
    def setUp(self) -> None:
        EmpleadoModel.objects.all().delete()
        self.repo = DjangoEmpleadoRepository()
        self.uow = DjangoUnitOfWork()

    def test_commit_persists_changes(self) -> None:
        with self.uow:
            self.repo.crear(cedula="1001", nombre="Alice", activo=True)

        self.assertEqual(1, EmpleadoModel.objects.count())

    def test_exception_rolls_back_changes(self) -> None:
        with self.assertRaises(RuntimeError):
            with self.uow:
                self.repo.crear(cedula="2001", nombre="Bob", activo=True)
                raise RuntimeError("boom")

        self.assertEqual(0, EmpleadoModel.objects.count())

    def test_reusable_across_multiple_transactions(self) -> None:
        with self.uow:
            self.repo.crear(cedula="3001", nombre="Carol", activo=True)

        with self.uow:
            self.repo.crear(cedula="3002", nombre="Dave", activo=True)

        self.assertEqual(2, EmpleadoModel.objects.count())
