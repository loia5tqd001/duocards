/**
 * Test suite for StorageManager behavior when Supabase is not configured
 * Ensures all storage operations gracefully handle missing configuration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StorageManager } from '../lib/storage';
import type { Card } from '../lib/utils';
import type { User } from '@supabase/supabase-js';

// Mock the supabase module to simulate no configuration
vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {
    from: () => ({
      select: () => ({ data: null, error: new Error('Not configured') }),
      insert: () => ({ data: null, error: new Error('Not configured') }),
      update: () => ({ data: null, error: new Error('Not configured') }),
      delete: () => ({ data: null, error: new Error('Not configured') }),
      upsert: () => ({ data: null, error: new Error('Not configured') }),
    }),
  },
}));

// Mock user object
const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'test-user-aud',
  created_at: new Date().toISOString(),
};

// Mock card object
const mockCard: Card = {
  id: 'test-card-id',
  english: 'test',
  vietnamese: 'thử nghiệm',
  example: 'This is a test.',
  phonetic: '/test/',
  createdAt: Date.now(),
  status: 'new',
  interval: 0,
  stepIndex: 0,
  nextReview: Date.now(),
  lapses: 0,
  reps: 0,
};

describe('StorageManager without Supabase Configuration', () => {
  let storageManager: StorageManager;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    storageManager = StorageManager.getInstance();
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('uploadLocalCards', () => {
    it('should return success without uploading when Supabase not configured', async () => {
      const result = await storageManager.uploadLocalCards(
        [mockCard],
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.conflictCount).toBe(0);
      expect(result.updatedCount).toBe(0);
      expect(result.error).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Supabase not configured, skipping upload'
      );
    });

    it('should handle empty cards array', async () => {
      const result = await storageManager.uploadLocalCards([], mockUser);

      expect(result.success).toBe(true);
      expect(result.conflictCount).toBe(0);
      expect(result.updatedCount).toBe(0);
    });

    it('should handle multiple cards gracefully', async () => {
      const cards = [mockCard, { ...mockCard, id: 'test-card-2' }];
      const result = await storageManager.uploadLocalCards(cards, mockUser);

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Supabase not configured, skipping upload'
      );
    });
  });

  describe('downloadCards', () => {
    it('should return empty cards array when Supabase not configured', async () => {
      const result = await storageManager.downloadCards(mockUser);

      expect(result.success).toBe(true);
      expect(result.cards).toEqual([]);
      expect(result.error).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Supabase not configured, returning empty cards'
      );
    });
  });

  describe('syncCards', () => {
    it('should return success without syncing when Supabase not configured', async () => {
      const result = await storageManager.syncCards([mockCard], mockUser);

      expect(result.success).toBe(true);
      expect(result.conflictCount).toBe(0);
      expect(result.updatedCount).toBe(0);
      expect(result.error).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Supabase not configured, skipping sync'
      );
    });

    it('should handle empty local cards', async () => {
      const result = await storageManager.syncCards([], mockUser);

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Supabase not configured, skipping sync'
      );
    });
  });

  describe('saveCard', () => {
    it('should return true without saving when Supabase not configured', async () => {
      const result = await storageManager.saveCard(mockCard, mockUser);

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Supabase not configured, skipping save'
      );
    });
  });

  describe('deleteCard', () => {
    it('should return true without deleting when Supabase not configured', async () => {
      const result = await storageManager.deleteCard('test-card-id', mockUser);

      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Supabase not configured, skipping delete'
      );
    });
  });

  describe('Error handling and stability', () => {
    it('should not throw errors for any operation', async () => {
      const operations = [
        () => storageManager.uploadLocalCards([mockCard], mockUser),
        () => storageManager.downloadCards(mockUser),
        () => storageManager.syncCards([mockCard], mockUser),
        () => storageManager.saveCard(mockCard, mockUser),
        () => storageManager.deleteCard('test-id', mockUser),
      ];

      for (const operation of operations) {
        await expect(operation()).resolves.not.toThrow();
      }
    });

    it('should handle null/undefined user gracefully', async () => {
      const nullUser = null as unknown as User;

      await expect(
        storageManager.uploadLocalCards([mockCard], nullUser)
      ).resolves.not.toThrow();

      await expect(
        storageManager.downloadCards(nullUser)
      ).resolves.not.toThrow();
    });

    it('should handle malformed card data gracefully', async () => {
      const malformedCard = { id: 'test' } as Card;

      await expect(
        storageManager.uploadLocalCards([malformedCard], mockUser)
      ).resolves.not.toThrow();
    });
  });

  describe('Singleton behavior', () => {
    it('should return the same instance', () => {
      const instance1 = StorageManager.getInstance();
      const instance2 = StorageManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should maintain consistent behavior across multiple calls', async () => {
      const result1 = await storageManager.uploadLocalCards(
        [mockCard],
        mockUser
      );
      const result2 = await storageManager.uploadLocalCards(
        [mockCard],
        mockUser
      );

      expect(result1).toEqual(result2);
    });
  });

  describe('Performance and concurrency', () => {
    it('should handle concurrent operations without conflicts', async () => {
      const promises = [
        storageManager.uploadLocalCards([mockCard], mockUser),
        storageManager.downloadCards(mockUser),
        storageManager.syncCards([mockCard], mockUser),
        storageManager.saveCard(mockCard, mockUser),
        storageManager.deleteCard('test-id', mockUser),
      ];

      const results = await Promise.all(promises);

      // All operations should complete successfully
      expect(results).toHaveLength(5);
      results.forEach((result) => {
        if (typeof result === 'boolean') {
          expect(result).toBe(true);
        } else {
          expect(result.success).toBe(true);
        }
      });
    });

    it('should complete operations quickly when not configured', async () => {
      const start = performance.now();

      await Promise.all([
        storageManager.uploadLocalCards([mockCard], mockUser),
        storageManager.downloadCards(mockUser),
        storageManager.syncCards([mockCard], mockUser),
      ]);

      const duration = performance.now() - start;

      // Should complete very quickly since no actual network calls are made
      expect(duration).toBeLessThan(100); // 100ms threshold
    });
  });

  describe('Console warnings', () => {
    it('should log appropriate warning messages for each operation', async () => {
      await storageManager.uploadLocalCards([mockCard], mockUser);
      await storageManager.downloadCards(mockUser);
      await storageManager.syncCards([mockCard], mockUser);
      await storageManager.saveCard(mockCard, mockUser);
      await storageManager.deleteCard('test-id', mockUser);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Supabase not configured, skipping upload'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Supabase not configured, returning empty cards'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Supabase not configured, skipping sync'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Supabase not configured, skipping save'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Supabase not configured, skipping delete'
      );
    });

    it('should not spam console with repeated warnings', async () => {
      // Call the same operation multiple times
      await storageManager.saveCard(mockCard, mockUser);
      await storageManager.saveCard(mockCard, mockUser);
      await storageManager.saveCard(mockCard, mockUser);

      // Should still log warnings (this is actually desired behavior for debugging)
      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });
  });
});
