# Estrategia de Mantenimiento y Actualizaciones

## Tareas periodicas
- Revisar dependencias (Next.js, React, Tailwind, ExcelJS) y aplicar parches criticos.
- Validar la compatibilidad con nuevas versiones del backend (endpoints y campos).
- Revisar tokens de color y estilos tras cambios de branding.
- Ejecutar `npm run lint` y pruebas manuales de flujos criticos antes de releases.

## Operaciones de configuracion
- Verificar que `NEXT_PUBLIC_API_URL` apunte al backend correcto en cada entorno.
- Confirmar que el middleware sigue protegiendo rutas luego de cambios de routing.
- Mantener actualizada la lista de rutas protegidas en `middleware.ts`.

## Mantenimiento correctivo
- Reproducir errores en entorno de QA con datos reales.
- Ajustar validaciones de formularios si el backend cambia reglas.
- Validar exportaciones CSV/XLSX tras cambios de campos.

## Mantenimiento evolutivo
- Incorporar nuevas vistas sin romper rutas existentes.
- Mantener consistencia de componentes y estilos.
- Documentar nuevas funcionalidades en esta carpeta.

## Gobierno del codigo y calidad
- Aplicar code review obligatorio para cambios en autenticacion y API.
- Mantener control de versiones y tags por release.
- Registrar cambios importantes en `CHANGELOG.md`.
