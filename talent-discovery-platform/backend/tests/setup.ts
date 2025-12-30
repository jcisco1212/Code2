import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for async operations
jest.setTimeout(30000);

// Mock console.error to reduce noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Filter out expected errors during testing
    if (args[0]?.includes?.('Warning:') || args[0]?.includes?.('Error:')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global test utilities
export const generateTestEmail = () => `test_${Date.now()}@example.com`;
export const generateTestUsername = () => `testuser_${Date.now()}`;
