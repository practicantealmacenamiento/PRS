# Instalacion y Configuracion

## Flujo general de despliegue
1. Clonar el repositorio y seleccionar la rama correspondiente (`main`, `develop` o release especifica).
2. Crear/activar el entorno virtual y ejecutar `pip install -r requirements.txt` (si aun no existe, generar uno con `pip freeze` tras instalar dependencias).
3. Configurar variables de entorno segun el ambiente (ver seccion siguiente).
4. Aplicar migraciones con `python manage.py migrate`.
5. Crear un superusuario inicial para acceso administrativo (`python manage.py createsuperuser`).
6. Ejecutar el servidor (`python manage.py runserver 0.0.0.0:8000` en desarrollo o Gunicorn/Uvicorn en produccion).
7. Validar endpoints clave: `/api/docs/`, `/api/empleados/`, `/api/prestamos/`, `/api/audit-log/`.

## Variables de entorno criticas
| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Clave criptografica; nunca debe exponerse en repositorio. | `DJANGO_SECRET_KEY=s3cr3t...` |
| `DEBUG` | Activa o desactiva modo debug. En produccion debe ser `False`. | `DEBUG=False` |
| `ALLOWED_HOSTS` | Lista separada por comas de dominios autorizados. | `ALLOWED_HOSTS=api.empresa.com,www.empresa.com` |
| `CORS_ALLOWED_ORIGINS` | Dominios permitidos para peticiones cross-origin. | `CORS_ALLOWED_ORIGINS=https://app.empresa.com` |
| `DATABASE_URL` (opcional) | Conexion para motores externos usando `django-environ` o `dj-database-url` (requerira ajustes en settings). | `DATABASE_URL=postgres://user:pass@host/db` |
| `SIMPLE_JWT_ACCESS_TOKEN_LIFETIME` | Vida util de token de acceso (en minutos). | `SIMPLE_JWT_ACCESS_TOKEN_LIFETIME=480` |
| `SIMPLE_JWT_REFRESH_TOKEN_LIFETIME` | Dias para token de refresco. | `SIMPLE_JWT_REFRESH_TOKEN_LIFETIME=7` |

> En ambientes Windows, se recomienda un archivo `.env` administrado con `python-dotenv` o scripts de PowerShell para cargar variables antes de iniciar el servidor.

## Configuracion por ambiente
- **Desarrollo**: `DEBUG=True`, `ALLOWED_HOSTS=*`, `CORS_ALLOW_ALL_ORIGINS=True`, base SQLite (`db.sqlite3`). Las migraciones y seeds se ejecutan localmente.
- **QA / Staging**: `DEBUG=False`, `ALLOWED_HOSTS` limitado, `CSRF_TRUSTED_ORIGINS` configurado con el dominio publico, base Postgres preferida. Activar logs estructurados y nivel `INFO`.
- **Produccion**: `DEBUG=False`, HTTPS obligatorio, `CORS_ALLOWED_ORIGINS` restringido, tokens de acceso menores a 8 horas, monitoreo configurado y backups diarios.

## Ajustes adicionales
- **Logs**: personalizar el diccionario `LOGGING` en `core/settings.py` para enviar registros a stdout, archivos o servicios externos.
- **Static/Media**: ejecutar `python manage.py collectstatic` si se sirven archivos estaticos desde el backend (por defecto no es necesario, pero se sugiere preparar la ruta `STATIC_ROOT`).
- **Tareas batch**: programar el script de importacion de empleados si se requiere sincronizacion periodica.

## Verificacion post-instalacion
- `python manage.py check` sin errores.
- Respuesta `200 OK` en `/api/docs/`.
- Autenticacion exitosa en `POST /api/token/` con el superusuario creado.
- Creacion y devolucion de un prestamo de prueba para validar reglas de negocio.
- Registro del evento correspondiente en `/api/audit-log/`.
