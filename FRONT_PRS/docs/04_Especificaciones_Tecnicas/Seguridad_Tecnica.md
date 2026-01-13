# Plan de Seguridad Tecnica

## Autenticacion y autorizacion
- Autenticacion basada en JWT obtenida via `POST /api/token/`.
- Renovacion automatica del token con `POST /api/token/refresh/` desde `src/lib/api.ts`.
- Limpieza de tokens y cierre de sesion al recibir respuestas 401.
- Control de acceso a rutas protegidas mediante `middleware.ts` y cookie `access_token`.

## Protecciones de plataforma
- Desplegar el frontend solo sobre HTTPS.
- Evitar exponer secretos en variables `NEXT_PUBLIC_*`.
- Restringir el acceso al backend mediante CORS y dominios permitidos (configuracion backend).
- Considerar cabeceras de seguridad (CSP, X-Frame-Options) en el reverse proxy.

## Seguridad de datos
- No persistir informacion sensible en el frontend mas alla de tokens y username.
- Mostrar mensajes de error genericos para no filtrar detalles internos.
- En exportaciones, limitar el acceso a personal autorizado.

## Seguridad de codigo y dependencias
- Ejecutar auditorias de dependencias (`npm audit`) de forma periodica.
- Mantener Next.js y React actualizados ante alertas de seguridad.
- Revisar cambios en `src/lib/api.ts` y `auth.ts` con code review obligatorio.

## Respuesta a incidentes
- Definir responsables para bloquear accesos y rotar credenciales.
- En incidentes graves, invalidar tokens desde el backend y forzar logout.
- Registrar incidentes y aplicar medidas correctivas en el frontend.
