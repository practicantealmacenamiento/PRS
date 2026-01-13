# Descripcion General del Proyecto

RadioFrecuencias Frontend es una aplicacion web construida con **Next.js 15** y **React 19** que permite al personal operativo gestionar prestamos y devoluciones de radios, consultar historicos y administrar catalogos desde un panel unificado. La interfaz se comunica con la API REST del backend Django, manejando autenticacion JWT, refresco automatico de tokens y exportacion de reportes en CSV/XLSX.

## Proposito de la plataforma
- Proveer una interfaz rapida para registrar prestamos y devoluciones con validaciones inmediatas.
- Visualizar metricas operativas y ultimos movimientos en un tablero inicial.
- Facilitar la consulta historica con filtros avanzados, ordenamiento y exportacion.
- Centralizar la administracion de catalogos, auditoria y usuarios del sistema.
- Mantener una experiencia consistente con tema claro/oscuro y layout responsive.

## Capas de la solucion (frontend)
- **App Router (`src/app`)**: rutas y layouts principales (`/`, `/login`, `/prestamos`, `/historico`, `/admin`) con componentes cliente.
- **Componentes UI (`src/components`)**: barra de navegacion, menu lateral, logo y selector de tema.
- **Servicios y utilidades (`src/lib`)**: cliente API con manejo de tokens (`api.ts`), autenticacion (`auth.ts`), tipos compartidos, helpers de exportacion (`csv.ts`, `xlsx.ts`) y calculo de turnos (`turnos.ts`).
- **Estilos globales (`src/app/globals.css`)**: tokens de color, utilidades y estilos base basados en Tailwind CSS v4.

## Servicios funcionales clave
- **Autenticacion**: login via `POST /api/token/`, almacenamiento de tokens y refresco via `/api/token/refresh/`.
- **Prestamos y devoluciones**: formulario operativo en `/prestamos` con validaciones de cedula, usuario SAP y codigo RF; permite devoluciones por cualquier identificador.
- **Historico**: vista `/historico` con filtros, ordenamiento, paginacion, exportacion CSV/XLSX y auto-refresh opcional.
- **Administracion**: panel `/admin` con gestion de catalogos (empleados, radios, usuarios SAP), auditoria y usuarios del sistema.
- **Tablero inicial**: pagina `/` con indicadores de prestamos abiertos, prestados/devueltos hoy y ultimos movimientos.

## Integraciones y dependencias
- **API Backend**: consumida via `NEXT_PUBLIC_API_URL` o `NEXT_PUBLIC_API_BASE_URL` (por defecto `http://127.0.0.1:8000/api`).
- **Autenticacion**: JWT almacenado en `localStorage` y cookie `access_token` para proteger rutas mediante `middleware.ts`.
- **Exportacion**: uso de `exceljs` para XLSX y utilidades propias para CSV.
- **UI**: Tailwind CSS v4 con tokens corporativos para coherencia visual.

## Flujo operativo resumido
1. El usuario inicia sesion en `/login` y obtiene tokens JWT desde el backend.
2. El frontend guarda `access` en `localStorage` y en cookie para proteger rutas.
3. En `/prestamos`, el operador valida empleado, usuario SAP y radio con consultas a la API, luego registra el prestamo.
4. Las devoluciones se registran con `/prestamos/devolver/` enviando cedula, usuario SAP o codigo RF.
5. En `/historico`, el usuario filtra y exporta registros.
6. En `/admin`, los administradores gestionan catalogos, revisan auditoria y administran usuarios internos.

## Principios de diseno
- Minimizar la latencia percibida mediante actualizaciones optimistas y refresco controlado.
- Centralizar la comunicacion con la API en `src/lib/api.ts` para mantener consistencia.
- Separar vistas por rutas y reutilizar componentes con estado aislado.
- Mantener estilos y tokens de color en `globals.css` para evitar divergencias visuales.
- Respetar la experiencia responsive en desktop y mobile con grid y flex.

Este documento resume el estado actual del frontend de RadioFrecuencias y sirve como referencia para soporte y evolucion de la interfaz.
