import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Card & Spaced Repetition Logic ---

export type CardStatus = 'new' | 'learning' | 'review' | 'relearning';
export type CardGrade = 'again' | 'hard' | 'good' | 'easy';

export interface Card {
  id: string;
  english: string;
  vietnamese: string;
  example?: string;
  phonetic?: string;
  createdAt: number;

  // Spaced repetition fields
  status: CardStatus;
  interval: number; // in days
  easeFactor: number; // 1.3 to 2.5, affects interval growth
  stepIndex: number; // current position in learning/relearning steps
  nextReview: number; // timestamp (ms)
  lapses: number; // number of times forgotten
  reps: number; // total successful reviews
  lastReview?: number; // timestamp of last review
}

// Learning steps in minutes
const LEARNING_STEPS = [1, 10]; // 1 minute, then 10 minutes
const RELEARNING_STEPS = [10]; // 10 minutes for failed cards
const GRADUATING_INTERVAL = 1; // 1 day after learning steps
const EASY_INTERVAL = 4; // 4 days when "easy" during learning

// Algorithm parameters
const STARTING_EASE = 2.5;
const MINIMUM_EASE = 1.3;
const EASE_AGAIN_DELTA = -0.2;
const EASE_HARD_DELTA = -0.15;
const EASE_EASY_DELTA = 0.15;
const INTERVAL_MODIFIER = 1.0;
const HARD_INTERVAL_MODIFIER = 1.2;
const NEW_INTERVAL_MODIFIER = 0.0; // 0% of previous interval on lapses

// Session queue to prevent immediate repetition
const sessionQueue: Set<string> = new Set();

const STORAGE_KEY = 'duocards.cards';

export function getAllCards(): Card[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Card[];
  } catch {
    return [];
  }
}

