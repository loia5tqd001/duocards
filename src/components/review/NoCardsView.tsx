import { Button } from '@/components/ui/button';
import PageContainer from '@/components/ui/PageContainer';

interface NoCardsViewProps {
  onNavigateHome: () => void;
  onNavigateAdd: () => void;
}

export default function NoCardsView({
  onNavigateHome,
  onNavigateAdd,
}: NoCardsViewProps) {
  return (
    <PageContainer
      title="📖 Review Cards"
      leftButton={
        <Button
          variant="outline"
          size="icon"
          className="rounded-lg w-10 h-10 min-w-0"
          onClick={onNavigateHome}
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
          onClick={onNavigateAdd}
          aria-label="Add Card"
        >
          <span className="text-xl">📝</span>
        </Button>
      }
    >
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="text-xl font-semibold text-slate-400 mb-4">
          No cards to review right now!
        </div>
        <Button
          onClick={onNavigateAdd}
          className="text-base rounded-xl py-3 px-8"
        >
          Add Card 📝
        </Button>
        <Button
          variant="outline"
          onClick={onNavigateHome}
          className="text-base rounded-xl py-3 px-8 mt-3"
        >
          Back to Home 🏠
        </Button>
      </div>
    </PageContainer>
  );
}
