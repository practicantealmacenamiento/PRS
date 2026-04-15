# ============================================================
# build_launcher.ps1  –  v2
# Construye el .exe del PRS Launcher usando PyInstaller.
# El .exe queda directamente en la raíz del proyecto.
# ============================================================

Set-Location -Path $PSScriptRoot

$VENV_PYTHON    = ".\BACK_PRS\.venv\Scripts\python.exe"
$LAUNCHER_SCRIPT = ".\launcher.py"
$EXE_NAME       = "PRS_Launcher"
$DIST_DIR       = ".\dist_temp_build"   # carpeta temporal; no confundir con "dist"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PRS Launcher - Build Script v2"           -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el venv
if (-not (Test-Path $VENV_PYTHON)) {
    Write-Host "ERROR: No se encontro el entorno virtual en $VENV_PYTHON" -ForegroundColor Red
    Write-Host "Crea el venv primero con: python -m venv .venv"           -ForegroundColor Yellow
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Verificar que existe el script launcher
if (-not (Test-Path $LAUNCHER_SCRIPT)) {
    Write-Host "ERROR: No se encontro launcher.py" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Instalar/actualizar PyInstaller en el venv
Write-Host "Instalando/verificando PyInstaller en el venv..." -ForegroundColor Yellow
& $VENV_PYTHON -m pip install pyinstaller --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: No se pudo instalar PyInstaller" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}
Write-Host "PyInstaller listo." -ForegroundColor Green
Write-Host ""

# Limpiar builds anteriores
Write-Host "Limpiando artefactos anteriores..." -ForegroundColor Yellow
if (Test-Path ".\build")    { Remove-Item ".\build"    -Recurse -Force }
if (Test-Path $DIST_DIR)    { Remove-Item $DIST_DIR    -Recurse -Force }
if (Test-Path ".\$EXE_NAME.spec") { Remove-Item ".\$EXE_NAME.spec" -Force }

# ── Construir el .exe
# --console       → la ventana de consola se mantiene abierta (el usuario ve errores)
# --distpath      → salida temporal, luego movemos el .exe a la raíz
# --clean         → fuerza build limpio
Write-Host "Construyendo $EXE_NAME.exe..." -ForegroundColor Yellow
& $VENV_PYTHON -m PyInstaller `
    --onefile `
    --console `
    --name      $EXE_NAME `
    --distpath  $DIST_DIR `
    --clean `
    $LAUNCHER_SCRIPT

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: La construccion fallo." -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# ── Mover el .exe a la raíz del proyecto (junto a BACK_PRS / FRONT_PRS)
$BUILT_EXE = Join-Path $DIST_DIR "$EXE_NAME.exe"
$TARGET_EXE = ".\$EXE_NAME.exe"

if (Test-Path $TARGET_EXE) { Remove-Item $TARGET_EXE -Force }
Move-Item $BUILT_EXE $TARGET_EXE

# Limpiar carpeta temporal
Remove-Item $DIST_DIR -Recurse -Force
Remove-Item ".\build"         -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item ".\$EXE_NAME.spec" -Force         -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  BUILD EXITOSO!"                            -ForegroundColor Green
Write-Host "  Ejecutable: $TARGET_EXE"                  -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "El .exe ya esta en la raiz del proyecto."    -ForegroundColor Cyan
Write-Host "Para distribuirlo, copia TODA esta carpeta" -ForegroundColor Yellow
Write-Host "(incluyendo BACK_PRS, FRONT_PRS y el .exe)" -ForegroundColor Yellow
Write-Host "al PC de destino."                           -ForegroundColor Yellow
Write-Host ""
Read-Host "Presiona Enter para cerrar"
