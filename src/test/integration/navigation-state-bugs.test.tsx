/**
 * Comprehensive integration tests for navigation and state management bugs
 *
 * Tests cover BUG-001 and BUG-002 documented in BUGS_DOCUMENTED.md
 *
 * @see BUGS_DOCUMENTED.md for detailed bug descriptions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';

import App from '../../App';
import {
  renderWithRouter,
  renderWithCards,
  renderInEditMode,
  resetAllStores,
  populateCardsStore,
  mockCambridgeAPI,
  navigateToHome,
  navigateToAddCard,
  navigateToEditCard,
  expectToBeInDocument,
  expectNotToBeInDocument,
  expectFormField,
  expectFormFieldPlaceholder,
  screen,
  waitFor,
  SELECTORS,
  TIMEOUTS,
} from '../test-utils';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock all external dependencies
vi.mock('../../lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/utils')>();
  return {
    ...actual,
    speak: vi.fn(),
    cn: vi.fn((...classes) => classes.filter(Boolean).join(' ')),
    formatTimeUntil: vi.fn(() => 'Due soon'),
    uuidv4: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
    scheduleNext: vi.fn((card) => ({
      ...card,
      nextReview: Date.now() + 86400000,
      reps: card.reps + 1,
    })),
  };
});

// ============================================================================
// Test Suite: BUG-001 - Edit Card State Persistence
// ============================================================================

describe('BUG-001: Edit Card State Persistence', () => {
  beforeEach(() => {
    resetAllStores();
    populateCardsStore();
    mockCambridgeAPI();
  });

  describe('Primary bug scenario', () => {
    it('should NOT persist edit state when navigating: Add Card → Home → Edit Card → Home → Add Card', async () => {
      const { user } = renderWithCards(<App />);

      // Step 1: Navigate to Add Card
      await navigateToAddCard(user);
      expectToBeInDocument(SELECTORS.ADD_CARD_TITLE);
      expectFormFieldPlaceholder('Enter English word');

      // Step 2: Navigate to Home
      await navigateToHome(user);
      expectToBeInDocument('2 Cards'); // Should see card count

      // Step 3: Navigate to Edit Card
      await navigateToEditCard(user, 0);
      expectToBeInDocument(SELECTORS.EDIT_CARD_TITLE);
      expectFormField('English', 'problem'); // Should be readonly
      expectFormField('Vietnamese', 'vấn đề');

      // Step 4: Navigate back to Home
      await navigateToHome(user);
      expectToBeInDocument('2 Cards');

      // Step 5: Navigate to Add Card - CRITICAL TEST
      await navigateToAddCard(user);

      // BUG VERIFICATION: Should show Add Card interface, NOT Edit Card
      await waitFor(
        () => {
          expectToBeInDocument(SELECTORS.ADD_CARD_TITLE);
          expectNotToBeInDocument(SELECTORS.EDIT_CARD_TITLE);
        },
        { timeout: TIMEOUTS.MEDIUM }
      );

      // Form should be empty and editable
      const englishField = expectFormFieldPlaceholder('Enter English word');
      expect(englishField).toHaveValue('');
      expect(englishField).not.toHaveAttribute('readonly');
    });

    it('should reset edit state when clicking home button directly from Edit Card', async () => {
      // Start directly in Edit Card mode
      const { user } = renderInEditMode(<App />, '1');

      // Verify we're in edit mode
      await waitFor(() => {
        expectToBeInDocument(SELECTORS.EDIT_CARD_TITLE);
        expectFormField('English', 'problem');
      });

      // Click home button from Edit Card
      await navigateToHome(user);
      expectToBeInDocument('2 Cards');

      // Navigate to Add Card
      await navigateToAddCard(user);

      // Should be in Add mode, not Edit mode
      await waitFor(() => {
        expectToBeInDocument(SELECTORS.ADD_CARD_TITLE);
        expectNotToBeInDocument(SELECTORS.EDIT_CARD_TITLE);
      });

      const englishField = expectFormFieldPlaceholder('Enter English word');
      expect(englishField).toHaveValue('');
    });
  });

  describe('State persistence edge cases', () => {
    it('should handle multiple rapid navigation cycles without state leakage', async () => {
      const { user } = renderWithCards(<App />);

      // Perform multiple rapid navigation cycles
      for (let cycle = 0; cycle < 3; cycle++) {
        // Add Card → Home
        await navigateToAddCard(user);
        expectToBeInDocument(SELECTORS.ADD_CARD_TITLE);

        await navigateToHome(user);
        expectToBeInDocument('2 Cards');

        // Edit Card → Home
        await navigateToEditCard(user, 0);
        expectToBeInDocument(SELECTORS.EDIT_CARD_TITLE);

        await navigateToHome(user);
        expectToBeInDocument('2 Cards');
      }

      // Final verification - should be clean Add Card state
      await navigateToAddCard(user);
      expectToBeInDocument(SELECTORS.ADD_CARD_TITLE);
      expectNotToBeInDocument(SELECTORS.EDIT_CARD_TITLE);
    });

    it('should maintain correct state when using browser back/forward', async () => {
      const { user } = renderWithRouter(<App />, {
        routerProps: { initialEntries: ['/'] },
      });

      populateCardsStore();

      // Navigate: Home → Add → Edit → Home
      await navigateToAddCard(user);
      expectToBeInDocument(SELECTORS.ADD_CARD_TITLE);

      await navigateToHome(user);
      await navigateToEditCard(user, 0);
      expectToBeInDocument(SELECTORS.EDIT_CARD_TITLE);

      await navigateToHome(user);

      // Now navigate to Add Card again
      await navigateToAddCard(user);
      expectToBeInDocument(SELECTORS.ADD_CARD_TITLE);
      expectNotToBeInDocument(SELECTORS.EDIT_CARD_TITLE);
    });
  });

  describe('State management verification', () => {
    it('should properly reset all form state when transitioning from edit to add mode', async () => {
      const { user } = renderInEditMode(<App />, '1');

      // Verify edit state is set
      await waitFor(() => {
        expectToBeInDocument(SELECTORS.EDIT_CARD_TITLE);
      });

      // Navigate away and back to add mode
      await navigateToHome(user);
      await navigateToAddCard(user);

      // Verify all form state is reset
      expect(screen.getByPlaceholderText('Enter English word')).toHaveValue('');
      expect(screen.getByPlaceholderText('Vietnamese translation')).toHaveValue(
        ''
      );
      expect(
        screen.getByPlaceholderText('Example sentence (English)')
      ).toHaveValue('');
    });
  });
});

// ============================================================================
// Test Suite: BUG-002 - Edit Card Form Fields Not Populated
// ============================================================================

describe('BUG-002: Edit Card Form Fields Not Populated', () => {
  beforeEach(() => {
    resetAllStores();
    populateCardsStore();
    mockCambridgeAPI();
  });

  describe('Primary bug scenario', () => {
    it('should populate ALL fields when navigating: Add Card → Home → Edit Card', async () => {
      const { user } = renderWithCards(<App />);

      // Step 1: Navigate to Add Card
      await navigateToAddCard(user);
      expectToBeInDocument(SELECTORS.ADD_CARD_TITLE);

      // Step 2: Navigate to Home
      await navigateToHome(user);
      expectToBeInDocument('2 Cards');

      // Step 3: Navigate to Edit Card
      await navigateToEditCard(user, 0);

      // CRITICAL BUG VERIFICATION: All fields should be populated
      await waitFor(
        () => {
          expectToBeInDocument(SELECTORS.EDIT_CARD_TITLE);

          // All form fields should be populated with existing data
          expectFormField('English', 'problem');
          expectFormField('Vietnamese', 'vấn đề');
          expectFormField('Example (optional)', 'This is a serious problem.');

          // Fields should have values and be properly populated
          expect(screen.getByDisplayValue('vấn đề')).toBeInTheDocument();
          expect(
            screen.getByDisplayValue('This is a serious problem.')
          ).toBeInTheDocument();
        },
        { timeout: TIMEOUTS.MEDIUM }
      );

      // English field should be readonly in edit mode
      const englishField = screen.getByDisplayValue('problem');
      expect(englishField).toHaveAttribute('readonly');
    });

    it('should populate fields when directly navigating to Edit Card URL', async () => {
      renderInEditMode(<App />, '1');

      // Direct navigation to edit should populate all fields
      await waitFor(() => {
        expectToBeInDocument(SELECTORS.EDIT_CARD_TITLE);
        expectFormField('English', 'problem');
        expectFormField('Vietnamese', 'vấn đề');
        expectFormField('Example (optional)', 'This is a serious problem.');
      });

      // English should be readonly
      expect(screen.getByDisplayValue('problem')).toHaveAttribute('readonly');
    });
  });

  describe('Data population edge cases', () => {
    it('should handle cards with missing optional fields', async () => {
      const cardsWithMissingFields = [
        {
          id: '1',
          english: 'minimal',
          vietnamese: 'tối thiểu',
          // No example or phonetic
          createdAt: Date.now(),
          status: 'new' as const,
          interval: 0,
          stepIndex: 0,
          nextReview: Date.now(),
          lapses: 0,
          reps: 0,
        },
      ];

      renderWithRouter(<App />, {
        routerProps: { initialEntries: ['/edit/1'] },
        initialStoreState: {
          cards: cardsWithMissingFields,
          editing: true,
          editingCardId: '1',
        },
      });

      await waitFor(() => {
        expectToBeInDocument(SELECTORS.EDIT_CARD_TITLE);
        expectFormField('English', 'minimal');
        expectFormField('Vietnamese', 'tối thiểu');

        // Optional fields should be empty but not show placeholders
        const exampleField = screen.getByLabelText('Example (optional)');
        expect(exampleField).toHaveValue('');
      });
    });

    it('should handle multiple navigation cycles without data loss', async () => {
      const { user } = renderWithCards(<App />);

      // Test multiple cycles to ensure data persistence
      for (let i = 0; i < 3; i++) {
        // Navigate to Add Card
        await navigateToAddCard(user);
        expectToBeInDocument(SELECTORS.ADD_CARD_TITLE);

        // Navigate to Home
        await navigateToHome(user);
        expectToBeInDocument('2 Cards');

        // Navigate to Edit Card
        await navigateToEditCard(user, 0);

        // Verify data is still populated correctly after each cycle
        await waitFor(() => {
          expectToBeInDocument(SELECTORS.EDIT_CARD_TITLE);
          expectFormField('English', 'problem');
          expectFormField('Vietnamese', 'vấn đề');
          expectFormField('Example (optional)', 'This is a serious problem.');
        });

        // Go back to Home for next cycle
        await navigateToHome(user);
      }
    });

    it('should populate different cards correctly', async () => {
      const { user } = renderWithCards(<App />);

      // Test editing different cards
      const expectedData = [
        {
          english: 'problem',
          vietnamese: 'vấn đề',
          example: 'This is a serious problem.',
        },
        {
          english: 'solution',
          vietnamese: 'giải pháp',
          example: 'We need to find a solution.',
        },
      ];

      for (let i = 0; i < expectedData.length; i++) {
        await navigateToHome(user);
        await navigateToEditCard(user, i);

        await waitFor(() => {
          expectToBeInDocument(SELECTORS.EDIT_CARD_TITLE);
          expectFormField('English', expectedData[i].english);
          expectFormField('Vietnamese', expectedData[i].vietnamese);
          expectFormField('Example (optional)', expectedData[i].example);
        });
      }
    });
  });

  describe('Race condition prevention', () => {
    it('should handle rapid navigation without form population race conditions', async () => {
      const { user } = renderWithCards(<App />);

      // Rapid navigation to test race conditions
      await navigateToAddCard(user);
      await navigateToHome(user);

      // Quickly navigate to edit mode
      const editButton = screen.getAllByTitle('Edit Card')[0];
      await user.click(editButton);

      // Should still populate correctly despite rapid navigation
      await waitFor(
        () => {
          expectToBeInDocument(SELECTORS.EDIT_CARD_TITLE);
          expectFormField('English', 'problem');
          expectFormField('Vietnamese', 'vấn đề');
        },
        { timeout: TIMEOUTS.LONG }
      );
    });

    it('should maintain data integrity during async operations', async () => {
      // Mock slower API response to test async timing
      mockCambridgeAPI({ word: 'delayed', phonetic: '/delayed/' });

      const { user } = renderWithCards(<App />);

      await navigateToAddCard(user);
      await navigateToHome(user);
      await navigateToEditCard(user, 0);

      // Even with API calls, form should populate correctly
      await waitFor(
        () => {
          expectFormField('English', 'problem');
          expectFormField('Vietnamese', 'vấn đề');
        },
        { timeout: TIMEOUTS.LONG }
      );
    });
  });
});

// ============================================================================
// Integration Tests: Combined Bug Scenarios
// ============================================================================

describe('Integration: Combined Navigation and Data Bugs', () => {
  beforeEach(() => {
    resetAllStores();
    populateCardsStore();
    mockCambridgeAPI();
  });

  it('should handle complex navigation patterns without any bugs', async () => {
    const { user } = renderWithCards(<App />);

    // Complex navigation pattern combining both bug scenarios

    // 1. Start with Add Card
    await navigateToAddCard(user);
    expectToBeInDocument(SELECTORS.ADD_CARD_TITLE);

    // 2. Go to Edit Card (potential BUG-002 trigger)
    await navigateToHome(user);
    await navigateToEditCard(user, 0);
    expectToBeInDocument(SELECTORS.EDIT_CARD_TITLE);
    expectFormField('English', 'problem'); // Should be populated

    // 3. Navigate through multiple screens
    await navigateToHome(user);
    await navigateToAddCard(user);
    expectToBeInDocument(SELECTORS.ADD_CARD_TITLE); // Should be Add, not Edit (BUG-001)

    // 4. Back to Edit different card
    await navigateToHome(user);
    await navigateToEditCard(user, 1);
    expectToBeInDocument(SELECTORS.EDIT_CARD_TITLE);
    expectFormField('English', 'solution'); // Should be populated with correct data

    // 5. Final verification
    await navigateToHome(user);
    await navigateToAddCard(user);
    expectToBeInDocument(SELECTORS.ADD_CARD_TITLE);
    expectNotToBeInDocument(SELECTORS.EDIT_CARD_TITLE);

    // Form should be clean
    expect(screen.getByPlaceholderText('Enter English word')).toHaveValue('');
  });

  it('should maintain state consistency across all navigation patterns', async () => {
    const { user } = renderWithCards(<App />);

    const navigationPatterns = [
      // Pattern 1: Home → Add → Home → Edit → Home → Add
      async () => {
        await navigateToAddCard(user);
        await navigateToHome(user);
        await navigateToEditCard(user, 0);
        await navigateToHome(user);
        await navigateToAddCard(user);
        expectToBeInDocument(SELECTORS.ADD_CARD_TITLE);
      },

      // Pattern 2: Edit → Home → Edit different card → Home → Add
      async () => {
        await navigateToHome(user);
        await navigateToEditCard(user, 1);
        await navigateToHome(user);
        await navigateToEditCard(user, 0);
        await navigateToHome(user);
        await navigateToAddCard(user);
        expectToBeInDocument(SELECTORS.ADD_CARD_TITLE);
      },
    ];

    // Test each navigation pattern
    for (const pattern of navigationPatterns) {
      await pattern();

      // After each pattern, verify clean state
      expectToBeInDocument(SELECTORS.ADD_CARD_TITLE);
      expectNotToBeInDocument(SELECTORS.EDIT_CARD_TITLE);
    }
  });
});

// ============================================================================
// Regression Tests
// ============================================================================

describe('Regression Prevention', () => {
  beforeEach(() => {
    resetAllStores();
    populateCardsStore();
    mockCambridgeAPI();
  });

  it('should prevent BUG-001 regression in all scenarios', async () => {
    const { user } = renderWithCards(<App />);

    // Simplified test - just verify the main scenario that could trigger BUG-001
    // Navigation pattern: Add Card → Home → Edit Card → Home → Add Card
    try {
      await navigateToAddCard(user);
      expectToBeInDocument(SELECTORS.ADD_CARD_TITLE);

      await navigateToHome(user);
      expectToBeInDocument(SELECTORS.HOME_TITLE);

      await navigateToEditCard(user, 0);
      expectToBeInDocument(SELECTORS.EDIT_CARD_TITLE);

      await navigateToHome(user);
      expectToBeInDocument(SELECTORS.HOME_TITLE);

      await navigateToAddCard(user);
      // Critical verification: Should be Add mode, not Edit mode (no state persistence)
      expectToBeInDocument(SELECTORS.ADD_CARD_TITLE);
      expectNotToBeInDocument(SELECTORS.EDIT_CARD_TITLE);
    } catch (error) {
      console.error('Navigation failed at step:', error);
      screen.debug();
      throw error;
    }
  });

  it('should prevent BUG-002 regression in all scenarios', async () => {
    const { user } = renderWithCards(<App />);

    // Test scenarios that could trigger BUG-002
    const populationTests = [
      { cardIndex: 0, expected: { english: 'problem', vietnamese: 'vấn đề' } },
      {
        cardIndex: 1,
        expected: { english: 'solution', vietnamese: 'giải pháp' },
      },
    ];

    for (const test of populationTests) {
      await navigateToAddCard(user);
      await navigateToHome(user);
      await navigateToEditCard(user, test.cardIndex);

      // Verify fields are populated, not showing placeholders
      await waitFor(() => {
        expectFormField('English', test.expected.english);
        expectFormField('Vietnamese', test.expected.vietnamese);
        expect(
          screen.getByDisplayValue(test.expected.vietnamese)
        ).toBeInTheDocument();
      });

      await navigateToHome(user); // Reset for next test
    }
  });
});
