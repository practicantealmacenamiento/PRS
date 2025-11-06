# Arquitectura y Patrones

## Vision general
RadioFrecuencias adopta un enfoque inspirado en Clean Architecture, separando la logica de negocio de los frameworks. Las capas siguen la estructura Domain -> Application -> Infrastructure -> Interfaces, con dependencias unidireccionales y contratos definidos mediante puertos.

## Capas y responsabilidades
- **Domain (`app/domain`)**
  - Entidades inmutables (`Empleado`, `RadioFrecuencia`, `SapUsuario`, `Prestamo`) implementadas con `dataclass(frozen=True)`.
  - Value objects y reglas (`Turno`, `EstadoPrestamo`, `calcular_turno`, normalizacion de identificadores).
  - Excepciones (`BusinessRuleViolation`, `EntityNotFound`, `InactiveEntity`) y eventos (`AdminChangeEvent`).
  - Puertos en `ports/` que describen interfaces para repositorios, auditoria y unidad de trabajo.
- **Application (`app/application`)**
  - Servicios de negocio (`PrestamosService`, `CatalogosService`) que orquestan validaciones, reglas y operaciones transaccionales.
  - Casos de uso (`PrestamoUseCases`, `CatalogosUseCases`) que exponen comandos inmutables (`AsignarPrestamoCmd`, `CrearEmpleadoCmd`, etc.) para facilitar pruebas y claridad.
  - Validadores (`validators.py`) que limpian inputs y limitan actualizaciones a campos permitidos.
- **Infrastructure (`app/infrastructure`)**
  - Modelos ORM (`models.py`) con indices y metadatos que optimizan consultas.
  - Mapeadores (`mappers.py`) responsables de convertir entre modelos Django y entidades de dominio, manteniendo consistencia de tipos.
  - Repositorios (`repositories.py`) que implementan los puertos usando Django ORM y `transaction.atomic()` a traves de `DjangoUnitOfWork`.
- **Interfaces (`app/interfaces`)**
  - Serializers DRF (`serializers.py`) que traducen entidades a JSON y validan payloads entrantes.
  - Permisos (`permissions.py`) que encapsulan politica de acceso (lectura vs escritura, grupo `admin`).
  - Viewsets (`views.py`) que empacan la API REST, injertan repositorios concretos y traducen errores de dominio a HTTP.
  - Ruta unificada (`urls.py`) incluida desde `core/urls.py`.

## Patrones aplicados
- **Repository Pattern**: `DjangoEmpleadoRepository`, `DjangoRadioRepository`, etc., ocultan detalles de persistencia y permiten reemplazar el motor de base de datos sin afectar el dominio.
- **Unit of Work**: `DjangoUnitOfWork` envuelve `transaction.atomic()` para asegurar atomicidad en operaciones compuestas (catalogos + auditoria).
- **Command Pattern**: `use_cases.py` define comandos inmutables que encapsulan datos de entrada, evitando efectos colaterales y facilitando test dobles.
- **Mapper Pattern**: `mappers.py` asegura conversion bidireccional consistente evitando duplicar logica en repositorios.
- **Decorator / Middleware**: `_handle_domain_errors` en `views.py` estandariza traduccion de excepciones de dominio, evitando repeticion en cada accion.

## Dependencias y configuracion
- No existen dependencias desde `domain` hacia Django. `application` depende solo de puertos, permitiendo pruebas unitarias con stubs.
- `interfaces/views.py` instancia repositorios concretos al cargar el modulo, simplificando la injecion manual y manteniendo un contenedor ligero.
- `core/settings.py` concentra configuraciones horizontales (DRF, SimpleJWT, CORS) y se mantiene libre de logica de negocio.

## Evolucion prevista
- Sustituir SQLite por Postgres o SQL Server implementando un adaptador de base de datos sin cambiar dominio ni servicios.
- Añadir tareas asincronas (Celery) para auditoria avanzada o notificaciones, usando eventos de dominio como disparadores.
- Publicar endpoints adicionales (GraphQL, WebSocket) reutilizando las mismas capas de dominio y aplicacion.
- Integrar control de importaciones masivo via API expuesta, apoyandose en `DjangoUnitOfWork` para garantizar consistencia.
