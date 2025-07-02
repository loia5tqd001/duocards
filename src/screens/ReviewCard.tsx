import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { speak } from '../lib/utils';
import type { Card, CardGrade } from '../lib/utils';
import { useDueCards, useCardsActions } from '../store/cardsStore';
import PageContainer from '@/components/ui/PageContainer';
import VolumeButton from '@/components/ui/VolumeButton';
import { FaEdit, FaRegHandPointer } from 'react-icons/fa';

// New components and hooks
import { ReviewCardStyles } from '../components/review/ReviewCardStyles';
import SwipeHints from '../components/review/SwipeHints';
import DeckCards from '../components/review/DeckCards';
import ActionButtons from '../components/review/ActionButtons';
import NoCardsView from '../components/review/NoCardsView';
import { useCardDrag } from '../hooks/useCardDrag';
import { useCardAnimation } from '../hooks/useCardAnimation';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { CARD_CONTAINER_STYLE } from '../constants/reviewCard';

function CardFrontContent({
  card,
  speak,
}: {
  card: Card;
  speak: (text: string) => void;
}) {
  return (
    <div className="review-card w-full">
      <div className="text-2xl font-bold mb-2 text-center tracking-tight">
        {card.english}
      </div>
      <div className="text-slate-400 text-md mb-2 font-medium flex items-center justify-center">
        {card.phonetic}
        <VolumeButton
          onClick={() => speak(card.english || '')}
          ariaLabel="Play word audio"
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
      className="absolute w-full h-full top-0 left-0 bg-white rounded-xl flex flex-col items-center justify-center p-6 backface-hidden overflow-y-auto max-h-full shadow-lg"
      style={{ backfaceVisibility: 'hidden' }}
      onClick={onFlip}
    >
      <style>{`.review-card::-webkit-scrollbar { display: none; }`}</style>
      <CardFrontContent card={card} speak={speak} />
      {/* Tap to reveal hint */}
      {showHint && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none">
          <FaRegHandPointer
            className="text-slate-300 mb-1 animate-bounce"
            size={20}
          />
          <span className="text-xs text-slate-400 font-medium">
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
      className="absolute w-full h-full top-0 left-0 bg-white rounded-xl flex flex-col items-center justify-center p-6 backface-hidden overflow-y-auto max-h-full shadow-lg"
      style={{
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
      }}
    >
      <style>{`.review-card::-webkit-scrollbar { display: none; }`}</style>
      <div className="review-card w-full flex flex-col items-center">
        {/* English word */}
        <div className="text-xl font-bold mb-1 text-center tracking-tight">
          {card.english}
        </div>
        {/* IPA + speaker */}
        <div className="text-slate-400 text-md mb-2 font-medium flex items-center justify-center">
          {card.phonetic}
          <VolumeButton
            onClick={() => speak(card.english || '')}
            ariaLabel="Play word audio"
            size={18}
            significant={true}
          />
        </div>
        {/* Vietnamese translation (biggest text) */}
        <div className="text-2xl text-green-600 font-extrabold mb-4 text-center break-words">
          {card.vietnamese}
        </div>
        {/* Example (if present) */}
        {card.example && (
          <div className="text-base text-slate-700 mb-4 text-center flex items-center justify-center flex-wrap">
            <span className="mr-2 text-sm text-slate-500">Example:</span>{' '}
            <div className="flex items-center">
              {card.example}
              <VolumeButton
                onClick={() => {
                  speak(card.example || '');
                }}
                ariaLabel="Play example audio"
                size={16}
                significant={false}
                className="rounded-lg w-5 h-5 min-w-0"
              />
            </div>
          </div>
        )}
        {/* Edit button */}
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 mt-2"
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
  const [currentIdx, setCurrentIdx] = useState(0);

  // Use Zustand selectors
  const dueCards = useDueCards();
  const { reviewCard, clearSession } = useCardsActions();
  const card = dueCards[currentIdx];

  // Track if we should auto play audio (only when a new card is shown, not when flipping)
  const [shouldAutoPlay, setShouldAutoPlay] = useState(true);

  const cardRef = useRef<HTMLDivElement>(null);

  // Custom hooks for state management
  const animation = useCardAnimation();
  const nextCard =
    animation.pendingNextCard || dueCards[currentIdx + 1] || dueCards[0];

  // Clear session queue when component mounts (new review session)
  useEffect(() => {
    clearSession();
  }, [clearSession]);

  const handleReview = (grade: CardGrade) => {
    if (!card || animation.isDismissing) return;

    // Store the next card before updating
    const nextCardToShow = dueCards[1] || dueCards[0] || null;

    // Start dismissal animation
    animation.startDismissAnimation(
      grade === 'correct' ? 'right' : 'left',
      nextCardToShow
    );

    // Update the card using Zustand store
    reviewCard(card, grade);

    // The dueCards will be automatically updated by Zustand
    // Check if we'll have more cards after this review
    const willHaveMoreCards = dueCards.length > 1;
    if (!willHaveMoreCards) {
      // No more cards due, but delay navigation for animation
      setCurrentIdx(0);
      animation.resetAnimation();
    } else {
      setCurrentIdx(0);
      setFlipped(false);
      setShouldAutoPlay(true);
      animation.disableFlipAnimation();
      drag.resetDrag();
      animation.resetAnimation();
    }
  };

  // Initialize drag functionality
  const drag = useCardDrag({
    flipped,
    isDismissing: animation.isDismissing,
    onReview: handleReview,
  });

  // Keyboard navigation
  useKeyboardNavigation({
    card,
    flipped,
    isDismissing: animation.isDismissing,
    onFlip: () => {
      setFlipped(true);
      setShouldAutoPlay(false);
    },
    onReview: handleReview,
  });

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
      animation.enableFlipAnimation();
    }
  }, [card, flipped, animation]);

  const handleFlip = () => {
    if (drag.isDragging || animation.isDismissing) return;
    if (!flipped) {
      setFlipped(true);
      setShouldAutoPlay(false);
      animation.enableFlipAnimation();
    }
  };

  if (!card) {
    return (
      <NoCardsView
        onNavigateHome={() => navigate('/')}
        onNavigateAdd={() => navigate('/add')}
      />
    );
  }

  const shouldShowDeckCards = !(
    animation.shouldAnimateFlip && !drag.isDragging
  );

  return (
    <PageContainer
      title="📖 Review Cards"
      leftButton={
        <Button
          variant="outline"
          size="icon"
          className="rounded-lg w-10 h-10 min-w-0"
          onClick={() => navigate('/')}
          aria-label="Back to Home"
        >
          <span className="text-xl">🏠</span>
        </Button>
      }
      rightButton={
        <Button
          variant="outline"
          size="icon"
          className="rounded-lg w-10 h-10 min-w-0"
          onClick={() => navigate('/add')}
          aria-label="Add Card"
        >
          <span className="text-xl">📝</span>
        </Button>
      }
      className={'overflow-hidden'}
    >
      <ReviewCardStyles />
      {/* Swipe hints */}
      <div className="relative w-full flex items-center justify-center mb-4">
        <SwipeHints
          showIncorrectHint={drag.showIncorrectHint}
          showCorrectHint={drag.showCorrectHint}
        />

        {/* Card Container */}
        <div className="relative" style={CARD_CONTAINER_STYLE}>
          <DeckCards
            dueCards={dueCards}
            nextCard={nextCard}
            speak={speak}
            shouldShow={shouldShowDeckCards}
          />
          {/* Next card (shown during dismissal) */}
          {animation.showNextCard && nextCard && dueCards.length > 1 && (
            <div
              className="absolute w-full slide-up"
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
              animation.isDismissing
                ? animation.dismissDirection === 'right'
                  ? 'throw-right'
                  : 'throw-left'
                : ''
            }`}
            style={{
              transform: animation.isDismissing
                ? undefined
                : `translateX(${drag.dragX}px) rotateZ(${drag.rotation}deg)`,
              transition:
                drag.isDragging || animation.isDismissing
                  ? 'none'
                  : animation.shouldAnimateFlip
                    ? 'transform 0.3s ease-out'
                    : 'none',
              minHeight: '70dvh',
              maxHeight: '80dvh',
              position: animation.isDismissing ? 'absolute' : 'relative',
              zIndex: animation.isDismissing ? 10 : 1,
            }}
          >
            <div
              ref={cardRef}
              className={`w-full relative flex items-center justify-center max-w-full select-none${
                animation.shouldAnimateFlip && !animation.isDismissing
                  ? ' transition-transform duration-400'
                  : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateY(${flipped ? 180 : 0}deg)`,
                minHeight: '70dvh',
                maxHeight: '80dvh',
                cursor:
                  flipped && !drag.isDragging && !animation.isDismissing
                    ? 'grab'
                    : 'pointer',
              }}
              {...drag.touchHandlers}
              {...drag.mouseHandlers}
            >
              {/* Front Side */}
              <ReviewCardFront
                card={card}
                onFlip={handleFlip}
                speak={speak}
                showHint={!(flipped || animation.isDismissing)}
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

      <ActionButtons
        flipped={flipped}
        isDismissing={animation.isDismissing}
        onReview={handleReview}
      />

      {/* Status and info */}
      <div className="text-xs text-slate-400 text-center space-y-1">
        {dueCards.length - 1} more cards due
      </div>
    </PageContainer>
  );
}
