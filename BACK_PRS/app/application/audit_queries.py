"""Servicios de aplicacion para consultar el log de auditoria."""

from __future__ import annotations

from typing import List, Optional

from ..domain.events import AuditLogRecord
from ..domain.ports.audit import AuditLogQueryRepository


class AuditLogQueryService:
    """Aplica reglas de paginacion y filtros a las consultas de auditoria."""

    def __init__(self, repo: AuditLogQueryRepository) -> None:
        self.repo = repo

    def listar(self, *, limit: int = 50, aggregate: Optional[str] = None) -> List[AuditLogRecord]:
        """Devuelve registros recientes (entre 1 y 200) opcionalmente filtrados por agregado."""
        limit = max(1, min(limit, 200))
        aggregate = aggregate or None
        return self.repo.listar(limit=limit, aggregate=aggregate)