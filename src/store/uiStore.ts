import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

interface UIState {
  // Loading states
  isLoading: boolean;
  loadingMessage?: string;

  // Notification system
  notification?: {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    autoHide?: boolean;
    duration?: number;
  };

  // Form states that could be shared
  isFormDirty: boolean;

  // Actions
  setLoading: (loading: boolean, message?: string) => void;
  showNotification: (
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
    autoHide?: boolean,
    duration?: number
  ) => void;
  hideNotification: () => void;
  setFormDirty: (dirty: boolean) => void;
}

// Selectors
export const useLoading = () =>
  useUIStore(
    useShallow((state) => ({
      isLoading: state.isLoading,
      message: state.loadingMessage,
    }))
  );
export const useNotification = () => useUIStore((state) => state.notification);
export const useFormDirty = () => useUIStore((state) => state.isFormDirty);

// Action selectors
export const useUIActions = () =>
  useUIStore(
    useShallow((state) => ({
      setLoading: state.setLoading,
      showNotification: state.showNotification,
      hideNotification: state.hideNotification,
      setFormDirty: state.setFormDirty,
    }))
  );

export const useUIStore = create<UIState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      isLoading: false,
      loadingMessage: undefined,
      notification: undefined,
      isFormDirty: false,

      setLoading: (loading, message) => {
        set((state) => {
          state.isLoading = loading;
          state.loadingMessage = message;
        });
      },

      showNotification: (type, message, autoHide = true, duration = 3000) => {
        const id = Math.random().toString(36).substring(7);

        set((state) => {
          state.notification = {
            id,
            type,
            message,
            autoHide,
            duration,
          };
        });

        // Auto-hide notification if specified
        if (autoHide) {
          setTimeout(() => {
            const currentNotification = get().notification;
            if (currentNotification?.id === id) {
              set((state) => {
                state.notification = undefined;
              });
            }
          }, duration);
        }
      },

      hideNotification: () => {
        set((state) => {
          state.notification = undefined;
        });
      },

      setFormDirty: (dirty) => {
        set((state) => {
          state.isFormDirty = dirty;
        });
      },
    }))
  )
);
