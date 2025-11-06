# Plan de Despliegue

## Preparativos
- Confirmar que la rama objetivo (por ejemplo `main`) tenga pipeline verde (tests, lint, migraciones).
- Generar artefacto o imagen container con dependencias congeladas (`pip freeze > requirements-lock.txt`).
- Verificar disponibilidad de variables de entorno y secretos en el servidor/servicio (SECRET_KEY, DB, JWT).
- Asegurar backups recientes de base de datos y archivos relevantes antes del despliegue.

## Pasos por entorno
1. **Conexion y sincronizacion**
   - Acceder al servidor mediante canal seguro (SSH/VPN) o ejecutar pipeline CI/CD.
   - Obtener el codigo (git pull, descarga de artefacto o despliegue Docker).
2. **Instalacion de dependencias**
   - Activar entorno virtual.
   - Instalar dependencias con `pip install -r requirements-lock.txt` o `pip install -r requirements.txt`.
3. **Configuracion**
   - Establecer variables de entorno (`.env`, Key Vault, secrets manager).
   - Revisar configuraciones especificas (`DEBUG=False`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`).
4. **Migraciones y tareas previas**
   - Ejecutar `python manage.py migrate`.
   - Opcional: `python manage.py collectstatic` si se serviran estaticos desde el backend.
   - Validar integridad con `python manage.py check`.
5. **Reinicio del servicio**
   - Reiniciar workers (gunicorn, uvicorn, IIS, systemd service, contenedor Docker).
   - Confirmar arranque sin errores en logs.
6. **Smoke test**
   - `GET /api/docs/` debe responder `200`.
   - Ejecutar asignacion y devolucion de prueba en ambiente controlado.
   - Validar que `audit_log` registre el evento respectivo.

## Post despliegue
- Monitorear logs durante los primeros 60 minutos en busca de errores 4xx/5xx o excepciones recurrentes.
- Notificar al equipo funcional y registrar el despliegue en bitacora (version tag, fecha, responsable).
- Validar integridad del proceso de importacion Excel cuando aplique.
- Programar una revision 24 horas despues para verificar que el volumen de prestamos y auditorias se mantiene estable.

## Rollback y contingencias
- Mantener disponible el artefacto de la version anterior y su archivo de dependencias.
- Si las migraciones son incompatibles, ejecutar `python manage.py migrate <app> <previous_migration>` o restaurar backup.
- Comunicar inmediatamente a stakeholders y ejecutar rollback en menos de 30 minutos para incidentes criticos.

## Escalabilidad y alta disponibilidad
- Implementar balanceador (NGINX, Azure Front Door) con al menos dos instancias del backend para tolerancia a fallos.
- Configurar workers segun hardware disponible (`gunicorn --workers N --threads M`).
- Considerar cache de solo lectura (Redis) para catalogos si la frecuencia de consulta lo amerita.
- Automatizar despliegues mediante pipeline CI/CD con gates de aprobacion para QA/Produccion.
