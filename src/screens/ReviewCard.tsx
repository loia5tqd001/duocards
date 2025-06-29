import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  getDueCards,
  scheduleNext,
  updateCard,
  speak,
  clearSessionQueue,
} from '../lib/utils';
import type { Card, CardGrade } from '../lib/utils';
import PageContainer from '@/components/ui/PageContainer';
import VolumeButton from '@/components/ui/VolumeButton';

function ReviewCardFront({
  card,
  onFlip,
  speak,
}: {
  card: Card;
  onFlip: (e: React.MouseEvent) => void;
  speak: (text: string) => void;
}) {
  return (
    <div
      className='absolute w-full h-full top-0 left-0 bg-white rounded-xl shadow flex flex-col items-center justify-center p-6 backface-hidden overflow-y-auto max-h-full'
      style={{ backfaceVisibility: 'hidden' }}
      onClick={onFlip}
    >
      <style>{`.review-card::-webkit-scrollbar { display: none; }`}</style>
      <div className='review-card w-full'>
        <div className='text-2xl font-bold mb-2 text-center tracking-tight'>
          {card.english}
        </div>
        <div className='text-slate-400 text-md mb-2 font-medium flex items-center justify-center'>
          {card.phonetic}
          <VolumeButton
            onClick={() => {
              speak(card.english || '');
            }}
            ariaLabel='Play word audio'
            size={18}
            significant={true}
          />
        </div>
      </div>
    </div>
  );
}

