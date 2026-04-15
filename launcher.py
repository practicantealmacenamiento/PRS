"""
PRS_App - All-in-One Launcher e Instalador automático.
Inicia el Backend (Django) y el Frontend (Next.js) en paralelo.
Si detecta que faltan dependencias (.venv o node_modules), las instala automáticamente.

MEJORAS v2:
- No se cierra la terminal si hay un error: muestra el error y espera Enter.
- Guarda un archivo de log (prs_launcher_error.log) junto al .exe para diagnóstico.
- Inyecta la variable BACK_DIR en el entorno para que Django use la ruta correcta.
- Corrige la mezcla bytes/texto en la captura de salida de subprocesos.
"""

import os
import sys
import time
import subprocess
import webbrowser
import threading
import atexit
import signal
import shutil
import traceback

# ==============================================================
# CONFIGURACIÓN GLOBALES Y PATHS
# ==============================================================

BACK_PORT = 8000
FRONT_PORT = 3000
BROWSER_DELAY_SECONDS = 15  # Esperar a que Next.js compile
FRONT_URL = f"http://localhost:{FRONT_PORT}"

# ── Directorio base: siempre la carpeta donde está el .exe (o el .py en desarrollo)
if getattr(sys, "frozen", False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

BACK_DIR  = os.path.join(BASE_DIR, "BACK_PRS")
FRONT_DIR = os.path.join(BASE_DIR, "FRONT_PRS")
VENV_DIR  = os.path.join(BACK_DIR, ".venv")
NODE_MODULES = os.path.join(FRONT_DIR, "node_modules")
REQUIREMENTS = os.path.join(BACK_DIR, "requirements.txt")
LOG_FILE  = os.path.join(BASE_DIR, "prs_launcher_error.log")

IS_WIN = (sys.platform == "win32")

if IS_WIN:
    VENV_PYTHON = os.path.join(VENV_DIR, "Scripts", "python.exe")
    NPM_CMD     = "npm.cmd"
else:
    VENV_PYTHON = os.path.join(VENV_DIR, "bin", "python")
    NPM_CMD     = "npm"

processes: list = []

# ==============================================================
# LOGGING
# ==============================================================

def log(msg: str, color: str = ""):
    """Imprime con color ANSI si el terminal lo soporta y escribe al log."""
    colors = {
        "green":  "\033[92m",
        "yellow": "\033[93m",
        "red":    "\033[91m",
        "cyan":   "\033[96m",
        "reset":  "\033[0m",
    }
    prefix = colors.get(color, "")
    suffix = colors["reset"] if color else ""
    ts = time.strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(f"[{ts}] {prefix}{msg}{suffix}", flush=True)
    # También escribir al log sin colores ANSI
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


def write_log_header():
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write("\n" + "=" * 60 + "\n")
            f.write(f"  INICIO SESIÓN: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"  BASE_DIR : {BASE_DIR}\n")
            f.write(f"  BACK_DIR : {BACK_DIR}\n")
            f.write(f"  FRONT_DIR: {FRONT_DIR}\n")
            f.write(f"  OS       : {sys.platform}\n")
            f.write("=" * 60 + "\n")
    except Exception:
        pass


# ==============================================================
# LIMPIEZA AL SALIR
# ==============================================================

def cleanup():
    """Termina todos los subprocesos al salir."""
    log("Cerrando servidores...", "yellow")
    for proc in processes:
        if proc and proc.poll() is None:
            try:
                proc.terminate()
                proc.wait(timeout=5)
            except Exception:
                try:
                    proc.kill()
                except Exception:
                    pass
    log("Todos los procesos han sido detenidos.", "green")


# ==============================================================
# INSTALACIÓN AUTOMÁTICA
# ==============================================================

def run_sync(cmd: list, cwd: str, label: str) -> bool:
    """Ejecuta un comando bloqueante y muestra salida en tiempo real."""
    log(f"Ejecutando: {' '.join(str(c) for c in cmd)}", "cyan")
    try:
        proc = subprocess.Popen(
            cmd,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,           # ← texto directamente, no bytes
            encoding="utf-8",
            errors="replace",
            shell=IS_WIN,
        )
        for line in proc.stdout:
            stripped = line.rstrip()
            if stripped:
                print(f"  [{label}] {stripped}", flush=True)
                try:
                    with open(LOG_FILE, "a", encoding="utf-8") as f:
                        f.write(f"  [{label}] {stripped}\n")
                except Exception:
                    pass
        proc.wait()
        if proc.returncode != 0:
            log(f"{label} falló (código {proc.returncode}).", "red")
            return False
        return True
    except FileNotFoundError as exc:
        log(f"Comando no encontrado [{label}]: {exc}", "red")
        log("Verifica que Python y Node.js estén instalados y en el PATH.", "yellow")
        return False
    except Exception as exc:
        log(f"Error al ejecutar {label}: {exc}", "red")
        return False


def check_and_install_dependencies():
    """Verifica si falta .venv o node_modules e instala todo lo necesario."""
    need_backend  = not os.path.exists(VENV_DIR)
    need_frontend = not os.path.exists(NODE_MODULES)

    if need_backend or need_frontend:
        print()
        log("=====================================================", "yellow")
        log("  PRIMERA EJECUCIÓN DETECTADA (Faltan dependencias)", "yellow")
        log("  Iniciando instalación automática. Por favor espera...", "yellow")
        log("=====================================================", "yellow")
        print()

    # 1. Instalar Backend
    if need_backend:
        log("1/4: Creando entorno virtual de Python...", "cyan")
        python_bin = shutil.which("python") or shutil.which("python3") or "python"
        if not run_sync([python_bin, "-m", "venv", ".venv"], cwd=BACK_DIR, label="venv"):
            input("\n❌ Error creando el entorno virtual.\n"
                  "Asegúrate de tener Python 3.10+ instalado y en el PATH.\n"
                  "Presiona Enter para salir...")
            sys.exit(1)

        log("2/4: Instalando dependencias de Python (puede tardar minutos)...", "cyan")
        if not run_sync(
            [VENV_PYTHON, "-m", "pip", "install", "-r", REQUIREMENTS, "--upgrade"],
            cwd=BACK_DIR, label="pip"
        ):
            input("\n❌ Error instalando dependencias Python.\n"
                  "Revisa el archivo prs_launcher_error.log para más detalles.\n"
                  "Presiona Enter para salir...")
            sys.exit(1)

        log("3/4: Preparando base de datos...", "cyan")
        # Pasar BACK_DIR al entorno para que Django use la ruta correcta
        env = build_django_env()
        proc = subprocess.run(
            [VENV_PYTHON, "manage.py", "migrate", "--run-syncdb"],
            cwd=BACK_DIR,
            env=env,
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
        )
        if proc.returncode != 0:
            log(f"Error en migrate:\n{proc.stdout}\n{proc.stderr}", "red")
            input("\n❌ Error en la base de datos.\n"
                  "Revisa el archivo prs_launcher_error.log.\n"
                  "Presiona Enter para salir...")
            sys.exit(1)
        log("Backend instalado correctamente.", "green")

    # 2. Instalar Frontend
    if need_frontend:
        log("4/4: Instalando dependencias del Frontend (puede tardar varios minutos)...", "cyan")
        if not run_sync([NPM_CMD, "install"], cwd=FRONT_DIR, label="npm"):
            input("\n❌ Error instalando node_modules.\n"
                  "Asegúrate de tener Node.js instalado.\n"
                  "Presiona Enter para salir...")
            sys.exit(1)
        log("Frontend instalado correctamente.", "green")

    if need_backend or need_frontend:
        print()
        log("✅ INSTALACIÓN COMPLETADA EXITOSAMENTE. INICIANDO SERVIDORES...", "green")
        print()


# ==============================================================
# ENTORNO DE DJANGO (paths dinámicos)
# ==============================================================

def build_django_env() -> dict:
    """
    Construye el entorno de OS para los subprocesos de Django.
    Inyecta BACK_DIR para que settings.py pueda resolver rutas relativas
    aunque se ejecute desde cualquier carpeta en cualquier PC.
    Carga también el .env de BACK_PRS si existe.
    """
    env = os.environ.copy()

    # Inyectar la ruta real del backend para que Django la use
    env["PRS_BACK_DIR"] = BACK_DIR

    # Cargar variables del .env manualmente (sin dependencia a python-dotenv)
    env_file = os.path.join(BACK_DIR, ".env")
    if os.path.isfile(env_file):
        try:
            with open(env_file, "r", encoding="utf-8") as f:
                for raw_line in f:
                    line = raw_line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, _, value = line.partition("=")
                    key   = key.strip()
                    value = value.strip().strip('"').strip("'")
                    if key and key not in env:   # no sobreescribir variables ya definidas
                        env[key] = value
        except Exception as exc:
            log(f"Advertencia: No se pudo leer el .env: {exc}", "yellow")

    return env


# ==============================================================
# INICIO DE SERVIDORES
# ==============================================================

def stream_output(proc, label: str):
    """Lee stdout de forma asíncrona (el pipe ya está en modo texto)."""
    try:
        for line in iter(proc.stdout.readline, ""):
            decoded = line.rstrip()
            if decoded:
                print(f"  [{label}] {decoded}", flush=True)
                try:
                    with open(LOG_FILE, "a", encoding="utf-8") as f:
                        f.write(f"  [{label}] {decoded}\n")
                except Exception:
                    pass
    except Exception:
        pass


def launch_backend():
    log(f"Iniciando API (Django) en puerto {BACK_PORT}...")
    cmd = [VENV_PYTHON, "manage.py", "runserver", f"127.0.0.1:{BACK_PORT}"]
    env = build_django_env()
    extra = {}
    if IS_WIN:
        extra["creationflags"] = subprocess.CREATE_NO_WINDOW
    proc = subprocess.Popen(
        cmd,
        cwd=BACK_DIR,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        shell=False,
        **extra,
    )
    processes.append(proc)
    threading.Thread(target=stream_output, args=(proc, "BACK"), daemon=True).start()
    return proc


def launch_frontend():
    log(f"Iniciando Web (Next.js) en puerto {FRONT_PORT}...")
    cmd = [NPM_CMD, "run", "dev"]
    extra = {}
    if IS_WIN:
        extra["creationflags"] = subprocess.CREATE_NO_WINDOW
    proc = subprocess.Popen(
        cmd,
        cwd=FRONT_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        shell=IS_WIN,
        **extra,
    )
    processes.append(proc)
    threading.Thread(target=stream_output, args=(proc, "FRONT"), daemon=True).start()
    return proc


def open_browser_delayed():
    log(f"El navegador se abrirá en {BROWSER_DELAY_SECONDS} segundos...", "cyan")
    time.sleep(BROWSER_DELAY_SECONDS)
    log(f"Abriendo aplicación en {FRONT_URL}", "green")
    webbrowser.open(FRONT_URL)


def wait_for_exit():
    try:
        while True:
            time.sleep(1)
            for proc in processes:
                if proc and proc.poll() is not None:
                    log(f"¡Un servicio se cerró inesperadamente! (código: {proc.returncode})", "red")
                    log(f"Revisa el archivo de log: {LOG_FILE}", "yellow")
                    return
    except KeyboardInterrupt:
        log("Cierre manual detectado (Ctrl+C).", "yellow")


# ==============================================================
# ENTRY POINT
# ==============================================================

def main():
    write_log_header()

    print("=" * 60)
    print("  🚀 SISTEMA DE PRESTAMOS RADIOFRECUENCIAS")
    print(f"  Directorio base: {BASE_DIR}")
    print("=" * 60)

    # 0. Validar que el .exe está en el lugar correcto
    if not os.path.isdir(BACK_DIR) or not os.path.isdir(FRONT_DIR):
        print()
        log("❌ ERROR CRÍTICO: Carpetas del proyecto no encontradas.", "red")
        log(f"  Se buscó BACK_PRS en : {BACK_DIR}", "red")
        log(f"  Se buscó FRONT_PRS en: {FRONT_DIR}", "red")
        print()
        log("POSIBLES CAUSAS:", "yellow")
        log("  1. Estás ejecutando el .exe desde dentro de la carpeta 'dist'.", "yellow")
        log("  2. Copiaste el .exe pero olvidaste copiar las carpetas del código.", "yellow")
        print()
        log("SOLUCIÓN:", "green")
        log("  Coloca el .exe JUNTO a las carpetas BACK_PRS y FRONT_PRS.", "green")
        print()
        input("Presiona ENTER para salir...")
        sys.exit(1)

    # 1. Comprobar e instalar lo que falte
    check_and_install_dependencies()

    atexit.register(cleanup)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, lambda s, f: sys.exit(0))

    # 2. Levantar el Backend
    launch_backend()
    time.sleep(2)

    # 3. Levantar el Frontend
    launch_frontend()

    # 4. Abrir el navegador automáticamente
    threading.Thread(target=open_browser_delayed, daemon=True).start()

    print()
    log("✅ Servicios en línea.", "green")
    log("   NO CIERRES ESTA VENTANA para mantener la app funcionando.", "green")
    log("   Presiona Ctrl+C para detener ambos servidores de forma segura.", "yellow")
    log(f"   Log guardado en: {LOG_FILE}", "cyan")
    print()

    wait_for_exit()


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:
        # ── Captura CUALQUIER error no controlado y lo muestra antes de cerrar
        print("\n" + "=" * 60, flush=True)
        print("  💥 ERROR INESPERADO EN EL LAUNCHER", flush=True)
        print("=" * 60, flush=True)
        tb = traceback.format_exc()
        print(tb, flush=True)
        try:
            with open(LOG_FILE, "a", encoding="utf-8") as f:
                f.write("\n💥 ERROR INESPERADO:\n")
                f.write(tb)
        except Exception:
            pass
        print(f"\nEl error también fue guardado en: {LOG_FILE}", flush=True)
        input("\nPresiona ENTER para cerrar...")
        sys.exit(1)
