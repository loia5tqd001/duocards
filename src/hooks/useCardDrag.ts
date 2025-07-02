import { useState, useRef } from 'react';

export const HINT_APPEAR_THRESHOLD = 50;

interface UseCardDragProps {
  flipped: boolean;
  isDismissing: boolean;
  onReview: (grade: 'correct' | 'incorrect') => void;
}

export function useCardDrag({
  flipped,
  isDismissing,
  onReview,
}: UseCardDragProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleStart = (clientX: number) => {
    if (!flipped || isDismissing) return;
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

    if (Math.abs(dragX) > HINT_APPEAR_THRESHOLD) {
      if (dragX > 0) {
        onReview('correct');
      } else {
        onReview('incorrect');
      }
    } else {
      setDragX(0);
    }
  };

  const resetDrag = () => {
    setDragX(0);
    setIsDragging(false);
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

  // Mouse event handlers
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

  const rotation = dragX / 10;
  const showIncorrectHint =
    dragX < -HINT_APPEAR_THRESHOLD && flipped && !isDismissing;
  const showCorrectHint =
    dragX > HINT_APPEAR_THRESHOLD && flipped && !isDismissing;

  return {
    isDragging,
    dragX,
    rotation,
    showIncorrectHint,
    showCorrectHint,
    resetDrag,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    mouseHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
    },
  };
}
