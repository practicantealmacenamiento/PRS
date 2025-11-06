# Plan de Seguridad Tecnica

## Autenticacion y autorizacion
- JWT emitidos con SimpleJWT (`SIMPLE_JWT` en `settings.py`) con `ACCESS_TOKEN_LIFETIME` de 8 horas y `REFRESH_TOKEN_LIFETIME` de 7 dias; ajustar segun politicas corporativas.
- Aplicar `IsAuthenticatedReadOnlyOrAdmin` en catalogos para permitir solo lectura a usuarios autenticados y restringir escrituras a grupo `admin` o superusuarios.
- `AppUserViewSet` expone gestion de usuarios internos; se recomienda habilitar MFA y politicas de contrasenia robustas mediante integraciones corporativas (LDAP/AD).
- Revocar tokens cuando un usuario sea desactivado (`is_active=False`) y registrar la accion en auditoria.

## Protecciones de plataforma
- Desplegar exclusivamente bajo HTTPS y configurar `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` y `SECURE_HSTS_SECONDS` (>= 31536000) en produccion.
- Limitar `ALLOWED_HOSTS` y `CORS_ALLOWED_ORIGINS` a dominios aprobados; deshabilitar `CORS_ALLOW_ALL_ORIGINS` fuera de desarrollo.
- Gestionar `DJANGO_SECRET_KEY`, credenciales DB y otros secretos mediante vault seguro (Azure Key Vault, AWS Secrets Manager, HashiCorp Vault).
- Configurar `X_FRAME_OPTIONS`, `SECURE_CONTENT_TYPE_NOSNIFF` y `SECURE_REFERRER_POLICY` para fortalecer encabezados HTTP.

## Seguridad de datos
- Cifrar la base de datos en reposo (TDE en Postgres/SQL Server) y proteger backups con claves administradas.
- Controlar el acceso a `db.sqlite3` en ambientes locales mediante permisos de sistema de archivos.
- Aplicar politicas de retencion para historicos de auditoria y prestamos, anonimizado de datos personales cuando se requiera por regulaciones.
- Utilizar `select_related` para minimizar exposicion de datos sensibles en consultas repetidas.

## Seguridad de codigo y dependencias
- Ejecutar analisis SAST (Bandit, SonarQube) y verificacion de dependencias (`pip-audit`, Dependabot) en el pipeline CI/CD.
- Revisar cambios en capas sensibles (rules, services) mediante code review obligatorio.
- Mantener actualizado Django y DRF; aplicar parches de seguridad tan pronto se liberen.
- Evitar el uso de `eval`, consultas SQL crudas sin parametrizacion y accesos directos al almacenamiento de archivos fuera de los repositorios.

## Respuesta a incidentes
- Definir playbook con responsables, tiempos de escalamiento y procedimientos de contencion.
- Registrar accesos privilegiados a la base de datos o al servidor de aplicaciones.
- Establecer canal de comunicacion para alertar a usuarios ante incidentes que afecten la disponibilidad o integridad del servicio.
- Realizar simulacros trimestrales de recuperacion (restore de backups, rotacion de claves) para garantizar tiempos de respuesta dentro del SLA.
