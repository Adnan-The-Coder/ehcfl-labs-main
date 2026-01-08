/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, X, Info } from 'lucide-react';

import { API_ENDPOINTS } from '@/config/api';
import ehcfLogo from '@/assets/ehcf-logo.png';

interface SignInProps {
  isOpen: boolean;
  onClose: () => void;
  redirectUrl?: string;
}

const SignIn: React.FC<SignInProps> = ({ isOpen, onClose, redirectUrl }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [accountNotFound, setAccountNotFound] = useState(false);

  const navigate = useNavigate();
  const emailId = useId();
  const passwordId = useId();
  const rememberMeId = useId();

  // Close modal when escape key is pressed
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Store redirect URL in localStorage
  useEffect(() => {
    if (isOpen) {
      const urlToStore = redirectUrl || window.location.pathname;
      localStorage.setItem('authRedirectUrl', urlToStore);
    }
  }, [isOpen, redirectUrl]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setAccountNotFound(false);

    try {
      // Call backend API for sign-in (backend handles everything)
      const response = await fetch(API_ENDPOINTS.authSignIn, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        if (result.accountNotFound) {
          setAccountNotFound(true);
          setError('Account not found. Please create an account to continue.');
        } else {
          setError(result.message || 'Failed to sign in');
        }
        return;
      }

      // Store session data in localStorage
      if (result.data?.session) {
        localStorage.setItem('ehcf_session', JSON.stringify(result.data.session));
        console.log('✅ Session stored');
      }

      // Store user data
      if (result.data?.user) {
        localStorage.setItem('ehcf_user', JSON.stringify(result.data.user));
        console.log('✅ User data stored');
      }

      // Store location data
      if (result.data?.location) {
        localStorage.setItem('ehcf_user_location', JSON.stringify(result.data.location));
        console.log('📍 Location stored');
      }

      // Close modal and redirect
      onClose();
      const storedRedirectUrl = localStorage.getItem('authRedirectUrl') || '/';
      localStorage.removeItem('authRedirectUrl');
      navigate(storedRedirectUrl);
      window.location.reload(); // Force reload to update auth state
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Store redirect URL in localStorage
      const urlToStore = redirectUrl || window.location.pathname;
      localStorage.setItem('authRedirectUrl', urlToStore);
      console.log('🔵 [Sign-in] Stored redirect URL:', urlToStore);

      // Call backend API to initiate Google OAuth
      const apiUrl = `${API_ENDPOINTS.authGoogleOAuth}?redirectUrl=${encodeURIComponent(urlToStore)}`;
      console.log('🔵 [Sign-in] Calling API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Enable cookies for PKCE flow
      });

      const result = await response.json();
      console.log('🔵 [Sign-in] API response:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to initiate Google OAuth');
      }

      // Redirect to Google OAuth URL
      if (result.data?.url) {
        console.log('✅ [Sign-in] Redirecting to Google:', result.data.url.substring(0, 80) + '...');
        window.location.href = result.data.url;
      } else {
        throw new Error('OAuth URL not received');
      }
    } catch (error: any) {
      console.error('❌ Google sign in error:', error);
      setError(error.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call backend API for password reset
      const response = await fetch(API_ENDPOINTS.authResetPassword, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to send reset password email');
      }

      setMessage(result.message || 'Password reset link sent to your email');
    } catch (error: any) {
      setError(error.message || 'Failed to send reset password email');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-card border border-border shadow-2xl">
        <div className="relative p-6 sm:p-8">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img
                src={ehcfLogo}
                alt="EHCF Logo"
                className="h-16 w-auto"
              />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Don't have an account?{' '}
              <a href="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </a>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 rounded-lg border-l-4 border-destructive bg-destructive/10 p-4">
              <div className="flex items-start">
                <AlertCircle className="mr-3 mt-0.5 w-5 h-5 text-destructive flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                  {accountNotFound && (
                    <div className="mt-2 flex items-center">
                      <Info className="mr-2 w-4 h-4 text-primary" />
                      <p className="text-xs text-muted-foreground">
                        <a href="/signup" className="font-medium text-primary hover:underline">
                          Sign up now
                        </a>{' '}
                        to create a new account.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="mt-4 rounded-lg border-l-4 border-primary bg-primary/10 p-4">
              <p className="text-sm text-foreground">{message}</p>
            </div>
          )}

          {/* Sign In Form */}
          <form className="mt-6 space-y-4" onSubmit={handleEmailSignIn}>
            {/* Email Input */}
            <div className="relative">
              <label htmlFor={emailId} className="sr-only">
                Email address
              </label>
              <Mail className="absolute left-3 top-1/2 w-5 h-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-11 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                placeholder="Email address"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <label htmlFor={passwordId} className="sr-only">
                Password
              </label>
              <Lock className="absolute left-3 top-1/2 w-5 h-5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                id={passwordId}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-11 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id={rememberMeId}
                  name="remember-me"
                  type="checkbox"
                  className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-primary/20"
                />
                <label htmlFor={rememberMeId} className="ml-2 block text-sm text-foreground">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={handlePasswordReset}
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading && <Loader2 className="mr-2 w-5 h-5 animate-spin" />}
              Sign in
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-4 text-muted-foreground">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-6 w-full flex items-center justify-center rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="mr-3 w-5 h-5" viewBox="0 0 24 24">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path
                  fill="#4285F4"
                  d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                />
                <path
                  fill="#34A853"
                  d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                />
                <path
                  fill="#FBBC05"
                  d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                />
                <path
                  fill="#EA4335"
                  d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                />
              </g>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </>
  );
};

export default SignIn;