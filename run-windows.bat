@echo off
title Token Dashboard
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [ERROR] Node.js is NOT installed!
  echo Please download and install Node.js from https://nodejs.org/
  pause
  exit /b
)
echo Starting Token Dashboard...
echo Open http://localhost:3001 in your browser
node server.js
pause