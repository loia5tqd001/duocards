import { useNotification } from '@/store/uiStore';
import { useUIActions } from '@/store/uiStore';
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTimes,
} from 'react-icons/fa';
import React, { useEffect, useRef, useState } from 'react';

const typeStyles: Record<string, string> = {
  success: 'bg-green-50 border-green-400 text-green-900',
  error: 'bg-red-50 border-red-400 text-red-900',
  info: 'bg-blue-50 border-blue-400 text-blue-900',
  warning: 'bg-yellow-50 border-yellow-400 text-yellow-900',
};

const typeIcons: Record<string, React.ReactNode> = {
  success: <FaCheckCircle className="text-green-500" size={18} />,
  error: <FaExclamationCircle className="text-red-500" size={18} />,
  info: <FaInfoCircle className="text-blue-500" size={18} />,
  warning: <FaExclamationTriangle className="text-yellow-500" size={18} />,
};

const ANIMATION_DURATION = 300; // ms

const Notification: React.FC = () => {
  const notification = useNotification();
  const { hideNotification } = useUIActions();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const last = useRef<{ type: string; message: string } | null>(null);
  const fadeTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handle mount/unmount and animation
  useEffect(() => {
    if (notification) {
      last.current = { type: notification.type, message: notification.message };
      setMounted(true);
      setVisible(false); // Start hidden
      // Next tick: trigger fade-in
      if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
      fadeTimeout.current = setTimeout(() => setVisible(true), 10);
    } else if (last.current) {
      setVisible(false); // start fade out
      // Unmount after animation
      if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
      fadeTimeout.current = setTimeout(() => {
        setMounted(false);
        last.current = null;
      }, ANIMATION_DURATION);
    }
    return () => {
      if (fadeTimeout.current) clearTimeout(fadeTimeout.current);
    };
  }, [notification]);

  if (!mounted) return null;

  const type = notification?.type || last.current?.type || 'info';
  const message = notification?.message || last.current?.message || '';
  const style = typeStyles[type] || typeStyles.info;
  const icon = typeIcons[type] || typeIcons.info;

  return (
    <div
      className={`fixed z-50 left-1/2 top-4 -translate-x-1/2 min-w-[180px] max-w-xs px-3 py-2 rounded-lg border shadow-md flex items-center gap-2 transition-all duration-300
        ${style}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'}
      `}
      role="alert"
      aria-live="assertive"
      style={{ boxShadow: '0 4px 16px 0 rgba(0,0,0,0.08)' }}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 text-sm font-medium leading-tight">
        {message}
      </span>
      <button
        className="ml-1 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 focus:outline-none transition-colors"
        onClick={hideNotification}
        aria-label="Dismiss notification"
      >
        <FaTimes size={12} />
      </button>
    </div>
  );
};

export default Notification;
