# Plan de Soporte

## Mantenimiento proactivo
- Revisar el estado de dependencias (Next.js, React, Tailwind, ExcelJS) de forma trimestral.
- Validar que el backend siga respondiendo en las rutas consumidas por el frontend.
- Ejecutar `npm run lint` antes de cada release.
- Verificar que la exportacion CSV/XLSX funciona tras cambios en la tabla historica.
- Revisar el comportamiento del refresco de tokens en sesiones largas.

## Mantenimiento reactivo
- Registrar incidentes con detalle de navegador, ruta afectada y pasos para reproducir.
- Analizar errores del cliente (console/network) y correlacionarlos con logs del backend.
- Crear ramas `hotfix/*` para correcciones urgentes y desplegar con prioridad.
- Documentar lecciones aprendidas y actualizar procesos.

## Niveles de servicio sugeridos
- Tiempo de respuesta inicial: <= 1 hora en horario laboral.
- Tiempo de contencion para fallos en login o prestamos: <= 2 horas.
- Tiempo de resolucion definitiva para severidad alta: <= 4 horas.
- Disponibilidad objetivo mensual: 99.5%.

## Roles involucrados
- **Soporte Nivel 1**: recibe reportes y valida credenciales.
- **Soporte Nivel 2 (desarrollo)**: diagnostica bugs y aplica fixes.
- **Infraestructura / DevOps**: despliega builds y gestiona variables de entorno.

## Herramientas y procedimientos
- Bitacora de despliegues y cambios.
- Checklist de despliegue (ver [Plan de Despliegue](../07_Despliegue_y_Seguridad_Usuario_Final/Plan_de_Despliegue.md)).
- Smoke tests: login, prestamo, historico y panel admin.
- Procedimiento de rollback: volver al artefacto previo y limpiar cache de la plataforma.

## Gestion del conocimiento
- Actualizar esta documentacion tras cambios de rutas o endpoints.
- Mantener registros de incidencias frecuentes con pasos de solucion.
- Capacitar nuevos usuarios en un ambiente sandbox.
