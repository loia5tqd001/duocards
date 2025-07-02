import type { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  leftButton?: ReactNode;
  rightButton?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function PageContainer({
  title,
  leftButton,
  rightButton,
  children,
  className,
}: PageContainerProps) {
  return (
    <div
      className={`w-full max-w-sm mx-auto p-4 h-dvh relative flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-6 min-h-[48px]">
        <div className="flex items-center justify-start">{leftButton}</div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="font-bold text-2xl tracking-tight">{title}</span>
        </div>
        <div className="flex items-center justify-end min-w-0">
          {rightButton}
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
