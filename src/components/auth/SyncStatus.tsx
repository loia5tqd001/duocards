import { useAuthStore } from '@/store/authStore';
import { useSyncStatus } from '@/store/cardsStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Cloud, CloudOff, RotateCw } from 'lucide-react';

export function SyncStatus() {
  const { user } = useAuthStore();
  const { isSyncing, lastSyncTime } = useSyncStatus();

  // Hide sync status if Supabase is not configured
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!user) {
    return (
      <div
        className="w-10 h-10 flex items-center gap-1 text-xs text-gray-500"
        title="Data stored locally only"
      >
        <CloudOff className="h-3 w-3" />
        <span className="hidden sm:inline whitespace-nowrap">Local only</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div
        className="w-10 h-10 flex items-center gap-1 text-xs text-blue-600"
        title="Syncing with cloud"
      >
        <RotateCw className="h-3 w-3 animate-spin" />
        <span className="hidden sm:inline">Syncing...</span>
      </div>
    );
  }

  const syncTimeText = lastSyncTime
    ? `Last sync: ${new Date(lastSyncTime).toLocaleTimeString()}`
    : 'Not synced yet';

  return (
    <div
      className="w-10 h-10 flex items-center gap-1 text-xs text-green-600"
      title={syncTimeText}
    >
      <Cloud className="h-3 w-3" />
      <span className="hidden sm:inline">Synced</span>
    </div>
  );
}
