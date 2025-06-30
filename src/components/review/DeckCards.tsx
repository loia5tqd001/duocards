import type { Card } from '../../lib/utils';
import VolumeButton from '@/components/ui/VolumeButton';

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
          onClick={() => speak(card.english || '')}
          ariaLabel='Play word audio'
          size={18}
          significant={true}
        />
      </div>
    </div>
  );
}

interface DeckCardsProps {
  dueCards: Card[];
  nextCard: Card;
  speak: (text: string) => void;
  shouldShow: boolean;
}

const CARD_DIMENSIONS = {
  minHeight: '70dvh',
  maxHeight: '80dvh',
};

export default function DeckCards({ dueCards, nextCard, speak, shouldShow }: DeckCardsProps) {
  if (dueCards.length <= 1 || !shouldShow) return null;

  return (
    <>
      {/* Third card (deepest) */}
      <div
        className='absolute w-full bg-white rounded-xl deck-card-2'
        style={{
          ...CARD_DIMENSIONS,
          transform: 'translateY(8px) scale(0.96)',
          zIndex: -2,
        }}
      />
      {/* Second card (middle) */}
      <div
        className='absolute w-full bg-white rounded-xl deck-card-1 flex flex-col items-center justify-center p-6'
        style={{
          ...CARD_DIMENSIONS,
          transform: 'translateY(4px) scale(0.98)',
          zIndex: -1,
        }}
      >
        <CardFrontContent card={nextCard} speak={speak} />
      </div>
    </>
  );
}