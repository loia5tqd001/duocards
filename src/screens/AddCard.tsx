import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  addCard as addCardToStorage,
  updateCard,
  getAllCards,
  speak,
} from '../lib/utils';
import PageContainer from '@/components/ui/PageContainer';
import { FaTimes } from 'react-icons/fa';
import AutoGrowTextarea from '@/components/ui/AutoGrowTextarea';
import VolumeButton from '@/components/ui/VolumeButton';
import { useNavigate, useParams } from 'react-router-dom';

interface CambridgeInfo {
  word: string;
  phonetic: string;
  audio: string;
  examples: string[];
  vietnameseTranslations: string[];
}

const DEBOUNCE_DELAY = 500;
const SUCCESS_MESSAGE_DURATION = 1200;

export default function AddOrEditCard() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Form state
  const [english, setEnglish] = useState('');
  const [vietnamese, setVietnamese] = useState('');
  const [example, setExample] = useState('');
  const [phonetic, setPhonetic] = useState('');

  // UI state
  const [info, setInfo] = useState<CambridgeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [cardLoaded, setCardLoaded] = useState(false);

  // Refs
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const englishInputRef = useRef<HTMLInputElement>(null);
  const vietnameseInputRef = useRef<HTMLInputElement>(null);
  const exampleTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Load card data for editing
  useEffect(() => {
    if (id) {
      const card = getAllCards().find((c) => c.id === id);
      if (card) {
        setEnglish(card.english);
        setVietnamese(card.vietnamese);
        setExample(card.example || '');
        setPhonetic(card.phonetic || '');
        setEditing(true);
      }
    }
    setCardLoaded(true);
  }, [id]);

  // Clear form when English input is empty (only in add mode)
  const clearFormData = useCallback(() => {
    setInfo(null);
    setVietnamese('');
    setExample('');
    setPhonetic('');
    setLoading(false);
  }, []);

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

        setInfo(newInfo);
        setPhonetic(newInfo.phonetic);
        // Don't auto-fill Vietnamese and Example - let user choose from suggestions
      } catch (error) {
        console.error('Failed to fetch Cambridge info:', error);
        clearFormData();
      } finally {
        setLoading(false);
      }
    },
    [clearFormData]
  );

  // Fetch Cambridge info with debouncing
  const debouncedFetchInfo = useCallback(
    (word: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      setLoading(true);
      debounceRef.current = setTimeout(() => {
        fetchInfo(word);
      }, DEBOUNCE_DELAY);
    },
    [fetchInfo]
  );

  // Fetch Cambridge info effect
  useEffect(() => {
    if (!cardLoaded || editing) return;

    const trimmedEnglish = english.trim();
    if (!trimmedEnglish) {
      clearFormData();
      return;
    }

    debouncedFetchInfo(trimmedEnglish);
  }, [english, editing, cardLoaded, clearFormData, debouncedFetchInfo]);

  // Input change handlers
  const handleEnglishChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEnglish(e.target.value);
      setAdded(false);
    },
    []
  );

  const handleVietnameseChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVietnamese(e.target.value);
    },
    []
  );

  const handleExampleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setExample(e.target.value);
    },
    []
  );

  // Form submission handler
  const handleAddOrEdit = useCallback(() => {
    const trimmedEnglish = english.trim();
    const trimmedVietnamese = vietnamese.trim();

    if (!trimmedEnglish || !trimmedVietnamese) return;

    try {
      if (editing && id) {
        // Update existing card
        const cards = getAllCards();
        const existingCard = cards.find((card) => card.id === id);
        if (existingCard) {
          updateCard({
            ...existingCard,
            english: trimmedEnglish,
            vietnamese: trimmedVietnamese,
            example: example.trim(),
          });
          setAdded(true);
          setTimeout(() => setAdded(false), SUCCESS_MESSAGE_DURATION);
          window.dispatchEvent(new Event('storage'));
          navigate('/');
        }
      } else {
        // Add new card
        addCardToStorage({
          english: trimmedEnglish,
          vietnamese: trimmedVietnamese,
          example: example.trim(),
          phonetic: info?.phonetic || '',
        });

        // Reset form
        setEnglish('');
        setVietnamese('');
        setExample('');
        setInfo(null);
        setAdded(true);
        setTimeout(() => setAdded(false), SUCCESS_MESSAGE_DURATION);
        window.dispatchEvent(new Event('storage'));
      }
    } catch (error) {
      alert('error: ' + error);
      console.error('Failed to save card:', error);
    }
  }, [english, vietnamese, example, editing, id, info?.phonetic, navigate]);

  return (
    <PageContainer
      title={editing ? '✏️ Edit Card' : '📝 Add New Card'}
      leftButton={
        <Button
          variant='outline'
          size='icon'
          className='rounded-lg w-10 h-10 min-w-0'
          onClick={() => navigate('/')}
          aria-label='Back to Home'
        >
          <span className='text-xl'>🏠</span>
        </Button>
      }
      rightButton={
        <Button
          variant='outline'
          size='icon'
          className='rounded-lg w-10 h-10 min-w-0'
          onClick={() => navigate('/review')}
          aria-label='Go to Review'
        >
          <span className='text-xl'>📖</span>
        </Button>
      }
    >
      <div className='flex flex-col gap-4'>
        <div className='pt-1'>
          <label htmlFor='english' className='font-bold text-sm'>
            English
          </label>
          <div className='relative flex items-center'>
            <input
              id='english'
              type='text'
              value={english}
              onChange={handleEnglishChange}
              placeholder='Enter English word'
              className={`w-full p-3 rounded-lg border text-base focus:outline-none pr-10 ${
                english ? 'border-blue-500' : 'border-slate-200'
              }`}
              ref={englishInputRef}
              readOnly={editing}
              autoFocus={!editing}
            />
            {!editing && english && (
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute right-2 inset-y-0 my-auto w-6 h-6 p-0 text-slate-300 hover:text-slate-500'
                onClick={() => {
                  setEnglish('');
                  setInfo(null);
                  setAdded(false);
                  englishInputRef.current?.focus();
                }}
                aria-label='Clear English input'
                title='Clear English input'
                tabIndex={-1}
              >
                <FaTimes size={14} />
              </Button>
            )}
          </div>
          {editing
            ? phonetic && (
                <div className='font-semibold text-lg mb-1 mt-1 flex items-center gap-2'>
                  <span className='text-slate-400 text-sm'>{phonetic}</span>
                  <VolumeButton
                    onClick={() => speak(english)}
                    ariaLabel='Play word audio'
                    size={18}
                    significant={true}
                  />
                </div>
              )
            : info && (
                <div className='font-semibold text-lg mb-1 mt-1 flex items-center gap-2'>
                  <span className='text-slate-400 text-sm'>
                    {info.phonetic}
                  </span>
                  <VolumeButton
                    onClick={() => speak(info.word)}
                    ariaLabel='Play word audio'
                    size={18}
                    significant={true}
                  />
                </div>
              )}
        </div>
        <div className='pt-1'>
          <label htmlFor='vietnamese' className='font-bold text-sm'>
            Vietnamese
          </label>
          <div className='relative flex items-center'>
            <input
              id='vietnamese'
              type='text'
              value={vietnamese}
              onChange={handleVietnameseChange}
              placeholder='Vietnamese translation'
              className={`w-full p-3 rounded-lg border text-base focus:outline-none pr-10 ${
                vietnamese ? 'border-blue-500' : 'border-slate-200'
              }`}
              ref={vietnameseInputRef}
            />
            {vietnamese && (
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute right-2 inset-y-0 my-auto w-6 h-6 p-0 text-slate-300 hover:text-slate-500'
                onClick={() => {
                  setVietnamese('');
                  vietnameseInputRef.current?.focus();
                }}
                aria-label='Clear Vietnamese input'
                title='Clear Vietnamese input'
                tabIndex={-1}
              >
                <FaTimes size={14} />
              </Button>
            )}
          </div>
          {/* Chips for Vietnamese translation suggestions */}
          {!editing &&
            info &&
            Array.isArray(info.vietnameseTranslations) &&
            info.vietnameseTranslations.length > 0 && (
              <div className='flex flex-wrap gap-2 mt-2'>
                {info.vietnameseTranslations.map((vi, i) => (
                  <button
                    key={i}
                    type='button'
                    className={`px-3 py-1 rounded-full border text-xs transition-colors cursor-pointer
                    ${
                      vietnamese === vi
                        ? 'border-primary text-primary bg-white'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }
                  `}
                    onClick={() => setVietnamese(vi)}
                  >
                    {vi}
                  </button>
                ))}
              </div>
            )}
        </div>
        <div className='pt-1'>
          <label htmlFor='example' className='font-bold text-sm'>
            Example (optional)
          </label>
          <div className='relative flex items-center'>
            <AutoGrowTextarea
              id='example'
              value={example}
              onChange={handleExampleChange}
              placeholder='Example sentence (English)'
              minRows={1}
              maxRows={3}
              className={`resize-none ${
                example ? 'border-blue-500' : 'border-slate-200'
              }`}
              ref={exampleTextareaRef}
            />
            {example && (
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute right-2 inset-y-0 my-auto w-6 h-6 p-0 text-slate-300 hover:text-slate-500'
                onClick={() => {
                  setExample('');
                  exampleTextareaRef.current?.focus();
                }}
                aria-label='Clear Example input'
                title='Clear Example input'
                tabIndex={-1}
              >
                <FaTimes size={14} />
              </Button>
            )}
          </div>
          {/* Chips for example suggestions */}
          {!editing &&
            info &&
            Array.isArray(info.examples) &&
            info.examples.length > 0 && (
              <div className='flex flex-wrap gap-2 mt-2'>
                {info.examples.map((ex, i) => (
                  <button
                    key={i}
                    type='button'
                    className={`px-3 py-1 rounded-full border text-xs transition-colors cursor-pointer
                    ${
                      example === ex
                        ? 'border-primary text-primary bg-white'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                    }
                  `}
                    onClick={() => setExample(ex)}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
        </div>

        {/* Padding to prevent content from being hidden behind sticky button */}
        <div className='pb-24'>
          {added && (
            <div className='text-green-500 text-center font-medium'>
              {editing ? 'Saved!' : 'Added!'}
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom button (no longer sticky to keyboard) */}
      <div
        className='fixed left-0 right-0 bg-white border-t border-slate-200 p-4 z-50'
        style={{
          bottom: 'env(safe-area-inset-bottom)',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        <Button
          className='w-full text-base py-3 rounded-xl'
          onClick={handleAddOrEdit}
          disabled={!english || !vietnamese || loading}
        >
          {loading ? 'Loading...' : editing ? 'Save Changes' : 'Add Card'}
        </Button>
      </div>
    </PageContainer>
  );
}
