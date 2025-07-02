/* eslint-disable react-refresh/only-export-components */
/**
 * Test utilities following React Testing Library best practices
 * Provides custom render functions, mocks, and test helpers
 */

import {
  render,
  screen,
  waitFor,
  type RenderOptions,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";
import { expect, vi } from "vitest";

// Store imports
import { useCardsStore } from "../store/cardsStore";
import { useFormStore } from "../store/formStore";
import { useUIStore } from "../store/uiStore";

// Types
import type { Card } from "../lib/utils";

// ============================================================================
// Test Data Factories
// ============================================================================

export const createMockCard = (overrides: Partial<Card> = {}): Card => ({
  id: `test-card-${Math.random().toString(36).substring(2, 11)}`,
  english: "test",
  vietnamese: "thử nghiệm",
  example: "This is a test example.",
  phonetic: "/test/",
  createdAt: Date.now() - 86400000, // 1 day ago
  status: "new",
  interval: 0,
  stepIndex: 0,
  nextReview: Date.now() - 3600000, // 1 hour ago (due)
  lapses: 0,
  reps: 0,
  lastReview: undefined,
  ...overrides,
});

export const createMockCardSet = () => [
  createMockCard({
    id: "1",
    english: "problem",
    vietnamese: "vấn đề",
    example: "This is a serious problem.",
    phonetic: "/ˈprɒbləm/",
    status: "learned",
    interval: 4,
    reps: 3,
    nextReview: Date.now() - 86400000, // Due yesterday
  }),
  createMockCard({
    id: "2",
    english: "solution",
    vietnamese: "giải pháp",
    example: "We need to find a solution.",
    phonetic: "/səˈluːʃən/",
    status: "learning",
    interval: 1,
    stepIndex: 1,
    reps: 1,
    nextReview: Date.now() + 86400000, // Due tomorrow
  }),
];

export const createMockCardSetWithThree = () => [
  ...createMockCardSet(),
  createMockCard({
    id: "3",
    english: "challenge",
    vietnamese: "thử thách",
    example: "This is a big challenge.",
    phonetic: "/ˈtʃælɪndʒ/",
    status: "new",
    interval: 0,
    stepIndex: 0,
    reps: 0,
    nextReview: Date.now() - 1800000, // Due 30 minutes ago
  }),
];

// ============================================================================
// Store Management Utilities
// ============================================================================

export const resetAllStores = () => {
  // Reset cards store
  useCardsStore.setState({
    cards: [],
    sessionQueue: [],
    stats: { new: 0, learning: 0, learned: 0, due: 0, total: 0 },
    dueCards: [],
  });

  // Reset form store
  useFormStore.setState({
    english: "",
    vietnamese: "",
    example: "",
    phonetic: "",
    isEditing: false,
    editingCardId: undefined,
    cardLoaded: false,
    cambridgeInfo: undefined,
    isFetchingCambridge: false,
    isSubmitting: false,
    hasUnsavedChanges: false,
  });

  // Reset UI store
  useUIStore.setState({
    isLoading: false,
    loadingMessage: undefined,
    notification: undefined,
    isFormDirty: false,
  });
};

export const populateCardsStore = (cards: Card[] = createMockCardSet()) => {
  useCardsStore.setState((state) => {
    const newStats = {
      new: cards.filter((c) => c.status === "new").length,
      learning: cards.filter((c) => c.status === "learning").length,
      learned: cards.filter((c) => c.status === "learned").length,
      due: cards.filter((c) => c.nextReview <= Date.now()).length,
      total: cards.length,
    };

    return {
      ...state,
      cards,
      stats: newStats,
      dueCards: cards.filter((c) => c.nextReview <= Date.now()),
    };
  });
};

export const setEditingMode = (cardId: string, cardData?: Partial<Card>) => {
  useFormStore.setState({
    isEditing: true,
    editingCardId: cardId,
    cardLoaded: true,
    english: cardData?.english || "test-english",
    vietnamese: cardData?.vietnamese || "test-vietnamese",
    example: cardData?.example || "test-example",
    phonetic: cardData?.phonetic || "/test/",
  });
};

export const setAddMode = () => {
  useFormStore.setState({
    isEditing: false,
    editingCardId: undefined,
    cardLoaded: true,
    english: "",
    vietnamese: "",
    example: "",
    phonetic: "",
  });
};

// ============================================================================
// Custom Render Functions
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  routerProps?: MemoryRouterProps;
  initialStoreState?: {
    cards?: Card[];
    editing?: boolean;
    editingCardId?: string;
  };
}

