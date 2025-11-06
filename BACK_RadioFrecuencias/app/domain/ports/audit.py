from __future__ import annotations
from typing import Protocol
from ..events import AdminChangeEvent

class AuditLogRepository(Protocol):
    """
    Puerto para persistir auditorías de cambios administrativos.
    La implementación (ORM/cola/log) se define en infraestructura.
    """
    def append(self, event: AdminChangeEvent) -> None: ...