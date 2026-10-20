@echo off
title My Social Network - SENA (Iniciando plataforma...)
echo ========================================================
echo   MY SOCIAL NETWORK - SENA (English Evidence)
echo   Conecta . Comparte . Crece
echo ========================================================
echo.

echo [1/3] Verificando servicio de base de datos MySQL (puerto 3306)...
netstat -ano | findstr ":3306 " >nul
if %errorlevel% neq 0 (
    echo [*] MySQL no esta activo. Verificando instalacion de XAMPP...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        echo [*] Iniciando MySQL de XAMPP en segundo plano...
        start /B "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 3 /nobreak >nul
        echo [OK] MySQL iniciado correctamente.
    ) else (
        echo [!] ADVERTENCIA: XAMPP no encontrado en C:\xampp. 
        echo [!] Asegurate de iniciar tu servidor MySQL manualmente.
    )
) else (
    echo [OK] MySQL ya se encuentra activo en el puerto 3306.
)
echo.

echo [2/3] Iniciando el Backend (Node.js + Express en puerto 5000)...
start "SENA Social - Backend (Puerto 5000)" cmd /k "cd backend && node server.js"

timeout /t 2 /nobreak >nul

echo [3/3] Iniciando el Frontend (React + Vite en puerto 5173)...
start "SENA Social - Frontend (Puerto 5173)" cmd /k "cd frontend && npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo Abriendo navegador en http://localhost:5173/ ...
start http://localhost:5173/

echo.
echo ========================================================
echo   Plataforma iniciada correctamente.
echo   - Backend:  http://localhost:5000
echo   - Frontend: http://localhost:5173
echo   Presiona cualquier tecla para cerrar esta ventana.
echo ========================================================
pause >nul

