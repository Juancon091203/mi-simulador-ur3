@echo off
title Iniciar UR3 HMI - Docker
echo ===================================================
echo   Iniciando UR3 Web-HMI con Docker Compose
echo ===================================================
echo.
echo Recuerda tener abierto Docker Desktop antes de continuar.
echo.
docker compose up --build
pause
