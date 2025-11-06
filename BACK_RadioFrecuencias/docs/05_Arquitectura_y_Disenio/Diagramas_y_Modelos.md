# Diagramas y Modelos

## Modelo de datos (descripcion textual)
- **empleados**
  - Campos: `id` (PK), `cedula` (unique, indexed), `nombre`, `activo`, timestamps.
  - Relaciona 1:N con `sap_usuarios` (opcional).
- **radios**
  - Campos: `id`, `codigo` (unique, indexed), `descripcion`, `activo`, timestamps.
- **sap_usuarios**
  - Campos: `id`, `username` (unique), `empleado_id` (FK opcional a `empleados`), `activo`.
  - Permite vincular un usuario SAP a un empleado para trazabilidad.
- **prestamos**
  - Campos: `id`, `cedula`, `empleado_nombre`, `usuario_sap`, `codigo_radio`, `fecha_hora_prestamo`, `turno`, `estado`, `usuario_registra_id`, `fecha_hora_devolucion`, timestamps.
  - Indices compuestos sobre (`cedula`, `estado`), (`codigo_radio`, `estado`) y (`usuario_sap`, `estado`) para detectar prestamos abiertos rapidamente.
  - Referencia logica a usuarios Django mediante `usuario_registra_id`.
- **audit_log**
  - Campos: `id`, `aggregate`, `action`, `id_ref`, `at`, `actor_user_id`, `before`, `after`, `reason`.
  - Ordenado por `at` descendente para consultas recientes.

## Flujos de secuencia (descriptivo)
1. **Asignacion de radio**
   - El frontend invoca `POST /api/prestamos/` con `cedula`, `codigo_radio`, `usuario_sap`.
   - `PrestamoViewSet` valida el payload con `AsignarPrestamoRequestSerializer` y crea `AsignarPrestamoCmd`.
   - `PrestamoUseCases.asignar` delega en `PrestamosService`, que consulta repositorios (`DjangoEmpleadoRepository`, `DjangoRadioRepository`, `DjangoSapUsuarioRepository`) y valida reglas de dominio.
   - `PrestamosService` crea la entidad `Prestamo` con turno calculado y la persiste via `DjangoPrestamoRepository`.
   - La respuesta retorna el prestamo con estado `ASIGNADO` y `usuario_registra_username`.
2. **Devolucion de radio**
   - El frontend invoca `POST /api/prestamos/devolver-por-radio/` (o variantes por cedula/SAP).
   - `PrestamoUseCases` identifica el prestamo abierto y `PrestamosService.devolver` valida que exista exactamente un identificador.
   - `DjangoPrestamoRepository.marcar_devolucion` actualiza `estado=DEVUELTO` y `fecha_hora_devolucion`.
3. **Actualizacion de catalogo**
   - Un administrador envía `PATCH /api/empleados/{cedula}/`.
   - `CatalogosUseCases.actualizar_empleado` ejecuta `CatalogosService`, que aplica cambios via repositorio y registra `AdminChangeEvent` en `audit_log`.
   - `DjangoUnitOfWork` garantiza atomicidad entre la actualizacion y la insercion de auditoria.

## Diagramas recomendados (pendiente de adjuntar)
- **Diagrama de componentes**: capas Domain/Application/Infrastructure/Interfaces, destacando la direccion de dependencias.
- **Diagrama ER**: tablas con cardinalidades, indices y campos clave (cedula, codigo, username).
- **Diagrama de secuencia**: asignacion y devolucion de radio, incluyendo auditoria.
- **Diagrama de despliegue**: servidores web, base de datos, almacenamiento de logs y consumo por frontend Next.js.

Hasta contar con diagramas graficos, esta descripcion narrativa sirve como referencia para comprender las relaciones y flujos principales del backend.
