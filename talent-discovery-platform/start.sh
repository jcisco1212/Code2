#!/bin/bash

# Get-Noticed - Full Stack Startup Script
# This script starts all services: Infrastructure, Backend, and Frontend

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
echo -e "${BLUE}   Get-Noticed Startup Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}Waiting for $service_name to be ready...${NC}"
    while ! nc -z "$host" "$port" >/dev/null 2>&1; do
        if [ $attempt -ge $max_attempts ]; then
            echo -e "${RED}$service_name failed to start after $max_attempts attempts${NC}"
            return 1
        fi
        echo -e "  Attempt $attempt/$max_attempts..."
        sleep 2
        ((attempt++))
    done
    echo -e "${GREEN}$service_name is ready!${NC}"
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}All prerequisites met!${NC}"
echo ""

# Step 1: Start infrastructure services
echo -e "${BLUE}Step 1: Starting infrastructure services (PostgreSQL, Redis, MinIO)...${NC}"
cd "$SCRIPT_DIR"

if [ -f "docker-compose.simple.yml" ]; then
    docker-compose -f docker-compose.simple.yml up -d
else
    echo -e "${RED}docker-compose.simple.yml not found!${NC}"
    exit 1
fi

# Wait for services to be ready
echo ""
wait_for_service localhost 5432 "PostgreSQL"
wait_for_service localhost 6379 "Redis"
wait_for_service localhost 9000 "MinIO"
echo ""

# Step 2: Install backend dependencies if needed
echo -e "${BLUE}Step 2: Setting up backend...${NC}"
cd "$SCRIPT_DIR/backend"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install --legacy-peer-deps
fi

# Step 3: Install frontend dependencies if needed
echo -e "${BLUE}Step 3: Setting up frontend...${NC}"
cd "$SCRIPT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install --legacy-peer-deps
fi

echo ""
echo -e "${BLUE}Step 4: Starting services...${NC}"

# Create a logs directory
mkdir -p "$SCRIPT_DIR/logs"

# Start backend in background
echo -e "${YELLOW}Starting backend server...${NC}"
cd "$SCRIPT_DIR/backend"
npm run dev > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$SCRIPT_DIR/logs/backend.pid"

# Wait for backend to be ready
sleep 5
wait_for_service localhost 4000 "Backend API"

# Start frontend in background
echo -e "${YELLOW}Starting frontend server...${NC}"
cd "$SCRIPT_DIR/frontend"
npm start > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$SCRIPT_DIR/logs/frontend.pid"

# Wait for frontend to be ready
sleep 5
wait_for_service localhost 3001 "Frontend"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   All services started successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Access the application at:"
echo -e "  ${BLUE}Frontend:${NC}    http://localhost:3001"
echo -e "  ${BLUE}Backend API:${NC} http://localhost:4000"
echo -e "  ${BLUE}MinIO:${NC}       http://localhost:9001 (minioadmin/minioadmin)"
echo ""
echo -e "View logs:"
echo -e "  ${YELLOW}Backend:${NC}  tail -f $SCRIPT_DIR/logs/backend.log"
echo -e "  ${YELLOW}Frontend:${NC} tail -f $SCRIPT_DIR/logs/frontend.log"
echo ""
echo -e "To stop all services, run: ${YELLOW}./stop.sh${NC}"
echo ""
