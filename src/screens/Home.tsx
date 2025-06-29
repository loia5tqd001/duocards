import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import {
  FaBook,
  FaCheckCircle,
  FaLightbulb,
  FaPlay,
  FaPlus,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import type { Card } from '../lib/utils';
import { getAllCards, getStats } from '../lib/utils';

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
        position: 'relative',
      }}
    >
      {/* Back button handled in App layout */}
      {children}
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(() => getStats());
  const [cards, setCards] = useState<Card[]>(() => getAllCards());

  useEffect(() => {
    const onStorage = () => {
      setStats(getStats());
      setCards(getAllCards());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    setStats(getStats());
    setCards(getAllCards());
  }, []);

  const statList = [
    {
      label: 'To Learn',
      value: stats.toLearn,
      color: '#22c55e',
      icon: <FaBook size={24} color='#22c55e' />,
      desc: 'Words you have yet to study.',
    },
    {
      label: 'Known',
      value: stats.known,
      color: '#2563eb',
      icon: <FaCheckCircle size={24} color='#2563eb' />,
      desc: 'Short-term memory.',
    },
    {
      label: 'Learned',
      value: stats.learned,
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
        📚 Duocards
      </h1>
      <div
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'space-between',
          marginBottom: 32,
        }}
      >
        {statList.map((s) => (
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
      {/* Card List */}
      <div style={{ marginTop: 36 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 10,
            textAlign: 'left',
          }}
        >
          All Cards
        </h2>
        {cards.length === 0 ? (
          <div style={{ color: '#888', fontSize: 15, textAlign: 'center' }}>
            No cards yet.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {cards.map((card) => (
              <li
                key={card.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: 16,
                }}
              >
                <span style={{ fontWeight: 600 }}>{card.english}</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color:
                      card.status === 'to-learn'
                        ? '#22c55e'
                        : card.status === 'known'
                        ? '#2563eb'
                        : '#eab308',
                    background:
                      card.status === 'to-learn'
                        ? '#e7fbe9'
                        : card.status === 'known'
                        ? '#e7f0fb'
                        : '#fdf6e7',
                    borderRadius: 8,
                    padding: '2px 10px',
                    marginLeft: 8,
                  }}
                >
                  {card.status === 'to-learn'
                    ? 'To Learn'
                    : card.status === 'known'
                    ? 'Known'
                    : 'Learned'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}

export default Home;