export function renderWithRouter(
  ui: ReactElement,
  {
    routerProps = { initialEntries: ["/"] },
    initialStoreState,
    ...renderOptions
  }: CustomRenderOptions = {},
) {
  // Set up initial store state
  if (initialStoreState) {
    resetAllStores();

    if (initialStoreState.cards) {
      populateCardsStore(initialStoreState.cards);
    }

    if (initialStoreState.editing && initialStoreState.editingCardId) {
      const card = initialStoreState.cards?.find(
        (c) => c.id === initialStoreState.editingCardId,
      );
      setEditingMode(initialStoreState.editingCardId, card);
    }
  }

  function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter {...routerProps}>{children}</MemoryRouter>;
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Shorthand for common scenarios
export function renderWithCards(ui: ReactElement, cards?: Card[]) {
  return renderWithRouter(ui, {
    initialStoreState: { cards: cards || createMockCardSet() },
  });
}

export function renderInEditMode(
  ui: ReactElement,
  cardId = "1",
  cards?: Card[],
) {
  const testCards = cards || createMockCardSet();
  return renderWithRouter(ui, {
    routerProps: { initialEntries: [`/edit/${cardId}`] },
    initialStoreState: {
      cards: testCards,
      editing: true,
      editingCardId: cardId,
    },
  });
}

// ============================================================================
// Mock Utilities
// ============================================================================

export const mockFetch = (
  responseData: unknown,
  options: { ok?: boolean; status?: number } = {},
) => {
  const mockResponse = {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: () => Promise.resolve(responseData),
    text: () => Promise.resolve(JSON.stringify(responseData)),
  };

  global.fetch = vi.fn(() =>
    Promise.resolve(mockResponse as unknown as Response),
  );
  return global.fetch;
};

export const mockCambridgeAPI = (overrides = {}) => {
  const defaultResponse = {
    word: "test",
    phonetic: "/test/",
    examples: ["Test example"],
    vietnameseTranslations: ["thử nghiệm"],
    ...overrides,
  };

  return mockFetch(defaultResponse);
};

export const mockNetworkError = () => {
  global.fetch = vi.fn(() => Promise.reject(new Error("Network error")));
  return global.fetch;
};

// ============================================================================
// Assertion Helpers
// ============================================================================

export const expectToBeInDocument = (text: string | RegExp) => {
  return expect(screen.getByText(text)).toBeInTheDocument();
};

export const expectNotToBeInDocument = (text: string | RegExp) => {
  return expect(screen.queryByText(text)).not.toBeInTheDocument();
};

export const expectFormField = (label: string, value?: string) => {
  const field = screen.getByLabelText(label);
  expect(field).toBeInTheDocument();
  if (value !== undefined) {
    expect(field).toHaveDisplayValue(value);
  }
  return field;
};

export const expectFormFieldPlaceholder = (placeholder: string) => {
  const field = screen.getByPlaceholderText(placeholder);
  expect(field).toBeInTheDocument();
  return field;
};

export const expectButton = (
  name: string | RegExp,
  options?: { disabled?: boolean },
) => {
  const button = screen.getByRole("button", { name });
  expect(button).toBeInTheDocument();
  if (options?.disabled !== undefined) {
    if (options.disabled) {
      expect(button).toBeDisabled();
    } else {
      expect(button).toBeEnabled();
    }
  }
  return button;
};

// ============================================================================
// Navigation Helpers
// ============================================================================

export const navigateToHome = async (
  user: ReturnType<typeof userEvent.setup>,
) => {
  // Check if we're already on the home page
  const cardsText = screen.queryByText(/\d+ Cards$/);
  if (cardsText) {
    // Already on home page, no need to navigate
    return;
  }

  // Look for the home button
  const homeButton = screen.queryByLabelText("Back to Home");
  if (homeButton) {
    await user.click(homeButton);
    await waitFor(() => {
      expect(screen.getByText(/\d+ Cards$/)).toBeInTheDocument();
    });
  } else {
    throw new Error(
      "Cannot navigate to home: no home button found and not already on home page",
    );
  }
};

export const navigateToAddCard = async (
  user: ReturnType<typeof userEvent.setup>,
) => {
  const addButton = screen.getByRole("button", { name: /📝 add card/i });
  await user.click(addButton);
  await waitFor(
    () => {
      expect(screen.getByText("📝 Add New Card")).toBeInTheDocument();
    },
    { timeout: TIMEOUTS.MEDIUM },
  );
};

export const navigateToEditCard = async (
  user: ReturnType<typeof userEvent.setup>,
  cardIndex = 0,
) => {
  const editButtons = screen.getAllByTitle("Edit Card");
  await user.click(editButtons[cardIndex]);
  await waitFor(
    () => {
      expect(screen.getByText("✏️ Edit Card")).toBeInTheDocument();
    },
    { timeout: 5000 },
  );
};

export const navigateToReview = async (
  user: ReturnType<typeof userEvent.setup>,
) => {
  const reviewButton = screen.getByRole("button", { name: /📖 start review/i });
  await user.click(reviewButton);
  await waitFor(() => {
    expect(screen.getByText("Review Cards")).toBeInTheDocument();
  });
};

// ============================================================================
// Form Interaction Helpers
// ============================================================================

export const fillCardForm = async (
  user: ReturnType<typeof userEvent.setup>,
  data: { english?: string; vietnamese?: string; example?: string },
) => {
  if (data.english) {
    const englishField = screen.getByPlaceholderText("Enter English word");
    await user.clear(englishField);
    await user.type(englishField, data.english);
  }

  if (data.vietnamese) {
    const vietnameseField = screen.getByPlaceholderText(
      "Vietnamese translation",
    );
    await user.clear(vietnameseField);
    await user.type(vietnameseField, data.vietnamese);
  }

  if (data.example) {
    const exampleField = screen.getByPlaceholderText(
      "Example sentence (English)",
    );
    await user.clear(exampleField);
    await user.type(exampleField, data.example);
  }
};

export const submitForm = async (user: ReturnType<typeof userEvent.setup>) => {
  const submitButton = screen.getByRole("button", {
    name: /^(add card|save changes)$/i,
  });
  await user.click(submitButton);
};

// ============================================================================
// Wait Utilities
// ============================================================================

export const waitForLoadingToFinish = () => {
  return waitFor(() => {
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
};

export const waitForNotification = () => {
  return waitFor(() => {
    // This would depend on how notifications are implemented
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
};

// ============================================================================
// Debug Utilities
// ============================================================================

export const debugStoreState = () => {
  console.log("Cards Store:", useCardsStore.getState());
  console.log("Form Store:", useFormStore.getState());
  console.log("UI Store:", useUIStore.getState());
};

export const debugDOM = () => {
  screen.debug();
};

// Export screen from testing library for convenience
export { screen, waitFor } from "@testing-library/react";

// ============================================================================
// Constants
// ============================================================================

export const TEST_IDS = {
  // Add test IDs as needed
  CARD_LIST: "card-list",
  CARD_ITEM: "card-item",
  ADD_FORM: "add-form",
  EDIT_FORM: "edit-form",
} as const;

export const SELECTORS = {
  HOME_TITLE: /\d+ Cards$/,
  ADD_CARD_TITLE: "📝 Add New Card",
  EDIT_CARD_TITLE: "✏️ Edit Card",
  REVIEW_TITLE: "Review Cards",
} as const;

export const TIMEOUTS = {
  SHORT: 1000,
  MEDIUM: 5000,
  LONG: 10000,
} as const;
