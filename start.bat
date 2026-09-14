@echo off
setlocal

echo ========================================================
echo   Mahjong AI Lab (Web UI) - Starting Application
echo ========================================================

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo.
echo [1/3] Starting Backend (FastAPI + Uvicorn on Port 8000)...
start "Mahjong AI Backend" cmd /k "cd /d "%SCRIPT_DIR%backend" && .\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000"

echo [2/3] Starting Frontend (Vite + Bun on Port 5173)...
start "Mahjong AI Frontend" cmd /k "cd /d "%SCRIPT_DIR%frontend" && bun run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ========================================================
echo   Mahjong AI Lab is now running!
echo   - Web UI:   http://localhost:5173
echo   - REST API: http://localhost:8000/docs
echo ========================================================
echo To stop the servers, close the respective command windows.
pause
