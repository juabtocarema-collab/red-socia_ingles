@echo off
title Enlace Mundial Publico - SENA Social Network
color 0A
echo ========================================================
echo   SENA SOCIAL NETWORK - ENLACE PUBLICO MUNDIAL
echo   Sin restricciones de pais - Acceso HTTPS Global
echo ========================================================
echo.
echo [1/3] Verificando compilacion de produccion...
if not exist "frontend\dist\index.html" (
    echo [*] Compilando frontend para produccion...
    cd frontend && npm run build && cd ..
)
echo.
echo [2/3] Verificando servidor backend en puerto 5000...
netstat -ano | findstr ":5000 " >nul
if %errorlevel% neq 0 (
    echo [*] Iniciando servidor backend...
    start "SENA Backend" /B cmd /c "cd backend && node server.js"
    timeout /t 3 /nobreak >nul
)
echo.
echo [3/3] Generando enlace seguro HTTPS accesible desde cualquier pais del mundo...
echo.
echo Conectando con tunel global...
echo.
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:localhost:5000 nokey@localhost.run
pause
