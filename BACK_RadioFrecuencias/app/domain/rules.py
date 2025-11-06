from __future__ import annotations
from datetime import datetime, time
from typing import Optional

def calcular_turno(ahora: Optional[datetime]) -> str:
    """
    Determina el turno a partir de una fecha/hora local.
      - Turno 1: 06:00 - 13:59
      - Turno 2: 14:00 - 21:59
      - Turno 3: 22:00 - 05:59
    """
    if ahora is None:
        raise ValueError("Se requiere 'ahora' para calcular el turno.")
    t = ahora.time()
    if time(6, 0) <= t < time(14, 0):
        return "Turno 1 (6 am - 2 pm)"
    if time(14, 0) <= t < time(22, 0):
        return "Turno 2 (2 pm - 10 pm)"
    return "Turno 3 (10 pm - 6 am)"

def clean_doc(x: Optional[str]) -> Optional[str]:
    if not x:
        return None
    return "".join(ch for ch in x if ch.isdigit())[:15]

def clean_sap(x: Optional[str]) -> Optional[str]:
    return x.strip()[:50] if x else None

def clean_rf(x: Optional[str]) -> Optional[str]:
    return x.strip().upper()[:25] if x else None