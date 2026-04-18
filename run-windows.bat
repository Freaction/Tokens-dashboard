@echo off
title Token Dashboard
set "NODE_BIN=%~dp0bin\node.exe"
if exist "%NODE_BIN%" (
  echo [Autonomous Mode] Using built-in Node.js
  "%NODE_BIN%" server.js
) else (
  where node >nul 2>nul
  if %errorlevel% neq 0 (
    echo [ERROR] Built-in Node.js not found AND system Node.js is not installed!
    echo Please download Node.js from https://nodejs.org/
    pause
    exit /b
  )
  echo [System Mode] Using system Node.js
  node server.js
)
pause