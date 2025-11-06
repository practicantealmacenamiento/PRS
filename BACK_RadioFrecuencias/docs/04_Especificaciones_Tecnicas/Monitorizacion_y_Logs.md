# Monitorizacion y Logs

## Configuracion base
- Ajustar el diccionario `LOGGING` en `core/settings.py` para definir handlers `console` y formatters JSON/estructurados segun el entorno.
- Activar los loggers `django`, `django.request`, `rest_framework` y `app` (si se agrega uno propio) con nivel `INFO` en produccion y `DEBUG` en desarrollo.
- En contenedores Docker o plataformas PaaS, enviar logs a stdout/stderr para ser recolectados por el orquestador (Azure App Service, Kubernetes, systemd).

## Eventos a registrar
- Autenticacion (`POST /api/token/`, intentos fallidos).
- Asignaciones y devoluciones de prestamos (incluir `cedula`, `codigo_radio`, `usuario_sap`, `usuario_registra_id`).
- Operaciones de catalogo (crear/actualizar/eliminar) junto con el `actor_user_id`.
- Errores de negocio (`BusinessRuleViolation`, `InactiveEntity`) y excepciones no controladas (log level `ERROR`).
- Importaciones masivas ejecutadas mediante scripts (insertados, actualizados, omitidos).

## Indicadores operativos
- Prestamos abiertos vs devueltos por turno y por dia.
- Frecuencia de violaciones de reglas (intentos de prestar un radio duplicado).
- Tiempo promedio de respuesta de endpoints `/api/empleados/`, `/api/radios/`, `/api/prestamos/`.
- Numero de eventos en `AuditEntry` por actor y ventana de tiempo para detectar patrones anormales.

## Integracion con herramientas
- **Prometheus/Grafana**: agregar `django-prometheus` para exponer metricas HTTP y de base de datos.
- **ELK / Azure Monitor / Datadog**: configurar exportadores para recolectar logs y generar dashboards.
- **Sentry / Rollbar**: capturar excepciones no controladas y correlacionarlas con releases del backend.

## Alertamiento sugerido
- Latencia mayor a 1 s sostenida durante 5 minutos en endpoints criticos.
- Mas de 5 errores 5xx en 10 minutos.
- Aumento repentino de eventos `DELETED` en auditoria o cambios masivos de estado.
- Importaciones fallidas o con porcentaje de omisiones superior al 20%.

## Retencion y compliance
- Retener logs de aplicacion por 6 meses y audit logs por 12 meses o lo que exija la politica corporativa.
- Programar tareas de archivado o purga (por ejemplo comandos cron mensuales) para `audit_log` y tablas de historial.
- Documentar procedimientos de acceso a logs para revisiones internas o auditorias externas.
