import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Card & Spaced Repetition Logic ---

export type CardStatus = 'to-learn' | 'known' | 'learned';

export interface Card {
  id: string;
  english: string;
  vietnamese: string;
  example?: string;
  definition?: string;
  phonetic?: string;
  partOfSpeech?: string;
  createdAt: number;
  status: CardStatus;
  nextReview: number; // timestamp (ms)
  interval: number; // in days
  reviewCount: number;
}

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
    'id' | 'createdAt' | 'status' | 'nextReview' | 'interval' | 'reviewCount'
  >
): Card {
  const newCard: Card = {
    ...card,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    status: 'to-learn',
    nextReview: Date.now(),
    interval: 0.5, // 12 hours for first review
    reviewCount: 0,
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

// Spaced Repetition Scheduling (SM-2 like, simplified)
export function scheduleNext(card: Card, correct: boolean): Card {
  let interval = card.interval;
  let reviewCount = card.reviewCount + 1;
  let status: CardStatus = card.status;
  if (correct) {
    if (interval < 1) interval = 1;
    else interval = Math.round(interval * 2.5); // increase interval
    if (reviewCount >= 5) status = 'learned';
    else if (reviewCount >= 2) status = 'known';
  } else {
    interval = 0.5; // 12 hours
    reviewCount = 0;
    status = 'to-learn';
  }
  return {
    ...card,
    interval,
    reviewCount,
    status,
    nextReview: Date.now() + interval * 24 * 60 * 60 * 1000,
  };
}

export function getDueCards(): Card[] {
  const now = Date.now();
  return getAllCards().filter(
    (c) =>
      c.status === 'to-learn' || (c.status === 'known' && c.nextReview <= now)
  );
}

export function getStats() {
  const cards = getAllCards();
  return {
    toLearn: cards.filter((c) => c.status === 'to-learn').length,
    known: cards.filter((c) => c.status === 'known').length,
    learned: cards.filter((c) => c.status === 'learned').length,
  };
}

export function speak(text: string) {
  console.log('>> speak', text);
  if ('speechSynthesis' in window) {
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    window.speechSynthesis.speak(utter);
  }
}
