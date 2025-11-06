"""Domain ports (hexagonal architecture).

Expose the repository contracts used by the application layer so that
adapters in infrastructure can implement them and interfaces can wire them.
"""

from .repositories import (  # noqa: F401
    EmpleadoRepository,
    PrestamoRepository,
    RadioRepository,
    SapUsuarioRepository,
)

__all__ = [
    "EmpleadoRepository",
    "PrestamoRepository",
    "RadioRepository",
    "SapUsuarioRepository",
]
