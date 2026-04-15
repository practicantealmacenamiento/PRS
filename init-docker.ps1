# Script de inicialización para Docker (Windows PowerShell)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 Iniciando PRS con Docker" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Verificar que existe docker compose
try {
    docker compose version | Out-Null
} catch {
    Write-Host "❌ Error: Docker Compose no está instalado" -ForegroundColor Red
    exit 1
}

# Crear archivos .env si no existen
Write-Host ""
Write-Host "📝 Verificando archivos de configuración..." -ForegroundColor Yellow

if (-Not (Test-Path "BACK_PRS\.env")) {
    Write-Host "⚠️  Creando BACK_PRS\.env desde .env.example" -ForegroundColor Yellow
    Copy-Item "BACK_PRS\.env.example" "BACK_PRS\.env"
    Write-Host "   IMPORTANTE: Configura DJANGO_SECRET_KEY en BACK_PRS\.env" -ForegroundColor Magenta
}

if (-Not (Test-Path "FRONT_PRS\.env.local")) {
    Write-Host "⚠️  Creando FRONT_PRS\.env.local desde .env.example" -ForegroundColor Yellow
    Copy-Item "FRONT_PRS\.env.example" "FRONT_PRS\.env.local"
}

if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  Creando .env para docker-compose" -ForegroundColor Yellow
    @"
# Variables para docker-compose
POSTGRES_PASSWORD=prs_secure_password_123
DJANGO_SECRET_KEY=change-this-to-a-random-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "   IMPORTANTE: Cambia las contraseñas en .env" -ForegroundColor Magenta
}

# Construir y levantar contenedores
Write-Host ""
Write-Host "🐳 Construyendo y levantando contenedores..." -ForegroundColor Green
docker compose up --build -d

Write-Host ""
Write-Host "✅ Stack iniciado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Servicios disponibles:" -ForegroundColor Cyan
Write-Host "   - Frontend:  http://localhost:3000"
Write-Host "   - Backend:   http://localhost:8000"
Write-Host "   - Admin:     http://localhost:8000/admin"
Write-Host "   - API Docs:  http://localhost:8000/api/docs"
Write-Host ""
Write-Host "📋 Comandos útiles:" -ForegroundColor Yellow
Write-Host "   Ver logs:        docker compose logs -f"
Write-Host "   Detener:         docker compose down"
Write-Host "   Reiniciar:       docker compose restart"
Write-Host "   Crear admin:     docker compose exec backend python manage.py createsuperuser"
Write-Host ""
