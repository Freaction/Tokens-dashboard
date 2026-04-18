#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
NODE_BIN="$DIR/bin/node"
if [ -f "$NODE_BIN" ]; then
    echo "[Autonomous Mode] Using built-in Node.js"
    "$NODE_BIN" "$DIR/server.js"
else
    if ! command -v node &> /dev/null
    then
        echo "[ERROR] Built-in Node.js not found AND system Node.js is not installed!"
        echo "Please install Node.js from https://nodejs.org/"
        exit
    fi
    echo "[System Mode] Using system Node.js"
    node "$DIR/server.js"
fi