#!/bin/bash
if ! command -v node &> /dev/null
then
    echo "[ERROR] Node.js is NOT installed!"
    echo "Please download and install Node.js from https://nodejs.org/"
    exit
fi
echo "Starting Token Dashboard..."
echo "Open http://localhost:3001 in your browser"
node server.js