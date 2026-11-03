@echo off
setlocal EnableExtensions
title Nova Salud - Iniciar servidores
cd /d "%~dp0"

echo ============================================================
echo   NOVA SALUD - INICIO DE SERVICIOS
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js no esta instalado o no esta en el PATH.
  echo Instala Node.js 20 o superior y vuelve a ejecutar este archivo.
  echo.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm.cmd no esta disponible en el PATH.
  echo.
  pause
  exit /b 1
)

echo [1/4] Verificando MySQL...
netstat -ano | findstr ":3306" | findstr "LISTENING" >nul
if errorlevel 1 (
  if exist "C:\xampp\mysql\bin\mysqld.exe" (
    echo       MySQL no esta activo. Iniciando XAMPP MySQL...
    start "Nova Salud - MySQL" /min "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
    timeout /t 6 /nobreak >nul
  ) else (
    echo [AVISO] No se encontro C:\xampp\mysql\bin\mysqld.exe.
    echo         Inicia MySQL manualmente desde el panel de XAMPP.
  )
) else (
  echo       MySQL ya esta activo en el puerto 3306.
)

if not exist "backend\.env" (
  if exist "backend\.env.example" (
    echo [INFO] Creando backend\.env a partir de .env.example...
    copy "backend\.env.example" "backend\.env" >nul
  )
)

echo [2/4] Verificando dependencias del backend...
if not exist "backend\node_modules" (
  echo       Instalando dependencias del backend...
  pushd backend
  call npm.cmd install
  if errorlevel 1 (
    popd
    echo [ERROR] No se pudieron instalar las dependencias del backend.
    pause
    exit /b 1
  )
  popd
) else (
  echo       Dependencias del backend listas.
)

echo [3/4] Verificando dependencias del frontend...
if not exist "frontend\node_modules" (
  echo       Instalando dependencias del frontend...
  pushd frontend
  call npm.cmd install
  if errorlevel 1 (
    popd
    echo [ERROR] No se pudieron instalar las dependencias del frontend.
    pause
    exit /b 1
  )
  popd
) else (
  echo       Dependencias del frontend listas.
)

echo [4/4] Iniciando servidores...
netstat -ano | findstr ":4000" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo       Levantando API Node.js en http://localhost:4000 ...
  start "Nova Salud - API" /D "%~dp0backend" cmd /k "npm.cmd start"
) else (
  echo       La API ya esta activa en http://localhost:4000 .
)

netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if errorlevel 1 (
  echo       Levantando frontend Vite en http://localhost:5173 ...
  start "Nova Salud - Web" /D "%~dp0frontend" cmd /k "npm.cmd run dev"
) else (
  echo       El frontend ya esta activo en http://localhost:5173 .
)

echo.
echo Esperando a que la API responda...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; for($i=0;$i -lt 40;$i++){ try { $r=Invoke-WebRequest -Uri 'http://localhost:4000/api/health' -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -eq 200){ $ok=$true; break } } catch {}; Start-Sleep -Milliseconds 500 }; if($ok){ exit 0 } else { exit 1 }"
if errorlevel 1 (
  echo [AVISO] La API no respondio en el tiempo esperado.
  echo         Revisa la ventana "Nova Salud - API" para ver el error.
) else (
  echo       API lista.
)

echo.
echo Abriendo la aplicacion en el navegador...
start "" "http://localhost:5173"

echo.
echo ============================================================
echo   Servicios iniciados.
echo   Frontend: http://localhost:5173
echo   API:      http://localhost:4000/api/health
echo.
echo   Usuarios de demostracion:
echo     admin    / NovaSalud2026
echo     vendedor / Vendedor2026
echo ============================================================
echo.
pause
endlocal
