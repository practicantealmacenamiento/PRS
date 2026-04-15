"""
Configuración para ambiente de DESARROLLO.
- DEBUG activo
- SQLite como base de datos
- CORS permisivo para localhost
- Hosts permitidos: todos
"""
import os
from pathlib import Path
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ["*"]

# ── Resolución robusta del directorio base del backend.
# Cuando la app se lanza desde el .exe (PyInstaller), BASE_DIR calculado en
# base.py puede apuntar al interior del .venv empaquetado (ruta del otro PC).
# El launcher inyecta PRS_BACK_DIR con la ruta real → la usamos si está disponible.
_back_dir_override = os.environ.get("PRS_BACK_DIR", "")
if _back_dir_override and os.path.isdir(_back_dir_override):
    BASE_DIR = Path(_back_dir_override)

# Database - SQLite para desarrollo
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# CORS - Permisivo para desarrollo local
_default_origins = os.environ.get("CORS_ALLOWED_ORIGINS")
if _default_origins:
    CORS_ALLOWED_ORIGINS = [origin.strip() for origin in _default_origins.split(",") if origin.strip()]
else:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://172.24.66.23:3000",
    ]

CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS
