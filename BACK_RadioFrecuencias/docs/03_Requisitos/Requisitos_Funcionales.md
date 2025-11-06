# Requisitos Funcionales

Los requisitos funcionales derivan del comportamiento implementado en `app/interfaces/views.py`, los servicios de aplicacion (`app/application/*.py`) y los repositorios de infraestructura (`app/infrastructure/repositories.py`).

## Autenticacion y control de acceso
- **RF-01**: Permitir autenticacion JWT mediante `POST /api/token/`, retornando `access` y `refresh` firmados segun la configuracion de `SimpleJWT`.
- **RF-02**: Renovar tokens de acceso a traves de `POST /api/token/refresh/`, respetando la vida util configurada en `SIMPLE_JWT`.
- **RF-03**: Exigir `IsAuthenticatedReadOnlyOrAdmin` para catalogos y prestamos, permitiendo lectura a cualquier usuario autenticado y escritura solo a miembros del grupo `admin` o superusuarios.
- **RF-04**: Restringir la administracion de usuarios internos (`AppUserViewSet`) a usuarios con privilegios de administrador (`IsAdmin`).

## Gestion de catalogos
- **RF-10**: `EmpleadoViewSet` debe listar, crear, actualizar y eliminar empleados identificados por `cedula`, utilizando `CatalogosUseCases` y validando unicidad (cedula unica).
- **RF-11**: `RadioViewSet` debe gestionar radios con `codigo` unico, descripcion opcional y estado `activo`, permitiendo actualizaciones parciales.
- **RF-12**: `SapUsuarioViewSet` debe crear usuarios SAP y vincularlos opcionalmente a un empleado por `cedula`, sincronizando `empleado_id` interno.
- **RF-13**: Las operaciones de catalogo deben registrar eventos de auditoria (`AdminChangeEvent`) con valores antes/despues, actor y razon opcional.

## Prestamos y trazabilidad
- **RF-20**: `PrestamoViewSet` debe permitir registrar un prestamo abierto (`AsignarPrestamoCmd`) recibiendo `cedula`, `codigo_radio`, `usuario_sap` y usuario registrador.
- **RF-21**: Al asignar un prestamo se debe calcular automaticamente el turno (`rules.calcular_turno`) con base en la hora del servidor o el valor `ahora` enviado.
- **RF-22**: Debe impedirse la creacion de prestamos si existe uno abierto para la misma `cedula`, `codigo_radio` o `usuario_sap`, respondiendo con `BusinessRuleViolation`.
- **RF-23**: La API debe listar prestamos (`GET /api/prestamos/`) con filtros por `cedula` y `codigo_radio`, ordenados por `fecha_hora_prestamo` descendente.
- **RF-24**: Se deben exponer endpoints de devolucion especificos (`devolver_por_radio`, `devolver_por_cedula`, `devolver_por_usuario_sap`) que marquen el prestamo como `DEVUELTO` y registren `fecha_hora_devolucion`.
- **RF-25**: Debe almacenarse el `usuario_registra_id` y `usuario_registra_username` para cada prestamo, facilitando auditoria de quien realizo la operacion.

## Auditoria y consulta historica
- **RF-30**: El sistema debe registrar cada cambio en catalogos (`CREATED`, `UPDATED`, `DELETED`) en la tabla `audit_log` usando `DjangoAuditLogRepository`.
- **RF-31**: `AuditLogViewSet` debe listar eventos con filtros por `aggregate`, `action`, `id_ref` y fechas, devolviendo el actor (`actor_user_id`) y username.
- **RF-32**: La auditoria debe almacenar campos `before` y `after` como JSON para reconstruir el estado previo y posterior.

## Usuarios de aplicacion
- **RF-40**: `AppUserViewSet` debe listar usuarios Django (`UserModel`) mostrando flags `is_active`, `is_staff` e `is_superuser`.
- **RF-41**: Debe permitir crear usuarios (`POST /api/usuarios-app/`) con contrasena inicial y `is_staff` opcional, asegurando hashing (`set_password`).
- **RF-42**: Debe permitir actualizar atributos (`PATCH /api/usuarios-app/{id}/`) incluyendo reset de contrasena y cambio de estado activo.
- **RF-43**: Se debe permitir eliminar usuarios (`DELETE /api/usuarios-app/{id}/`) siempre que no se elimine el usuario autenticado actual.

## Integracion operativa
- **RF-50**: El script `scripts/import_empleados_excel_sqlite.py` debe importar o actualizar empleados desde Excel, identificando columnas de cedula y nombre con sinonimos.
- **RF-51**: El backend debe exponer documentacion interactiva en `/api/docs/` y el esquema en `/api/schema/`, sincronizados con los viewsets via drf-spectacular.
- **RF-52**: Las respuestas de `PrestamoResponseSerializer` deben incluir el turno (`turno.value`), estado (`estado.value`) y, cuando aplica, `fecha_hora_devolucion`.

## Gobernanza y compatibilidad
- **RF-60**: Todos los endpoints deben permanecer bajo el prefijo `/api/` para facilitar versionamiento futuro.
- **RF-61**: Las vistas deben traducir excepciones de dominio (`EntityNotFound`, `InactiveEntity`, `BusinessRuleViolation`) en respuestas 404, 409 o 400 coherentes.
- **RF-62**: El backend debe permitir configuracion de CORS y host autorizados via variables (`CORS_ALLOW_ALL_ORIGINS`, `ALLOWED_HOSTS`) sin modificar el codigo fuente.
