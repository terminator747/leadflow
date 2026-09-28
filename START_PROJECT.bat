@echo off
title LeadFlow Project Launcher
echo.
echo ============================================
echo              LEADFLOW STARTER
echo ============================================
echo.
echo Make sure you have already run:
echo   server\ npm install
echo   client\ npm install
echo   server\ npm run seed
echo.
echo Starting backend and frontend in separate windows...
echo.

start "LeadFlow Backend" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 3 /nobreak >nul
start "LeadFlow Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Two terminals were opened.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause
