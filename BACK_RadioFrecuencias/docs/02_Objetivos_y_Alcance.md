# Objetivos y Alcance

## Objetivo general
Entregar y mantener un backend robusto para RadioFrecuencias que gestione el ciclo completo de prestamos de radios, preserve catalogos maestros confiables y exponga capacidades de auditoria y seguridad alineadas con la operacion industrial.

## Objetivos especificos
- Centralizar autenticacion JWT, autorizacion y gestion de usuarios internos bajo un conjunto de endpoints REST consistentes.
- Permitir el CRUD completo de empleados, radios y usuarios SAP con reglas de unicidad, estados activos/inactivos y vinculaciones validadas.
- Orquestar prestamos garantizando que un empleado, radio o usuario SAP no acumulen mas de un prestamo abierto simultaneamente.
- Registrar eventos de auditoria derivados de acciones administrativas, capturando valores anteriores y posteriores con trazabilidad de actor y motivo.
- Facilitar integraciones con el frontend Next.js y futuras aplicaciones a traves del esquema OpenAPI publicado.
- Proveer scripts de soporte (importacion desde Excel) y servicios para mantener actualizados los catalogos sin edicion manual en base de datos.

## Alcance funcional
- API REST autenticada bajo el prefijo `api/`, protegida por JWT y documentada con drf-spectacular (`/api/schema`, `/api/docs`).
- Endpoints de catalogo para empleados (`EmpleadoViewSet`), radios (`RadioViewSet`) y usuarios SAP (`SapUsuarioViewSet`) basados en `CatalogosUseCases`.
- Flujos de prestamos: asignacion (`POST /api/prestamos/`), devoluciones por radio/cedula/usuario SAP, listados filtrados y consultas historicas.
- Registro de auditoria consultable (`/api/audit-log/`) y gestion de usuarios internos (`/api/usuarios-app/`) para operadores y administradores.
- Configuracion de seguridad basica: CORS configurable, control de origenes, vida util de tokens y gestion de roles via grupos de Django.
- Soporte a base de datos SQLite en desarrollo con capacidad de migrar a motores SQL soportados por Django.

## Fuera de alcance
- Interfaces graficas del usuario final (gestionadas por el frontend Next.js o aplicaciones moviles).
- Integraciones en tiempo real con sistemas SAP; el backend almacena referencias (username) pero no sincroniza datos automaticamente.
- Gestion de hardware (lectores, racks) o inventario fisico mas alla de la informacion registrada en los catalogos.
- Pipelines CI/CD y automatizacion de infraestructura (requieren configuraciones externas).
- Servicios de mensajeria o notificaciones push a los usuarios finales.

## Indicadores de exito
- Cumplimiento de reglas de negocio que impiden prestamos duplicados segun cedula, radio o usuario SAP.
- Latencia promedio inferior a 300 ms en operaciones CRUD de catalogo y menor a 500 ms en asignaciones/devoluciones bajo carga nominal.
- Documentacion OpenAPI sincronizada con las implementaciones y accesible a integradores internos.
- Eventos de auditoria completos para al menos el 95% de operaciones administrativas efectuadas por usuarios staff.
- Capacidad de incorporar nuevos radios o empleados en menos de 5 minutos utilizando los endpoints o scripts provistos.
