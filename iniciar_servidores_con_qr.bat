@echo off
title Sistema Activo Fijo UAGRM - Lanzador Completo
echo ========================================================
echo   Iniciando Sistema de Activo Fijo UAGRM con Acceso QR
echo ========================================================

echo 1. Iniciando Backend Django (Puerto 8000)...
start "Backend Django" /D "E:\Proyect_Activo_fijo\activo-fijo-backend" .\venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000

echo 2. Iniciando Frontend React (Puerto 3000)...
start "Frontend React" /D "E:\Proyect_Activo_fijo\activo-fijo-frontend" npm start

echo 3. Iniciando Tunel Cloudflare y Detector Automatico de QR...
start "Tunel Cloudflare" /D "E:\Proyect_Activo_fijo" .\activo-fijo-backend\venv\Scripts\python.exe iniciar_tunel.py

echo ========================================================
echo   Todo iniciado correctamente. No cierres las ventanas.
echo ========================================================
pause
