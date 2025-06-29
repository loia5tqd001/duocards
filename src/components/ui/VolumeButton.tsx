import { Button } from './button';
import { FaVolumeUp } from 'react-icons/fa';
import React from 'react';

interface VolumeButtonProps {
  onClick?: () => void;
  ariaLabel?: string;
  size?: number;
  significant?: boolean; // true = blue, false = default (shadow/black)
  className?: string;
  tabIndex?: number;
  title?: string;
  disabled?: boolean;
}

const VolumeButton: React.FC<VolumeButtonProps> = ({
  onClick,
  ariaLabel = 'Play audio',
  size = 18,
  significant = true,
  className = '',
  tabIndex,
  title,
  disabled = false,
}) => {
  // Blue for significant, shadow/black for not
  const colorClass = significant
    ? 'text-blue-500 hover:text-blue-700'
    : 'text-slate-500 hover:text-slate-700';

  return (
    <Button
      type='button'
      variant='ghost'
      size={undefined}
      className={
        `inline-flex items-center justify-center ${colorClass} ${className}`.trim() +
        ' rounded-lg p-0 w-5 h-5 min-w-0'
      }
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      title={title}
      disabled={disabled}
      style={{ width: 20, height: 20 }}
    >
      <FaVolumeUp size={size} />
    </Button>
  );
};

export default VolumeButton;
