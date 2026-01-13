# Seguridad para Usuario Final

## Protecciones a nivel UI
- Redireccion a `/login` cuando no existe sesion activa.
- Mensajes de error claros cuando la API responde 401/403.
- Evitar mostrar detalles internos del backend en la UI.

## Gestion de credenciales y sesiones
- Solicitar al usuario cerrar sesion en equipos compartidos.
- Almacenar tokens unicamente en `localStorage` y cookie `access_token`.
- Forzar refresco de token en segundo plano para evitar expiracion repentina.

## Buenas practicas de uso
- No compartir credenciales entre operadores.
- Reportar inmediatamente accesos sospechosos al equipo de soporte.
- Mantener navegador actualizado para recibir parches de seguridad.

## Proteccion de datos personales
- Limitar la visualizacion de datos a lo necesario para la operacion.
- Evitar capturas de pantalla con datos sensibles en espacios compartidos.
- Exportar historicos solo con autorizacion formal.

## Respuesta ante incidentes
- Establecer canal de soporte para reportar incidentes.
- Bloquear accesos desde el backend ante credenciales comprometidas.
- Registrar incidentes en la bitacora y dar seguimiento hasta su resolucion.
