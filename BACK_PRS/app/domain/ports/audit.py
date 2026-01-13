"""Puertos para auditar cambios administrativos."""

from __future__ import annotations

from typing import List, Optional, Protocol

from ..events import AdminChangeEvent, AuditLogRecord


class AuditLogRepository(Protocol):
    """Puerto para persistir auditorias de cambios administrativos."""

    def append(self, event: AdminChangeEvent) -> None: ...


class AuditLogQueryRepository(Protocol):
    """Puerto de solo lectura para consultar entradas de auditoria."""

    def listar(self, *, limit: int, aggregate: Optional[str] = None) -> List[AuditLogRecord]: ...
