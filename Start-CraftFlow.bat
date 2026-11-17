@echo off
title CraftFlow Hand Embroidery Server & App
cd /d "%~dp0"

echo ============================================================
echo   CraftFlow - Hand Embroidery Production SaaS Launcher
echo ============================================================
echo.

:: Check if port 3000 is already running
netstat -ano | findstr ":3000" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [INFO] CraftFlow Server is already running on port 3000.
) else (
    echo [STARTING] Starting CraftFlow Background Server on port 3000...
    start /b "" powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0server.ps1" -Port 3000 >nul 2>&1
    timeout /t 2 /nobreak >nul
)

:: Find Chrome
set CHROME=""
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    set CHROME="C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set CHROME="%LocalAppData%\Google\Chrome\Application\chrome.exe"
)

if not %CHROME%=="" (
    echo [LAUNCH] Opening CraftFlow in Chrome App Mode...
    start "" %CHROME% --app=http://127.0.0.1:3000/index.html
) else (
    echo [LAUNCH] Opening in Default Browser...
    start http://127.0.0.1:3000/index.html
)

exit
