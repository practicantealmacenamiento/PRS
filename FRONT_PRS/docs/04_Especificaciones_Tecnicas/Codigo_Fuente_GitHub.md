# Codigo Fuente y Estructura

## Raiz del proyecto
- `package.json`: scripts (`dev`, `build`, `start`, `lint`) y dependencias.
- `src/`: codigo fuente principal.
- `public/`: assets estaticos (logos, imagenes corporativas).
- `middleware.ts`: proteccion de rutas para sesiones sin token.
- `docs/`: documentacion oficial del frontend.

## Estructura de `src/`
- **`app/`**
  - `layout.tsx`: layout raiz con navbar global.
  - `page.tsx`: tablero inicial con metricas y ultimos movimientos.
  - `(routes)/login/page.tsx`: login y autenticacion.
  - `(routes)/prestamos/page.tsx`: formulario operativo de prestamos y devoluciones.
  - `(routes)/historico/page.tsx`: filtros, exportacion y tabla historica.
  - `(routes)/admin/*`: panel administrativo con catalogos, auditoria y usuarios.
- **`components/`**
  - `Navbar.tsx`, `Menu.tsx`, `ThemeToggle.tsx`, `logo.tsx`: componentes UI reutilizables.
- **`lib/`**
  - `api.ts`: wrapper de fetch con tokens y refresh.
  - `auth.ts`: login/logout y parseo de errores.
  - `types.ts`: tipado de respuestas (prestamos, catalogos, usuarios).
  - `csv.ts`, `xlsx.ts`: exportacion de reportes.
  - `turnos.ts`: calculo de turno y formatos de fecha/hora.

## Buenas practicas de versionamiento
- Mantener ramas `main` (produccion) y `develop` (integracion).
- Usar `feature/*` para cambios aislados.
- Etiquetar releases con version semantica (`v1.0.0`).
- Registrar cambios relevantes en `CHANGELOG.md` (pendiente).

## Recomendaciones de CI/CD
Un pipeline tipico (GitHub Actions, GitLab CI, Azure DevOps) debe incluir:
1. Instalacion de dependencias `npm install`.
2. Lint con `npm run lint`.
3. Build con `npm run build`.
4. Publicacion del artefacto o despliegue en el entorno destino.

Mantener esta estructura facilita escalar el frontend, agregar nuevas rutas y mantener consistencia visual.
