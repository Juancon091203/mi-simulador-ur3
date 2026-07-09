@echo off
title Iniciar HMI Robot y Camara FRAMOS
cd /d "%~dp0"

echo ==========================================================
echo   INICIANDO HMI DE ROBOT Y CONTROL DE CAMARA FRAMOS
echo ==========================================================
echo.

:: 1. Verificar si Docker Desktop esta corriendo
echo [1/4] Comprobando estado de Docker...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Docker no parece estar iniciado. Intentando arrancar Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Esperando a que Docker se inicialice - 30 segundos...
    timeout /t 30 /nobreak
)

:: 2. Arrancar contenedores Docker (Server y URSim) en segundo plano
echo.
echo [2/4] Arrancando contenedores Docker (Express Server y URSim)...
docker compose up -d server ursim

echo Esperando 3 segundos a que inicien los servicios de Docker...
timeout /t 3 /nobreak >nul

:: Detener el contenedor de flask-server en Docker para liberar el puerto 5000 en el host
docker compose stop flask-server >nul 2>&1

:: 3. Iniciar el servidor Flask nativo para la camara FRAMOS
echo.
echo [3/4] Lanzando Flask Python Backend (Nativo en Windows)...
echo (Esto permite el acceso directo a la camara FRAMOS y sus DLLs)
start "Flask Camera Backend" cmd /k "cd flask-server && python app.py"

:: 4. Iniciar el servidor de React HMI
echo.
echo [4/4] Lanzando React Frontend HMI (Nativo en Windows)...
set NPM_CMD=npm
if exist "C:\Program Files\nodejs\npm.cmd" (
    set NPM_CMD="C:\Program Files\nodejs\npm.cmd"
)
start "React HMI Frontend" cmd /k "cd react-hmi && %NPM_CMD% run dev"

echo.
echo ==========================================================
echo ¡PROCESOS ARRANCADOS!
echo.
echo Accede a la interfaz de usuario en: http://localhost:3001
echo ==========================================================
echo.
timeout /t 3 >nul
exit
