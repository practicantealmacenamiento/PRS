# Roles y Permisos

## Roles del sistema
- **Administrador**
  - Acceso al panel `/admin` para gestionar catalogos, auditoria y usuarios.
  - Puede registrar prestamos y devoluciones.
- **Operador**
  - Acceso a `/prestamos` y `/historico`.
  - Puede registrar y devolver equipos, pero no administrar catalogos ni usuarios.
- **Superusuario**
  - Mismas capacidades de administrador con privilegios adicionales desde el backend.

## Matriz de permisos (resumen)
| Pantalla / Accion | Operador | Administrador | Superusuario |
|-------------------|----------|---------------|--------------|
| `/login` | Si | Si | Si |
| `/prestamos` | Si | Si | Si |
| `/historico` | Si | Si | Si |
| `/admin` (catalogos) | No | Si | Si |
| `/admin` (auditoria) | No | Si | Si |
| `/admin` (usuarios) | No | Si | Si |

## Control de acceso en frontend
- `middleware.ts` valida la existencia de cookie `access_token` para rutas protegidas.
- La autorizacion por rol se valida principalmente en el backend; el frontend muestra errores si la API responde 403.
- La barra de navegacion incluye el enlace a `/admin`; se recomienda ocultarlo segun rol en futuras versiones.

## Gestion de sesiones
- Tokens `access` y `refresh` se almacenan en `localStorage`.
- La cookie `access_token` permite redireccionar a `/login` si la sesion no esta activa.
- El cierre de sesion elimina tokens y el usuario almacenado.

## Recomendaciones adicionales
- Configurar politicas de contrasena en el backend y comunicar a usuarios finales.
- Revisar accesos de administradores de forma trimestral.
- Registrar cambios de usuarios en la bitacora de soporte.
