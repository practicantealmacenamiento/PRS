# Codigo Fuente y Estructura

## Raiz del proyecto
- `manage.py`: punto de entrada para comandos Django.
- `core/`: configuraciones globales (`settings.py`, `urls.py`, `wsgi.py`, `asgi.py`).
- `app/`: modulo de negocio estructurado por capas domain-driven.
- `scripts/`: utilidades auxiliares (importadores, tareas manuales).
- `docs/`: esta documentacion oficial del backend.

## Estructura por capas (`app/`)
- **`domain/`**:
  - `entities.py`: entidades inmutables (`Empleado`, `RadioFrecuencia`, `SapUsuario`, `Prestamo`).
  - `value_objects.py`: value objects como `Turno` y `EstadoPrestamo`.
  - `events.py`: eventos de dominio (`AdminChangeEvent`) utilizados por la auditoria.
  - `errors.py`: excepciones especificas (`BusinessRuleViolation`, `EntityNotFound`, `InactiveEntity`).
  - `rules.py`: reglas puras (calculo de turno, limpieza de identificadores).
  - `ports/`: contratos abstractos de repositorios, auditoria y unidad de trabajo.
- **`application/`**:
  - `services.py`: `PrestamosService` implementa la logica de asignacion/devolucion.
  - `catalogos_service.py`: operaciones sobre catalogos y emision de auditoria.
  - `use_cases.py`: comandos inmutables y casos de uso (`PrestamoUseCases`, `CatalogosUseCases`).
  - `validators.py`: utilidades para validar entradas y filtrar campos permitidos.
- **`infrastructure/`**:
  - `models.py`: modelos ORM (`EmpleadoModel`, `RadioFrecuenciaModel`, `SapUsuarioModel`, `PrestamoModel`, `AuditEntry`).
  - `mappers.py`: conversion bidireccional entre modelos Django y entidades de dominio.
  - `repositories.py`: implementaciones concretas de los puertos (incluyendo `DjangoUnitOfWork`).
- **`interfaces/`**:
  - `serializers.py`: serializers DRF para request/response de catalogos, prestamos y usuarios app.
  - `permissions.py`: `IsAdmin`, `IsAuthenticatedReadOnlyOrAdmin`.
  - `views.py`: viewsets y acciones personalizadas (devolver prestamo, auditoria).
  - `urls.py`: ruteo registrado en `core/urls.py`.

## Scripts y herramientas
- `scripts/import_empleados_excel_sqlite.py`: lee la hoja "Base de datos" y ejecuta upserts sobre la tabla `empleados`.
- `app/admin.py`: configuracion del Django Admin para gestionar entidades desde consola administrativa.
- `app/migrations/`: historico de migraciones de base de datos.

## Buenas practicas de versionamiento
- Mantener ramas `main` (produccion) y `develop` (integracion continua). Utilizar `feature/*` para desarrollos aislados.
- Generar tags semanticos (`v1.0.0`, `v1.1.0`) alineados con releases y despliegues en produccion.
- Requerir pull requests con al menos una revision cruzada y pipeline verde (tests, lint).
- Documentar cambios relevantes en un `CHANGELOG.md` (pendiente de implementacion).

## Recomendaciones de CI/CD
Un pipeline tipico (GitHub Actions, GitLab CI, Azure DevOps) debe incluir:
1. Instalacion de dependencias y carga del entorno virtual.
2. Verificacion de estilo (`ruff`, `flake8`) y formateo opcional (`black --check`).
3. Ejecucion de pruebas (`python manage.py test` o `pytest`).
4. Migraciones sobre base temporal (`python manage.py migrate --check`).
5. Empaquetado y despliegue al entorno objetivo (contendor Docker, WebApp, servidor on-premise).

Mantener la estructura descrita facilita escalar el proyecto, incorporar nuevas funcionalidades y garantizar consistencia entre entornos.
