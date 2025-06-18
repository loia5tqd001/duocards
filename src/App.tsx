import './App.css';
import { Button } from '@/components/ui/button';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  FaBook,
  FaCheckCircle,
  FaLightbulb,
  FaPlay,
  FaPlus,
} from 'react-icons/fa';

function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 400,
        margin: '0 auto',
        padding: 20,
        height: '100vh',
        background: '#f8fafc',
      }}
    >
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
          onClick={() => navigate('/review')}
        >
          <FaPlus />
          Add Card
        </Button>
      </div>
    </PageContainer>
  );
}

function AddCard() {
  return (
    <PageContainer>
      <h1>Add Card</h1>
      <p>Form coming soon...</p>
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
