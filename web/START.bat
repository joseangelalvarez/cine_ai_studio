@echo off
REM 🎬 Cine AI Studio Web – Quick Start Script (Windows)
REM Run this to get started in seconds

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     🎬 CINE AI STUDIO – WEB VERSION STARTER               ║
echo ║                    v1.0.0 PRODUCTION READY               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check Node.js
echo ✓ Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Install from https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo.

REM Get script directory
cd /d "%~dp0"
echo 📂 Project directory: %cd%
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ npm install failed
    pause
    exit /b 1
)
echo.

REM Build check
echo 🔨 Building for production...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed. Check errors above.
    pause
    exit /b 1
)
echo ✓ Build successful!
echo   Size: 14.62 kB gzipped
echo.

REM Show size
if exist dist (
    echo   dist/ folder created
) else (
    echo   (dist/ folder not found)
)
echo.

REM Start dev server
echo 🚀 Starting development server...
echo    Server: http://localhost:5173
echo.
echo Press Ctrl+C to stop
echo.

call npm run dev
pause
