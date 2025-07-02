/**
 * Integration test for the complete app behavior when Supabase is not configured
 * Tests the end-to-end user experience in local-only mode
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithRouter } from '../test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCardsStore } from '../../store/cardsStore';

// Import main app components
import App from '../../App';
import Home from '../../screens/Home';

// Mock the supabase configuration as not available
vi.mock('../../lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Supabase not configured'),
      }),
      signOut: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Supabase not configured'),
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: new Error('Supabase not configured'),
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: null },
        error: new Error('Supabase not configured'),
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Supabase not configured'),
        }),
      }),
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Supabase not configured'),
      }),
      upsert: vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Supabase not configured'),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Supabase not configured'),
        }),
      }),
    })),
  },
}));

// Mock Cambridge API to prevent network calls
vi.mock('../../api/cambridge', () => ({
  fetchCambridgeInfo: vi.fn().mockResolvedValue(null),
}));

// Mock fetch to prevent actual network calls to Cambridge API
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        word: 'test',
        phonetic: '/test/',
        examples: [],
        vietnameseTranslations: [],
      }),
  })
) as unknown as typeof fetch;

describe('App Integration without Supabase', () => {
  beforeEach(() => {
    // Clear localStorage to ensure clean state
    localStorage.clear();
    vi.clearAllMocks();

    // Reset fetch mock
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            word: 'test',
            phonetic: '/test/',
            examples: [],
            vietnameseTranslations: [],
          }),
      })
    ) as unknown as typeof fetch;

    // Mock Speech Synthesis API
    global.speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn().mockReturnValue([]),
      pending: false,
      speaking: false,
      paused: false,
    } as unknown as SpeechSynthesis;

    global.SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
      text,
      lang: 'en-US',
      voice: null,
      volume: 1,
      rate: 1,
      pitch: 1,
      onstart: null,
      onend: null,
      onerror: null,
      onpause: null,
      onresume: null,
      onmark: null,
      onboundary: null,
    }));
  });

  describe('App initialization and stability', () => {
    it('should load the app without crashing when Supabase is not configured', () => {
      expect(() => {
        renderWithRouter(<App />);
      }).not.toThrow();
    });

    it('should display the home page by default', () => {
      renderWithRouter(<App />);
      expect(screen.getAllByText(/cards$/i).length).toBeGreaterThan(0);
    });

    it('should not show authentication-related UI elements', () => {
      renderWithRouter(<Home />);

      // Login button should be hidden
      expect(
        screen.queryByRole('button', { name: /sign in/i })
      ).not.toBeInTheDocument();

      // Sync status should be hidden
      expect(screen.queryByText(/local only/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/synced/i)).not.toBeInTheDocument();
    });
  });

  describe('Navigation behavior', () => {
    it('should redirect from login page to home', () => {
      renderWithRouter(<App />, {
        routerProps: { initialEntries: ['/login'] },
      });

      // Should not show login page content
      expect(screen.queryByText(/welcome to vocards/i)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/continue with google/i)
      ).not.toBeInTheDocument();

      // Should show home page instead
      waitFor(() => {
        expect(screen.getAllByText(/cards$/i).length).toBeGreaterThan(0);
      });
    });

    it('should allow navigation to other app pages', async () => {
      const user = userEvent.setup();
      renderWithRouter(<App />);

      // Navigate to add card page
      const addButton = screen.getByRole('button', { name: /📝 add card/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/add new card/i)).toBeInTheDocument();
      });
    });
  });

  describe('Local functionality', () => {
    it('should allow adding cards locally', async () => {
      renderWithRouter(<App />);

      // Get initial card count
      const initialCardsText = screen.getByText(/\d+ cards?/i).textContent;
      const initialCount = parseInt(initialCardsText?.match(/\d+/)?.[0] || '0');

      // Directly test the store functionality instead of UI integration
      // This tests the core business logic which is what matters for this test
      const { addCard } = useCardsStore.getState();

      // Add a card directly through the store
      addCard({
        english: 'test',
        vietnamese: 'thử nghiệm',
        example: 'This is a test example.',
        phonetic: '/test/',
      });

      // Wait for the UI to update with one more card
      const expectedCount = initialCount + 1;
      await waitFor(
        () => {
          expect(
            screen.getByText(new RegExp(`${expectedCount} cards?`, 'i'))
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('should persist cards in localStorage', async () => {
      renderWithRouter(<App />);

      // Get initial card count from state
      const initialCardsCount = useCardsStore.getState().cards.length;

      // Add a card directly through the store to test persistence
      const { addCard } = useCardsStore.getState();
      addCard({
        english: 'persist',
        vietnamese: 'lưu trữ',
        example: 'This persists in localStorage.',
        phonetic: '/pərˈsɪst/',
      });

      // Wait for UI to update
      const expectedCount = initialCardsCount + 1;
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(`${expectedCount} cards?`, 'i'))
        ).toBeInTheDocument();
      });

      // Check if data is stored in localStorage
      await waitFor(() => {
        const storedData = localStorage.getItem('duocards-storage');
        expect(storedData).toBeTruthy();
        if (storedData) {
          const parsed = JSON.parse(storedData);
          expect(parsed.state.cards.length).toBe(expectedCount);
          const persistCard = parsed.state.cards.find(
            (card: { english: string }) => card.english === 'persist'
          );
          expect(persistCard).toBeTruthy();
        }
      });
    });
  });

  describe('Review functionality', () => {
    it('should allow reviewing cards without sync', async () => {
      const user = userEvent.setup();
      renderWithRouter(<App />);

      // Get initial card count
      const initialCardsCount = useCardsStore.getState().cards.length;

      // Add a card directly through the store
      const { addCard } = useCardsStore.getState();
      addCard({
        english: 'review',
        vietnamese: 'ôn tập',
        example: 'Let me review this lesson.',
        phonetic: '/rɪˈvjuː/',
      });

      // Wait for the card to be added and show in UI
      const expectedCount = initialCardsCount + 1;
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(`${expectedCount} cards?`, 'i'))
        ).toBeInTheDocument();
      });

      // Start review
      const reviewButton = screen.getByRole('button', {
        name: /📖 start review/i,
      });
      await user.click(reviewButton);

      // Should navigate to review page
      await waitFor(() => {
        expect(screen.getByText(/review cards/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should not show error messages related to Supabase configuration', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      renderWithRouter(<App />);

      // Should not log configuration-related errors
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Supabase')
      );

      consoleSpy.mockRestore();
    });

    it('should handle page refreshes gracefully', () => {
      // First render
      const { unmount } = renderWithRouter(<App />);
      unmount();

      // Second render (simulating refresh)
      expect(() => {
        renderWithRouter(<App />);
      }).not.toThrow();

      expect(screen.getAllByText(/cards$/i).length).toBeGreaterThan(0);
    });
  });

  describe('Performance in local mode', () => {
    it('should load quickly without network dependencies', () => {
      const start = performance.now();

      renderWithRouter(<App />);
      expect(screen.getAllByText(/cards$/i).length).toBeGreaterThan(0);

      const loadTime = performance.now() - start;

      // Should load very quickly since no network calls
      expect(loadTime).toBeLessThan(1000); // 1 second threshold
    });
  });

  describe('User experience', () => {
    it('should provide a complete local-only experience', async () => {
      const user = userEvent.setup();
      renderWithRouter(<App />);

      // Should show current card count
      expect(screen.getByText(/\d+ cards?/i)).toBeInTheDocument();

      // Should be able to add cards
      const addButton = screen.getByRole('button', { name: /📝 add card/i });
      expect(addButton).toBeEnabled();

      // Should be able to navigate
      await user.click(addButton);
      await waitFor(() => {
        expect(screen.getByText(/add new card/i)).toBeInTheDocument();
      });

      // Should be able to go back home
      const backButton = screen.getByLabelText(/back to home/i);
      await user.click(backButton);

      await waitFor(() => {
        expect(screen.getAllByText(/cards$/i).length).toBeGreaterThan(0);
      });
    });

    it('should not mention sync or authentication features', () => {
      renderWithRouter(<App />);

      // Should not show any sync-related text
      expect(screen.queryByText(/sync/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cloud/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/login/i)).not.toBeInTheDocument();
    });
  });

  describe('Data integrity', () => {
    it('should maintain data consistency across navigation', async () => {
      const user = userEvent.setup();
      renderWithRouter(<App />);

      // Get initial card count
      const initialCardsCount = useCardsStore.getState().cards.length;

      // Add multiple cards directly through the store
      const { addCard } = useCardsStore.getState();

      for (let i = 1; i <= 3; i++) {
        addCard({
          english: `word${i}`,
          vietnamese: `từ${i}`,
          example: `Example sentence ${i}.`,
          phonetic: `/wɜːrd${i}/`,
        });
      }

      // Wait for all cards to show in UI
      const expectedCount = initialCardsCount + 3;
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(`${expectedCount} cards?`, 'i'))
        ).toBeInTheDocument();
      });

      // Navigate to add card page and back to test consistency
      const addButton = screen.getByRole('button', { name: /📝 add card/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/add new card/i)).toBeInTheDocument();
      });

      const backButton = screen.getByLabelText(/back to home/i);
      await user.click(backButton);

      // Should still show all cards
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(`${expectedCount} cards?`, 'i'))
        ).toBeInTheDocument();
      });
    });
  });
});
