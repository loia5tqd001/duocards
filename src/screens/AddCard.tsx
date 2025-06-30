import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  addCard as addCardToStorage,
  updateCard,
  getAllCards,
} from '../lib/utils';
import PageContainer from '@/components/ui/PageContainer';
import { FaTimes } from 'react-icons/fa';
import { speak } from '../lib/utils';
import AutoGrowTextarea from '@/components/ui/AutoGrowTextarea';
import VolumeButton from '@/components/ui/VolumeButton';
import { useNavigate, useParams } from 'react-router-dom';

// Info type for Cambridge info
type Info = {
  word: string;
  phonetic: string;
  audio: string;
  examples: string[];
  vietnameseTranslations: string[];
};

export default function AddOrEditCard() {
  const { id } = useParams<{ id?: string }>();
  const [english, setEnglish] = useState('');
  const [vietnamese, setVietnamese] = useState('');
  const [example, setExample] = useState('');
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [editing, setEditing] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const englishInputRef = useRef<HTMLInputElement>(null);
  const vietnameseInputRef = useRef<HTMLInputElement>(null);
  const exampleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [cardLoaded, setCardLoaded] = useState(false);
  const [phonetic, setPhonetic] = useState('');

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
      setCardLoaded(true);
    } else {
      setCardLoaded(true);
    }
  }, [id]);

  // Debounced fetch for Cambridge info and translation (only in add mode)
  useEffect(() => {
    if (!cardLoaded || editing) return;
    if (!english.trim()) {
      setInfo(null);
      setVietnamese('');
      setExample('');
      setPhonetic('');
      setLoading(false);
      return;
    }
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchInfo(english.trim());
    }, 500);
  }, [english, editing, cardLoaded]);

  // Placeholder: fetch Cambridge info and auto-translate
  const fetchInfo = async (word: string) => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(
        `${apiUrl}/api/cambridge/${encodeURIComponent(word)}`
      );
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setInfo({
        word: data.word || word,
        phonetic: data.phonetic,
        audio: '',
        examples: data.examples,
        vietnameseTranslations: data.vietnameseTranslations,
      });
      setPhonetic(data.phonetic || '');
      setVietnamese(data.mainVietnamese || '');
      setExample(data.examples?.[0] || '');
    } catch (e) {
      console.error(e);
      setInfo(null);
      setVietnamese('');
      setPhonetic('');
    }
    setLoading(false);
  };

  const handleEnglishChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEnglish(e.target.value);
    setAdded(false);
  };

  const handleAddOrEdit = () => {
    if (!english || !vietnamese) return;
    if (editing && id) {
      // Update existing card
      const cards = getAllCards();
      const card = cards.find((c) => c.id === id);
      if (card) {
        updateCard({ ...card, english, vietnamese, example });
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
        window.dispatchEvent(new Event('storage'));
        navigate('/');
      }
    } else {
      // Add new card
      addCardToStorage({
        english,
        vietnamese,
        example,
        phonetic: info?.phonetic || '',
      });
      setAdded(true);
      setEnglish('');
      setVietnamese('');
      setExample('');
      setInfo(null);
      setTimeout(() => setAdded(false), 1200);
      window.dispatchEvent(new Event('storage'));
    }
  };

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
              autoFocus
              ref={englishInputRef}
              readOnly={editing}
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
                  setTimeout(() => englishInputRef.current?.focus(), 0);
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
              onChange={(e) => setVietnamese(e.target.value)}
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
                  setTimeout(() => vietnameseInputRef.current?.focus(), 0);
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
              onChange={(e) => setExample(e.target.value)}
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
                  setTimeout(() => exampleTextareaRef.current?.focus(), 0);
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
      
      {/* Sticky bottom button */}
      <div className='fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-safe'>
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
