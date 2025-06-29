import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { FaBook, FaCheckCircle, FaLightbulb } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import type { Card } from '../lib/utils';
import { getAllCards, getStats } from '../lib/utils';
import PageContainer from '@/components/ui/PageContainer';

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
      color: 'text-green-500',
      icon: <FaBook size={24} color='#22c55e' />,
      desc: 'Words you have yet to study.',
    },
    {
      label: 'Known',
      value: stats.known,
      color: 'text-blue-600',
      icon: <FaCheckCircle size={24} color='#2563eb' />,
      desc: 'Short-term memory.',
    },
    {
      label: 'Learned',
      value: stats.learned,
      color: 'text-yellow-400',
      icon: <FaLightbulb size={24} color='#eab308' />,
      desc: 'Long-term memory.',
    },
  ];

  return (
    <PageContainer title='🏠 Duocards'>
      <div className='flex gap-2 justify-between mb-6'>
        {statList.map((s) => (
          <div
            key={s.label}
            className='flex-1 bg-white rounded-xl shadow p-3 flex flex-col items-center min-w-0'
          >
            {s.icon}
            <div className={`text-lg font-semibold ${s.color} my-1`}>
              {s.value}
            </div>
            <div className='text-sm text-slate-900 font-medium'>{s.label}</div>
            <div className='text-xs text-slate-400 mt-0.5 text-center'>
              {s.desc}
            </div>
          </div>
        ))}
      </div>
      <div className='flex flex-col gap-2 w-full'>
        <Button
          className='w-full text-base py-3 rounded-xl'
          onClick={() => navigate('/review')}
        >
          📖 Start Review
        </Button>
        <Button
          variant='outline'
          className='w-full text-base py-3 rounded-xl'
          onClick={() => navigate('/add')}
        >
          📝 Add Card
        </Button>
      </div>
      {/* Card List */}
      <div className='mt-8'>
        <h2 className='text-lg font-bold mb-2 text-left'>All Cards</h2>
        {cards.length === 0 ? (
          <div className='text-slate-400 text-sm text-center'>
            No cards yet.
          </div>
        ) : (
          <ul className='list-none p-0 m-0'>
            {cards.map((card) => (
              <li
                key={card.id}
                className='flex justify-between items-center py-2 border-b border-slate-100 text-base'
              >
                <span className='font-semibold'>{card.english}</span>
                <span
                  className={
                    `text-xs font-medium rounded-lg px-2 py-0.5 ml-2 ` +
                    (card.status === 'to-learn'
                      ? 'text-green-500 bg-green-50'
                      : card.status === 'known'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-yellow-500 bg-yellow-50')
                  }
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
