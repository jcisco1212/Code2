# Get-Noticed Platform - Testing Guide

This document describes how to run automated tests for the Get-Noticed talent discovery platform.

## Test Structure

```
talent-discovery-platform/
├── backend/
│   ├── tests/
│   │   ├── setup.ts          # Test setup and configuration
│   │   ├── helpers.ts        # Test utilities
│   │   └── api/
│   │       ├── auth.test.ts      # Authentication tests
│   │       ├── profiles.test.ts  # Profile API tests
│   │       ├── agents.test.ts    # Agent API tests
│   │       └── videos.test.ts    # Video API tests
│   └── jest.config.js        # Jest configuration
├── e2e/
│   ├── tests/
│   │   ├── auth.spec.ts          # Authentication E2E tests
│   │   ├── navigation.spec.ts    # Navigation E2E tests
│   │   └── agent-discover.spec.ts # Agent discover E2E tests
│   ├── playwright.config.ts  # Playwright configuration
│   └── package.json
└── scripts/
    └── run-tests.sh          # Main test runner script
```

## Prerequisites

- Node.js 18+
- npm
- PostgreSQL (for backend tests)
- Redis (for backend tests)

## Running Tests

### Quick Start

Run all tests:
```bash
./scripts/run-tests.sh
```

### Backend API Tests Only

```bash
./scripts/run-tests.sh --api-only
```

Or directly:
```bash
cd backend
npm test
```

### E2E Tests Only

```bash
./scripts/run-tests.sh --e2e-only
```

Or directly:
```bash
cd e2e
npm test
```

## Backend API Tests

### Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create a `.env.test` file (optional) for test-specific configuration:
```env
NODE_ENV=test
DATABASE_URL=postgres://user:pass@localhost:5432/test_db
```

### Available Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### Test Categories

- **Authentication Tests**: Registration, login, JWT validation
- **Profile Tests**: Profile viewing, updating, privacy settings
- **Agent Tests**: Agent-specific endpoints, bookmarks, discovery
- **Video Tests**: Video listing, trending, feed

## E2E Tests (Playwright)

### Setup

1. Install dependencies:
```bash
cd e2e
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

### Available Commands

```bash
# Run all E2E tests
npm test

# Run tests with browser UI visible
npm run test:headed

# Run tests with Playwright UI
npm run test:ui

# Run tests in debug mode
npm run test:debug

# Run tests for specific browser
npm run test:chrome
npm run test:firefox
npm run test:safari

# Run mobile tests
npm run test:mobile

# View test report
npm run report

# Generate test code by recording
npm run codegen
```

### Test Categories

- **Authentication Flow**: Login, registration, password validation
- **Navigation**: Page routing, responsive design
- **Agent Discover**: Advanced search filters (age, gender, ethnicity, etc.)
- **Profile View**: Profile page rendering, banner settings

## Running Tests in CI/CD

For CI environments, use:

```bash
# Backend
cd backend && npm run test:ci

# E2E
cd e2e && CI=true npm test
```

## Writing New Tests

### Backend API Test Example

```typescript
import request from 'supertest';
import { app } from '../../src/index';

describe('My Feature', () => {
  it('should do something', async () => {
    const res = await request(app)
      .get('/api/my-endpoint')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should work correctly', async ({ page }) => {
    await page.goto('/my-page');
    await expect(page.locator('h1')).toContainText('Expected Title');
  });
});
```

## Test Coverage

Backend tests generate coverage reports in `backend/coverage/`.

View the HTML report:
```bash
open backend/coverage/lcov-report/index.html
```

## Troubleshooting

### Backend tests fail to connect to database
- Ensure PostgreSQL is running
- Check DATABASE_URL in environment

### E2E tests timeout
- Ensure both backend and frontend servers are running
- Check if the correct ports are being used (3000, 3001)

### Playwright browser installation fails
- Try: `npx playwright install --with-deps`

## Best Practices

1. **Isolate tests**: Each test should be independent
2. **Clean up**: Remove test data after tests complete
3. **Use meaningful names**: Describe what the test validates
4. **Test edge cases**: Include error scenarios
5. **Keep tests fast**: Mock external services when possible
