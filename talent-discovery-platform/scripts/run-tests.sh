#!/bin/bash

# Get-Noticed Platform - Automated Test Runner
# This script runs all tests: API tests and E2E tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Get-Noticed Automated Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print section headers
print_section() {
    echo ""
    echo -e "${YELLOW}----------------------------------------${NC}"
    echo -e "${YELLOW}  $1${NC}"
    echo -e "${YELLOW}----------------------------------------${NC}"
    echo ""
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_section "Checking Prerequisites"

if ! command_exists node; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

if ! command_exists npm; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"

# Parse arguments
RUN_API_TESTS=true
RUN_E2E_TESTS=true
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --api-only)
            RUN_E2E_TESTS=false
            shift
            ;;
        --e2e-only)
            RUN_API_TESTS=false
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --api-only    Run only API tests"
            echo "  --e2e-only    Run only E2E tests"
            echo "  --verbose     Show verbose output"
            echo "  --help        Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Track test results
API_TEST_RESULT=0
E2E_TEST_RESULT=0

# Run Backend API Tests
if [ "$RUN_API_TESTS" = true ]; then
    print_section "Running Backend API Tests"

    cd "$PROJECT_ROOT/backend"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing backend dependencies..."
        npm install
    fi

    # Install supertest if not present
    if ! npm list supertest >/dev/null 2>&1; then
        echo "Installing supertest for API testing..."
        npm install --save-dev supertest @types/supertest
    fi

    echo "Running Jest tests..."
    if [ "$VERBOSE" = true ]; then
        npm test -- --verbose || API_TEST_RESULT=$?
    else
        npm test || API_TEST_RESULT=$?
    fi

    if [ $API_TEST_RESULT -eq 0 ]; then
        echo -e "${GREEN}✓ Backend API tests passed${NC}"
    else
        echo -e "${RED}✗ Backend API tests failed${NC}"
    fi
fi

# Run E2E Tests
if [ "$RUN_E2E_TESTS" = true ]; then
    print_section "Running E2E Tests"

    cd "$PROJECT_ROOT/e2e"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing E2E test dependencies..."
        npm install
    fi

    # Install Playwright browsers if needed
    if ! npx playwright --version >/dev/null 2>&1; then
        echo "Installing Playwright browsers..."
        npx playwright install
    fi

    echo "Running Playwright tests..."
    echo -e "${YELLOW}Note: E2E tests require the application to be running${NC}"
    echo -e "${YELLOW}Start backend: cd backend && npm run dev${NC}"
    echo -e "${YELLOW}Start frontend: cd frontend && npm start${NC}"
    echo ""

    if [ "$VERBOSE" = true ]; then
        npm test -- --reporter=list || E2E_TEST_RESULT=$?
    else
        npm test || E2E_TEST_RESULT=$?
    fi

    if [ $E2E_TEST_RESULT -eq 0 ]; then
        echo -e "${GREEN}✓ E2E tests passed${NC}"
    else
        echo -e "${RED}✗ E2E tests failed${NC}"
    fi
fi

# Summary
print_section "Test Summary"

TOTAL_FAILED=0

if [ "$RUN_API_TESTS" = true ]; then
    if [ $API_TEST_RESULT -eq 0 ]; then
        echo -e "${GREEN}✓ Backend API Tests: PASSED${NC}"
    else
        echo -e "${RED}✗ Backend API Tests: FAILED${NC}"
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
    fi
fi

if [ "$RUN_E2E_TESTS" = true ]; then
    if [ $E2E_TEST_RESULT -eq 0 ]; then
        echo -e "${GREEN}✓ E2E Tests: PASSED${NC}"
    else
        echo -e "${RED}✗ E2E Tests: FAILED${NC}"
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
    fi
fi

echo ""
if [ $TOTAL_FAILED -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  All tests passed! 🎉${NC}"
    echo -e "${GREEN}========================================${NC}"
    exit 0
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  $TOTAL_FAILED test suite(s) failed${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
