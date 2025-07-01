import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCardsStore } from "@/store/cardsStore";

export function useAuthSync() {
  const { user, session, isInitialized } = useAuthStore();
  const { cards, syncWithSupabase, uploadToSupabase, loadFromSupabase } =
    useCardsStore();
  const previousUser = useRef<typeof user>(null);
  const hasInitialSync = useRef(false);

  useEffect(() => {
    // Initialize auth on app start
    if (!isInitialized) {
      useAuthStore.getState().initialize();
    }
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

    const wasLoggedOut = previousUser.current && !user;
    const wasLoggedIn = !previousUser.current && user;
    const userChanged = previousUser.current?.id !== user?.id;

    // User just logged in
    if (wasLoggedIn || (user && userChanged)) {
      console.log("User logged in, syncing data...");

      // If user has local cards, upload them first, then sync
      if (cards.length > 0) {
        uploadToSupabase().then(() => {
          syncWithSupabase();
        });
      } else {
        // No local cards, just load from Supabase
        loadFromSupabase();
      }

      hasInitialSync.current = true;
    }

    // User just logged out
    if (wasLoggedOut) {
      console.log("User logged out, keeping local data");
      hasInitialSync.current = false;
    }

    // Periodic sync for logged-in users (every 5 minutes)
    let syncInterval: NodeJS.Timeout | null = null;
    if (user && hasInitialSync.current) {
      syncInterval = setInterval(
        () => {
          syncWithSupabase();
        },
        5 * 60 * 1000,
      ); // 5 minutes
    }

    previousUser.current = user;

    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [
    user,
    isInitialized,
    cards.length,
    syncWithSupabase,
    uploadToSupabase,
    loadFromSupabase,
  ]);

  return {
    isLoggedIn: !!user,
    user,
    session,
    isInitialized,
  };
}
