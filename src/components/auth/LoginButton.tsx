import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useSyncStatus } from "@/store/cardsStore";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Link } from "react-router-dom";

export function LoginButton() {
  const { user, isLoading, signOut } = useAuthStore();
  const { isSyncing } = useSyncStatus();

  // Hide login button if Supabase is not configured
  if (!isSupabaseConfigured) {
    return null;
  }

  if (user) {
    return (
      <Button
        variant="outline"
        onClick={signOut}
        disabled={isLoading || isSyncing}
        className="relative"
      >
        {isSyncing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          </div>
        )}
        <span className={isSyncing ? "opacity-0" : ""}>Sign Out</span>
      </Button>
    );
  }

  return (
    <Button asChild size="sm" disabled={isLoading}>
      <Link to="/login">Sign In</Link>
    </Button>
  );
}
