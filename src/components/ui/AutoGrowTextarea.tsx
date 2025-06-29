import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AutoGrowTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
}

export default function AutoGrowTextarea({
  minRows = 1,
  maxRows = 3,
  className,
  ...props
}: AutoGrowTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.rows = minRows;
    textarea.style.height = 'auto';
    const lineHeight = parseInt(
      getComputedStyle(textarea).lineHeight || '24',
      10
    );

    if (!props.value) {
      textarea.rows = minRows;
    } else {
      const scrollHeight = textarea.scrollHeight;
      let rows = Math.floor(scrollHeight / lineHeight);
      if (
        typeof props.value === 'string' &&
        !props.value.includes('\n') &&
        rows <= minRows
      ) {
        rows = minRows;
      } else {
        rows = Math.max(minRows, Math.min(maxRows, rows)) - 1;
      }
      textarea.rows = rows;
    }
  }, [props.value, minRows, maxRows]);

  return (
    <textarea
      ref={textareaRef}
      className={cn(
        'w-full p-3 rounded-lg border border-slate-200 text-base focus:outline-none resize-none pr-10',
        className
      )}
      rows={minRows}
      {...props}
    />
  );
}
