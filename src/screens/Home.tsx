import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { FaBook, FaCheckCircle, FaLightbulb, FaRedo } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import type { Card } from '../lib/utils';
import { getAllCards, getStats, formatTimeUntil } from '../lib/utils';
import PageContainer from '@/components/ui/PageContainer';
import React from 'react';

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

  const statusMap: Record<string, Card['status']> = {
    New: 'new',
    Learning: 'learning',
    Review: 'review',
    Relearning: 'relearning',
  };

  const statList = [
    {
      label: 'New',
      value: stats.new,
      color: 'text-blue-500',
      icon: <FaBook size={24} color='#3b82f6' />,
      sublabel: 'Not Studied',
    },
    {
      label: 'Learning',
      value: stats.learning,
      color: 'text-yellow-500',
      icon: <FaLightbulb size={24} color='#eab308' />,
      sublabel: 'Memorizing',
    },
    {
      label: 'Review',
      value: stats.review,
      color: 'text-green-500',
      icon: <FaCheckCircle size={24} color='#22c55e' />,
      sublabel: 'Learned',
    },
    {
      label: 'Relearning',
      value: stats.relearning,
      color: 'text-red-500',
      icon: <FaRedo size={24} color='#ef4444' />,
      sublabel: 'Forgotten',
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
  const statusOrder: Card['status'][] = [
    'learning',
    'relearning',
    'new',
    'review',
  ];
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

  // Display label for card status
  const getStatusLabel = (status: Card['status']) => {
    switch (status) {
      case 'new':
        return 'New';
      case 'learning':
        return 'Learning';
      case 'review':
        return 'Review';
      case 'relearning':
        return 'Relearning';
      default:
        return status;
    }
  };

  // Display color for card status
  const getStatusColor = (status: Card['status']) => {
    switch (status) {
      case 'new':
        return 'text-blue-500 bg-blue-50';
      case 'learning':
        return 'text-yellow-500 bg-yellow-50';
      case 'review':
        return 'text-green-500 bg-green-50';
      case 'relearning':
        return 'text-red-500 bg-red-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <PageContainer title='🏠 Duocards'>
      <div className='flex flex-col gap-2 w-full mb-6'>
        <Button
          className='w-full text-base py-3 rounded-xl'
          onClick={() => navigate('/review')}
        >
          📖 Start Review ({stats.due} due)
        </Button>
        <Button
          variant='outline'
          className='w-full text-base py-3 rounded-xl'
          onClick={() => navigate('/add')}
        >
          📝 Add Card
        </Button>
      </div>
      <div className='grid grid-cols-4 gap-2 w-full mb-4'>
        {statList.map((s) => {
          const status = statusMap[s.label];
          const isSelected = selectedFilters.includes(status);
          return (
            <button
              key={s.label}
              type='button'
              onClick={() => handleFilterClick(s.label)}
              className={
                'flex flex-col items-center justify-center bg-white rounded-lg shadow p-1 transition-all border-2 min-w-0 w-full gap-1' +
                (isSelected ? ' border-blue-500' : ' border-transparent')
              }
              style={{ outline: 'none' }}
            >
              <div className='text-base font-semibold text-slate-900 leading-none'>
                {s.value}
              </div>
              <div className={`text-xs font-medium leading-none ${s.color}`}>
                {s.label}
              </div>
              <div className='text-[10px] text-slate-400 leading-none'>
                {s.sublabel}
              </div>
            </button>
          );
        })}
      </div>

      {/* Card List */}
      <div>
        {filteredCards.length === 0 ? (
          <div className='text-slate-400 text-sm text-center'>
            {selectedFilters.length > 0
              ? 'No cards match the selected filters.'
              : 'No cards yet.'}
          </div>
        ) : (
          <ul className='list-none p-0 m-0'>
            {filteredCards.map((card) => (
              <li
                key={card.id}
                className='flex justify-between items-center py-2 border-b border-slate-100 text-base'
              >
                <div className='flex flex-col'>
                  <span className='font-semibold'>{card.english}</span>
                  {card.nextReview > Date.now() ? (
                    <span className='text-xs text-slate-400 mt-0.5'>
                      {formatTimeUntil(card.nextReview)}
                    </span>
                  ) : (
                    <span className='text-xs text-green-600 font-semibold mt-0.5'>
                      Ready to review!
                    </span>
                  )}
                </div>
                <span
                  className={
                    `text-xs font-medium rounded-lg px-2 py-0.5 ml-2 ` +
                    getStatusColor(card.status)
                  }
                >
                  {getStatusLabel(card.status)}
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
