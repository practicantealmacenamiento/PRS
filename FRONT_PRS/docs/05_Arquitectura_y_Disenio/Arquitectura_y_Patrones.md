# Arquitectura y Patrones

## Vision general
RadioFrecuencias Frontend utiliza Next.js App Router con componentes cliente para gestionar el estado de UI y la comunicacion con la API. La arquitectura separa rutas, componentes visuales y servicios de integracion, evitando logica duplicada y facilitando mantenimiento.

## Capas y responsabilidades
- **Rutas y vistas (`src/app`)**
  - Cada ruta representa un caso de uso principal: inicio, prestamos, historico, admin, login.
  - Las vistas manejan estado local, validaciones y renderizado.
- **Componentes UI (`src/components`)**
  - Elementos reutilizables (Navbar, Menu, ThemeToggle) que mantienen consistencia visual.
- **Servicios (`src/lib`)**
  - `api.ts` centraliza fetch con JWT y refresh.
  - `auth.ts` encapsula login/logout y manejo de errores.
  - Helpers de exportacion y tipos compartidos.

## Patrones aplicados
- **Service Layer**: `api.ts` y `auth.ts` concentran la comunicacion con el backend.
- **Custom Hooks**: `useAuditLog` y `useBusyMutation` encapsulan estado y efectos.
- **Stateful Components**: cada pagina maneja estado local para formularios y filtros.
- **Composition**: panel admin divide secciones en componentes reutilizables.
- **Middleware**: `middleware.ts` protege rutas de manera uniforme.

## Dependencias y configuracion
- `NEXT_PUBLIC_API_URL` define el origen del backend consumido por el frontend.
- `globals.css` contiene tokens de color y estilos base con Tailwind CSS.
- `tailwind.config.js` habilita el modo oscuro mediante clase `.dark`.

## Evolucion prevista
- Agregar proteccion por rol en el frontend para ocultar acciones a usuarios sin permisos.
- Incorporar caching o SWR para optimizar listados.
- Añadir pruebas end-to-end (Playwright) para flujos criticos.
- Incluir observabilidad front con Sentry o similar.
