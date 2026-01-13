"""Reglas de negocio y utilidades de normalizacion."""

from __future__ import annotations

from datetime import datetime, time
from typing import Optional

from .value_objects import Turno


def calcular_turno(ahora: Optional[datetime]) -> Turno:
    """Determina el turno correspondiente para la hora proporcionada."""
    if ahora is None:
        raise ValueError("Se requiere 'ahora' para calcular el turno.")
    t = ahora.time()
    if time(6, 0) <= t < time(14, 0):
        return Turno.T1
    if time(14, 0) <= t < time(22, 0):
        return Turno.T2
    return Turno.T3


def clean_doc(x: Optional[str]) -> Optional[str]:
    """Limpia una cedula dejando solo digitos (maximo 15)."""
    if not x:
        return None
    return "".join(ch for ch in x if ch.isdigit())[:15]


def clean_sap(x: Optional[str]) -> Optional[str]:
    """Normaliza un usuario de SAP (strip y maximo 50 chars)."""
    return x.strip()[:50] if x else None


def clean_rf(x: Optional[str]) -> Optional[str]:
    """Normaliza un codigo de radio (strip, upper, maximo 25 chars)."""
    return x.strip().upper()[:25] if x else None
