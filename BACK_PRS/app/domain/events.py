"""Eventos de dominio y read models relacionados con auditoria."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any


@dataclass(frozen=True)
class AdminChangeEvent:
    """Evento de dominio para trazabilidad de cambios en catalogos."""

    aggregate: str  # "Empleado" | "RadioFrecuencia" | "SapUsuario"
    action: str  # "CREATED" | "UPDATED" | "DELETED"
    id_ref: str  # clave de negocio (cedula, codigo, username)
    at: datetime
    actor_user_id: int
    before: Optional[Dict[str, Any]] = None
    after: Optional[Dict[str, Any]] = None
    reason: Optional[str] = None


@dataclass(frozen=True)
class AuditLogRecord:
    """Entrada persistida del log de auditoria (read model)."""

    id: int
    aggregate: str
    action: str
    id_ref: str
    at: datetime
    actor_user_id: int
    actor_username: Optional[str]
    before: Optional[Dict[str, Any]]
    after: Optional[Dict[str, Any]]
    reason: Optional[str]
