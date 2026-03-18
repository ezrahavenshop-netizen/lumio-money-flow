#!/bin/bash
# Kill anything on port 5000 first
fuser -k 5000/tcp 2>/dev/null || true
# Start API server in background
node server.js &
# Give it a moment to start
sleep 1
# Start Vite frontend
npm run dev
