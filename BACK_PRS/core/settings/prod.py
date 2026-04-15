"""
Configuración para ambiente de PRODUCCIÓN.
- DEBUG desactivado
- PostgreSQL como base de datos (vía DATABASE_URL)
- CORS restrictivo (solo dominios permitidos)
- Configuración de seguridad HTTPS
- WhiteNoise para archivos estáticos
"""
from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Hosts permitidos desde variable de entorno
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')

# Database - PostgreSQL desde DATABASE_URL
# Requiere: pip install dj-database-url psycopg2-binary
try:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(
            default='sqlite:///db.sqlite3',
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
except ImportError:
    # Fallback a SQLite si no está instalado dj-database-url
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# Static files - WhiteNoise configuration
STATIC_ROOT = BASE_DIR / 'staticfiles'
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# CORS - Restrictivo, solo dominios permitidos
_cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if _cors_origins:
    CORS_ALLOWED_ORIGINS = [origin.strip() for origin in _cors_origins.split(',') if origin.strip()]
else:
    CORS_ALLOWED_ORIGINS = []

CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

# Security Settings para HTTPS
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HSTS (HTTP Strict Transport Security)
SECURE_HSTS_SECONDS = 31536000  # 1 año
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
