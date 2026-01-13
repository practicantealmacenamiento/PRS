# Entorno de Desarrollo

## Requerimientos basicos
- Node.js 18+ (recomendado 20+) y npm/pnpm.
- Git para clonar el repositorio y gestionar ramas.
- Acceso al backend Django en `http://127.0.0.1:8000/api` o un entorno equivalente.
- Navegador moderno (Chrome/Edge/Firefox) para pruebas.

## Configuracion inicial
1. Clonar el repositorio y ubicarse en `FRONT_PRS/`.
2. Instalar dependencias: `npm install`.
3. Crear `.env.local` con la variable de API:
   ```
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
   ```
4. Ejecutar el servidor de desarrollo: `npm run dev`.
5. Abrir `http://localhost:3000` en el navegador.

## Configuracion de herramientas
- **Editor**: Visual Studio Code con extensiones *ESLint*, *Tailwind CSS IntelliSense*.
- **Lint**: `npm run lint`.
- **Formateo**: se sugiere Prettier si se desea estandarizar estilo (pendiente de agregar).

## Datos de prueba
- Usar un usuario del backend con permisos de operador o admin.
- Crear empleados/radios/usuarios SAP desde el panel `/admin` o el backend.
- Generar prestamos de ejemplo desde `/prestamos` y revisar `/historico`.

## Servicios externos opcionales
- Sentry, Application Insights o similar para errores de cliente.
- CDN o proxy inverso si se despliega en red corporativa.

## Buenas practicas locales
- Mantener `.env.local` fuera de Git.
- Reiniciar `npm run dev` tras cambios en variables de entorno.
- Usar ramas `feature/*` para desarrollos aislados.
