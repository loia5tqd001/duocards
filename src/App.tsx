import './App.css';
import { Button } from '@/components/ui/button';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBook,
  FaCheckCircle,
  FaLightbulb,
  FaPlay,
  FaPlus,
} from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';

type Info = {
  word: string;
  phonetic: string;
  audio: string;
  partOfSpeech: string;
  definitions: string[];
  examples: string[];
};

function PageContainer({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 400,
        margin: '0 auto',
        padding: 20,
        height: '100vh',
        background: '#f8fafc',
        position: 'relative',
      }}
    >
      {!isHome && (
        <Button
          variant='outline'
          size='icon'
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 10,
            borderRadius: 8,
            width: 40,
            height: 40,
            padding: 0,
            minWidth: 0,
          }}
          onClick={() => navigate('/')}
          aria-label='Back to Home'
        >
          <FaArrowLeft size={20} />
        </Button>
      )}
      {children}
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  // Placeholder stats
  const stats = [
    {
      label: 'To Learn',
      value: 1,
      color: '#22c55e',
      icon: <FaBook size={24} color='#22c55e' />,
      desc: 'Words you have yet to study.',
    },
    {
      label: 'Known',
      value: 0,
      color: '#2563eb',
      icon: <FaCheckCircle size={24} color='#2563eb' />,
      desc: 'Short-term memory.',
    },
    {
      label: 'Learned',
      value: 0,
      color: '#eab308',
      icon: <FaLightbulb size={24} color='#eab308' />,
      desc: 'Long-term memory.',
    },
  ];

  return (
    <PageContainer>
      <h1
        style={{
          fontWeight: 700,
          fontSize: 28,
          marginBottom: 28,
          textAlign: 'center',
          letterSpacing: -1,
        }}
      >
        Duocards
      </h1>
      <div
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'space-between',
          marginBottom: 32,
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 1px 4px #0001',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 0,
            }}
          >
            {s.icon}
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: s.color,
                margin: '8px 0 2px',
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: 14, color: '#222', fontWeight: 500 }}>
              {s.label}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#888',
                marginTop: 2,
                textAlign: 'center',
              }}
            >
              {s.desc}
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexDirection: 'column',
          width: '100%',
        }}
      >
        <Button
          style={{
            width: '100%',
            fontSize: 18,
            padding: '14px 0',
            borderRadius: 24,
          }}
          onClick={() => navigate('/review')}
        >
          <FaPlay />
          Start Review
        </Button>
        <Button
          variant='outline'
          style={{
            width: '100%',
            fontSize: 18,
            padding: '14px 0',
            borderRadius: 24,
          }}
          onClick={() => navigate('/add')}
        >
          <FaPlus />
          Add Card
        </Button>
      </div>
    </PageContainer>
  );
}

function AddCard() {
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
    // TODO: Integrate Cambridge API and translation
    setTimeout(() => {
      setInfo({
        word,
        phonetic: '/ˈkɒm.prə.maɪz/',
        audio: '',
        partOfSpeech: 'noun, verb',
        definitions: [
          'a settlement of differences in which each side gives up something it has previously demanded',
          'to accept less than you originally wanted in order to reach an agreement',
        ],
        examples: [
          'We argued for a long time but finally arrived at a compromise.',
          'The union is prepared to compromise with the management on the pay issue.',
        ],
      });
      setVietnamese('thỏa hiệp'); // Placeholder translation
      setLoading(false);
    }, 800);
  };

  const handleEnglishChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEnglish(e.target.value);
    setAdded(false);
  };

  const handleAdd = () => {
    // TODO: Save card to local storage or backend
    setAdded(true);
    setEnglish('');
    setVietnamese('');
    setExample('');
    setInfo(null);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <PageContainer>
      <h1 style={{ fontWeight: 700, fontSize: 22, marginBottom: 18 }}>
        Add New Card
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label htmlFor='english' style={{ fontWeight: 500, fontSize: 15 }}>
            English
          </label>
          <input
            id='english'
            type='text'
            value={english}
            onChange={handleEnglishChange}
            placeholder='Enter English word'
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              marginTop: 4,
              fontSize: 16,
            }}
            autoFocus
          />
        </div>
        <div>
          <label htmlFor='vietnamese' style={{ fontWeight: 500, fontSize: 15 }}>
            Vietnamese
          </label>
          <input
            id='vietnamese'
            type='text'
            value={vietnamese}
            onChange={(e) => setVietnamese(e.target.value)}
            placeholder='Vietnamese translation'
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              marginTop: 4,
              fontSize: 16,
            }}
          />
        </div>
        <div>
          <label htmlFor='example' style={{ fontWeight: 500, fontSize: 15 }}>
            Example (optional)
          </label>
          <input
            id='example'
            type='text'
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder='Example sentence (English)'
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              marginTop: 4,
              fontSize: 16,
            }}
          />
        </div>
        <Button
          style={{
            width: '100%',
            fontSize: 17,
            padding: '13px 0',
            borderRadius: 16,
            marginTop: 8,
          }}
          onClick={handleAdd}
          disabled={!english || !vietnamese || loading}
        >
          {loading ? 'Loading...' : 'Add Card'}
        </Button>
        {added && (
          <div
            style={{ color: '#22c55e', textAlign: 'center', fontWeight: 500 }}
          >
            Added!
          </div>
        )}
      </div>
      {/* Cambridge Info Card */}
      {info && (
        <div
          style={{
            marginTop: 28,
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 1px 4px #0001',
            padding: 18,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>
            {info.word}{' '}
            <span style={{ color: '#888', fontSize: 15 }}>{info.phonetic}</span>
          </div>
          <div
            style={{
              color: '#2563eb',
              fontWeight: 500,
              fontSize: 14,
              marginBottom: 6,
            }}
          >
            {info.partOfSpeech}
          </div>
          <ul style={{ paddingLeft: 18, marginBottom: 8 }}>
            {info.definitions.map((d: string, i: number) => (
              <li key={i} style={{ fontSize: 15, marginBottom: 2 }}>
                {d}
              </li>
            ))}
          </ul>
          <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
            Examples:
          </div>
          <ul style={{ paddingLeft: 18 }}>
            {info.examples.map((ex: string, i: number) => (
              <li
                key={i}
                style={{ fontSize: 14, color: '#444', marginBottom: 2 }}
              >
                {ex}
              </li>
            ))}
          </ul>
        </div>
      )}
    </PageContainer>
  );
}

function ReviewCard() {
  return (
    <PageContainer>
      <h1>Review Card</h1>
      <p>Review UI coming soon...</p>
    </PageContainer>
  );
}

function App() {
  return (
    <Routes>
      <Route path='/' element={<Home />} />
      <Route path='/add' element={<AddCard />} />
      <Route path='/review' element={<ReviewCard />} />
    </Routes>
  );
}

export default App;
