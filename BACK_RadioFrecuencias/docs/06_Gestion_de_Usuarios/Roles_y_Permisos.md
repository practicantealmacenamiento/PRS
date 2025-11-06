# Roles y Permisos

## Roles del sistema
- **Superusuario Django**
  - Acceso completo a `/admin/`, todos los endpoints REST, gestion de usuarios y auditoria.
  - Puede crear y asignar grupos, redefinir contrasenas, ejecutar scripts desde el servidor.
- **Administrador (grupo `admin`)**
  - Lectura y escritura sobre catalogos (`empleados`, `radios`, `sap-usuarios`).
  - Puede registrar y devolver prestamos, consultar auditoria y administrar usuarios de aplicacion.
- **Operador autenticado**
  - Lectura de catalogos y listado de auditoria.
  - Puede registrar y devolver prestamos, pero no modificar catalogos ni usuarios.
- **Usuario externo / no autenticado**
  - Solo acceso a recursos publicos (ninguno actualmente). Necesita token valido para interactuar con la API.

## Matriz de permisos (resumen)
| Endpoint | Operador | Administrador | Superusuario |
|----------|----------|---------------|--------------|
| `/api/empleados/` (GET) | ✅ | ✅ | ✅ |
| `/api/empleados/` (POST/PUT/PATCH/DELETE) | ❌ | ✅ | ✅ |
| `/api/radios/` (GET) | ✅ | ✅ | ✅ |
| `/api/radios/` (POST/PUT/PATCH/DELETE) | ❌ | ✅ | ✅ |
| `/api/sap-usuarios/` (GET) | ✅ | ✅ | ✅ |
| `/api/sap-usuarios/` (POST/PUT/PATCH/DELETE) | ❌ | ✅ | ✅ |
| `/api/prestamos/` (list, asignar, devolver) | ✅ | ✅ | ✅ |
| `/api/audit-log/` | ✅ (solo lectura) | ✅ | ✅ |
| `/api/usuarios-app/` | ❌ | ✅ | ✅ |

## Control de acceso en codigo
- `IsAuthenticatedReadOnlyOrAdmin` protege catalogos: `SAFE_METHODS` solo requieren autenticacion; modificaciones exigen grupo `admin` o superusuario.
- `IsAdmin` limita `AppUserViewSet` a administradores y superusuarios.
- `@action` personalizados en `PrestamoViewSet` reutilizan `permission_classes` del viewset base, permitiendo a operadores ejecutar asignaciones y devoluciones.
- La auditoria (`AuditLogViewSet`) permite lectura a cualquier usuario autenticado, manteniendo transparencia.

## Gestion de grupos y usuarios
- Crear grupo `admin` desde `/admin/auth/group/` y asignar usuarios que deban gestionar catalogos.
- Crear grupo `operador` para usuarios que solo registran prestamos; mantenerlo sin permisos explicitos para apoyarse en `IsAuthenticatedReadOnlyOrAdmin`.
- Registrar nuevos usuarios mediante `/api/usuarios-app/` o Django Admin; aplicar politica de contrasenas robustas.

## Sesiones y tokens
- Autenticacion via `POST /api/token/` (credenciales Django) y renovacion con `POST /api/token/refresh/`.
- Se recomienda habilitar rotacion de tokens de refresco (`ROTATE_REFRESH_TOKENS=True`) y listas negras (`BLACKLIST_AFTER_ROTATION=True`) si se habilita la app `rest_framework_simplejwt.token_blacklist`.
- Implementar bloqueo tras intentos fallidos repetidos usando librerias como `django-axes` para entornos productivos.

## Recomendaciones adicionales
- Registrar altas y bajas de usuarios en el log corporativo y vincularlas con tickets de soporte.
- Revisar membresias de grupos al menos una vez por trimestre.
- Mantener diferenciadas las cuentas de servicio (para integraciones) marcandolas como `is_staff=False`, `is_superuser=False` y limitando su uso a endpoints especificos.
