# Descripcion General del Proyecto

RadioFrecuencias digitaliza el control de radios de comunicacion corporativos, garantizando que cada dispositivo se asigne y devuelva siguiendo reglas de negocio estrictas. El backend, implementado con **Django 5** y **Django REST Framework 3.15**, expone una API REST centralizada (`/api/`) que administra catalogos maestros (empleados, radios, usuarios SAP), administra prestamos y conserva un registro de auditoria completo. El diseno aplica principios de Clean Architecture para mantener la logica de dominio desacoplada de Django y facilitar integraciones futuras.

## Proposito de la plataforma
- Automatizar el prestamo y la devolucion de radios con trazabilidad por empleado, radio y usuario SAP.
- Mantener sincronizados los catalogos maestros con operaciones de alta, edicion, baja logica y vinculacion entre entidades.
- Proveer a los administradores visibilidad de todos los movimientos mediante historicos y un registro de auditoria consultable.
- Simplificar la administracion de usuarios internos y la emision de tokens JWT para el frontend y sistemas externos.
- Ofrecer un punto unico de integracion para futuras aplicaciones (por ejemplo BI o sistemas de control operativo).

## Capas de la solucion
- **Dominio (`app/domain`)**: concentra entidades inmutables (`entities.py`), errores (`errors.py`), reglas (`rules.py`), value objects (`value_objects.py`) y puertos (`ports/*`). Modela conceptos como `Empleado`, `RadioFrecuencia`, `SapUsuario`, `Prestamo` y el calculo de turnos.
- **Aplicacion (`app/application`)**: implementa servicios orquestadores (`services.py`, `catalogos_service.py`), comandos y casos de uso (`use_cases.py`) y validadores (`validators.py`). Traduce escenarios de negocio en operaciones transaccionales sobre los repositorios del dominio.
- **Infraestructura (`app/infrastructure`)**: define los modelos ORM (`models.py`), mapeadores (`mappers.py`) y adaptadores concretos de repositorios (`repositories.py`), ademas de la unidad de trabajo `DjangoUnitOfWork`.
- **Interfaces (`app/interfaces`)**: expone la API REST con viewsets DRF (`views.py`), serializers (`serializers.py`), permisos (`permissions.py`) y ruteo (`urls.py`). Tambien sirve el log de auditoria y la administracion de usuarios internos.

## Servicios funcionales clave
- **Catalogos maestros**: `EmpleadoViewSet`, `RadioViewSet` y `SapUsuarioViewSet` consumen `CatalogosUseCases` para CRUD completo con reglas de activacion y vinculacion.
- **Prestamos operativos**: `PrestamoViewSet` orquesta `PrestamoUseCases` y `PrestamosService` para asignar, listar y marcar devoluciones, validando que no existan conflictos (misma radio, cedula o usuario SAP).
- **Auditoria administrativa**: `AuditLogViewSet` consulta `DjangoAuditLogRepository` y expone eventos `AdminChangeEvent` generados desde `CatalogosService`.
- **Usuarios de aplicacion**: `AppUserViewSet` gestiona usuarios Django (is_staff, is_superuser, contrasenas) para operar el sistema mediante JWT (`/api/token/`).
- **Integracion con frontend**: drf-spectacular publica el esquema en `/api/schema/` y Swagger en `/api/docs/`, consumidos por el frontend Next.js alojado en `FRONT_RadioFrecuencias`.

## Integraciones y persistencia
- **Base de datos**: por defecto utiliza SQLite (`db.sqlite3`), pero la capa de infraestructura se abstrae para soportar Postgres o SQL Server via configuracion en `DATABASES`.
- **Autenticacion**: se apoya en usuarios Django y tokens JWT emitidos con SimpleJWT (`SIMPLE_JWT` en `settings.py`), compatibles con rotacion de tokens de refresco.
- **CORS y seguridad**: `corsheaders` permite habilitar origenes controlados; `ALLOWED_HOSTS` y `DEBUG` se configuran por entorno.
- **Scripts operativos**: `scripts/import_empleados_excel_sqlite.py` carga empleados desde Excel con upsert, apoyando procesos masivos.

## Flujo operativo resumido
1. Un administrador o operador obtiene un token (`POST /api/token/`) y el frontend almacena el JWT.
2. El usuario consulta catalogos (`GET /api/empleados/`, `/api/radios/`, `/api/sap-usuarios/`) para visualizar disponibilidad.
3. Para asignar una radio, el frontend invoca `POST /api/prestamos/` con cedula, codigo de radio y usuario SAP; `PrestamosService` valida reglas y crea el prestamo con el turno calculado automaticamente.
4. Las devoluciones se registran via `POST /api/prestamos/devolver-*` (por radio, cedula o usuario SAP), cambiando el estado a `DEVUELTO`.
5. Cada cambio en catalogos dispara un `AdminChangeEvent` que se persiste en `audit_log` y puede consultarse desde `/api/audit-log/`.
6. Los usuarios internos pueden administrarse desde `/api/usuarios-app/`, posibilitando revocar accesos o promover privilegios.

## Principios de diseno
- Mantener la logica de negocio exclusivamente en las capas domain y application, evitando dependencias circulares.
- Utilizar comandos inmutables (`AsignarPrestamoCmd`, `CrearEmpleadoCmd`) para encapsular datos de entrada y mantener servicios deterministas.
- Traducir errores de dominio (`EntityNotFound`, `BusinessRuleViolation`, `InactiveEntity`) en respuestas HTTP consistentes mediante `_handle_domain_errors`.
- Garantizar que el calculo de turnos y la validacion de prestamos abiertos se realicen en el dominio, asegurando consistencia entre futuras interfaces.
- Publicar documentacion automatica con drf-spectacular para facilitar la adopcion por parte de otras aplicaciones o integraciones.

Este documento resume el estado actual del backend de RadioFrecuencias y sirve como punto de partida para tareas de soporte, auditoria y evolucion tecnica.
