import type { ReactNode } from 'react';
import { Button } from './button';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

interface PageContainerProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightButton?: ReactNode;
  children: ReactNode;
}

export default function PageContainer({
  title,
  showBack = false,
  onBack,
  rightButton,
  children,
}: PageContainerProps) {
  const navigate = useNavigate();
  return (
    <div className='w-full max-w-sm mx-auto p-4 h-screen relative flex flex-col'>
      {/* Header */}
      <div className='w-full flex items-center justify-between mb-6 min-h-[48px]'>
        {showBack ? (
          <Button
            variant='outline'
            size='icon'
            className='rounded-lg w-10 h-10 min-w-0'
            onClick={onBack || (() => navigate('/'))}
            aria-label='Back to Home'
          >
            <FaArrowLeft size={20} />
          </Button>
        ) : (
          <div className='w-10 h-10' />
        )}
        <div className='flex-1 flex items-center justify-center gap-2'>
          <span className='font-bold text-2xl tracking-tight'>{title}</span>
        </div>
        <div className='w-10 h-10 flex items-center justify-end'>
          {rightButton}
        </div>
      </div>
      {/* Main Content */}
      <div className='flex-1 flex flex-col'>{children}</div>
    </div>
  );
}
