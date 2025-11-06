# Seguridad para Usuario Final

## Protecciones a nivel API
- Exigir HTTPS en todos los dominios expuestos y bloquear trafico HTTP (`SECURE_SSL_REDIRECT=True`).
- Validar tokens JWT en cada request (middleware DRF). El frontend debe refrescar tokens antes de su expiracion y cerrar sesion automaticamente cuando expiren.
- Configurar `CORS_ALLOWED_ORIGINS` y `CSRF_TRUSTED_ORIGINS` con los dominios oficiales del frontend, evitando accesos desde sitios no autorizados.
- Limitar los metodos disponibles en viewsets para usuarios operadores (por ejemplo, prohibir `DELETE` en catalogos).

## Gestion de credenciales y sesiones
- Forzar el cambio de contrasena en el primer acceso para usuarios administradores creados via `AppUserViewSet`.
- Adoptar politicas de contrasena: longitud minima 12, mezcla de caracteres, caducidad cada 90 dias.
- Activar rotacion de tokens de refresco y listas negras si se detecta compromiso (`rest_framework_simplejwt.token_blacklist`).
- Revocar tokens al desactivar cuentas (`is_active=False`) y comunicar al usuario el motivo y pasos para restablecer acceso.

## Experiencia y comunicacion
- Proveer mensajes claros en el frontend ante errores 401/403, indicando que el token expiro o que se requieren permisos adicionales.
- Evitar exponer detalles internos del backend en respuestas de error; registrar el detalle en logs para diagnostico.
- Implementar un endpoint de verificacion (`/api/usuarios-app/me/` futuro) o reusar `/api/empleados/` para validar sesion activa.

## Proteccion de datos personales
- Limitar los campos expuestos en serializers a informacion necesaria (`cedula`, `nombre`, `activo`) evitando datos sensibles adicionales.
- Cumplir lineamientos de tratamiento de datos personales: permitir desactivar empleados y eliminar usuarios SAP bajo solicitud formal.
- Asegurar que exportaciones o reportes provengan de personal autorizado y se registren en auditoria.

## Respuesta ante incidentes
- Establecer canal para reportar perdida o robo de credenciales (mesa de ayuda, linea directa).
- Definir procedimiento para bloquear cuentas comprometidas en menos de 30 minutos y notificar al usuario.
- Documentar incidentes y medidas tomadas en la bitacora de soporte para analisis posterior.
