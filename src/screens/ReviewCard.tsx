import { useState, useEffect, useRef } from 'react';
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
import {
  FaEdit,
  FaArrowLeft,
  FaArrowRight,
  FaRegHandPointer,
} from 'react-icons/fa';

const HINT_APPEAR_THRESHOLD = 50;

function CardFrontContent({
  card,
  speak,
}: {
  card: Card;
  speak: (text: string) => void;
}) {
  return (
    <div className='review-card w-full'>
      <div className='text-2xl font-bold mb-2 text-center tracking-tight'>
        {card.english}
      </div>
      <div className='text-slate-400 text-md mb-2 font-medium flex items-center justify-center'>
        {card.phonetic}
        <VolumeButton
          onClick={(e) => {
            e.stopPropagation();
            speak(card.english || '');
          }}
          ariaLabel='Play word audio'
          size={18}
          significant={true}
        />
      </div>
    </div>
  );
}

function ReviewCardFront({
  card,
  onFlip,
  speak,
  showHint = true,
}: {
  card: Card;
  onFlip: (e: React.MouseEvent) => void;
  speak: (text: string) => void;
  showHint?: boolean;
}) {
  return (
    <div
      className='absolute w-full h-full top-0 left-0 bg-white rounded-xl flex flex-col items-center justify-center p-6 backface-hidden overflow-y-auto max-h-full shadow-lg'
      style={{ backfaceVisibility: 'hidden' }}
      onClick={onFlip}
    >
      <style>{`.review-card::-webkit-scrollbar { display: none; }`}</style>
      <CardFrontContent card={card} speak={speak} />
      {/* Tap to reveal hint */}
      {showHint && (
        <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none'>
          <FaRegHandPointer
            className='text-slate-300 mb-1 animate-bounce'
            size={20}
          />
          <span className='text-xs text-slate-400 font-medium'>
            Tap to reveal
          </span>
        </div>
      )}
    </div>
  );
}

