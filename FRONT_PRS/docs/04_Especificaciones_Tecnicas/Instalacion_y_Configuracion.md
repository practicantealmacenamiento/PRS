# Instalacion y Configuracion

## Flujo general de despliegue
1. Clonar el repositorio y seleccionar la rama correspondiente (`main`, `develop` o release).
2. Instalar dependencias con `npm install`.
3. Configurar variables de entorno segun el ambiente (ver seccion siguiente).
4. Generar build: `npm run build`.
5. Levantar el servidor: `npm run start`.
6. Validar rutas clave: `/login`, `/prestamos`, `/historico`, `/admin`.

## Variables de entorno criticas
| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL base del backend Django (preferida). | `NEXT_PUBLIC_API_URL=https://api.empresa.com/api` |
| `NEXT_PUBLIC_API_BASE_URL` | Alias alterno para la URL base. | `NEXT_PUBLIC_API_BASE_URL=https://api.empresa.com/api` |

> En entornos Windows se recomienda mantener `.env.local` para desarrollo y definir variables de entorno en el servicio para QA/Produccion.

## Configuracion por ambiente
- **Desarrollo**: `NEXT_PUBLIC_API_URL` apuntando a `http://127.0.0.1:8000/api`, `npm run dev`.
- **QA / Staging**: URL del backend de QA, build generado con `npm run build` y `npm run start`.
- **Produccion**: URL del backend productivo, HTTPS obligatorio y despliegue en servidor Node o plataforma compatible (Vercel, Azure Web App).

## Ajustes adicionales
- **Middleware**: `middleware.ts` protege rutas usando cookie `access_token`.
- **Build**: habilitar cache de Next.js segun la plataforma de despliegue.
- **Proxy**: si se usa reverse proxy, asegurar que las rutas de `/login` y assets estaticos esten habilitadas.

## Verificacion post-instalacion
- Pagina `/login` responde sin errores.
- Redireccion a `/prestamos` tras autenticacion valida.
- Consultas a `/prestamos` y `/historico` devuelven datos.
- Panel `/admin` carga catalogos y auditoria para un usuario admin.
