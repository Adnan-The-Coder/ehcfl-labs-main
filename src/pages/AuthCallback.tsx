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

        // Log full URL for debugging
        const fullUrl = window.location.href;
        console.log('🔍 [AuthCallback] Full URL:', fullUrl);
        console.log('🔍 [AuthCallback] Search params:', window.location.search);
        console.log('🔍 [AuthCallback] Hash:', window.location.hash);

        // Check if we have tokens in hash fragment (implicit flow - fallback)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          console.log('⚠️ [AuthCallback] Detected implicit flow (hash-based tokens)');
          console.log('⚠️ [AuthCallback] Converting to session...');
          
          // Parse hash parameters
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const expiresIn = hashParams.get('expires_in');
          
          if (accessToken) {
            // Store tokens directly from hash
            const session = {
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_in: expiresIn ? parseInt(expiresIn) : 3600,
              expires_at: Date.now() + (expiresIn ? parseInt(expiresIn) * 1000 : 3600000),
              token_type: 'bearer',
            };
            
            localStorage.setItem('ehcf_session', JSON.stringify(session));
            console.log('✅ [AuthCallback] Session stored from implicit flow');
            
            // Decode JWT to get user info
            try {
              const payload = JSON.parse(atob(accessToken.split('.')[1]));
              const user = {
                id: payload.sub,
                email: payload.email,
                user_metadata: payload.user_metadata,
              };
              localStorage.setItem('ehcf_user', JSON.stringify(user));
              console.log('✅ [AuthCallback] User data extracted from token');
            } catch (e) {
              console.error('❌ Failed to decode token:', e);
            }
            
            // Get redirect URL and navigate
            const redirectUrl = localStorage.getItem('authRedirectUrl') || '/';
            localStorage.removeItem('authRedirectUrl');
            
            setMessage('Success! Redirecting...');
            window.dispatchEvent(new Event('auth-state-changed'));
            
            setTimeout(() => {
              navigate(redirectUrl, { replace: true });
            }, 1000);
            return;
          }
        }

        // Get the authorization code from URL (PKCE flow - preferred)
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        console.log('🔍 [AuthCallback] Code:', code ? 'Present' : 'MISSING');
        console.log('🔍 [AuthCallback] Error:', error || 'None');

        // Handle OAuth errors
        if (error) {
          console.error('❌ OAuth error:', error, errorDescription);
          setMessage(`Authentication error: ${errorDescription || error}`);
          setTimeout(() => navigate('/', { replace: true }), 3000);
          return;
        }

        if (!code) {
          console.error('❌ No authorization code found and no tokens in hash');
          console.error('❌ All search params:', Array.from(searchParams.entries()));     
          setMessage('No authorization code received. Please try signing in again.');
          setTimeout(() => navigate('/', { replace: true }), 3000);
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
          credentials: 'include', // Include cookies for PKCE verification
        });

        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error('❌ Failed to parse response:', jsonError);
          const text = await response.text();
          console.error('❌ Response text:', text);
          throw new Error(`Server returned invalid response (${response.status}): ${text.substring(0, 100)}`);
        }

        if (!response.ok || !result.success) {
          console.error('❌ Backend response error:', {
            status: response.status,
            result,
          });
          throw new Error(result.message || result.error || 'Failed to complete authentication');
        }

        console.log('✅ Authentication successful', result);

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

        // Dispatch custom event to notify app of auth state change
        window.dispatchEvent(new Event('auth-state-changed'));

        // Redirect after a short delay (no reload needed - event will trigger re-render)
        setTimeout(() => {
          navigate(finalRedirectUrl, { replace: true });
        }, 1000);

      } catch (error: any) {
        console.error('❌ Error in auth callback:', error);
        const errorMsg = error?.message || 'Authentication failed. Please try again.';
        setMessage(errorMsg);
        
        // Show error for longer before redirecting
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
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
