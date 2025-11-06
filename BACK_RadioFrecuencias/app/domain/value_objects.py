from __future__ import annotations
from enum import Enum
from typing import NewType

# Identificadores semánticos (opcionalmente normalizados en rules.py)
Cedula = NewType("Cedula", str)
CodigoRF = NewType("CodigoRF", str)
Username = NewType("Username", str)

class Turno(Enum):
    T1 = "Turno 1 (6 am - 2 pm)"
    T2 = "Turno 2 (2 pm - 10 pm)"
    T3 = "Turno 3 (10 pm - 6 am)"

class EstadoPrestamo(Enum):
    ASIGNADO = "ASIGNADO"
    DEVUELTO = "DEVUELTO"
