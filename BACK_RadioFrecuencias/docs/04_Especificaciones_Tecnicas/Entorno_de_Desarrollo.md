# Entorno de Desarrollo

## Requerimientos basicos
- Python 3.13 (probado) o 3.11+ con `pip` actualizado.
- Git para clonar el repositorio y gestionar ramas.
- SQLite (incluido en Python) o un motor SQL equivalente para pruebas locales.
- Node.js 18+ opcional si se desea ejecutar el frontend junto al backend.
- Herramienta para gestionar variables de entorno (`direnv`, `.env`, PowerShell `$Env:`).

## Configuracion inicial
1. Clonar el repositorio y ubicarse en `BACK_RadioFrecuencias/`.
2. Crear el entorno virtual: `python -m venv .venv` y activarlo.
3. Actualizar herramientas: `pip install --upgrade pip setuptools wheel`.
4. Instalar dependencias de proyecto:
   ```bash
   pip install django djangorestframework drf-spectacular djangorestframework-simplejwt django-cors-headers openpyxl
   ```
   > Si se agrega `requirements.txt` en el futuro, priorizar `pip install -r requirements.txt`.
5. Copiar o crear un archivo `.env` con los valores minimos:
   ```
   DJANGO_SECRET_KEY=dev-secret
   DEBUG=True
   ALLOWED_HOSTS=*
   ```
6. Ejecutar migraciones: `python manage.py migrate`.
7. Crear un superusuario: `python manage.py createsuperuser`.

## Configuracion de herramientas
- **Editor**: Visual Studio Code con extensiones *Python*, *Django* y *REST Client* o PyCharm Professional.
- **Formateo y lint**: se recomienda `ruff` para linting rapido (`pip install ruff`) y `black` para formateo opcional.
- **Base de datos**: SQLite se crea automaticamente (`db.sqlite3`). Para Postgres, definir `DATABASE_URL` y ajustar `core/settings.py`.
- **Tests**: ejecutar `python manage.py test` o configurar `pytest` con `pytest-django` (pendiente de agregar).

## Datos de prueba
- Importar empleados desde Excel usando `python scripts/import_empleados_excel_sqlite.py --excel "BASE DE DATOS A&T.xlsx" --db db.sqlite3 --table empleados`.
- Crear radios y usuarios SAP desde el admin (`/admin/`) o via endpoints de catalogo.
- Generar prestamos de ejemplo con `POST /api/prestamos/` para validar reglas de negocio.

## Servicios externos opcionales
- Integracion con Active Directory o SSO corporativo (requeriria personalizar `AUTHENTICATION_BACKENDS`).
- Herramientas de monitoreo como Elastic, Application Insights o Sentry configurando handlers de logging.
- Docker compose para levantar la pila completa (pendiente de definir, sugerido para entornos multipersona).

## Buenas practicas locales
- Mantener `DEBUG=True` solo en desarrollo y reusar `.env.dev` ignorado por Git.
- Ejecutar `python manage.py check` y `python manage.py showmigrations` tras cambios en modelos.
- Trabajar con ramas de caracteristica (`feature/`) y hacer merge mediante PR revisadas.
