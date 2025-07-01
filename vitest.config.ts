/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'happy-dom', // Faster alternative to jsdom
    globals: true,

    // Setup files
    setupFiles: ['./src/test/setup.ts'],

    // File patterns
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.git', '.cache', 'coverage'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/coverage/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    // Test execution
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,

    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 1,
      },
    },

    // UI configuration
    ui: true,
    open: false,

    // Reporter
    reporters: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html',
    },

    // Watch mode
    watch: false,

    // CSS processing
    css: {
      modules: {
        classNameStrategy: 'stable',
      },
    },
  },

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@test': path.resolve(__dirname, './src/test'),
    },
  },

  // Define global variables for tests
  define: {
    'import.meta.vitest': undefined,
  },
});
