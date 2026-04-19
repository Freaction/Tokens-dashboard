@echo off
title Token Dashboard
set "NODE_BIN=%~dp0bin\node.exe"
if exist "%NODE_BIN%" (
  echo [Autonomous Mode] Using built-in Node.js
  "%NODE_BIN%" server.js
) else (
  where node >nul 2>nul
  if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please download from https://nodejs.org/
    pause
    exit /b
  )
  node server.js
)
pause