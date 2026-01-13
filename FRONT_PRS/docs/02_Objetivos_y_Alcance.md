# Objetivos y Alcance

## Objetivo general
Entregar un frontend web intuitivo y seguro para RadioFrecuencias que permita registrar prestamos, devoluciones y administrar catalogos, asegurando una experiencia rapida y confiable para los usuarios operativos.

## Objetivos especificos
- Implementar autenticacion JWT con almacenamiento seguro de tokens y refresco automatico.
- Ofrecer formularios operativos con validaciones inmediatas de cedula, usuario SAP y codigo RF.
- Proveer un historico consultable con filtros, ordenamiento, paginacion y exportacion.
- Consolidar la administracion de catalogos, auditoria y usuarios en un panel unico.
- Mantener una UI responsive con tema claro/oscuro y componentes reutilizables.
- Facilitar la integracion con la API REST del backend sin exponer detalles internos.

## Alcance funcional
- Paginas: `/login`, `/`, `/prestamos`, `/historico`, `/admin`.
- Consumo de endpoints REST: `token/`, `token/refresh/`, `empleados/`, `radios/`, `sap-usuarios/`, `prestamos/`, `prestamos/devolver/`, `audit-log/`, `usuarios-app/`.
- Middleware de proteccion de rutas basado en cookie `access_token`.
- Exportacion de historicos en CSV y Excel (XLSX).
- Panel administrativo con CRUD de catalogos y usuarios, y lectura de auditoria.
- Mecanismo de auto-refresh configurable en tablero inicial e historico.

## Fuera de alcance
- Logica de negocio del prestamo (se mantiene en el backend).
- Integraciones con hardware, lectores o dispositivos fisicos.
- Aplicacion movil nativa u offline.
- Analitica avanzada, dashboards BI o reporting corporativo.
- Notificaciones push, correo o SMS.

## Indicadores de exito
- Tiempo de carga inicial menor a 2 segundos en red local.
- Registro de prestamos y devoluciones completado en menos de 30 segundos por operacion.
- Exportaciones CSV/XLSX generan archivos validos en menos de 5 segundos para 5 000 registros.
- Usuarios administradores pueden crear, actualizar y eliminar catalogos sin errores de UI.
- Tokens se refrescan automaticamente sin interrumpir la sesion del usuario.
