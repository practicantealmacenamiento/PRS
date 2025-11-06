# Estrategia de Mantenimiento y Actualizaciones

## Tareas periodicas
- Ejecutar `python manage.py migrate` en cada release para mantener el esquema alineado con las migraciones.
- Revisar catalogos trimestralmente para desactivar empleados o radios que ya no se utilicen, evitando ruido en las listas operativas.
- Auditar prestamos cerrados con mas de 24 meses y moverlos a almacenamiento historico (export CSV o base secundaria) para evitar crecimiento excesivo.
- Validar que los indices (`cedula`, `codigo`, `usuario_sap`) se mantengan vigentes tras operaciones masivas.

## Operaciones de datos
- Utilizar `scripts/import_empleados_excel_sqlite.py` para sincronizaciones masivas; ejecutar primero en ambiente de pruebas.
- Antes de cambios significativos, exportar catalogos con `python manage.py dumpdata app.EmpleadoModel app.RadioFrecuenciaModel app.SapUsuarioModel > backup.json`.
- Documentar cualquier ajuste manual en base de datos y registrar el ticket asociado en auditoria.

## Mantenimiento correctivo
- Reproducir incidencias en entorno staging, capturando payloads y estados previos para diagnostico.
- Crear pruebas unitarias que validen la regresion (por ejemplo, nuevo escenario de `PrestamosService`).
- Planificar ventanas de despliegue en horarios de bajo trafico y comunicar a usuarios.
- Verificar logs y auditoria despues del despliegue para asegurar que la correccion se aplico.

## Mantenimiento evolutivo
- Gestionar backlog priorizando impactos en API publica, contratos con el frontend y documentación.
- Mantener versionado semantico; para cambios breaking considerar un prefijo `/api/v2/`.
- Actualizar esta documentacion inmediatamente despues de incorporar endpoints o reglas nuevas.
- Evaluar integraciones futuras (por ejemplo, sincronizacion automatica con SAP) garantizando que utilicen los puertos existentes del dominio.

## Gobierno del codigo y calidad
- Aplicar code review obligatorio, verificando separacion de capas y adherencia a patrones definidos.
- Mantener cobertura de pruebas > 80% en dominios criticos (prestamos, auditoria).
- Registrar releases en un `CHANGELOG.md` con fecha, version y resumen de cambios.
- Ejecutar auditorias de seguridad y dependencias de forma trimestral o ante alertas graves.
