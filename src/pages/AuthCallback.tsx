import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [message, setMessage] = useState('Processing your login...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setMessage('Verifying your account...');

        // Get the authorization code from URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle OAuth errors
        if (error) {
          console.error('❌ OAuth error:', error, errorDescription);
          setMessage('Authentication failed. Redirecting...');
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        if (!code) {
          console.error('❌ No authorization code found');
          setMessage('Authentication failed. Redirecting...');
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        // Get stored redirect URL
        const redirectUrl = searchParams.get('redirectUrl') || localStorage.getItem('authRedirectUrl') || '/';

        setMessage('Completing sign in...');

        // Call backend to exchange code for session
        const response = await fetch(`${API_ENDPOINTS.authCallback}?code=${encodeURIComponent(code)}&redirectUrl=${encodeURIComponent(redirectUrl)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to complete authentication');
        }

        console.log('✅ Authentication successful');

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

        // Clean up
        localStorage.removeItem('authRedirectUrl');

        const finalRedirectUrl = result.data?.redirectUrl || redirectUrl;
        setMessage(`Success! Redirecting to ${finalRedirectUrl === '/' ? 'home' : 'your page'}...`);
        console.log('✅ Redirecting to:', finalRedirectUrl);

        // Redirect after a short delay
        setTimeout(() => {
          navigate(finalRedirectUrl);
          window.location.reload(); // Force reload to update auth state
        }, 1500);

      } catch (error) {
        console.error('❌ Error in auth callback:', error);
        setMessage('Authentication failed. Redirecting to home...');
        setTimeout(() => navigate('/'), 2000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{message}</h2>
          <p className="text-sm text-muted-foreground">
            {isProcessing ? 'Please wait while we set things up...' : 'Almost there...'}
          </p>
        </div>
      </div>
    </div>
  );
}
