import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

const GoogleIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="#1877F2"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithFacebook, user, isLoading } =
    useAuthStore();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);

  // Redirect to home if Supabase is not configured
  if (!isSupabaseConfigured) {
    navigate('/');
    return null;
  }

  // Redirect if already logged in
  if (user && !isLoading) {
    navigate('/');
    return null;
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign in failed:', error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      setIsFacebookLoading(true);
      await signInWithFacebook();
    } catch (error) {
      console.error('Facebook sign in failed:', error);
    } finally {
      setIsFacebookLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-white drop-shadow-sm">
                🏠
              </span>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Welcome to Vocards
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Sign in to sync your flashcards across devices
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {!isSupabaseConfigured && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800">
                  Authentication is currently unavailable. You can still use the
                  app in local mode.
                </p>
              </div>
            )}

            <Button
              onClick={handleGoogleSignIn}
              disabled={
                !isSupabaseConfigured || isGoogleLoading || isFacebookLoading
              }
              className="w-full h-12 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-md transition-all duration-200 font-medium disabled:opacity-50"
              variant="outline"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <GoogleIcon />
                  <span className="ml-3">Continue with Google</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleFacebookSignIn}
              disabled={
                !isSupabaseConfigured || isGoogleLoading || isFacebookLoading
              }
              className="w-full h-12 bg-white text-[#1877F2] border border-gray-300 hover:bg-gray-50 hover:shadow-md transition-all duration-200 font-medium disabled:opacity-50"
              variant="outline"
            >
              {isFacebookLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <FacebookIcon />
                  <span className="ml-3">Continue with Facebook</span>
                </>
              )}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">or</span>
              </div>
            </div>

            <Button
              onClick={handleBackToHome}
              variant="ghost"
              className="w-full h-12 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
            >
              Continue without signing in
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
