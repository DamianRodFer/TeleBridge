@echo off
chcp 65001 >nul 2>&1
title TeleBridge Setup Wizard v1.2

echo.
echo  ========================================
echo    TeleBridge - Setup Wizard v1.2
echo    Telegram Bot Manager
echo  ========================================
echo.

:: Get project directory
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
cd /d "%PROJECT_DIR%"
set "PROJECT_DIR=%cd%"

echo  Project: %PROJECT_DIR%
echo.

:: ──────────────────────────────────────
:: Step 1: Check Node.js
:: ──────────────────────────────────────
echo  [1/6] Checking Node.js...

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Node.js not found!
    echo  Please install Node.js LTS from https://nodejs.org/
    echo  Then run this script again.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do echo  Found Node.js %%i

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] npm not found! Reinstall Node.js.
    pause
    exit /b 1
)

:: ──────────────────────────────────────
:: Step 2: Install dependencies
:: ──────────────────────────────────────
echo.
echo  [2/6] Installing dependencies...
echo  This may take a few minutes...

call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo  [ERROR] npm install failed.
    pause
    exit /b 1
)
echo  Dependencies installed.

:: ──────────────────────────────────────
:: Step 3: Setup .env file
:: ──────────────────────────────────────
echo.
echo  [3/6] Setting up environment...

:: Create .env with correct relative database path
echo DATABASE_URL=file:../db/custom.db > .env
echo  Environment configured.

:: ──────────────────────────────────────
:: Step 4: Setup database
:: ──────────────────────────────────────
echo.
echo  [4/6] Setting up database...

if not exist "db" mkdir db

call npx prisma generate
call npx prisma db push
if %errorlevel% neq 0 (
    echo  [ERROR] Database setup failed.
    pause
    exit /b 1
)
echo  Database ready.

:: ──────────────────────────────────────
:: Step 5: Build application
:: ──────────────────────────────────────
echo.
echo  [5/6] Building application...
echo  This may take a few minutes...
echo  Note: Using Webpack (not Turbopack) for standalone output.

call npm run build
if %errorlevel% neq 0 (
    echo  [ERROR] Build failed. Check errors above.
    pause
    exit /b 1
)
echo  Build complete.

:: ──────────────────────────────────────
:: Step 6: Create desktop shortcut
:: ──────────────────────────────────────
echo.
echo  [6/6] Creating desktop shortcut with logo...

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PROJECT_DIR%\scripts\create-shortcut.ps1"

echo.
echo  ========================================
echo    TeleBridge is ready!
echo  ========================================
echo.
echo  Double-click TeleBridge on your Desktop.
echo  The app will show a loading screen, then
echo  open as a full desktop window.
echo.
echo  Or run from terminal:
echo    cd /d "%PROJECT_DIR%"
echo    npm run desktop
echo.
pause
