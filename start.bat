@echo off
REM Start Backend
cd /d "D:\Working\Game word\backend\game-word-server"
start "Backend" cmd /c "mvn spring-boot:run"

REM Start Frontend
cd /d "D:\Working\Game word\frontend\game-word-web"
start "Frontend" cmd /c "npm run dev"

echo Da khoi dong Backend (port 8080) va Frontend (port 3000)
pause
