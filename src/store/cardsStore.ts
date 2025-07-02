import { create } from 'zustand';
import {
  subscribeWithSelector,
  persist,
  createJSONStorage,
} from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import type { Card, CardGrade, CardStatus } from '../lib/utils';
import { scheduleNext, uuidv4 } from '../lib/utils';
import { StorageManager } from '../lib/storage';
import { useAuthStore } from './authStore';

interface CardsState {
  cards: Card[];
  sessionQueue: string[];
  isSyncing: boolean;
  lastSyncTime: number | null;

  // Computed values - stored as state to avoid recalculation
  stats: {
    new: number;
    learning: number;
    learned: number;
    due: number;
    total: number;
  };
  dueCards: Card[];

  // Actions
  addCard: (
    card: Omit<
      Card,
      | 'id'
      | 'createdAt'
      | 'status'
      | 'interval'
      | 'stepIndex'
      | 'nextReview'
      | 'lapses'
      | 'reps'
    >
  ) => void;
  updateCard: (card: Card) => void;
  deleteCard: (id: string) => void;
  reviewCard: (card: Card, grade: CardGrade) => void;
  clearSession: () => void;

  // Sync actions
  syncWithSupabase: () => Promise<void>;
  loadFromSupabase: () => Promise<void>;
  uploadToSupabase: () => Promise<void>;
  setCards: (cards: Card[]) => void;
}

// Helper functions for computing derived state
function computeStats(cards: Card[], sessionQueue: string[]) {
  const now = Date.now();
  const sessionQueueSet = new Set(sessionQueue);

  return {
    new: cards.filter((c) => c.status === 'new').length,
    learning: cards.filter((c) => c.status === 'learning').length,
    learned: cards.filter((c) => c.status === 'learned').length,
    due: cards.filter((c) => c.nextReview <= now && !sessionQueueSet.has(c.id))
      .length,
    total: cards.length,
  };
}

function computeDueCards(cards: Card[], sessionQueue: string[]): Card[] {
  const now = Date.now();
  const sessionQueueSet = new Set(sessionQueue);

  return cards
    .filter((c) => !sessionQueueSet.has(c.id) && c.nextReview <= now)
    .sort((a, b) => {
      // Priority order: learning > new > learned
      const priority = (card: Card) => {
        switch (card.status) {
          case 'learning':
            return 0;
          case 'new':
            return 1;
          case 'learned':
            return 2;
          default:
            return 3;
        }
      };

      const priorityDiff = priority(a) - priority(b);
      if (priorityDiff !== 0) return priorityDiff;

      // Within same priority, sort by nextReview time
      return a.nextReview - b.nextReview;
    });
}

