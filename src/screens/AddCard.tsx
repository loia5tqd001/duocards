import { useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { speak } from '../lib/utils';
import PageContainer from '@/components/ui/PageContainer';
import { FaTimes } from 'react-icons/fa';
import AutoGrowTextarea from '@/components/ui/AutoGrowTextarea';
import VolumeButton from '@/components/ui/VolumeButton';
import { useNavigate, useParams } from 'react-router-dom';
import { useCards, useCardsActions } from '../store/cardsStore';
import {
  useFormFields,
  useFormState,
  useCambridgeState,
  useFormActions,
  type CambridgeInfo,
} from '../store/formStore';
import { useUIActions } from '../store/uiStore';

// CambridgeInfo interface is now imported from formStore

const DEBOUNCE_DELAY = 500;

export default function AddOrEditCard() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Use stores
  const cards = useCards();
  const { addCard, updateCard } = useCardsActions();
  const { english, vietnamese, example, phonetic } = useFormFields();
  const { isEditing, editingCardId, cardLoaded, isSubmitting } = useFormState();
  const { info, isFetching } = useCambridgeState();
  const {
    setField,
    setCambridgeInfo,
    setFetchingCambridge,
    setEditing,
    setCardLoaded,
    setSubmitting,
    resetForm,
    populateFromCard,
  } = useFormActions();
  const { showNotification } = useUIActions();

  // Refs
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const englishInputRef = useRef<HTMLInputElement>(null);
  const vietnameseInputRef = useRef<HTMLInputElement>(null);
  const exampleTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Load card data for editing
  useEffect(() => {
    if (id) {
      const card = cards.find((c) => c.id === id);
      if (card) {
        populateFromCard(card);
        setEditing(true, id);
      }
    } else {
      // If no ID, we're in add mode - only reset if we were previously editing
      if (isEditing) {
        resetForm();
      }
    }
    setCardLoaded(true);
  }, [
    id,
    cards,
    populateFromCard,
    setEditing,
    setCardLoaded,
    isEditing,
    resetForm,
  ]);

  // Clear form when English input is empty (only in add mode)
  const clearFormData = useCallback(() => {
    setCambridgeInfo(undefined);
    setField('vietnamese', '');
    setField('example', '');
    setField('phonetic', '');
    setFetchingCambridge(false);
  }, [setCambridgeInfo, setField, setFetchingCambridge]);

  // Fetch Cambridge info and auto-translate
  const fetchInfo = useCallback(
    async (word: string) => {
      try {
        const apiUrl =
          import.meta.env.VITE_API_URL ||
          `http://${window.location.hostname}:3001`;
        const response = await fetch(
          `${apiUrl}/api/cambridge/${encodeURIComponent(word)}`,
          {
            signal: AbortSignal.timeout(7000), // 7 second timeout
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const newInfo: CambridgeInfo = {
          word: data.word || word,
          phonetic: data.phonetic || '',
          audio: '',
          examples: data.examples || [],
          vietnameseTranslations: data.vietnameseTranslations || [],
        };

        setCambridgeInfo(newInfo);
        setField('phonetic', newInfo.phonetic);
        // Don't auto-fill Vietnamese and Example - let user choose from suggestions
      } catch (error) {
        console.error('Failed to fetch Cambridge info:', error);
        clearFormData();
      } finally {
        setFetchingCambridge(false);
      }
    },
    [clearFormData, setCambridgeInfo, setField, setFetchingCambridge]
  );

  // Fetch Cambridge info with debouncing
  const debouncedFetchInfo = useCallback(
    (word: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      setFetchingCambridge(true);
      debounceRef.current = setTimeout(() => {
        fetchInfo(word);
      }, DEBOUNCE_DELAY);
    },
    [fetchInfo, setFetchingCambridge]
  );

  // Fetch Cambridge info effect
  useEffect(() => {
    if (!cardLoaded || isEditing) return;

    const trimmedEnglish = english.trim();
    if (!trimmedEnglish) {
      clearFormData();
      return;
    }

    debouncedFetchInfo(trimmedEnglish);
  }, [english, isEditing, cardLoaded, clearFormData, debouncedFetchInfo]);

  // Input change handlers
  const handleEnglishChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setField('english', e.target.value);
    },
    [setField]
  );

  const handleVietnameseChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setField('vietnamese', e.target.value);
    },
    [setField]
  );

  const handleExampleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setField('example', e.target.value);
    },
    [setField]
  );

  // Form submission handler
  const handleAddOrEdit = useCallback(async () => {
    const trimmedEnglish = english.trim();
    const trimmedVietnamese = vietnamese.trim();

    if (!trimmedEnglish || !trimmedVietnamese) return;

    setSubmitting(true);

    try {
      if (isEditing && editingCardId) {
        // Update existing card
        const existingCard = cards.find((card) => card.id === editingCardId);
        if (existingCard) {
          updateCard({
            ...existingCard,
            english: trimmedEnglish,
            vietnamese: trimmedVietnamese,
            example: example.trim(),
            phonetic: phonetic.trim(),
          });
          showNotification('success', 'Card updated successfully!');
        }
      } else {
        // Add new card
        addCard({
          english: trimmedEnglish,
          vietnamese: trimmedVietnamese,
          example: example.trim(),
          phonetic: info?.phonetic || phonetic.trim(),
        });

        // Reset form
        resetForm();
        showNotification('success', 'Card added successfully!');
        englishInputRef.current?.focus();
      }
    } catch (error) {
      console.error('Error adding/editing card:', error);
      showNotification('error', 'Failed to save card. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [
    english,
    vietnamese,
    example,
    phonetic,
    isEditing,
    editingCardId,
    cards,
    updateCard,
    addCard,
    showNotification,
    resetForm,
    info,
    setSubmitting,
  ]);

  // Navigation handlers
  const handleNavigateHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleNavigateReview = useCallback(() => {
    navigate('/review');
  }, [navigate]);

  return (
    <PageContainer
      title={isEditing ? '✏️ Edit Card' : '📝 Add New Card'}
      leftButton={
        <Button
          variant="outline"
          size="icon"
          className="rounded-lg w-10 h-10 min-w-0"
          onClick={handleNavigateHome}
          aria-label="Back to Home"
        >
          <span className="text-xl">🏠</span>
        </Button>
      }
      rightButton={
        <Button
          variant="outline"
          size="icon"
          className="rounded-lg w-10 h-10 min-w-0"
          onClick={handleNavigateReview}
          aria-label="Go to Review"
        >
          <span className="text-xl">📖</span>
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="pt-1">
          <label htmlFor="english" className="font-bold text-sm">
            English
          </label>
          <div className="relative flex items-center">
            <input
              id="english"
              type="text"
              value={english}
              onChange={handleEnglishChange}
              placeholder="Enter English word"
              className={`w-full p-3 rounded-lg border text-base focus:outline-none pr-10 ${
                english ? 'border-blue-500' : 'border-slate-200'
              }`}
              ref={englishInputRef}
              readOnly={isEditing}
              autoFocus={!isEditing}
            />
            {!isEditing && english && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 inset-y-0 my-auto w-6 h-6 p-0 text-slate-300 hover:text-slate-500"
                onClick={() => {
                  setField('english', '');
                  setCambridgeInfo(undefined);
                  englishInputRef.current?.focus();
                }}
                aria-label="Clear English input"
                title="Clear English input"
                tabIndex={-1}
              >
                <FaTimes size={14} />
              </Button>
            )}
          </div>
          {isEditing
            ? phonetic && (
                <div className="font-semibold text-lg mb-1 mt-1 flex items-center gap-2">
                  <span className="text-slate-400 text-sm">{phonetic}</span>
                  <VolumeButton
                    onClick={() => speak(english)}
                    ariaLabel="Play word audio"
                    size={18}
                    significant={true}
                  />
                </div>
              )
            : info && (
                <div className="font-semibold text-lg mb-1 mt-1 flex items-center gap-2">
                  <span className="text-slate-400 text-sm">
                    {info.phonetic}
                  </span>
                  <VolumeButton
                    onClick={() => speak(info.word)}
                    ariaLabel="Play word audio"
                    size={18}
                    significant={true}
                  />
                </div>
              )}
        </div>
        <div className="pt-1">
          <label htmlFor="vietnamese" className="font-bold text-sm">
            Vietnamese
          </label>
          <div className="relative flex items-center">
            <input
              id="vietnamese"
              type="text"
              value={vietnamese}
              onChange={handleVietnameseChange}
              placeholder="Vietnamese translation"
              className={`w-full p-3 rounded-lg border text-base focus:outline-none pr-10 ${
                vietnamese ? 'border-blue-500' : 'border-slate-200'
              }`}
              ref={vietnameseInputRef}
            />
            {vietnamese && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 inset-y-0 my-auto w-6 h-6 p-0 text-slate-300 hover:text-slate-500"
                onClick={() => {
                  setField('vietnamese', '');
                  vietnameseInputRef.current?.focus();
                }}
                aria-label="Clear Vietnamese input"
                title="Clear Vietnamese input"
                tabIndex={-1}
              >
                <FaTimes size={14} />
              </Button>
            )}
          </div>
          {/* Chips for Vietnamese translation suggestions */}
          {!isEditing &&
            info &&
            Array.isArray(info.vietnameseTranslations) &&
            info.vietnameseTranslations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {info.vietnameseTranslations.map((vi: string, i: number) => (
                  <button
                    key={i}
                    type="button"
                    className={`px-3 py-1 rounded-full border text-xs transition-colors cursor-pointer
                    ${
                      vietnamese === vi
                        ? 'border-primary text-primary bg-white'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }
                  `}
                    onClick={() => setField('vietnamese', vi)}
                  >
                    {vi}
                  </button>
                ))}
              </div>
            )}
        </div>
        <div className="pt-1">
          <label htmlFor="example" className="font-bold text-sm">
            Example (optional)
          </label>
          <div className="relative flex items-center">
            <AutoGrowTextarea
              id="example"
              value={example}
              onChange={handleExampleChange}
              placeholder="Example sentence (English)"
              minRows={1}
              maxRows={3}
              className={`resize-none ${
                example ? 'border-blue-500' : 'border-slate-200'
              }`}
              ref={exampleTextareaRef}
            />
            {example && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 inset-y-0 my-auto w-6 h-6 p-0 text-slate-300 hover:text-slate-500"
                onClick={() => {
                  setField('example', '');
                  exampleTextareaRef.current?.focus();
                }}
                aria-label="Clear Example input"
                title="Clear Example input"
                tabIndex={-1}
              >
                <FaTimes size={14} />
              </Button>
            )}
          </div>
          {/* Chips for example suggestions */}
          {!isEditing &&
            info &&
            Array.isArray(info.examples) &&
            info.examples.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {info.examples.map((ex: string, i: number) => (
                  <button
                    key={i}
                    type="button"
                    className={`px-3 py-1 rounded-full border text-xs transition-colors cursor-pointer
                    ${
                      example === ex
                        ? 'border-primary text-primary bg-white'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }
                  `}
                    onClick={() => setField('example', ex)}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
        </div>

        {/* Padding to prevent content from being hidden behind sticky button */}
        <div className="pb-24">
          {/* Notifications now handled by UI store */}
        </div>
      </div>

      {/* Fixed bottom button (no longer sticky to keyboard) */}
      <div
        className="fixed left-0 right-0 bg-white border-t border-slate-200 z-50"
        style={{
          bottom: 'env(safe-area-inset-bottom)',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="w-full max-w-sm mx-auto p-4">
          <Button
            className="w-full text-base py-3 rounded-xl"
            onClick={handleAddOrEdit}
            disabled={!english || !vietnamese || isFetching || isSubmitting}
          >
            {isFetching || isSubmitting
              ? 'Loading...'
              : isEditing
                ? 'Save Changes'
                : 'Add Card'}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
