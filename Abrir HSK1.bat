@echo off
title Chino HSK 1 - servidor local
cd /d "%~dp0"
echo Servidor en http://localhost:8137  (cierra esta ventana para detenerlo)
start "" http://localhost:8137/index.html
python -m http.server 8137
if errorlevel 1 (
  echo.
  echo Python no encontrado. Intentando con Node...
  npx --yes http-server -p 8137 .
)
