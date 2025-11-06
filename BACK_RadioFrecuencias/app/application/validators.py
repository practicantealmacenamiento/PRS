"""
Validaciones de capa de aplicación (input/DTO level).
No duplican reglas de dominio; solo verifican que los datos de entrada
tengan forma razonable antes de llamar a los servicios.
"""
from __future__ import annotations
from typing import Any, Dict, Optional


def require_str(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field} es requerido y debe ser cadena no vacía")
    return value.strip()


def require_bool(value: Any, field: str) -> bool:
    if not isinstance(value, bool):
        raise ValueError(f"{field} debe ser booleano")
    return value


def optional_str(value: Any, field: str) -> Optional[str]:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError(f"{field} debe ser cadena o None")
    return value.strip()


def clean_changes(changes: Dict[str, Any], allowed: set[str]) -> Dict[str, Any]:
    """
    Filtra un dict de cambios para evitar updates no permitidos desde la interfaz.
    """
    return {k: v for k, v in changes.items() if k in allowed}
