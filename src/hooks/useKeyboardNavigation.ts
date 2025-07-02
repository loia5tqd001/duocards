import { useEffect } from 'react';
import type { Card, CardGrade } from '../lib/utils';

interface UseKeyboardNavigationProps {
  card: Card | undefined;
  flipped: boolean;
  isDismissing: boolean;
  onFlip: () => void;
  onReview: (grade: CardGrade) => void;
}

export function useKeyboardNavigation({
  card,
  flipped,
  isDismissing,
  onFlip,
  onReview,
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if any modifier key is held
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || isDismissing)
        return;
      if (!card) return;

      if (!flipped) {
        // On front: any key flips
        onFlip();
      } else {
        // On back - arrow keys for grading
        if (e.key === 'ArrowLeft') {
          onReview('incorrect');
        } else if (e.key === 'ArrowRight') {
          onReview('correct');
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [flipped, card, isDismissing, onFlip, onReview]);
}
