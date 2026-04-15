# 🐳 Guía de Despliegue con Docker

Esta guía explica cómo ejecutar el proyecto PRS usando Docker y Docker Compose.

## Requisitos

- **Docker Engine** 20.10+ - [Instalar Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** 2.0+ (incluido en Docker Desktop)

## Inicio Rápido

### Opción 1: Script automático (Recomendado)

**En Windows (PowerShell):**
```powershell
.\init-docker.ps1
```

**En Linux/Mac:**
```bash
chmod +x init-docker.sh
./init-docker.sh
```

### Opción 2: Manual

1. **Crear archivos de configuración** (si no existen):
   ```bash
   cp BACK_PRS/.env.example BACK_PRS/.env
   cp FRONT_PRS/.env.example FRONT_PRS/.env.local
   ```

2. **Configurar variables de entorno** en `.env` (raíz del proyecto):
   ```bash
   POSTGRES_PASSWORD=tu_password_seguro
   DJANGO_SECRET_KEY=clave-secreta-aleatoria-muy-larga
   ALLOWED_HOSTS=localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

3. **Levantar los servicios**:
   ```bash
   docker compose up --build -d
   ```

## Servicios Disponibles

Una vez iniciados los contenedores, los servicios estarán disponibles en:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:3000 | Interfaz de usuario Next.js |
| Backend API | http://localhost:8000/api | API REST Django |
| Admin Django | http://localhost:8000/admin | Panel de administración |
| API Docs | http://localhost:8000/api/docs | Documentación OpenAPI |
| PostgreSQL | localhost:5432 | Base de datos |

## Comandos Útiles

### Ver logs en tiempo real
```bash
# Todos los servicios
docker compose logs -f

# Solo backend
docker compose logs -f backend

# Solo frontend
docker compose logs -f frontend
```

### Ejecutar comandos en los contenedores

**Crear superusuario de Django:**
```bash
docker compose exec backend python manage.py createsuperuser
```

**Ejecutar migraciones:**
```bash
docker compose exec backend python manage.py migrate
```

**Ejecutar shell de Django:**
```bash
docker compose exec backend python manage.py shell
```

**Acceder a PostgreSQL:**
```bash
docker compose exec db psql -U prs_user -d radiofrecuencias
```

### Administración de contenedores

**Detener servicios:**
```bash
docker compose down
```

**Detener y eliminar volúmenes (⚠️ borra datos):**
```bash
docker compose down -v
```

**Reiniciar servicios:**
```bash
docker compose restart
```

**Reconstruir imágenes:**
```bash
docker compose build --no-cache
docker compose up -d
```

## Estructura de Volúmenes

Los datos persistentes se almacenan en volúmenes Docker:

- `prs_postgres_data`: Datos de PostgreSQL
- `prs_static_files`: Archivos estáticos del backend

## Variables de Entorno

### Archivo `.env` (raíz del proyecto)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL | `mi_password_123` |
| `DJANGO_SECRET_KEY` | Clave secreta de Django | `random-secret-key` |
| `ALLOWED_HOSTS` | Hosts permitidos (separados por comas) | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | Orígenes CORS permitidos | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | URL del backend para el frontend | `http://localhost:8000/api` |

## Solución de Problemas

### El backend no inicia

**Problema:** "django.db.utils.OperationalError: could not connect to server"

**Solución:** Esperar a que PostgreSQL termine de iniciar:
```bash
docker compose logs db
```

### El frontend no puede conectarse al backend

**Problema:** "Failed to fetch"

**Solución:** Verificar que `NEXT_PUBLIC_API_URL` esté configurado correctamente:
```bash
docker compose exec frontend env | grep NEXT_PUBLIC_API_URL
```

### Puerto ya en uso

**Problema:** "Bind for 0.0.0.0:3000 failed: port is already allocated"

**Solución:** Cambiar el puerto en `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Usar puerto 3001 externamente
```

### Limpiar todo y empezar de cero

```bash
# Detener contenedores y eliminar volúmenes
docker compose down -v

# Eliminar imágenes creadas
docker compose down --rmi all

# Volver a construir
docker compose up --build -d
```

## Despliegue en Producción

Para producción, considera:

1. **Usar un archivo `.env.production`** con valores seguros
2. **Configurar un dominio real** en ALLOWED_HOSTS y CORS_ALLOWED_ORIGINS
3. **Usar un gestor de secretos** (AWS Secrets Manager, Azure Key Vault)
4. **Habilitar HTTPS** con un reverse proxy (Nginx, Traefik, Caddy)
5. **Configurar backups** de la base de datos PostgreSQL
6. **Usar `docker compose -f docker-compose.prod.yml`** con configuración optimizada

## Más Información

- [Documentación de Docker](https://docs.docker.com/)
- [Documentación de Docker Compose](https://docs.docker.com/compose/)
- [Mejores prácticas de Django en producción](https://docs.djangoproject.com/en/stable/howto/deployment/)
