/**
 * Basic test to verify test setup is working correctly
 */

import { describe, it, expect } from 'vitest';

describe('Test Setup Verification', () => {
  it('should have working test environment', () => {
    expect(true).toBe(true);
  });

  it('should have access to global DOM APIs', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });

  it('should have test constants available', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});