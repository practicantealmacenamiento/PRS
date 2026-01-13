# Requisitos No Funcionales

## Seguridad
- **RNF-01**: El frontend debe operar sobre HTTPS en ambientes productivos.
- **RNF-02**: Los tokens JWT no deben exponerse en logs ni almacenarse en texto plano fuera de `localStorage`/cookie.
- **RNF-03**: La cookie `access_token` debe usarse solo para control de rutas y mantenerse con `SameSite=Lax`.
- **RNF-04**: El frontend debe limpiar tokens al detectar respuesta 401 o tokens expirados.
- **RNF-05**: Evitar incluir secretos en variables `NEXT_PUBLIC_*`.

## Rendimiento y escalabilidad
- **RNF-10**: Las vistas principales deben renderizar en menos de 2 segundos en red local.
- **RNF-11**: La pagina de historico debe manejar al menos 5 000 registros sin fallas de UI.
- **RNF-12**: Exportaciones CSV/XLSX deben completarse en menos de 5 segundos para 5 000 filas.
- **RNF-13**: Las llamadas API deben reutilizar el wrapper centralizado para evitar duplicidad de logica.

## Calidad y mantenibilidad
- **RNF-20**: Separar rutas, componentes y utilidades en `src/app`, `src/components` y `src/lib`.
- **RNF-21**: Mantener tipado estricto de respuestas mediante `src/lib/types.ts`.
- **RNF-22**: Documentar cambios relevantes en esta carpeta y alinear docs con el codigo desplegado.
- **RNF-23**: Ejecutar `npm run lint` antes de releases.

## Usabilidad y accesibilidad
- **RNF-30**: La interfaz debe ser usable en pantallas desde 360px hasta desktop.
- **RNF-31**: Formularios deben indicar errores de validacion de forma visible.
- **RNF-32**: Los controles principales deben ser navegables con teclado.

## Observabilidad
- **RNF-40**: Los errores de API deben mostrar mensajes amigables sin revelar detalles internos.
- **RNF-41**: Integrar (opcional) una herramienta de monitoreo front (Sentry, App Insights) para errores de cliente.

## Compatibilidad y despliegue
- **RNF-50**: Soportar navegadores modernos basados en Chromium y Firefox ESR.
- **RNF-51**: Desplegar en Node 18+ o plataformas compatibles con Next.js 15.
- **RNF-52**: Permitir configuracion del backend via `NEXT_PUBLIC_API_URL` sin recompilar el codigo fuente.
