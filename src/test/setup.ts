/**
 * Global test setup file for Vitest
 * This file runs before all tests and sets up the testing environment
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi, beforeAll, afterAll } from 'vitest';

// ============================================================================
// Global Cleanup
// ============================================================================

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.clearAllTimers();
});

beforeEach(() => {
  // Reset DOM state
  document.body.innerHTML = '';
  document.head.innerHTML = '';

  // Reset any global state
  localStorage.clear();
  sessionStorage.clear();

  // Reset console spies
  vi.clearAllMocks();
});

// ============================================================================
// Global Mocks
// ============================================================================

// Mock window.matchMedia (required for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Speech Synthesis API
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => []),
    speaking: false,
    pending: false,
    paused: false,
    onvoiceschanged: null,
  },
});

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000',
  hostname: 'localhost',
  pathname: '/',
  search: '',
  hash: '',
  port: '3000',
  protocol: 'http:',
  origin: 'http://localhost:3000',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn(),
    pushState: vi.fn(),
    replaceState: vi.fn(),
    state: null,
    length: 1,
  },
  writable: true,
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Mock console methods for testing
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress console errors and warnings in tests unless explicitly needed
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// ============================================================================
// Environment Variables for Tests
// ============================================================================

process.env.NODE_ENV = 'test';
process.env.VITE_API_URL = 'http://localhost:3001';

// ============================================================================
// Mock External Dependencies
// ============================================================================

// Mock crypto for UUID generation in tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn().mockImplementation((buffer: Uint8Array) => {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = Math.floor(Math.random() * 256);
      }
      return buffer;
    }),
    randomUUID: vi.fn(
      () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
    ),
  },
});

// Mock dynamic imports
vi.mock('virtual:pwa-register', () => ({
  registerSW: vi.fn(() => ({
    updateAvailable: false,
    needRefresh: false,
    update: vi.fn(),
  })),
}));

// ============================================================================
// Test Data Factories
// ============================================================================

// Export test data factories for consistent test data
export const createTestCard = (overrides = {}) => ({
  id: 'test-card-id',
  english: 'test',
  vietnamese: 'thử nghiệm',
  example: 'This is a test.',
  phonetic: '/test/',
  createdAt: Date.now(),
  status: 'new' as const,
  interval: 0,
  stepIndex: 0,
  nextReview: Date.now(),
  lapses: 0,
  reps: 0,
  ...overrides,
});

// ============================================================================
// Global Error Handling
// ============================================================================

// Catch unhandled promise rejections in tests
beforeAll(() => {
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection in test:', reason);
  });
});

// ============================================================================
// Performance Monitoring in Tests
// ============================================================================

// Optional: Add performance monitoring for slow tests
const SLOW_TEST_THRESHOLD = 1000; // 1 second

beforeEach(() => {
  const testStart = performance.now();

  return () => {
    const testEnd = performance.now();
    const duration = testEnd - testStart;

    if (duration > SLOW_TEST_THRESHOLD) {
      console.warn(`Slow test detected: ${duration.toFixed(2)}ms`);
    }
  };
});

// Export common test constants
export const TEST_CONSTANTS = {
  TIMEOUT: {
    SHORT: 1000,
    MEDIUM: 5000,
    LONG: 10000,
  },
  DELAYS: {
    ANIMATION: 300,
    DEBOUNCE: 500,
    NETWORK: 100,
  },
} as const;
