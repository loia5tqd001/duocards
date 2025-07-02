import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

export interface CambridgeInfo {
  word: string;
  phonetic: string;
  audio: string;
  examples: string[];
  vietnameseTranslations: string[];
}

interface FormState {
  // Form fields
  english: string;
  vietnamese: string;
  example: string;
  phonetic: string;

  // Form state
  isEditing: boolean;
  editingCardId?: string;
  cardLoaded: boolean;

  // Cambridge API state
  cambridgeInfo?: CambridgeInfo;
  isFetchingCambridge: boolean;

  // Form status
  isSubmitting: boolean;
  hasUnsavedChanges: boolean;

  // Actions
  setField: (
    field: keyof Pick<
      FormState,
      'english' | 'vietnamese' | 'example' | 'phonetic'
    >,
    value: string
  ) => void;
  setFields: (
    fields: Partial<
      Pick<FormState, 'english' | 'vietnamese' | 'example' | 'phonetic'>
    >
  ) => void;
  setCambridgeInfo: (info?: CambridgeInfo) => void;
  setFetchingCambridge: (fetching: boolean) => void;
  setEditing: (editing: boolean, cardId?: string) => void;
  setCardLoaded: (loaded: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setUnsavedChanges: (hasChanges: boolean) => void;
  resetForm: () => void;
  populateFromCard: (card: {
    english: string;
    vietnamese: string;
    example?: string;
    phonetic?: string;
  }) => void;
}

// Selectors
export const useFormFields = () =>
  useFormStore(
    useShallow((state) => ({
      english: state.english,
      vietnamese: state.vietnamese,
      example: state.example,
      phonetic: state.phonetic,
    }))
  );

export const useFormState = () =>
  useFormStore(
    useShallow((state) => ({
      isEditing: state.isEditing,
      editingCardId: state.editingCardId,
      cardLoaded: state.cardLoaded,
      isSubmitting: state.isSubmitting,
      hasUnsavedChanges: state.hasUnsavedChanges,
    }))
  );

export const useCambridgeState = () =>
  useFormStore(
    useShallow((state) => ({
      info: state.cambridgeInfo,
      isFetching: state.isFetchingCambridge,
    }))
  );

// Action selectors
export const useFormActions = () =>
  useFormStore(
    useShallow((state) => ({
      setField: state.setField,
      setFields: state.setFields,
      setCambridgeInfo: state.setCambridgeInfo,
      setFetchingCambridge: state.setFetchingCambridge,
      setEditing: state.setEditing,
      setCardLoaded: state.setCardLoaded,
      setSubmitting: state.setSubmitting,
      setUnsavedChanges: state.setUnsavedChanges,
      resetForm: state.resetForm,
      populateFromCard: state.populateFromCard,
    }))
  );

const initialFormState = {
  english: '',
  vietnamese: '',
  example: '',
  phonetic: '',
  isEditing: false,
  editingCardId: undefined,
  cardLoaded: false,
  cambridgeInfo: undefined,
  isFetchingCambridge: false,
  isSubmitting: false,
  hasUnsavedChanges: false,
};

export const useFormStore = create<FormState>()(
  subscribeWithSelector(
    immer((set) => ({
      ...initialFormState,

      setField: (field, value) => {
        set((state) => {
          state[field] = value;
          state.hasUnsavedChanges = true;
        });
      },

      setFields: (fields) => {
        set((state) => {
          Object.assign(state, fields);
          state.hasUnsavedChanges = true;
        });
      },

      setCambridgeInfo: (info) => {
        set((state) => {
          state.cambridgeInfo = info;
        });
      },

      setFetchingCambridge: (fetching) => {
        set((state) => {
          state.isFetchingCambridge = fetching;
        });
      },

      setEditing: (editing, cardId) => {
        set((state) => {
          state.isEditing = editing;
          state.editingCardId = cardId;
        });
      },

      setCardLoaded: (loaded) => {
        set((state) => {
          state.cardLoaded = loaded;
        });
      },

      setSubmitting: (submitting) => {
        set((state) => {
          state.isSubmitting = submitting;
        });
      },

      setUnsavedChanges: (hasChanges) => {
        set((state) => {
          state.hasUnsavedChanges = hasChanges;
        });
      },

      resetForm: () => {
        set((state) => {
          Object.assign(state, initialFormState);
        });
      },

      populateFromCard: (card) => {
        set((state) => {
          state.english = card.english;
          state.vietnamese = card.vietnamese;
          state.example = card.example || '';
          state.phonetic = card.phonetic || '';
          state.hasUnsavedChanges = false;
        });
      },
    }))
  )
);
