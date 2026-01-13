from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from app.domain.events import AdminChangeEvent
from app.infrastructure.repositories import (
    DjangoAuditLogQueryRepository,
    DjangoAuditLogRepository,
)


class AuditLogRepositoryTests(TestCase):
    def setUp(self) -> None:
        from app.infrastructure.models import AuditEntry

        AuditEntry.objects.all().delete()
        self.writer = DjangoAuditLogRepository()
        self.reader = DjangoAuditLogQueryRepository()
        self.user = get_user_model().objects.create_user(username="auditor", password="pass123")

    def _append_event(self, aggregate: str, suffix: str) -> None:
        event = AdminChangeEvent(
            aggregate=aggregate,
            action="CREATED",
            id_ref=f"id-{suffix}",
            at=timezone.now(),
            actor_user_id=self.user.id,
            before=None,
            after={"field": suffix},
            reason=None,
        )
        self.writer.append(event)

    def test_listar_retorna_registros_en_orden_y_con_username(self) -> None:
        self._append_event("Empleado", "1")
        self._append_event("Empleado", "2")

        records = self.reader.listar(limit=10)

        self.assertEqual(2, len(records))
        self.assertEqual("id-2", records[0].id_ref)  # orden descendente
        self.assertEqual(self.user.username, records[0].actor_username)

    def test_filtro_por_aggregate(self) -> None:
        self._append_event("Empleado", "1")
        self._append_event("RadioFrecuencia", "2")

        records = self.reader.listar(limit=10, aggregate="RadioFrecuencia")

        self.assertEqual(1, len(records))
        self.assertEqual("RadioFrecuencia", records[0].aggregate)
