import { useState } from 'react';
import type { Card } from '../lib/utils';

export function useCardAnimation() {
  const [isDismissing, setIsDismissing] = useState(false);
  const [dismissDirection, setDismissDirection] = useState<
    'left' | 'right' | null
  >(null);
  const [showNextCard, setShowNextCard] = useState(false);
  const [pendingNextCard, setPendingNextCard] = useState<Card | null>(null);
  const [shouldAnimateFlip, setShouldAnimateFlip] = useState(false);

  const startDismissAnimation = (
    direction: 'left' | 'right',
    nextCard: Card | null
  ) => {
    setIsDismissing(true);
    setDismissDirection(direction);
    setPendingNextCard(nextCard);
    setShowNextCard(true);
  };

  const resetAnimation = () => {
    setTimeout(() => {
      setIsDismissing(false);
      setDismissDirection(null);
      setShowNextCard(false);
      setPendingNextCard(null);
    }, 600);
  };

  const enableFlipAnimation = () => {
    setShouldAnimateFlip(true);
  };

  const disableFlipAnimation = () => {
    setShouldAnimateFlip(false);
  };

  return {
    isDismissing,
    dismissDirection,
    showNextCard,
    pendingNextCard,
    shouldAnimateFlip,
    startDismissAnimation,
    resetAnimation,
    enableFlipAnimation,
    disableFlipAnimation,
  };
}
