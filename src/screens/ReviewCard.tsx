import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FaVolumeUp, FaSyncAlt, FaPlus } from 'react-icons/fa';
import { getDueCards, scheduleNext, updateCard, speak } from '../lib/utils';
import type { Card } from '../lib/utils';
import PageContainer from '@/components/ui/PageContainer';

export default function ReviewCard() {
  const navigate = useNavigate();
  const [flipped, setFlipped] = useState(false);
  const [dueCards, setDueCards] = useState<Card[]>(() => getDueCards());
  const [currentIdx, setCurrentIdx] = useState(0);
  const card = dueCards[currentIdx];

  // Helper to format next review time
  function formatNextReview(ts: number) {
    const diff = ts - Date.now();
    if (diff < 60 * 1000) return 'in a few seconds';
    if (diff < 60 * 60 * 1000) return `in ${Math.round(diff / 60000)} min`;
    if (diff < 24 * 60 * 60 * 1000)
      return `in ${Math.round(diff / 3600000)} hr`;
    return `in ${Math.round(diff / (24 * 3600000))} days`;
  }

  const handleFlip = () => setFlipped((f) => !f);

  const handleReview = (correct: boolean) => {
    if (!card) return;
    const updated = scheduleNext(card, correct);
    updateCard(updated);
    // Move to next card
    const newDueCards = getDueCards();
    setDueCards(newDueCards);
    setCurrentIdx(0);
    setFlipped(false);
  };

  if (!card) {
    return (
      <PageContainer title='📖 Review Cards' showBack={true}>
        <div className='flex flex-col items-center justify-center flex-1'>
          <div className='text-xl font-semibold text-slate-400 mb-4'>
            No cards to review right now!
          </div>
          <Button
            onClick={() => navigate('/add')}
            className='text-base rounded-xl py-3 px-8'
          >
            Add Card
          </Button>
          <Button
            variant='outline'
            onClick={() => navigate('/')}
            className='text-base rounded-xl py-3 px-8 mt-3'
          >
            Back to Home
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title='📖 Review Cards'
      showBack={true}
      rightButton={
        <Button
          variant='outline'
          size='icon'
          className='rounded-lg w-10 h-10 min-w-0'
          onClick={() => navigate('/add')}
          aria-label='Add Card'
        >
          <FaPlus size={20} />
        </Button>
      }
    >
      {/* 3D Flip Card */}
      <div className='w-full flex items-center justify-center mb-8'>
        <div
          className='w-full relative flex items-center justify-center transition-transform duration-400 max-w-full'
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'none',
            maxWidth: 360,
            minHeight: 320,
            maxHeight: 420,
          }}
        >
          {/* Front Side */}
          <div
            className='absolute w-full h-full top-0 left-0 bg-white rounded-xl shadow flex flex-col items-center justify-center p-6 backface-hidden overflow-y-auto max-h-full'
            style={{ backfaceVisibility: 'hidden' }}
          >
            <style>{`.review-card::-webkit-scrollbar { display: none; }`}</style>
            <div className='review-card w-full'>
              <div className='text-2xl font-bold mb-2 text-center tracking-tight'>
                {card.english}
              </div>
              <div className='text-slate-400 text-lg mb-2 font-medium'>
                {card.phonetic}
              </div>
              <div className='text-blue-600 font-semibold text-base mb-4'>
                {card.partOfSpeech}
              </div>
              <div className='flex gap-4 mb-2 justify-center'>
                <Button
                  variant='secondary'
                  size='icon'
                  className='rounded-lg w-10 h-10 min-w-0'
                  onClick={() => speak(card.english || '')}
                  aria-label='Play word audio'
                >
                  <FaVolumeUp size={20} />
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  className='rounded-lg w-10 h-10 min-w-0'
                  onClick={handleFlip}
                  aria-label='Flip card'
                >
                  <FaSyncAlt size={20} />
                </Button>
              </div>
            </div>
          </div>
          {/* Back Side */}
          <div
            className='absolute w-full h-full top-0 left-0 bg-white rounded-xl shadow flex flex-col items-center justify-center p-6 backface-hidden overflow-y-auto max-h-full'
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <style>{`.review-card::-webkit-scrollbar { display: none; }`}</style>
            <div className='review-card w-full'>
              <div className='text-lg text-green-500 font-semibold mb-2 text-center'>
                {card.vietnamese}
              </div>
              <div className='text-base font-semibold mb-2 text-center'>
                {card.definition}
              </div>
              <div className='text-sm text-slate-700 mb-3 text-center flex items-center justify-center flex-wrap'>
                <span className='mr-2'>Example:</span> {card.example}
                <Button
                  variant='ghost'
                  size='icon'
                  className='ml-2 rounded-lg w-8 h-8 min-w-0'
                  onClick={() => speak(card.example || '')}
                  aria-label='Play example audio'
                >
                  <FaVolumeUp size={16} />
                </Button>
              </div>
              <Button
                variant='outline'
                size='icon'
                className='rounded-lg w-10 h-10 min-w-0 mt-2'
                onClick={handleFlip}
                aria-label='Flip card back'
              >
                <FaSyncAlt size={20} />
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className='w-full flex gap-3 mb-7'>
        <Button
          className={`flex-1 text-base py-3 rounded-xl ${
            flipped ? '' : 'opacity-50 pointer-events-none'
          }`}
          variant='destructive'
          onClick={() => handleReview(false)}
          disabled={!flipped}
        >
          Incorrect
        </Button>
        <Button
          className={`flex-1 text-base py-3 rounded-xl bg-green-500 text-white border-none ${
            flipped ? '' : 'opacity-50 pointer-events-none'
          }`}
          onClick={() => handleReview(true)}
          disabled={!flipped}
        >
          Correct
        </Button>
      </div>
      {/* Status */}
      <div className='text-sm text-slate-400 mb-1 text-center font-medium'>
        Status:{' '}
        <span className='text-slate-900 font-bold'>
          {card.status.replace('-', ' ')}
        </span>
      </div>
      <div className='text-sm text-slate-400 text-center font-medium'>
        Next review:{' '}
        <span className='text-slate-900 font-bold'>
          {formatNextReview(card.nextReview)}
        </span>
      </div>
    </PageContainer>
  );
}
