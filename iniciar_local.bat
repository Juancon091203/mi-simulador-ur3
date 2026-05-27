@echo off
title Iniciar UR3 HMI - Local
echo ===================================================
echo   Iniciando UR3 Web-HMI Localmente (Sin Docker)
echo ===================================================
echo.
echo Se abriran dos nuevas ventanas para ejecutar:
echo 1. El Frontend de React (puerto 3001)
echo 2. El Backend de Flask (puerto 5000)
echo.
pause

echo Iniciando Frontend (React)...
start "React Frontend HMI" cmd /k "cd /d %~dp0react-hmi && npm install && npm run dev"

echo Iniciando Backend (Flask)...
start "Flask Backend Server" cmd /k "cd /d %~dp0flask-server && pip install Flask flask-cors ur-rtde && python app.py"

echo.
echo ===================================================
echo ¡Procesos lanzados con exito!
echo ===================================================
echo.
