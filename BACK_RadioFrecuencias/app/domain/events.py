from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any

@dataclass(frozen=True)
class AdminChangeEvent:
    """
    Evento de dominio para trazabilidad de cambios en catálogos.
    No define 'cómo' se persiste; solo qué pasó.
    """
    aggregate: str            # "Empleado" | "RadioFrecuencia" | "SapUsuario"
    action: str               # "CREATED" | "UPDATED" | "DELETED"
    id_ref: str               # clave de negocio (cedula, codigo, username)
    at: datetime
    actor_user_id: int
    before: Optional[Dict[str, Any]] = None
    after: Optional[Dict[str, Any]] = None
    reason: Optional[str] = None