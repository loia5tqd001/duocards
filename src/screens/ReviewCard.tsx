import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import { getDueCards, scheduleNext, updateCard, speak } from '../lib/utils';
import type { Card } from '../lib/utils';
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
        // On back
        if (e.key === 'ArrowLeft') {
          handleReview(false);
        } else if (e.key === 'ArrowRight') {
          handleReview(true);
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

  const handleFlip = () => {
    // If flipping back to front, do not auto play
    setFlipped((f) => !f);
    setShouldAutoPlay(false);
  };

  const handleReview = (correct: boolean) => {
    if (!card) return;
    const updated = scheduleNext(card, correct);
    updateCard(updated);
    // Move to next card
    const newDueCards = getDueCards();
    setDueCards(newDueCards);
    setCurrentIdx(0);
    setFlipped(false);
    setShouldAutoPlay(true); // Next card should auto play
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
          <ReviewCardFront card={card} onFlip={handleFlip} speak={speak} />
          {/* Back Side */}
          <ReviewCardBack card={card} onFlip={handleFlip} speak={speak} />
        </div>
      </div>
      {/* Action Buttons */}
      <div className='w-full flex gap-3 mb-7'>
        <Button
          className={`flex-1 text-base py-3 rounded-xl hover:bg-red-700 focus:bg-red-700 focus-visible:bg-red-700 flex items-center justify-center ${
            flipped ? '' : 'opacity-50 pointer-events-none'
          }`}
          variant='destructive'
          onClick={() => handleReview(false)}
          disabled={!flipped}
        >
          ⬅️ Incorrect
        </Button>
        <Button
          className={`flex-1 text-base py-3 rounded-xl bg-green-500 text-white border-none hover:bg-green-600 focus:bg-green-600 focus-visible:bg-green-600 flex items-center justify-center ${
            flipped ? '' : 'opacity-50 pointer-events-none'
          }`}
          onClick={() => handleReview(true)}
          disabled={!flipped}
        >
          Correct ➡️
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