function ReviewCardBack({
  card,
  onFlip,
  speak,
}: {
  card: Card;
  onFlip: (e: React.MouseEvent) => void;
  speak: (text: string) => void;
}) {
  return (
    <div
      className='absolute w-full h-full top-0 left-0 bg-white rounded-xl shadow flex flex-col items-center justify-center p-6 backface-hidden overflow-y-auto max-h-full'
      style={{
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
      }}
      onClick={onFlip}
    >
      <style>{`.review-card::-webkit-scrollbar { display: none; }`}</style>
      <div className='review-card w-full flex flex-col items-center'>
        {/* English word */}
        <div className='text-xl font-bold mb-1 text-center tracking-tight'>
          {card.english}
        </div>
        {/* IPA + speaker */}
        <div className='text-slate-400 text-md mb-2 font-medium flex items-center justify-center'>
          {card.phonetic}
          <VolumeButton
            onClick={() => {
              speak(card.english || '');
            }}
            ariaLabel='Play word audio'
            size={18}
            significant={false}
          />
        </div>
        {/* Vietnamese translation (biggest text) */}
        <div className='text-2xl text-green-600 font-extrabold mb-4 text-center break-words'>
          {card.vietnamese}
        </div>
        {/* Example (if present) */}
        {card.example && (
          <div className='text-base text-slate-700 mb-4 text-center flex items-center justify-center flex-wrap'>
            <span className='mr-2 text-sm text-slate-500'>Example:</span>{' '}
            <div className='flex items-center'>
              {card.example}
              <VolumeButton
                onClick={() => {
                  speak(card.example || '');
                }}
                ariaLabel='Play example audio'
                size={16}
                significant={false}
                className='rounded-lg w-5 h-5 min-w-0'
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReviewCard() {
  const navigate = useNavigate();
  const [flipped, setFlipped] = useState(false);
  const [dueCards, setDueCards] = useState<Card[]>(() => getDueCards());
  const [currentIdx, setCurrentIdx] = useState(0);
  const card = dueCards[currentIdx];

  // Track if we should auto play audio (only when a new card is shown, not when flipping)
  const [shouldAutoPlay, setShouldAutoPlay] = useState(true);
  // Track if flip animation should be enabled
  const [shouldAnimateFlip, setShouldAnimateFlip] = useState(false);

  // Clear session queue when component mounts (new review session)
  useEffect(() => {
    clearSessionQueue();
    // Re-fetch due cards after clearing session
    setDueCards(getDueCards());
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if any modifier key is held
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (!card) return;
      if (!flipped) {
        // On front: any key flips
        setFlipped(true);
        setShouldAutoPlay(false);
      } else {
        // On back - map keys to grades
        if (e.key === '1') {
          handleReview('again');
        } else if (e.key === '2') {
          handleReview('hard');
        } else if (e.key === '3') {
          handleReview('good');
        } else if (e.key === '4') {
          handleReview('easy');
        } else if (e.key === ' ' || e.key === 'Enter') {
          handleReview('good'); // Space/Enter defaults to 'good'
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          setFlipped(false);
          setShouldAutoPlay(false);
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, card]);

  // Helper to format next review time
  function formatNextReview(ts: number) {
    const diff = ts - Date.now();
    if (diff < 60 * 1000) return 'in a few seconds';
    if (diff < 60 * 60 * 1000) return `in ${Math.round(diff / 60000)} min`;
    if (diff < 24 * 60 * 60 * 1000)
      return `in ${Math.round(diff / 3600000)} hr`;
    return `in ${Math.round(diff / (24 * 3600000))} days`;
  }

  // Auto play audio when a new card is shown (not when flipping)
  // Only play when not flipped and shouldAutoPlay is true
  useEffect(() => {
    if (card && !flipped && shouldAutoPlay) {
      speak(card.english || '');
      setShouldAutoPlay(false); // Only play once per card
    }
  }, [card, flipped, shouldAutoPlay]);

  // Re-enable flip animation after card is reset to front
  useEffect(() => {
    if (!flipped) {
      setShouldAnimateFlip(true);
    }
  }, [card, flipped]);

  const handleFlip = () => {
    setFlipped((f) => !f);
    setShouldAutoPlay(false);
    setShouldAnimateFlip(true); // Enable animation when user flips
  };

  const handleReview = (grade: CardGrade) => {
    if (!card) return;
    const updated = scheduleNext(card, grade);
    updateCard(updated);
    // Move to next card
    const newDueCards = getDueCards();
    if (newDueCards.length === 0) {
      // No more cards due
      navigate('/');
    } else {
      setDueCards(newDueCards);
      setCurrentIdx(0);
      setFlipped(false);
      setShouldAutoPlay(true); // Next card should auto play
      setShouldAnimateFlip(false); // Disable animation when moving to next card
    }
  };

  if (!card) {
    return (
      <PageContainer
        title='📖 Review Cards'
        leftButton={
          <Button
            variant='outline'
            size='icon'
            className='rounded-lg w-10 h-10 min-w-0'
            onClick={() => navigate('/')}
            aria-label='Back to Home'
          >
            <span className='text-xl'>🏠</span>
          </Button>
        }
        rightButton={
          <Button
            variant='outline'
            size='icon'
            className='rounded-lg w-10 h-10 min-w-0'
            onClick={() => navigate('/add')}
            aria-label='Add Card'
          >
            <span className='text-xl'>📝</span>
          </Button>
        }
      >
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
      leftButton={
        <Button
          variant='outline'
          size='icon'
          className='rounded-lg w-10 h-10 min-w-0'
          onClick={() => navigate('/')}
          aria-label='Back to Home'
        >
          <span className='text-xl'>🏠</span>
        </Button>
      }
      rightButton={
        <Button
          variant='outline'
          size='icon'
          className='rounded-lg w-10 h-10 min-w-0'
          onClick={() => navigate('/add')}
          aria-label='Add Card'
        >
          <span className='text-xl'>📝</span>
        </Button>
      }
    >
      {/* 3D Flip Card */}
      <div className='w-full flex items-center justify-center mb-8'>
        <div
          className={`w-full relative flex items-center justify-center max-w-full ${
            shouldAnimateFlip ? 'transition-transform duration-400' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'none',
            maxWidth: 360,
            minHeight: 320,
            maxHeight: 420,
          }}
        >
          {/* Front Side */}
          <ReviewCardFront card={card} onFlip={handleFlip} speak={speak} />
          {/* Back Side */}
          <ReviewCardBack card={card} onFlip={handleFlip} speak={speak} />
        </div>
      </div>
      {/* Action Buttons - 4-button system */}
      <div className='w-full flex gap-2 mb-4'>
        <Button
          className={`flex-1 text-sm py-3 rounded-xl hover:bg-red-700 focus:bg-red-700 focus-visible:bg-red-700 flex flex-col items-center justify-center gap-1 ${
            flipped ? '' : 'opacity-50 pointer-events-none'
          }`}
          variant='destructive'
          onClick={() => handleReview('again')}
          disabled={!flipped}
        >
          <span className='text-base'>😕</span>
          <span>Again</span>
          <span className='text-xs opacity-80'>1</span>
        </Button>
        <Button
          className={`flex-1 text-sm py-3 rounded-xl bg-orange-500 text-white border-none hover:bg-orange-600 focus:bg-orange-600 focus-visible:bg-orange-600 flex flex-col items-center justify-center gap-1 ${
            flipped ? '' : 'opacity-50 pointer-events-none'
          }`}
          onClick={() => handleReview('hard')}
          disabled={!flipped}
        >
          <span className='text-base'>😐</span>
          <span>Hard</span>
          <span className='text-xs opacity-80'>2</span>
        </Button>
        <Button
          className={`flex-1 text-sm py-3 rounded-xl bg-blue-500 text-white border-none hover:bg-blue-600 focus:bg-blue-600 focus-visible:bg-blue-600 flex flex-col items-center justify-center gap-1 ${
            flipped ? '' : 'opacity-50 pointer-events-none'
          }`}
          onClick={() => handleReview('good')}
          disabled={!flipped}
        >
          <span className='text-base'>🙂</span>
          <span>Good</span>
          <span className='text-xs opacity-80'>3</span>
        </Button>
        <Button
          className={`flex-1 text-sm py-3 rounded-xl bg-green-500 text-white border-none hover:bg-green-600 focus:bg-green-600 focus-visible:bg-green-600 flex flex-col items-center justify-center gap-1 ${
            flipped ? '' : 'opacity-50 pointer-events-none'
          }`}
          onClick={() => handleReview('easy')}
          disabled={!flipped}
        >
          <span className='text-base'>😊</span>
          <span>Easy</span>
          <span className='text-xs opacity-80'>4</span>
        </Button>
      </div>
      {/* Status and info */}
      <div className='text-xs text-slate-400 text-center space-y-1'>
        <div>
          Status:{' '}
          <span className='text-slate-700 font-medium'>{card.status}</span>
          {card.status === 'learning' && ` (step ${card.stepIndex + 1}/2)`}
          {card.status === 'relearning' && ` (step ${card.stepIndex + 1}/1)`}
        </div>
        <div>
          Next:{' '}
          <span className='text-slate-700 font-medium'>
            {formatNextReview(card.nextReview)}
          </span>
        </div>
        {card.status === 'review' && (
          <div>
            Interval:{' '}
            <span className='text-slate-700 font-medium'>
              {Math.round(card.interval)} days
            </span>{' '}
            • Ease:{' '}
            <span className='text-slate-700 font-medium'>
              {Math.round(card.easeFactor * 100)}%
            </span>
          </div>
        )}
        <div className='text-slate-300 mt-2'>
          {dueCards.length - 1} more cards due
        </div>
      </div>
    </PageContainer>
  );
}
