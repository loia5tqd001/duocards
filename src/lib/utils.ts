import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Card & Spaced Repetition Logic ---

export type CardStatus = 'new' | 'learning' | 'learned';
export type CardGrade = 'incorrect' | 'correct';

export interface Card {
  id: string;
  english: string;
  vietnamese: string;
  example?: string;
  phonetic?: string;
  createdAt: number;

  // Simplified spaced repetition fields
  status: CardStatus;
  interval: number; // in days
  stepIndex: number; // current position in learning steps
  nextReview: number; // timestamp (ms)
  lapses: number; // number of times forgotten
  reps: number; // total successful reviews
  lastReview?: number; // timestamp of last review
  // Remove easeFactor - we'll use fixed multipliers
}

// Simplified learning steps in minutes
const LEARNING_STEPS = [1, 10]; // 1 minute, then 10 minutes
const GRADUATING_INTERVAL = 1; // 1 day after learning steps

// Simplified algorithm parameters
const CORRECT_MULTIPLIER = 2.5; // Multiply interval by this when correct
const INCORRECT_MULTIPLIER = 0.25; // Reduce interval to 25% when incorrect
const MINIMUM_INTERVAL = 1; // Minimum 1 day interval for learned cards

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
    | 'stepIndex'
    | 'nextReview'
    | 'lapses'
    | 'reps'
  >
): Card {
  const newCard: Card = {
    ...card,
    id: uuidv4(),
    createdAt: Date.now(),
    status: 'new',
    interval: 0,
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

// Cross-browser UUID v4 generator
export function uuidv4(): string {
  // Use crypto.getRandomValues if available
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    // Set version and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return [...bytes]
      .map((b, i) =>
        [4, 6, 8, 10].includes(i)
          ? '-' + b.toString(16).padStart(2, '0')
          : b.toString(16).padStart(2, '0')
      )
      .join('')
      .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
  }
  // Fallback: Math.random (not cryptographically secure)
  let uuid = '',
    i = 0;
  for (i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4';
    } else if (i === 19) {
      uuid += ((Math.random() * 4) | 8).toString(16);
    } else {
      uuid += ((Math.random() * 16) | 0).toString(16);
    }
  }
  return uuid;
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
    case 'learned':
      updated = scheduleLearned(updated, grade);
      break;
  }

  return updated;
}

// Schedule learning cards (new or in learning steps)
function scheduleLearning(card: Card, grade: CardGrade): Card {
  const now = Date.now();

  if (grade === 'incorrect') {
    // Reset to first step
    return {
      ...card,
      status: 'learning',
      stepIndex: 0,
      nextReview: now + minutesToMs(LEARNING_STEPS[0]),
    };
  }

  // Correct - advance to next step
  const nextStepIndex = card.stepIndex + 1;

  if (nextStepIndex >= LEARNING_STEPS.length) {
    // Graduate to learned
    return {
      ...card,
      status: 'learned',
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

// Schedule learned cards
function scheduleLearned(card: Card, grade: CardGrade): Card {
  const now = Date.now();
  let newInterval: number;

  if (grade === 'incorrect') {
    // Reduce interval significantly
    newInterval = Math.max(
      MINIMUM_INTERVAL,
      card.interval * INCORRECT_MULTIPLIER
    );

    // If interval drops below minimum, put back in learning
    if (newInterval <= MINIMUM_INTERVAL) {
      return {
        ...card,
        status: 'learning',
        stepIndex: 0,
        interval: 0,
        nextReview: now + minutesToMs(LEARNING_STEPS[0]),
        lapses: card.lapses + 1,
      };
    }

    return {
      ...card,
      interval: newInterval,
      nextReview: now + daysToMs(newInterval),
      lapses: card.lapses + 1,
    };
  }

  // Correct - increase interval
  newInterval = card.interval * CORRECT_MULTIPLIER;

  // Cap at reasonable maximum (1 year)
  newInterval = Math.min(365, newInterval);

  return {
    ...card,
    interval: newInterval,
    nextReview: now + daysToMs(newInterval),
    reps: card.reps + 1,
  };
}

// Get cards due for review, excluding cards reviewed in this session
export function getDueCards(): Card[] {
  const now = Date.now();
  return getAllCards()
    .filter((c) => !sessionQueue.has(c.id)) // Exclude cards reviewed this session
    .filter((c) => c.nextReview <= now)
    .sort((a, b) => {
      // Priority order: learning > new > learned
      const priority = (card: Card) => {
        if (card.status === 'learning') return 0;
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
    learned: cards.filter((c) => c.status === 'learned').length,
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
  status:
    | 'to-learn'
    | 'known'
    | 'learned'
    | 'new'
    | 'learning'
    | 'review'
    | 'relearning';
  nextReview: number;
  interval: number;
  reviewCount?: number;
  reps?: number;
  easeFactor?: number;
  stepIndex?: number;
  lapses?: number;
  lastReview?: number;
};

// Convert old card format to new format (for migration)
export function migrateCards() {
  const cards = getAllCards();
  let migrated = false;

  const updatedCards = cards.map((card) => {
    const oldCard = card as unknown as OldCard;

    // Check if this is an old format card that needs migration
    if (
      'easeFactor' in oldCard ||
      oldCard.status === 'review' ||
      oldCard.status === 'relearning' ||
      oldCard.status === 'to-learn' ||
      oldCard.status === 'known'
    ) {
      migrated = true;

      // Map old status to new
      let newStatus: CardStatus = 'new';
      if (oldCard.status === 'learning') {
        newStatus = 'learning';
      } else if (
        oldCard.status === 'review' ||
        oldCard.status === 'relearning' ||
        oldCard.status === 'known' ||
        oldCard.status === 'learned'
      ) {
        newStatus = 'learned';
      }

      // Create new card structure without easeFactor
      return {
        id: oldCard.id,
        english: oldCard.english,
        vietnamese: oldCard.vietnamese,
        example: oldCard.example,
        phonetic: oldCard.phonetic,
        createdAt: oldCard.createdAt,
        status: newStatus,
        interval: oldCard.interval || 1,
        stepIndex: oldCard.stepIndex || 0,
        nextReview: oldCard.nextReview,
        lapses: oldCard.lapses || 0,
        reps: oldCard.reps || oldCard.reviewCount || 0,
        lastReview: oldCard.lastReview,
      } as Card;
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

export function deleteCard(id: string) {
  const cards = getAllCards();
  const updated = cards.filter((c) => c.id !== id);
  saveAllCards(updated);
}
