# Monitorizacion y Logs

## Configuracion base
- Usar la consola del navegador para inspeccionar errores de UI y respuestas de API.
- Verificar en la pestaña Network que `Authorization: Bearer` se envia en llamadas protegidas.
- En produccion, habilitar un servicio de monitoreo (Sentry, App Insights, Datadog RUM).

## Eventos a registrar
- Fallos de autenticacion y expiracion de tokens.
- Errores 4xx/5xx de la API al registrar prestamos o devoluciones.
- Fallos de exportacion CSV/XLSX.
- Errores de carga en `/admin` (catalogos, auditoria, usuarios).

## Indicadores operativos
- Tiempo promedio de carga de `/prestamos` y `/historico`.
- Frecuencia de errores de red o 401 en sesiones activas.
- Volumen de exportaciones y tiempo promedio de generacion.
- Cantidad de usuarios concurrentes en horarios pico (si se instrumenta analytics).

## Integracion con herramientas
- **Sentry**: captura de errores JavaScript y trazas de UI.
- **Google Analytics / Matomo**: seguimiento de paginas vistas y rutas mas usadas.
- **Azure Monitor / Datadog**: analitica de rendimiento y trazas de frontend.

## Alertamiento sugerido
- Incremento sostenido de errores 401 en menos de 10 minutos.
- Tiempos de respuesta del backend superiores a 2 s en endpoints consumidos.
- Fallos repetidos de exportacion en `/historico`.

## Retencion y compliance
- Retener errores de cliente por al menos 30 dias para analisis.
- Evitar registrar datos sensibles (cedulas completas, tokens) en logs.
- Documentar procedimientos de acceso a logs de cliente en auditorias internas.