function ReviewCardBack({
  card,
  speak,
  onEdit,
}: {
  card: Card;
  speak: (text: string) => void;
  onEdit: () => void;
}) {
  return (
    <div
      className='absolute w-full h-full top-0 left-0 bg-white rounded-xl flex flex-col items-center justify-center p-6 backface-hidden overflow-y-auto max-h-full shadow-lg'
      style={{
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
      }}
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
            onClick={(e) => {
              e.stopPropagation();
              speak(card.english || '');
            }}
            ariaLabel='Play word audio'
            size={18}
            significant={true}
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
        {/* Edit button */}
        <Button
          variant='outline'
          size='sm'
          className='flex items-center gap-1 mt-2'
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <FaEdit size={14} /> Edit
        </Button>
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

  // Swipe state
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);

  // Store the next card to show during animation, so it doesn't shift to the next-next card
  const [pendingNextCard, setPendingNextCard] = useState<Card | null>(null);
  const nextCard = pendingNextCard || dueCards[currentIdx + 1] || dueCards[0];

  // Animation states
  const [isDismissing, setIsDismissing] = useState(false);
  const [dismissDirection, setDismissDirection] = useState<
    'left' | 'right' | null
  >(null);
  const [showNextCard, setShowNextCard] = useState(false);

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
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || isDismissing)
        return;
      if (!card) return;
      if (!flipped) {
        // On front: any key flips
        setFlipped(true);
        setShouldAutoPlay(false);
      } else {
        // On back - arrow keys for grading
        if (e.key === 'ArrowLeft') {
          handleReview('incorrect');
        } else if (e.key === 'ArrowRight') {
          handleReview('correct');
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipped, card, isDismissing]);

  // Auto play audio when a new card is shown (not when flipping)
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
    if (isDragging || isDismissing) return; // Don't flip while dragging or during dismissal
    if (!flipped) {
      setFlipped(true);
      setShouldAutoPlay(false);
      setShouldAnimateFlip(true); // Enable animation when user flips
    }
  };

  const handleReview = (grade: CardGrade) => {
    if (!card || isDismissing) return;
    // Start dismissal animation
    setIsDismissing(true);
    setDismissDirection(grade === 'correct' ? 'right' : 'left');
    // Store the next card before updating dueCards
    const newDueCardsPreview = getDueCards();
    const nextCardToShow =
      newDueCardsPreview[1] || newDueCardsPreview[0] || null;
    setPendingNextCard(nextCardToShow);
    setShowNextCard(true);

    // Update the card in storage
    const updated = scheduleNext(card, grade);
    updateCard(updated);

    // Update due cards and UI immediately for buttons/count
    const newDueCards = getDueCards();
    if (newDueCards.length === 0) {
      // No more cards due, but delay navigation for animation
      setDueCards([]);
      setCurrentIdx(0);
      setTimeout(() => {
        setIsDismissing(false);
        setDismissDirection(null);
        setShowNextCard(false);
        setPendingNextCard(null);
      }, 600);
    } else {
      setDueCards(newDueCards);
      setCurrentIdx(0);
      setFlipped(false);
      setShouldAutoPlay(true);
      setShouldAnimateFlip(false);
      setDragX(0);
      setOpacity(1);
      setIsDragging(false);
      // Only delay the animation reset
      setTimeout(() => {
        setIsDismissing(false);
        setDismissDirection(null);
        setShowNextCard(false);
        setPendingNextCard(null);
      }, 600);
    }
  };

  // Touch handlers for swipe gestures
  const handleStart = (clientX: number) => {
    if (!flipped || isDismissing) return; // Only allow swipes when card is flipped and not dismissing
    setIsDragging(true);
    startX.current = clientX - dragX;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !flipped || isDismissing) return;

    currentX.current = clientX - startX.current;
    setDragX(currentX.current);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = HINT_APPEAR_THRESHOLD;

    if (Math.abs(dragX) > threshold) {
      // Immediately process the swipe - no animation delay
      if (dragX > 0) {
        handleReview('correct');
      } else {
        handleReview('incorrect');
      }
    } else {
      // Spring back to center
      setDragX(0);
      setOpacity(1);
    }
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Mouse event handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleEnd();
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
            Add Card 📝
          </Button>
          <Button
            variant='outline'
            onClick={() => navigate('/')}
            className='text-base rounded-xl py-3 px-8 mt-3'
          >
            Back to Home 🏠
          </Button>
        </div>
      </PageContainer>
    );
  }

  // Calculate rotation based on drag
  const rotation = dragX / 10; // Subtle rotation effect
  const showIncorrectHint =
    dragX < -HINT_APPEAR_THRESHOLD && flipped && !isDismissing;
  const showCorrectHint =
    dragX > HINT_APPEAR_THRESHOLD && flipped && !isDismissing;

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
      className={'overflow-hidden'}
    >
      <style>{`
        @keyframes throwLeft {
          0% {
            transform: translateX(0) translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateX(-150%) translateY(-30%) rotate(-25deg) scale(0.9);
            opacity: 0.8;
          }
          100% {
            transform: translateX(-200%) translateY(100%) rotate(-30deg) scale(0.7);
            opacity: 0;
          }
        }
        @keyframes throwRight {
          0% {
            transform: translateX(0) translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateX(150%) translateY(-30%) rotate(25deg) scale(0.9);
            opacity: 0.8;
          }
          100% {
            transform: translateX(200%) translateY(100%) rotate(30deg) scale(0.7);
            opacity: 0;
          }
        }
        @keyframes slideUp {
          0% {
            transform: translateY(0) scale(0.95);
            opacity: 0.5;
            z-index: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
            z-index: 1;
          }
        }
        .throw-left {
          animation: throwLeft 0.6s ease-out forwards;
        }
        .throw-right {
          animation: throwRight 0.6s ease-out forwards;
        }
        .slide-up {
          animation: slideUp 0.6s ease-out forwards;
        }
        .card-shadow {
          box-shadow: 
            0 20px 25px -5px rgb(0 0 0 / 0.15),
            0 10px 10px -5px rgb(0 0 0 / 0.1),
            0 0 0 1px rgb(0 0 0 / 0.05);
        }
        .deck-card-1 {
          box-shadow: 
            0 15px 20px -5px rgb(0 0 0 / 0.08),
            0 8px 8px -5px rgb(0 0 0 / 0.06);
        }
        .deck-card-2 {
          box-shadow: 
            0 10px 15px -5px rgb(0 0 0 / 0.05),
            0 5px 5px -5px rgb(0 0 0 / 0.03);
        }
      `}</style>
      {/* Swipe hints */}
      <div className='relative w-full flex items-center justify-center mb-4'>
        {/* Incorrect hint (left) */}
        <div
          className={`absolute left-4 top-1/2 -translate-y-1/2 transition-opacity duration-200 pointer-events-none z-10 ${
            showIncorrectHint ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className='bg-red-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg'>
            Didn't get it!
          </div>
        </div>

        {/* Correct hint (right) */}
        <div
          className={`absolute right-4 top-1/2 -translate-y-1/2 transition-opacity duration-200 pointer-events-none z-10 ${
            showCorrectHint ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className='bg-green-500 text-white px-4 py-2 rounded-lg font-semibold shadow-lg'>
            Got it!
          </div>
        </div>

        {/* Card Container */}
        <div
          className='relative'
          style={{
            maxWidth: 360,
            width: '100%',
            minHeight: '70dvh',
            maxHeight: '80dvh',
          }}
        >
          {/* Deck effect - background cards */}
          {dueCards.length > 1 && !(shouldAnimateFlip && !isDragging) && (
            <>
              {/* Third card (deepest) */}
              <div
                className='absolute w-full bg-white rounded-xl deck-card-2'
                style={{
                  minHeight: '70dvh',
                  maxHeight: '80dvh',
                  transform: 'translateY(8px) scale(0.96)',
                  zIndex: -2,
                }}
              />
              {/* Second card (middle) */}
              <div
                className='absolute w-full bg-white rounded-xl deck-card-1 flex flex-col items-center justify-center p-6'
                style={{
                  minHeight: '70dvh',
                  maxHeight: '80dvh',
                  transform: 'translateY(4px) scale(0.98)',
                  zIndex: -1,
                }}
              >
                <CardFrontContent card={nextCard} speak={speak} />
              </div>
            </>
          )}
          {/* Next card (shown during dismissal) */}
          {showNextCard && nextCard && dueCards.length > 1 && (
            <div
              className='absolute w-full slide-up'
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateY(0deg)`,
                minHeight: '70dvh',
                maxHeight: '80dvh',
              }}
            >
              <ReviewCardFront
                card={nextCard}
                onFlip={() => {}}
                speak={speak}
                showHint={true}
              />
            </div>
          )}
          {/* Current card with animations */}
          <div
            className={`w-full relative flex items-center justify-center ${
              isDismissing
                ? dismissDirection === 'right'
                  ? 'throw-right'
                  : 'throw-left'
                : ''
            }`}
            style={{
              transform: isDismissing
                ? undefined
                : `translateX(${dragX}px) rotateZ(${rotation}deg)`,
              transition:
                isDragging || isDismissing
                  ? 'none'
                  : shouldAnimateFlip
                  ? 'transform 0.3s ease-out' // Removed opacity from transition
                  : 'none',
              minHeight: '70dvh',
              maxHeight: '80dvh',
              position: isDismissing ? 'absolute' : 'relative',
              zIndex: isDismissing ? 10 : 1,
            }}
          >
            <div
              ref={cardRef}
              className={`w-full relative flex items-center justify-center max-w-full select-none${
                shouldAnimateFlip && !isDismissing
                  ? ' transition-transform duration-400'
                  : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateY(${flipped ? 180 : 0}deg)`,
                minHeight: '70dvh',
                maxHeight: '80dvh',
                cursor:
                  flipped && !isDragging && !isDismissing ? 'grab' : 'pointer',
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              {/* Front Side */}
              <ReviewCardFront
                card={card}
                onFlip={handleFlip}
                speak={speak}
                showHint={!(flipped || isDismissing)}
              />
              {/* Back Side */}
              <ReviewCardBack
                card={card}
                speak={speak}
                onEdit={() => navigate(`/edit/${card.id}`)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Simplified 2-button system */}
      <div className={`w-full flex gap-4 mb-2 ${!flipped ? 'opacity-0' : ''}`}>
        <Button
          className={`flex-1 text-base py-4 rounded-xl bg-red-500 hover:bg-red-600 focus:bg-red-600 focus-visible:bg-red-600 text-white border-none flex items-center justify-center gap-2 ${
            flipped && !isDismissing ? '' : 'opacity-50 pointer-events-none'
          }`}
          onClick={() => handleReview('incorrect')}
          disabled={!flipped || isDismissing}
        >
          <FaArrowLeft size={20} />
          <div className='flex flex-col items-center'>
            <span>Incorrect</span>
          </div>
        </Button>
        <Button
          className={`flex-1 text-base py-4 rounded-xl bg-green-500 hover:bg-green-600 focus:bg-green-600 focus-visible:bg-green-600 text-white border-none flex items-center justify-center gap-2 ${
            flipped && !isDismissing ? '' : 'opacity-50 pointer-events-none'
          }`}
          onClick={() => handleReview('correct')}
          disabled={!flipped || isDismissing}
        >
          <div className='flex flex-col items-center'>
            <span>Correct</span>
          </div>
          <FaArrowRight size={20} />
        </Button>
      </div>

      {/* Status and info */}
      <div className='text-xs text-slate-400 text-center space-y-1'>
        {dueCards.length - 1} more cards due
      </div>
    </PageContainer>
  );
}