export const useCardsStore = create<CardsState>()(
  persist(
    subscribeWithSelector(
      immer((set) => ({
        cards: [] as Card[],
        sessionQueue: [] as string[],
        isSyncing: false,
        lastSyncTime: null,
        stats: { new: 0, learning: 0, learned: 0, due: 0, total: 0 },
        dueCards: [] as Card[],

        addCard: (cardData) => {
          const newCard: Card = {
            ...cardData,
            id: uuidv4(),
            createdAt: Date.now(),
            status: 'new',
            interval: 0,
            stepIndex: 0,
            nextReview: Date.now(), // due immediately
            lapses: 0,
            reps: 0,
          };

          set((state) => {
            state.cards.push(newCard);
            // Recompute derived state inline
            state.stats = computeStats(state.cards, state.sessionQueue);
            state.dueCards = computeDueCards(state.cards, state.sessionQueue);
          });

          // Optimistically sync to Supabase if user is logged in
          const user = useAuthStore.getState().user;
          if (user) {
            StorageManager.getInstance()
              .saveCard(newCard, user)
              .catch(console.error);
          }
        },

        updateCard: (updatedCard) => {
          set((state) => {
            const index = state.cards.findIndex((c) => c.id === updatedCard.id);
            if (index !== -1) {
              state.cards[index] = updatedCard;
            }
            // Recompute derived state inline
            state.stats = computeStats(state.cards, state.sessionQueue);
            state.dueCards = computeDueCards(state.cards, state.sessionQueue);
          });

          // Optimistically sync to Supabase if user is logged in
          const user = useAuthStore.getState().user;
          if (user) {
            StorageManager.getInstance()
              .saveCard(updatedCard, user)
              .catch(console.error);
          }
        },

        deleteCard: (id) => {
          set((state) => {
            state.cards = state.cards.filter((c) => c.id !== id);
            // Also remove from session queue if present
            state.sessionQueue = state.sessionQueue.filter((qId) => qId !== id);
            // Recompute derived state inline
            state.stats = computeStats(state.cards, state.sessionQueue);
            state.dueCards = computeDueCards(state.cards, state.sessionQueue);
          });

          // Optimistically sync to Supabase if user is logged in
          const user = useAuthStore.getState().user;
          if (user) {
            StorageManager.getInstance()
              .deleteCard(id, user)
              .catch(console.error);
          }
        },

        reviewCard: (card, grade) => {
          // Update the card using SRS algorithm
          const updatedCard = scheduleNext(card, grade);

          set((state) => {
            // Add to session queue
            if (!state.sessionQueue.includes(card.id)) {
              state.sessionQueue.push(card.id);
            }

            // Update the card
            const index = state.cards.findIndex((c) => c.id === card.id);
            if (index !== -1) {
              state.cards[index] = updatedCard;
            }
            // Recompute derived state inline
            state.stats = computeStats(state.cards, state.sessionQueue);
            state.dueCards = computeDueCards(state.cards, state.sessionQueue);
          });

          // Optimistically sync to Supabase if user is logged in
          const user = useAuthStore.getState().user;
          if (user) {
            StorageManager.getInstance()
              .saveCard(updatedCard, user)
              .catch(console.error);
          }
        },

        clearSession: () => {
          set((state) => {
            state.sessionQueue = [];
            // Recompute derived state inline
            state.stats = computeStats(state.cards, state.sessionQueue);
            state.dueCards = computeDueCards(state.cards, state.sessionQueue);
          });
        },

        setCards: (cards) => {
          set((state) => {
            state.cards = cards;
            // Reset session queue when cards are replaced
            state.sessionQueue = [];
            // Recompute derived state inline
            state.stats = computeStats(state.cards, state.sessionQueue);
            state.dueCards = computeDueCards(state.cards, state.sessionQueue);
          });
        },

        syncWithSupabase: async () => {
          const user = useAuthStore.getState().user;
          if (!user) return;

          const state = useCardsStore.getState();
          if (state.isSyncing) return;

          try {
            set((state) => {
              state.isSyncing = true;
            });

            const storageManager = StorageManager.getInstance();
            const result = await storageManager.syncCards(state.cards, user);

            if (result.success) {
              // Download fresh data after sync
              const { cards } = await storageManager.downloadCards(user);
              useCardsStore.getState().setCards(cards);

              set((state) => {
                state.lastSyncTime = Date.now();
              });
            }
          } catch (error) {
            console.error('Sync failed:', error);
          } finally {
            set((state) => {
              state.isSyncing = false;
            });
          }
        },

        loadFromSupabase: async () => {
          const user = useAuthStore.getState().user;
          if (!user) return;

          try {
            set((state) => {
              state.isSyncing = true;
            });

            const storageManager = StorageManager.getInstance();
            const { cards, success } = await storageManager.downloadCards(user);

            if (success) {
              useCardsStore.getState().setCards(cards);
              set((state) => {
                state.lastSyncTime = Date.now();
              });
            }
          } catch (error) {
            console.error('Load from Supabase failed:', error);
          } finally {
            set((state) => {
              state.isSyncing = false;
            });
          }
        },

        uploadToSupabase: async () => {
          const user = useAuthStore.getState().user;
          if (!user) return;

          const state = useCardsStore.getState();
          if (state.isSyncing) return;

          try {
            set((state) => {
              state.isSyncing = true;
            });

            const storageManager = StorageManager.getInstance();
            const result = await storageManager.uploadLocalCards(
              state.cards,
              user
            );

            if (result.success) {
              set((state) => {
                state.lastSyncTime = Date.now();
              });
            }
          } catch (error) {
            console.error('Upload to Supabase failed:', error);
          } finally {
            set((state) => {
              state.isSyncing = false;
            });
          }
        },
      }))
    ),
    {
      name: 'duocards-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cards: state.cards,
        lastSyncTime: state.lastSyncTime,
        // Don't persist sessionQueue, stats, dueCards, or isSyncing - they should be recomputed/reset
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset session queue and sync state, recompute derived state on app start
          state.sessionQueue = [];
          state.isSyncing = false;
          state.stats = computeStats(state.cards, state.sessionQueue);
          state.dueCards = computeDueCards(state.cards, state.sessionQueue);
        }
      },
    }
  )
);

// Simple selectors that just return state properties
export const useCards = () => useCardsStore((state) => state.cards);
export const useStats = () => useCardsStore((state) => state.stats);
export const useDueCards = () => useCardsStore((state) => state.dueCards);
export const useSessionQueue = () =>
  useCardsStore((state) => state.sessionQueue);

// Action selectors
export const useCardsActions = () =>
  useCardsStore(
    useShallow((state) => ({
      addCard: state.addCard,
      updateCard: state.updateCard,
      deleteCard: state.deleteCard,
      reviewCard: state.reviewCard,
      clearSession: state.clearSession,
      syncWithSupabase: state.syncWithSupabase,
      loadFromSupabase: state.loadFromSupabase,
      uploadToSupabase: state.uploadToSupabase,
      setCards: state.setCards,
    }))
  );

// Sync status selectors
export const useSyncStatus = () =>
  useCardsStore(
    useShallow((state) => ({
      isSyncing: state.isSyncing,
      lastSyncTime: state.lastSyncTime,
    }))
  );

// Filtered cards selector - this needs to be computed on demand to avoid storing all possible filter combinations
export const useFilteredCards = (filters: string[]): Card[] => {
  return useCardsStore(
    useShallow((state) => {
      const now = Date.now();
      const sessionQueueSet = new Set(state.sessionQueue);

      // Filter cards based on selected filters
      const filteredCards =
        filters.length === 0
          ? state.cards
          : state.cards.filter((card) => filters.includes(card.status));

      // Create a new array copy to avoid mutating read-only array, then sort
      return [...filteredCards].sort((a, b) => {
        // Check if cards are due (ready to review)
        const aIsDue = a.nextReview <= now && !sessionQueueSet.has(a.id);
        const bIsDue = b.nextReview <= now && !sessionQueueSet.has(b.id);

        // Due cards always come first
        if (aIsDue && !bIsDue) return -1;
        if (!aIsDue && bIsDue) return 1;

        // If both are due or both are not due, sort by status priority
        const statusOrder: CardStatus[] = ['learning', 'new', 'learned'];
        const statusDiff =
          statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
        if (statusDiff !== 0) return statusDiff;

        // Within same status, sort by nextReview time
        return a.nextReview - b.nextReview;
      });
    })
  );
};
