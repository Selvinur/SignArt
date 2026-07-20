@echo off
title signArt Backend Server
cd /d "d:\signArt\SingArt_Backend"
echo ===================================================
echo   signArt Backend Sunucusu Baslatiliyor...
echo   Port: 8000
echo ===================================================
python -m uvicorn main:app --reload --port 8000
pause
