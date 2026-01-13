# Requisitos Funcionales

Los requisitos funcionales derivan del comportamiento implementado en `src/app`, los servicios en `src/lib` y los componentes de UI en `src/components`.

## Autenticacion y control de acceso
- **RF-01**: Permitir inicio de sesion via `/login` ejecutando `POST /api/token/` y almacenar `access`/`refresh`.
- **RF-02**: Guardar el token `access` en `localStorage` y en cookie `access_token` para habilitar middleware de rutas.
- **RF-03**: Renovar el token de acceso automaticamente usando `POST /api/token/refresh/` cuando el `access` expira.
- **RF-04**: Redirigir a `/login` cuando se intenta acceder a `/prestamos`, `/historico` o `/admin` sin cookie valida.
- **RF-05**: Permitir cierre de sesion desde la barra superior eliminando tokens y usuario local.

## Tablero inicial
- **RF-10**: Mostrar indicadores de prestamos abiertos, prestados hoy, devueltos hoy y total de registros.
- **RF-11**: Listar los ultimos movimientos consultando `GET /api/prestamos/`.
- **RF-12**: Permitir busqueda rapida por cedula, empleado, usuario SAP, codigo RF o estado.
- **RF-13**: Ofrecer recarga manual y auto-refresh opcional cada 30 segundos.

## Prestamos y devoluciones
- **RF-20**: Validar cedula consultando `GET /api/empleados/?q=` y bloquear registros si el empleado no existe o esta inactivo.
- **RF-21**: Validar usuario SAP consultando `GET /api/sap-usuarios/?q=` y mostrar estado valido/invalido.
- **RF-22**: Validar radio consultando `GET /api/radios/?q=` y mostrar estado valido/invalido.
- **RF-23**: Registrar un prestamo con `POST /api/prestamos/` enviando cedula, usuario SAP y codigo RF.
- **RF-24**: Registrar devolucion con `POST /api/prestamos/devolver/` aceptando cedula, usuario SAP o codigo RF.
- **RF-25**: Mostrar turno, fecha, hora y usuario que registra la operacion.

## Historico y exportacion
- **RF-30**: Listar prestamos historicos mediante `GET /api/prestamos/` con filtros por cedula o radio.
- **RF-31**: Aplicar filtros client-side por estado, turno, usuario SAP, nombre y rango de fechas.
- **RF-32**: Permitir ordenamiento por columnas y paginacion local.
- **RF-33**: Exportar registros filtrados a CSV y XLSX.
- **RF-34**: Permitir auto-refresh opcional cada 30 segundos.

## Administracion
- **RF-40**: Gestionar catalogo de empleados (crear, editar, eliminar) via `GET/POST/PATCH/DELETE /api/empleados/`.
- **RF-41**: Gestionar catalogo de radios via `GET/POST/PATCH/DELETE /api/radios/`.
- **RF-42**: Gestionar usuarios SAP via `GET/POST/PATCH/DELETE /api/sap-usuarios/`.
- **RF-43**: Consultar auditoria con `GET /api/audit-log/` y filtrar por tipo de agregado.
- **RF-44**: Gestionar usuarios del sistema via `GET/POST/PATCH/DELETE /api/usuarios-app/`.
- **RF-45**: Notificar exitos y errores en el panel administrativo mediante mensajes flash.

## Experiencia de usuario
- **RF-50**: Mantener menu lateral y barra superior consistentes en todas las rutas principales.
- **RF-51**: Permitir alternar entre tema claro y oscuro persistiendo preferencia en `localStorage`.
- **RF-52**: Mostrar mensajes de error comprensibles cuando una llamada a la API falla.
