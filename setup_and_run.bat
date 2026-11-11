@echo off
title WayPoint Setup & Run
echo ===================================================
echo       WayPoint - Auto Setup and Run Script
echo ===================================================
echo.

:: 1. Check for Node.js
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH! Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

:: 2. Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH! Please install Python from https://www.python.org/
    pause
    exit /b
)

echo [1/3] Setting up Backend...
cd backend
if not exist ".venv" (
    echo Creating Python virtual environment...
    python -m venv .venv
)
echo Installing backend dependencies...
call .venv\Scripts\activate.bat
pip install -r requirements.txt
cd ..

echo.
echo [2/3] Setting up Frontend...
cd frontend
echo Installing frontend dependencies...
call npm install
cd ..

echo.
echo [3/3] Starting Servers...
echo Starting Backend Server (FastAPI) on port 8000...
start "WayPoint Backend" cmd /k "cd backend && call .venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"

echo Starting Frontend Server (Vite) on port 5173...
start "WayPoint Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   Setup Complete! The application is starting...
echo   Frontend will be available at http://localhost:5173
echo   Backend API will be available at http://localhost:8000
echo ===================================================
echo.
echo IMPORTANT: Make sure you have placed the .env files in 
echo both the 'frontend' and 'backend' folders before using the app!
echo.
pause
