#!/bin/bash

# Get-Noticed - Stop All Services Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Get-Noticed Shutdown Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Stop backend
echo -e "${YELLOW}Stopping backend server...${NC}"
if [ -f "$SCRIPT_DIR/logs/backend.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/logs/backend.pid")
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID" 2>/dev/null || true
        echo -e "${GREEN}Backend stopped${NC}"
    else
        echo -e "${YELLOW}Backend was not running${NC}"
    fi
    rm -f "$SCRIPT_DIR/logs/backend.pid"
else
    # Try to kill any node processes on port 4000
    pkill -f "node.*backend" 2>/dev/null || true
    echo -e "${YELLOW}Backend process cleaned up${NC}"
fi

# Stop frontend
echo -e "${YELLOW}Stopping frontend server...${NC}"
if [ -f "$SCRIPT_DIR/logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$SCRIPT_DIR/logs/frontend.pid")
    if kill -0 "$FRONTEND_PID" 2>/dev/null; then
        kill "$FRONTEND_PID" 2>/dev/null || true
        echo -e "${GREEN}Frontend stopped${NC}"
    else
        echo -e "${YELLOW}Frontend was not running${NC}"
    fi
    rm -f "$SCRIPT_DIR/logs/frontend.pid"
else
    # Try to kill any node processes on port 3001
    pkill -f "react-scripts" 2>/dev/null || true
    echo -e "${YELLOW}Frontend process cleaned up${NC}"
fi

# Stop Docker infrastructure
echo -e "${YELLOW}Stopping infrastructure services...${NC}"
cd "$SCRIPT_DIR"
if [ -f "docker-compose.simple.yml" ]; then
    docker-compose -f docker-compose.simple.yml down
    echo -e "${GREEN}Infrastructure services stopped${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   All services stopped${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
