# Requisitos No Funcionales

## Seguridad
- **RNF-01**: Gestionar `DJANGO_SECRET_KEY`, credenciales DB y configuraciones JWT mediante variables de entorno, evitando hardcodeo en el repositorio.
- **RNF-02**: Requerir HTTPS en ambientes productivos y habilitar `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE` y `CSRF_COOKIE_SECURE` cuando `DEBUG=False`.
- **RNF-03**: Configurar `CORS_ALLOWED_ORIGINS` para restringir el acceso del frontend a dominios aprobados y deshabilitar `CORS_ALLOW_ALL_ORIGINS` en produccion.
- **RNF-04**: Registrar cada cambio de catalogo en `audit_log`, preservando `actor_user_id` y marcas de tiempo para trazabilidad forense.
- **RNF-05**: Implementar rotacion periodica de contrasenas para usuarios internos y revocar tokens al desactivar cuentas (`AppUserViewSet`).

## Rendimiento y escalabilidad
- **RNF-10**: Las operaciones de catalogo y prestamos deben responder en menos de 300 ms en condiciones nominales utilizando indices definidos en los modelos (`empleados.cedula`, `radios.codigo`, `prestamos.estado`).
- **RNF-11**: Los repositorios deben emplear `select_related` y `order_by` para evitar N+1 queries al mapear entidades (`DjangoPrestamoRepository`, `DjangoSapUsuarioRepository`).
- **RNF-12**: El sistema debe soportar al menos 10 000 registros en cada catalogo sin degradacion perceptible, beneficiandose de los indices y filtros implementados.
- **RNF-13**: El calculo de turno (`rules.calcular_turno`) debe ejecutarse en memoria sin dependencias externas, garantizando respuesta constante.

## Calidad y mantenibilidad
- **RNF-20**: Mantener la separacion entre capas domain, application, infrastructure e interfaces, impidiendo dependencias circulares (ver `app/domain/ports`).
- **RNF-21**: Las vistas deben permanecer delgadas, delegando validaciones complejas y reglas a servicios de aplicacion o dominio.
- **RNF-22**: Documentar cada cambio relevante en esta carpeta y alinear la documentacion con el codigo desplegado.
- **RNF-23**: Incorporar pruebas unitarias para reglas de dominio (turnos, prestamos abiertos) y usar `pytest` o `unittest` en el pipeline de CI.

## Observabilidad y logs
- **RNF-30**: Configurar logging centralizado en `core/settings.py` para emitir mensajes `INFO` en produccion y `DEBUG` en desarrollo.
- **RNF-31**: Registrar eventos criticos (prestamos asignados, devoluciones, errores de negocio) y almacenar stack traces de errores inesperados.
- **RNF-32**: Mantener registros de auditoria por al menos 6 meses, con estrategia de archivado o depuracion documentada.

## Disponibilidad y recuperacion
- **RNF-40**: El backend debe recuperar su operacion tras reinicios planificados preservando el estado en la base de datos.
- **RNF-41**: Los comandos de soporte (importacion Excel) deben manejar errores y hacer rollback ante fallos, garantizando consistencia de datos.
- **RNF-42**: Planificar respaldos diarios de la base y diferenciales cada 4 horas en entornos productivos.

## Compatibilidad y despliegue
- **RNF-50**: Soportar ejecucion en Python 3.13 (entorno actual) y permitir portabilidad a Python 3.11+ segun dependencias instaladas.
- **RNF-51**: Permitir despliegue en contenedores o servidores tradicionales (gunicorn, IIS) sin cambios en el codigo base.
- **RNF-52**: Exponer la documentacion OpenAPI actualizada automaticamente tras cada release (`/api/schema`, `/api/docs`).
- **RNF-53**: Mantener compatibilidad con SQLite en desarrollo y pronosticar migraciones a motores SQL sin afectar la capa de dominio.
