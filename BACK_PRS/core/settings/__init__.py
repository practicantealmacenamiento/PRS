"""
Selector de configuración basado en el ambiente.
Por defecto usa 'development' si DJANGO_ENV no está definido.
"""
import os

env = os.environ.get('DJANGO_ENV', 'development')

if env == 'production':
    from .prod import *
else:
    from .dev import *
