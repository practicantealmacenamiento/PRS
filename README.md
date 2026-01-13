# PRS – Préstamo Radiofrecuencias Suministros

Suite (backend Django + frontend Next.js) para gestionar el préstamo, devolución y trazabilidad de radios de comunicación. Incluye autenticación JWT, auditoría de cambios y catálogo de empleados, radios y usuarios SAP.

## Estructura
- `BACK_PRS/`: API Django REST, dominios y reglas de negocio (capas domain → application → infrastructure → interfaces).
- `FRONT_PRS/`: App Next.js 15 (app router) que consume la API y gestiona login, préstamos y reportes.

## Requisitos rápidos
- Python 3.11+ y virtualenv (backend).
- Node 20+ y npm (frontend).

## Configuración
- Backend env (opcional): `DJANGO_SECRET_KEY`, `CORS_ALLOWED_ORIGINS`, `DEBUG` (por defecto `True`, CORS abierto para `localhost` y `127.0.0.1`).
- Frontend env: `FRONT_PRS/.env.local` → `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api` (para desarrollo local).

## Ejecución en local
Backend:
```bash
cd BACK_PRS
python -m venv .venv
.venv\Scripts\activate      # en Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Frontend:
```bash
cd FRONT_PRS
npm install
npm run dev                 # usa .env.local
# para modo producción: npm run build && npm run start
```

## Endpoints clave (API)
- `POST /api/token/` y `POST /api/token/refresh/` (JWT).
- CRUD de empleados, radios y usuarios SAP bajo `/api/`.
- Auditoría de cambios en `/api/audit/` (según permisos).

## Notas de autenticación
- El frontend persiste tokens en `localStorage` y cookie `access_token`.
- Para acceder al admin de Django: crear superusuario (`python manage.py createsuperuser`) y entrar en `/admin/`.

## Problemas comunes
- Cambios en `.env` del frontend requieren reconstruir si sirves con `npm run start`.
- Si usas IP en lugar de `127.0.0.1`, ajusta `NEXT_PUBLIC_API_URL` y ejecuta de nuevo `npm run dev` o `npm run build`.
