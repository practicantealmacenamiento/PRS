# Frontend PRS - Radiofrecuencias

Aplicación Next.js 15 para la gestión de préstamos de radios de comunicación.

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19
- **Lenguaje:** TypeScript 5
- **Estilos:** Tailwind CSS 4
- **Manejo de Excel:** ExcelJS
- **Testing:** Jest + React Testing Library

## 🚀 Inicio Rápido

### Desarrollo Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env.local
   ```
   
   Editar `.env.local` y configurar:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
   ```

3. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador:**
   ```
   http://localhost:3000
   ```

### Producción

```bash
npm run build
npm run start
```

### Con Docker

Desde la raíz del proyecto:
```bash
docker compose up --build
```

## 📋 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia servidor de desarrollo con Turbopack |
| `npm run build` | Construye la aplicación para producción |
| `npm run start` | Inicia servidor de producción |
| `npm run lint` | Ejecuta ESLint |
| `npm test` | Ejecuta tests con Jest |
| `npm run test:watch` | Ejecuta tests en modo watch |
| `npm run test:coverage` | Genera reporte de cobertura |

## 🧪 Testing

El proyecto usa Jest y React Testing Library para tests unitarios.

**Ejecutar todos los tests:**
```bash
npm test
```

**Modo watch (desarrollo):**
```bash
npm run test:watch
```

**Reporte de coverage:**
```bash
npm run test:coverage
```

Los tests deben colocarse en:
- `src/**/__tests__/*.test.{ts,tsx}`
- `src/**/*.test.{ts,tsx}`

## 📁 Estructura del Proyecto

```
FRONT_PRS/
├── src/
│   ├── app/              # App Router pages
│   │   ├── (routes)/     # Rutas de la aplicación
│   │   ├── layout.tsx    # Layout principal
│   │   └── page.tsx      # Página de inicio
│   ├── components/       # Componentes reutilizables
│   └── lib/              # Utilidades y helpers
├── public/               # Archivos estáticos
├── .env.local            # Variables de entorno (local)
├── next.config.ts        # Configuración de Next.js
├── tailwind.config.js    # Configuración de Tailwind
└── jest.config.js        # Configuración de Jest
```

## 🔌 API Backend

El frontend se conecta al backend Django REST a través de la variable:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

### Endpoints principales:
- `POST /token/` - Autenticación JWT
- `GET /empleados/` - Lista de empleados
- `GET /radios/` - Lista de radios
- `POST /prestamos/` - Crear préstamo
- `GET /audit/` - Auditoría de cambios

## 🎨 Estilos

El proyecto usa **Tailwind CSS 4** con configuración personalizada.

Los estilos globales están en `src/app/globals.css`.

## 🔐 Autenticación

El frontend maneja autenticación JWT:
- Los tokens se almacenan en `localStorage`
- Se incluye un token de acceso en cada petición
- Refresh token para renovar sesiones

## 🌐 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL del backend API | `http://localhost:8000/api` |

> **Nota:** Las variables que empiezan con `NEXT_PUBLIC_` son accesibles en el navegador.

## 📦 Dependencias Principales

- `next`: Framework React con SSR y routing
- `react` & `react-dom`: Biblioteca UI
- `exceljs`: Manejo de archivos Excel
- `@tailwindcss/postcss`: Procesamiento de CSS

## 🐛 Solución de Problemas

### El frontend no puede conectarse al backend

**Error:** `Failed to fetch` o `Network error`

**Solución:**
1. Verificar que el backend esté corriendo en `http://127.0.0.1:8000`
2. Verificar `NEXT_PUBLIC_API_URL` en `.env.local`
3. Verificar CORS en el backend

### Error de build

**Error:** `Module not found`

**Solución:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Hot reload no funciona

**Solución:**
```bash
# Matar el proceso y reiniciar
npm run dev
```

## 📚 Recursos

- [Documentación de Next.js 15](https://nextjs.org/docs)
- [Documentación de React 19](https://react.dev)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro)

## 📄 Licencia

Privado - Uso interno Prebel S.A BIC
