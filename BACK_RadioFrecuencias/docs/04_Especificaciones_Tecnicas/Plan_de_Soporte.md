# Plan de Soporte

## Mantenimiento proactivo
- Revisar diariamente los tableros de monitoreo y los registros de auditoria (`audit_log`) para detectar anomalías.
- Ejecutar respaldos completos de la base de datos en horario de baja demanda (diarios) y diferenciales cada 4 horas.
- Programar actualizaciones de dependencias criticas (Django, DRF, SimpleJWT, corsheaders) una vez por trimestre o ante alertas de seguridad.
- Mantener pruebas automatizadas actualizadas; ejecutar suite completa previo a cada release y despues de aplicar parches.
- Validar que el script de importacion desde Excel siga operativo tras cambios en hojas de origen.

## Mantenimiento reactivo
- Habilitar un canal de soporte (Service Desk, Teams) para registrar incidentes con SLA definidos.
- Registrar cada incidente con fecha, sintomas, usuario afectado, prestamo o catalogo relacionado y acciones tomadas.
- Crear ramas `hotfix/*` para resolver incidentes urgentes, aplicando pruebas dirigidas antes de desplegar a produccion.
- Documentar lecciones aprendidas y actualizar procesos si el incidente revela brechas operativas.

## Niveles de servicio sugeridos
- Tiempo de respuesta inicial: <= 1 hora en horario laboral.
- Tiempo de contencion para incidentes criticos (prestamos imposibles de registrar): <= 2 horas.
- Tiempo de resolucion definitiva para severidad alta: <= 4 horas o plan alterno comunicado.
- Disponibilidad objetivo mensual: 99.5%.

## Roles involucrados
- **Soporte Nivel 1**: atiende reportes, valida credenciales, guía a usuarios en pasos basicos.
- **Soporte Nivel 2 (desarrollo)**: diagnostica bugs, revisa logs y aplica fixes en codigo.
- **Infraestructura / DevOps**: gestiona despliegues, certificados, seguridad de servidor, backups y restauraciones.

## Herramientas y procedimientos
- Bitacora centralizada para registrar despliegues, incidencias y cambios de configuracion.
- Checklist de despliegue (ver [Plan de Despliegue](../07_Despliegue_y_Seguridad_Usuario_Final/Plan_de_Despliegue.md)) para garantizar consistencia.
- Scripts de verificacion rapida (smoke tests) para validar endpoints criticos tras cada subida.
- Procedimiento de rollback documentado: restaurar backup mas reciente, revertir tag en git y reejecutar migraciones necesarias.

## Gestion del conocimiento
- Actualizar esta documentacion cada vez que cambien endpoints, reglas o procesos operativos.
- Mantener diagramas y diagramas ER accesibles (ver [Diagramas y Modelos](../05_Arquitectura_y_Disenio/Diagramas_y_Modelos.md)).
- Capacitar al personal nuevo con sesiones guiadas utilizando un ambiente sandbox con datos ficticios.
