"""Puerto de unidad de trabajo para coordinar transacciones."""

from __future__ import annotations

from typing import Protocol, ContextManager


class UnitOfWork(Protocol, ContextManager["UnitOfWork"]):
    """Permite orquestar operaciones atomicas entre multiples repositorios."""

    def commit(self) -> None: ...
    def rollback(self) -> None: ...
    def __enter__(self) -> "UnitOfWork": ...
    def __exit__(self, exc_type, exc, tb) -> None: ...