export function saveAllCards(cards: Card[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function addCard(
  card: Omit<
    Card,
    | 'id'
    | 'createdAt'
    | 'status'
    | 'interval'
    | 'easeFactor'
    | 'stepIndex'
    | 'nextReview'
    | 'lapses'
    | 'reps'
  >
): Card {
  const newCard: Card = {
    ...card,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    status: 'new',
    interval: 0,
    easeFactor: STARTING_EASE,
    stepIndex: 0,
    nextReview: Date.now(), // due immediately
    lapses: 0,
    reps: 0,
  };
  const cards = getAllCards();
  cards.push(newCard);
  saveAllCards(cards);
  return newCard;
}

export function updateCard(updated: Card) {
  const cards = getAllCards();
  const idx = cards.findIndex((c) => c.id === updated.id);
  if (idx !== -1) {
    cards[idx] = updated;
    saveAllCards(cards);
  }
}

// Convert minutes to milliseconds
function minutesToMs(minutes: number): number {
  return minutes * 60 * 1000;
}

// Convert days to milliseconds
function daysToMs(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

// Calculate the next review time based on card state and grade
export function scheduleNext(card: Card, grade: CardGrade): Card {
  const now = Date.now();
  let updated: Card = { ...card, lastReview: now };

  // Add to session queue to prevent immediate re-review
  sessionQueue.add(card.id);

  switch (card.status) {
    case 'new':
    case 'learning':
      updated = scheduleLearning(updated, grade);
      break;
    case 'review':
      updated = scheduleReview(updated, grade);
      break;
    case 'relearning':
      updated = scheduleRelearning(updated, grade);
      break;
  }

  return updated;
}

// Schedule learning cards (new or in learning steps)
function scheduleLearning(card: Card, grade: CardGrade): Card {
  const now = Date.now();

  if (grade === 'again') {
    // Reset to first step
    return {
      ...card,
      status: 'learning',
      stepIndex: 0,
      nextReview: now + minutesToMs(LEARNING_STEPS[0]),
    };
  }

  if (grade === 'easy') {
    // Graduate immediately with easy interval
    return {
      ...card,
      status: 'review',
      interval: EASY_INTERVAL,
      stepIndex: 0,
      nextReview: now + daysToMs(EASY_INTERVAL),
      reps: card.reps + 1,
    };
  }

  // For 'hard' or 'good'
  const nextStepIndex = grade === 'hard' ? card.stepIndex : card.stepIndex + 1;

  if (nextStepIndex >= LEARNING_STEPS.length) {
    // Graduate to review
    return {
      ...card,
      status: 'review',
      interval: GRADUATING_INTERVAL,
      stepIndex: 0,
      nextReview: now + daysToMs(GRADUATING_INTERVAL),
      reps: card.reps + 1,
    };
  }

  // Move to next learning step
  return {
    ...card,
    status: 'learning',
    stepIndex: nextStepIndex,
    nextReview: now + minutesToMs(LEARNING_STEPS[nextStepIndex]),
  };
}

// Schedule review cards (graduated cards)
function scheduleReview(card: Card, grade: CardGrade): Card {
  const now = Date.now();
  let easeFactor = card.easeFactor;
  const interval = card.interval;

  // Adjust ease factor
  if (grade === 'again') {
    easeFactor = Math.max(MINIMUM_EASE, easeFactor + EASE_AGAIN_DELTA);
  } else if (grade === 'hard') {
    easeFactor = Math.max(MINIMUM_EASE, easeFactor + EASE_HARD_DELTA);
  } else if (grade === 'easy') {
    easeFactor = easeFactor + EASE_EASY_DELTA;
  }
  // 'good' doesn't change ease

  // Calculate new interval
  if (grade === 'again') {
    // Move to relearning
    return {
      ...card,
      status: 'relearning',
      easeFactor,
      stepIndex: 0,
      interval: Math.max(1, interval * NEW_INTERVAL_MODIFIER),
      nextReview: now + minutesToMs(RELEARNING_STEPS[0]),
      lapses: card.lapses + 1,
    };
  }

  // Calculate interval based on grade
  let newInterval: number;
  if (grade === 'hard') {
    newInterval = interval * HARD_INTERVAL_MODIFIER;
  } else if (grade === 'good') {
    newInterval = interval * easeFactor;
  } else {
    // easy
    newInterval = interval * easeFactor * 1.3;
  }

  // Apply interval modifier and ensure minimum
  newInterval = Math.max(interval + 1, newInterval * INTERVAL_MODIFIER);

  return {
    ...card,
    easeFactor,
    interval: newInterval,
    nextReview: now + daysToMs(newInterval),
    reps: card.reps + 1,
  };
}

// Schedule relearning cards (failed review cards)
function scheduleRelearning(card: Card, grade: CardGrade): Card {
  const now = Date.now();

  if (grade === 'again') {
    // Reset to first relearning step
    return {
      ...card,
      stepIndex: 0,
      nextReview: now + minutesToMs(RELEARNING_STEPS[0]),
    };
  }

  // For 'hard', 'good', or 'easy'
  const nextStepIndex = grade === 'hard' ? card.stepIndex : card.stepIndex + 1;

  if (nextStepIndex >= RELEARNING_STEPS.length) {
    // Graduate back to review
    return {
      ...card,
      status: 'review',
      stepIndex: 0,
      nextReview: now + daysToMs(card.interval),
      reps: card.reps + 1,
    };
  }

  // Move to next relearning step
  return {
    ...card,
    stepIndex: nextStepIndex,
    nextReview: now + minutesToMs(RELEARNING_STEPS[nextStepIndex]),
  };
}

// Get cards due for review, excluding cards reviewed in this session
export function getDueCards(): Card[] {
  const now = Date.now();
  return getAllCards()
    .filter((c) => !sessionQueue.has(c.id)) // Exclude cards reviewed this session
    .filter((c) => c.nextReview <= now)
    .sort((a, b) => {
      // Priority order: learning/relearning > new > review
      const priority = (card: Card) => {
        if (card.status === 'learning' || card.status === 'relearning')
          return 0;
        if (card.status === 'new') return 1;
        return 2;
      };

      const priorityDiff = priority(a) - priority(b);
      if (priorityDiff !== 0) return priorityDiff;

      // Within same priority, sort by nextReview time
      return a.nextReview - b.nextReview;
    });
}

// Clear session queue (call when starting a new session)
export function clearSessionQueue() {
  sessionQueue.clear();
}

// Get statistics
export function getStats() {
  const cards = getAllCards();
  const now = Date.now();

  return {
    new: cards.filter((c) => c.status === 'new').length,
    learning: cards.filter((c) => c.status === 'learning').length,
    review: cards.filter((c) => c.status === 'review').length,
    relearning: cards.filter((c) => c.status === 'relearning').length,
    due: cards.filter((c) => c.nextReview <= now && !sessionQueue.has(c.id))
      .length,
    total: cards.length,
  };
}

// Old card format for migration
type OldCard = {
  id: string;
  english: string;
  vietnamese: string;
  example?: string;
  phonetic?: string;
  createdAt: number;
  status: 'to-learn' | 'known' | 'learned';
  nextReview: number;
  interval: number;
  reviewCount: number;
};

// Convert old card format to new format (for migration)
export function migrateCards() {
  const cards = getAllCards();
  let migrated = false;

  const updatedCards = cards.map((card) => {
    // Check if card uses old format (using type guard)
    if ('status' in card && 'reviewCount' in card) {
      const oldCard = card as unknown as OldCard;
      if (
        oldCard.status === 'to-learn' ||
        oldCard.status === 'known' ||
        oldCard.status === 'learned'
      ) {
        migrated = true;

        // Map old status to new
        let newStatus: CardStatus = 'new';
        if (oldCard.status === 'known') newStatus = 'review';
        else if (oldCard.status === 'learned') newStatus = 'review';

        return {
          ...card,
          status: newStatus,
          easeFactor: STARTING_EASE,
          stepIndex: 0,
          lapses: 0,
          reps: oldCard.reviewCount || 0,
          interval: oldCard.interval || 1,
        } as Card;
      }
    }
    return card;
  });

  if (migrated) {
    saveAllCards(updatedCards);
  }
}

// Initialize migration on load
if (typeof window !== 'undefined') {
  migrateCards();
}

export function speak(text: string) {
  console.log('>> speak', text);
  if ('speechSynthesis' in window) {
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  }
}

/**
 * Returns a human-readable string for the time until the given timestamp (ms).
 * E.g. 'in 2 hours', 'in 1 day', 'now'.
 */
export function formatTimeUntil(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  if (diff <= 0) return 'now';
  const minutes = Math.round(diff / 60000);
  if (minutes < 60) return `in ${minutes} min${minutes === 1 ? '' : 's'}`;
  const hours = Math.round(diff / 3600000);
  if (hours < 24) return `in ${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.round(diff / 86400000);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}
