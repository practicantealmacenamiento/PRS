import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

try:
    import django

    django.setup()
except Exception:
    # Permite ejecutar pruebas unitarias puras sin Django instalado/configurado.
    pass
