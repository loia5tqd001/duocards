import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { addCard as addCardToStorage } from '../lib/utils';
import PageContainer from '@/components/ui/PageContainer';

// Info type for Cambridge info
type Info = {
  word: string;
  phonetic: string;
  audio: string;
  partOfSpeech: string;
  definitions: string[];
  examples: string[];
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
        word: data.word,
        phonetic: data.phonetic,
        audio: '', // You can extend the proxy to return audio URLs if needed
        partOfSpeech: data.partOfSpeech,
        definitions: data.definitions,
        examples: data.examples,
      });
      setVietnamese(data.mainVietnamese || '');
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
        <div>
          <label htmlFor='english' className='font-medium text-sm'>
            English
          </label>
          <input
            id='english'
            type='text'
            value={english}
            onChange={handleEnglishChange}
            placeholder='Enter English word'
            className='w-full p-3 rounded-lg border border-slate-200 mt-1 text-base focus:outline-none focus:ring-2 focus:ring-primary'
            autoFocus
          />
        </div>
        <div>
          <label htmlFor='vietnamese' className='font-medium text-sm'>
            Vietnamese
          </label>
          <input
            id='vietnamese'
            type='text'
            value={vietnamese}
            onChange={(e) => setVietnamese(e.target.value)}
            placeholder='Vietnamese translation'
            className='w-full p-3 rounded-lg border border-slate-200 mt-1 text-base focus:outline-none focus:ring-2 focus:ring-primary'
          />
        </div>
        <div>
          <label htmlFor='example' className='font-medium text-sm'>
            Example (optional)
          </label>
          <input
            id='example'
            type='text'
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder='Example sentence (English)'
            className='w-full p-3 rounded-lg border border-slate-200 mt-1 text-base focus:outline-none focus:ring-2 focus:ring-primary'
          />
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
      {/* Cambridge Info Card */}
      {info && (
        <div className='mt-6 bg-white rounded-lg shadow p-4'>
          <div className='font-semibold text-lg mb-1'>
            {info.word}{' '}
            <span className='text-slate-400 text-sm'>{info.phonetic}</span>
          </div>
          <div className='text-blue-600 font-medium text-xs mb-1'>
            {info.partOfSpeech}
          </div>
          <ul className='pl-4 mb-2'>
            {info.definitions.map((d: string, i: number) => (
              <li key={i} className='text-sm mb-1'>
                {d}
              </li>
            ))}
          </ul>
          <div className='text-xs text-slate-500 mb-1'>Examples:</div>
          <ul className='pl-4'>
            {info.examples.map((ex: string, i: number) => (
              <li key={i} className='text-xs text-slate-700 mb-1'>
                {ex}
              </li>
            ))}
          </ul>
        </div>
      )}
    </PageContainer>
  );
}
