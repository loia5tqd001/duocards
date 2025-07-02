import { Button } from '@/components/ui/button';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import type { CardGrade } from '../../lib/utils';

interface ActionButtonsProps {
  flipped: boolean;
  isDismissing: boolean;
  onReview: (grade: CardGrade) => void;
}

export default function ActionButtons({
  flipped,
  isDismissing,
  onReview,
}: ActionButtonsProps) {
  const isDisabled = !flipped || isDismissing;

  return (
    <div className={`w-full flex gap-4 mb-2 ${!flipped ? 'opacity-0' : ''}`}>
      <Button
        className={`flex-1 text-base py-4 rounded-xl bg-red-500 hover:bg-red-600 focus:bg-red-600 focus-visible:bg-red-600 text-white border-none flex items-center justify-center gap-2 ${
          isDisabled ? 'opacity-50 pointer-events-none' : ''
        }`}
        onClick={() => onReview('incorrect')}
        disabled={isDisabled}
      >
        <FaArrowLeft size={20} />
        <div className="flex flex-col items-center">
          <span>Incorrect</span>
        </div>
      </Button>
      <Button
        className={`flex-1 text-base py-4 rounded-xl bg-green-500 hover:bg-green-600 focus:bg-green-600 focus-visible:bg-green-600 text-white border-none flex items-center justify-center gap-2 ${
          isDisabled ? 'opacity-50 pointer-events-none' : ''
        }`}
        onClick={() => onReview('correct')}
        disabled={isDisabled}
      >
        <div className="flex flex-col items-center">
          <span>Correct</span>
        </div>
        <FaArrowRight size={20} />
      </Button>
    </div>
  );
}
