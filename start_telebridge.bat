@echo off
title TeleBridge Server
echo ========================================
echo Starting TeleBridge Server...
echo ========================================
cd /d "%~dp0"

:: Start the dev server in the background
start /b cmd /c "npm run dev"

echo Waiting for server to initialize...
timeout /t 10 /nobreak > nul

:: Open the browser
echo Opening browser...
start http://localhost:3001

echo.
echo Server is running! Do not close this window.
echo Press any key to stop the server...
pause > nul
