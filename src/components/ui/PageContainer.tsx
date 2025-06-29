import type { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  leftButton?: ReactNode;
  rightButton?: ReactNode;
  children: ReactNode;
}

export default function PageContainer({
  title,
  leftButton,
  rightButton,
  children,
}: PageContainerProps) {
  return (
    <div className='w-full max-w-sm mx-auto p-4 h-dvh relative flex flex-col'>
      {/* Header */}
      <div className='w-full flex items-center justify-between mb-6 min-h-[48px]'>
        <div className='w-10 h-10 flex items-center justify-start'>
          {leftButton}
        </div>
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
