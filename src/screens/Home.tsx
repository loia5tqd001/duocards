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
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

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

  const statusMap: Record<string, string> = {
    'To Learn': 'to-learn',
    Known: 'known',
    Learned: 'learned',
  };

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

  const handleFilterClick = (label: string) => {
    const status = statusMap[label];
    setSelectedFilters((prev) =>
      prev.includes(status)
        ? prev.filter((f) => f !== status)
        : [...prev, status]
    );
  };

  // Filter cards based on selected filters, then sort by status order and nextReview
  const statusOrder = ['to-learn', 'known', 'learned'];
  const filteredCards = (
    selectedFilters.length === 0
      ? cards
      : cards.filter((card) => selectedFilters.includes(card.status))
  )
    .slice()
    .sort((a, b) => {
      const statusDiff =
        statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
      if (statusDiff !== 0) return statusDiff;
      return a.nextReview - b.nextReview;
    });

  return (
    <PageContainer title='🏠 Duocards'>
      <div className='flex flex-col gap-2 w-full mb-6'>
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
      <div className='flex gap-2 justify-between'>
        {statList.map((s) => {
          const status = statusMap[s.label];
          const isSelected = selectedFilters.includes(status);
          return (
            <button
              key={s.label}
              type='button'
              onClick={() => handleFilterClick(s.label)}
              className={
                'flex-1 bg-white rounded-xl shadow p-3 flex flex-col items-center min-w-0 transition-all border-2 ' +
                (isSelected ? 'border-blue-500' : 'border-transparent')
              }
              style={{ outline: 'none' }}
            >
              {s.icon}
              <div className={`text-lg font-semibold ${s.color} my-1`}>
                {s.value}
              </div>
              <div className='text-sm text-slate-900 font-medium'>
                {s.label}
              </div>
              <div className='text-xs text-slate-400 mt-0.5 text-center'>
                {s.desc}
              </div>
            </button>
          );
        })}
      </div>

      {/* Card List */}
      <div className='mt-4'>
        {filteredCards.length === 0 ? (
          <div className='text-slate-400 text-sm text-center'>
            No cards yet.
          </div>
        ) : (
          <ul className='list-none p-0 m-0'>
            {filteredCards.map((card) => (
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
