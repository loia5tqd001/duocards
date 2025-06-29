import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { addCard as addCardToStorage } from '../lib/utils';
import PageContainer from '@/components/ui/PageContainer';
import { FaVolumeUp, FaTimes } from 'react-icons/fa';
import { speak } from '../lib/utils';
import AutoGrowTextarea from '@/components/ui/AutoGrowTextarea';

// Info type for Cambridge info
type Info = {
  word: string;
  phonetic: string;
  audio: string;
  partOfSpeech: string;
  definitions: string[];
  examples: string[];
  vietnameseTranslations: string[];
};

export default function AddCard() {
  const [english, setEnglish] = useState('');
  const [vietnamese, setVietnamese] = useState('');
  const [example, setExample] = useState('');
  const [info, setInfo] = useState<Info | null>(null); // Placeholder for Cambridge info
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced fetch for Cambridge info and translation
  useEffect(() => {
    if (!english.trim()) {
      setInfo(null);
      setVietnamese('');
      setLoading(false);
      return;
    }
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchInfo(english.trim());
    }, 500);
  }, [english]);

  // Placeholder: fetch Cambridge info and auto-translate
  const fetchInfo = async (word: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3001/api/cambridge/${encodeURIComponent(word)}`
      );
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setInfo({
        word: data.word || word,
        phonetic: data.phonetic,
        audio: '', // You can extend the proxy to return audio URLs if needed
        partOfSpeech: data.partOfSpeech,
        definitions: data.definitions,
        examples: data.examples,
        vietnameseTranslations: data.vietnameseTranslations,
      });
      setVietnamese(data.mainVietnamese || '');
      setExample(data.examples?.[0] || '');
    } catch (e) {
      console.error(e);
      setInfo(null);
      setVietnamese('');
    }
    setLoading(false);
  };

  const handleEnglishChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEnglish(e.target.value);
    setAdded(false);
  };

  const handleAdd = () => {
    if (!english || !vietnamese) return;
    addCardToStorage({
      english,
      vietnamese,
      example,
      definition: info?.definitions?.[0] || '',
      phonetic: info?.phonetic || '',
      partOfSpeech: info?.partOfSpeech || '',
    });
    setAdded(true);
    setEnglish('');
    setVietnamese('');
    setExample('');
    setInfo(null);
    setTimeout(() => setAdded(false), 1200);
    window.dispatchEvent(new Event('storage')); // trigger Home stats update
  };

  return (
    <PageContainer title='📝 Add New Card' showBack={true}>
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
            />
            {english && (
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute right-2 inset-y-0 my-auto w-6 h-6 p-0 text-slate-300 hover:text-slate-500'
                onClick={() => {
                  setEnglish('');
                  setInfo(null);
                  setAdded(false);
                }}
                aria-label='Clear English input'
                title='Clear English input'
                tabIndex={-1}
              >
                <FaTimes size={14} />
              </Button>
            )}
          </div>
          {info && (
            <div className='font-semibold text-lg mb-1 mt-1 flex items-center gap-2'>
              <span className='text-slate-400 text-sm'>{info.phonetic}</span>
              <button
                className='inline-flex items-center justify-center text-blue-500 hover:text-blue-700 focus:outline-none'
                onClick={() => speak(info.word)}
                aria-label='Play word audio'
                type='button'
              >
                <FaVolumeUp size={18} />
              </button>
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
            />
            {vietnamese && (
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute right-2 inset-y-0 my-auto w-6 h-6 p-0 text-slate-300 hover:text-slate-500'
                onClick={() => setVietnamese('')}
                aria-label='Clear Vietnamese input'
                title='Clear Vietnamese input'
                tabIndex={-1}
              >
                <FaTimes size={14} />
              </Button>
            )}
          </div>
          {/* Chips for Vietnamese translation suggestions */}
          {info &&
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
            />
            {example && (
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute right-2 inset-y-0 my-auto w-6 h-6 p-0 text-slate-300 hover:text-slate-500'
                onClick={() => setExample('')}
                aria-label='Clear Example input'
                title='Clear Example input'
                tabIndex={-1}
              >
                <FaTimes size={14} />
              </Button>
            )}
          </div>
          {/* Chips for example suggestions */}
          {info && Array.isArray(info.examples) && info.examples.length > 0 && (
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
        <Button
          className='w-full text-base py-3 rounded-xl mt-2'
          onClick={handleAdd}
          disabled={!english || !vietnamese || loading}
        >
          {loading ? 'Loading...' : 'Add Card'}
        </Button>
        {added && (
          <div className='text-green-500 text-center font-medium'>Added!</div>
        )}
      </div>
    </PageContainer>
  );
}
