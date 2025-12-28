import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { supabase } from '@/utils/supabase/client';
import { API_ENDPOINTS } from '@/config/api';

interface GeoLocation {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
}

interface StoredLocation {
  coordinates: string;
  city: string;
  region: string;
  country: string;
  postal: string;
  timezone: string;
  address: string;
  lastUpdated: string;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [message, setMessage] = useState('Processing your login...');

  // Get IP and geolocation
  const getIpAndLocation = async (): Promise<GeoLocation | null> => {
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      const ip = ipData.ip;

      const IP_INFO_TOKEN = import.meta.env.VITE_PUBLIC_IP_INFO_TOKEN || 'db04343f368c67';

      const geoResponse = await fetch(`https://ipinfo.io/${ip}/json?token=${IP_INFO_TOKEN}`);
      const geoData = await geoResponse.json();

      return {
        ip,
        city: geoData.city || 'Unknown',
        region: geoData.region || 'Unknown',
        country: geoData.country || 'Unknown',
        loc: geoData.loc || '0,0',
        org: geoData.org || 'Unknown',
        postal: geoData.postal || 'Unknown',
        timezone: geoData.timezone || 'Unknown'
      };
    } catch (error) {
      console.error('❌ Error fetching IP or location:', error);
      return null;
    }
  };

  // Store geolocation in localStorage
  const storeGeolocation = async (locationInfo: GeoLocation) => {
    try {
      const formattedAddress = `${locationInfo.city}, ${locationInfo.region}, ${locationInfo.country} ${locationInfo.postal}`;

      const storedLocation: StoredLocation = {
        coordinates: locationInfo.loc || '0,0',
        city: locationInfo.city || 'Unknown',
        region: locationInfo.region || 'Unknown',
        country: locationInfo.country || 'Unknown',
        postal: locationInfo.postal || 'Unknown',
        timezone: locationInfo.timezone || 'Unknown',
        address: formattedAddress,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem('ehcf_user_location', JSON.stringify(storedLocation));
      console.log('📍 Location stored in localStorage:', storedLocation);
    } catch (error) {
      console.error('❌ Error storing location:', error);
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setMessage('Verifying your account...');

        // Get session from URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          console.error('❌ No session found');
          setMessage('Authentication failed. Redirecting...');
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        const userId = session.user.id;
        console.log('✅ User authenticated:', userId);

        // Get and store geolocation
        setMessage('Getting your location...');
        const locationInfo = await getIpAndLocation();
        if (locationInfo) {
          await storeGeolocation(locationInfo);
        }

        // Check if profile exists
        setMessage('Checking your profile...');
        let profileData = null;
        
        try {
          const profileRes = await fetch(API_ENDPOINTS.getProfileByUUID(userId), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (profileRes.ok) {
            const profileJson = await profileRes.json();
            if (profileJson.success && profileJson.data) {
              profileData = profileJson.data;

              // Parse user_login_info if it's a string
              if (profileData.user_login_info && typeof profileData.user_login_info === 'string') {
                try {
                  profileData.user_login_info = JSON.parse(profileData.user_login_info);
                } catch {
                  profileData.user_login_info = {};
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ Error fetching profile:', error);
        }

        if (!profileData) {
          // Create new profile
          setMessage('Setting up your account...');
          console.log('📝 Creating new profile for user:', userId);

          try {
            const createRes = await fetch(API_ENDPOINTS.createProfile, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                uuid: userId,
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                email: session.user.email || '',
                phone: session.user.user_metadata?.phone || '',
                avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || '',
                user_login_info: {
                  last_sign_in: new Date().toISOString(),
                  sign_in_method: 'google',
                  provider: 'google',
                  sign_in_count: 1,
                  ip_address: locationInfo?.ip || 'unknown',
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }),
            });

            if (!createRes.ok) {
              const err = await createRes.json();
              console.error('❌ Failed to create profile:', err);
              throw new Error(err.message || 'Failed to create profile');
            }

            console.log('✅ Profile created successfully');
          } catch (error) {
            console.error('❌ Error creating profile:', error);
          }
        } else {
          // Update existing profile
          setMessage('Updating your account...');
          console.log('🔄 Updating existing profile for user:', userId);

          try {
            const userLoginInfo = {
              last_sign_in: new Date().toISOString(),
              sign_in_method: 'google',
              provider: 'google',
              sign_in_count: (profileData.user_login_info?.sign_in_count || 0) + 1,
              ip_address: locationInfo?.ip || profileData.user_login_info?.ip_address || 'unknown',
            };

            const updateRes = await fetch(API_ENDPOINTS.updateProfileByUUID(userId), {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                avatar_url: session.user.user_metadata?.avatar_url || 
                           session.user.user_metadata?.picture || 
                           profileData.avatar_url,
                full_name: session.user.user_metadata?.full_name || 
                          session.user.user_metadata?.name || 
                          profileData.full_name,
                user_login_info: userLoginInfo,
                updated_at: new Date().toISOString(),
              }),
            });

            if (!updateRes.ok) {
              const err = await updateRes.json();
              console.error('❌ Failed to update profile:', err);
              throw new Error(err.message || 'Failed to update profile');
            }

            console.log('✅ Profile updated successfully');
          } catch (error) {
            console.error('❌ Error updating profile:', error);
          }
        }

        // Get redirect URL
        const storedRedirectUrl = localStorage.getItem('authRedirectUrl');
        const redirectTo = storedRedirectUrl || '/';
        
        // Clean up
        localStorage.removeItem('authRedirectUrl');

        setMessage(`Success! Redirecting to ${redirectTo === '/' ? 'home' : 'your page'}...`);
        console.log('✅ Redirecting to:', redirectTo);

        // Redirect after a short delay
        setTimeout(() => {
          navigate(redirectTo);
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
  }, [navigate]);

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