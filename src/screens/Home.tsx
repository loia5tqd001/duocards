import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import {
  FaBook,
  FaCheckCircle,
  FaLightbulb,
  FaTrash,
  FaEdit,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import type { Card } from '../lib/utils';
import { formatTimeUntil } from '../lib/utils';
import PageContainer from '@/components/ui/PageContainer';
import {
  useStats,
  useFilteredCards,
  useCardsActions,
  useCards,
} from '../store/cardsStore';
import { LoginButton } from '@/components/auth/LoginButton';
import { SyncStatus } from '@/components/auth/SyncStatus';

function Home() {
  const navigate = useNavigate();
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Use Zustand selectors
  const stats = useStats();
  const cards = useCards();

  // Memoize selectedFilters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => selectedFilters, [selectedFilters]);
  const filteredCards = useFilteredCards(memoizedFilters);
  const { deleteCard } = useCardsActions();

  const statusMap: Record<string, Card['status']> = {
    New: 'new',
    Learning: 'learning',
    Learned: 'learned',
  };

  const statList = [
    {
      label: 'New',
      value: stats.new,
      color: 'text-blue-500',
      icon: <FaBook size={24} color="#3b82f6" />,
      sublabel: 'Not Started',
    },
    {
      label: 'Learning',
      value: stats.learning,
      color: 'text-yellow-500',
      icon: <FaLightbulb size={24} color="#eab308" />,
      sublabel: 'In Progress',
    },
    {
      label: 'Learned',
      value: stats.learned,
      color: 'text-green-500',
      icon: <FaCheckCircle size={24} color="#22c55e" />,
      sublabel: 'Completed',
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

  // filteredCards is already computed by the selector

  // Display label for card status
  const getStatusLabel = (status: Card['status']) => {
    switch (status) {
      case 'new':
        return 'New';
      case 'learning':
        return 'Learning';
      case 'learned':
        return 'Learned';
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
      case 'learned':
        return 'text-green-500 bg-green-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <PageContainer
      title="🏠 Vocards"
      leftButton={<SyncStatus />}
      rightButton={<LoginButton />}
    >
      <div className="grid grid-cols-3 gap-3 w-full mb-4">
        {statList.map((s) => {
          const status = statusMap[s.label];
          const isSelected = selectedFilters.includes(status);
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => handleFilterClick(s.label)}
              className={
                'flex flex-col items-center justify-center bg-white rounded-lg shadow p-3 transition-all border-2 min-w-0 w-full gap-2' +
                (isSelected ? ' border-blue-500' : ' border-transparent')
              }
              style={{ outline: 'none' }}
            >
              <div className={`text-xl font-bold leading-none ${s.color}`}>
                {s.value}
              </div>
              <div className={`text-sm font-medium leading-none ${s.color}`}>
                {s.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Card List */}
      <div className="pb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {filteredCards.length}
            {filteredCards.length === cards.length
              ? ' Cards'
              : ` of ${cards.length} Cards`}
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="text-sm py-2 px-3 rounded-lg"
            onClick={() => navigate('/add')}
          >
            📝 Add Card
          </Button>
        </div>

        {filteredCards.length === 0 ? (
          <div className="text-slate-400 text-sm text-center">
            {selectedFilters.length > 0
              ? 'No cards match the selected filters.'
              : 'No cards yet.'}
          </div>
        ) : (
          <ul className="list-none p-0 m-0">
            {filteredCards.map((card) => (
              <li
                key={card.id}
                className="flex justify-between items-center py-2 border-b border-slate-100 text-base"
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{card.english}</span>
                  {card.nextReview > Date.now() ? (
                    <span className="text-xs text-slate-400 mt-0.5">
                      {formatTimeUntil(card.nextReview)}
                    </span>
                  ) : (
                    <span className="text-xs text-green-500 font-semibold mt-0.5">
                      Ready to review!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      `text-xs font-medium rounded-lg px-2 py-0.5 ml-2 ` +
                      getStatusColor(card.status)
                    }
                  >
                    {getStatusLabel(card.status)}
                  </span>
                  <button
                    className="ml-2 text-slate-400 hover:text-blue-500 p-1 rounded"
                    title="Edit Card"
                    onClick={() => navigate(`/edit/${card.id}`)}
                  >
                    <FaEdit size={16} />
                  </button>
                  <button
                    className="ml-1 text-slate-400 hover:text-red-500 p-1 rounded"
                    title="Delete Card"
                    onClick={() => {
                      if (window.confirm('Delete this card?')) {
                        deleteCard(card.id);
                      }
                    }}
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Sticky bottom button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 sticky-bottom-bar">
        <div className="w-full max-w-sm mx-auto p-4">
          <Button
            className="w-full text-base py-3 rounded-xl"
            onClick={() => navigate('/review')}
          >
            📖 Start Review ({stats.due} due)
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

export default Home;
