/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context } from 'hono';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getCookie, setCookie } from 'hono/cookie';
import { CloudflareBindings } from '../../types';
import { getIpAndLocation } from '../../helpers/geolocation';

// Types
interface CustomStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

interface UserData {
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  picture?: string;
  sign_in_method?: string;
  provider?: string;
}

interface LocationInfo {
  ip?: string;
  loc?: string;
  city?: string;
  region?: string;
  country?: string;
  postal?: string;
  timezone?: string;
}

interface FormattedLocation {
  coordinates: string | undefined;
  city: string | undefined;
  region: string | undefined;
  country: string | undefined;
  postal: string | undefined;
  timezone: string | undefined;
  address: string;
  lastUpdated: string;
}

interface UserLoginInfo {
  last_sign_in: string;
  sign_in_method: string;
  provider: string;
  sign_in_count: number;
  ip_address: string;
}

/**
 * Create Supabase client with proper typing
 */
const getSupabaseClient = (
  env: CloudflareBindings,
  storage?: CustomStorage
): SupabaseClient => {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be configured'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      ...(storage && { storage }),
    },
  });
};

/**
 * Parse user login info safely
 */
const parseUserLoginInfo = (loginInfo: any): Partial<UserLoginInfo> => {
  try {
    if (!loginInfo) return {};
    if (typeof loginInfo === 'string') {
      return JSON.parse(loginInfo);
    }
    return loginInfo;
  } catch (error) {
    console.error('Error parsing user login info:', error);
    return {};
  }
};

/**
 * Format location data for frontend
 */
const formatLocationData = (locationInfo: LocationInfo): FormattedLocation => {
  const city = locationInfo.city || '';
  const region = locationInfo.region || '';
  const country = locationInfo.country || '';
  const postal = locationInfo.postal || '';

  return {
    coordinates: locationInfo.loc,
    city: locationInfo.city,
    region: locationInfo.region,
    country: locationInfo.country,
    postal: locationInfo.postal,
    timezone: locationInfo.timezone,
    address: [city, region, country, postal].filter(Boolean).join(', '),
    lastUpdated: new Date().toISOString(),
  };
};

/**
 * Create or update user profile in the database
 */
const syncUserProfile = async (
  userId: string,
  userData: UserData,
  locationInfo: LocationInfo,
  isNewUser: boolean,
  c: Context
): Promise<any> => {
  try {
    console.log('📝 [DB Sync] Starting profile sync for user:', userId);
    console.log('📝 [DB Sync] Is new user:', isNewUser);

    const db = c.env.DB;
    if (!db) {
      throw new Error('Database not configured');
    }

    const { drizzle } = await import('drizzle-orm/d1');
    const { eq } = await import('drizzle-orm');
    const { userProfiles } = await import('../../db/schema');
    const dbInstance = drizzle(db);

    if (isNewUser) {
      const newProfile = {
        uuid: userId,
        full_name: userData.full_name || userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        avatar_url: userData.avatar_url || userData.picture || '',
        user_login_info: JSON.stringify({
          last_sign_in: new Date().toISOString(),
          sign_in_method: userData.sign_in_method || 'email',
          provider: userData.provider || 'email',
          sign_in_count: 1,
          ip_address: locationInfo?.ip || 'unknown',
        } as UserLoginInfo),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('📝 [DB Sync] Creating new profile');
      const result = await dbInstance.insert(userProfiles).values(newProfile);
      console.log('✅ [DB Sync] Profile created successfully');
      return newProfile;
    } else {
      // Update existing profile
      const existingProfile = await dbInstance
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.uuid, userId))
        .limit(1);

      const existingLoginInfo = parseUserLoginInfo(
        existingProfile[0]?.user_login_info
      );

      const updatedLoginInfo: UserLoginInfo = {
        last_sign_in: new Date().toISOString(),
        sign_in_method: userData.sign_in_method || 'email',
        provider: userData.provider || 'email',
        sign_in_count: (existingLoginInfo?.sign_in_count || 0) + 1,
        ip_address: locationInfo?.ip || existingLoginInfo?.ip_address || 'unknown',
      };

      const updateData = {
        avatar_url: userData.avatar_url || userData.picture || existingProfile[0]?.avatar_url,
        full_name: userData.full_name || userData.name || existingProfile[0]?.full_name,
        user_login_info: JSON.stringify(updatedLoginInfo),
        updated_at: new Date().toISOString(),
      };

      console.log('📝 [DB Sync] Updating existing profile');
      const result = await dbInstance
        .update(userProfiles)
        .set(updateData)
        .where(eq(userProfiles.uuid, userId));

      console.log('✅ [DB Sync] Profile updated successfully');
      return { ...existingProfile[0], user_login_info: JSON.stringify(updatedLoginInfo) };
    }
  } catch (error) {
    console.error('❌ Error syncing user profile:', error);
    throw error;
  }
};

/**
 * Check if profile exists in database
 */
const checkProfileExists = async (
  userId: string,
  c: Context
): Promise<boolean> => {
  const db = c.env.DB;
  const { drizzle } = await import('drizzle-orm/d1');
  const { eq } = await import('drizzle-orm');
  const { userProfiles } = await import('../../db/schema');
  const dbInstance = drizzle(db);

  const existingProfile = await dbInstance
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.uuid, userId))
    .limit(1);

  return existingProfile.length > 0;
};

/**
 * POST /auth/signin
 * Handle email/password sign-in
 */
export const emailSignIn = async (c: Context<{ Bindings: CloudflareBindings }>) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ success: false, message: 'Email and password are required' }, 400);
    }

    const supabase = getSupabaseClient(c.env);
    const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';

    // Sign in with Supabase
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('❌ Supabase sign-in error:', signInError);
      if (signInError.message.includes('Invalid login credentials')) {
        return c.json({
          success: false,
          message: 'Account not found. Please create an account to continue.',
          accountNotFound: true,
        }, 401);
      }
      return c.json({ success: false, message: signInError.message }, 401);
    }

    if (!data?.user || !data?.session) {
      return c.json({ success: false, message: 'Authentication failed' }, 401);
    }

    // Get location info
    const locationInfo = await getIpAndLocation(clientIp, c.env);

    // Check if profile exists and sync
    const isNewUser = !(await checkProfileExists(data.user.id, c));

    await syncUserProfile(
      data.user.id,
      {
        full_name: data.user.user_metadata?.full_name,
        email: data.user.email,
        phone: data.user.user_metadata?.phone,
        avatar_url: data.user.user_metadata?.avatar_url,
        sign_in_method: 'email',
        provider: 'email',
      },
      locationInfo,
      isNewUser,
      c
    );

    return c.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
        location: formatLocationData(locationInfo),
      },
    });
  } catch (error: any) {
    console.error('❌ Error in emailSignIn:', error);
    return c.json({ success: false, message: error.message || 'Internal server error' }, 500);
  }
};

/**
 * Create in-memory storage for PKCE
 */
const createPKCEStorage = (): { storage: CustomStorage; tempStore: Record<string, string> } => {
  const tempStore: Record<string, string> = {};
  
  const storage: CustomStorage = {
    getItem: (key: string) => {
      console.log('🔵 [Storage] getItem:', key);
      return tempStore[key] ?? null;
    },
    setItem: (key: string, value: string) => {
      console.log('🔵 [Storage] setItem:', key);
      tempStore[key] = value;
    },
    removeItem: (key: string) => {
      console.log('🔵 [Storage] removeItem:', key);
      delete tempStore[key];
    },
  };

  return { storage, tempStore };
};

/**
 * Determine origin with fallback
 */
const getOrigin = (c: Context): string => {
  const origin = 
    c.req.header('origin') || 
    c.req.header('referer')?.split('/').slice(0, 3).join('/') || 
    'http://localhost:8080';

  console.log('🔵 [Origin] Detected:', origin);
  return origin;
};

/**
 * Set PKCE cookie with appropriate security settings
 */
const setPKCECookie = (c: Context, verifier: string, origin: string): void => {
  const isSecure = origin.startsWith('https://') || 
                   origin.includes('localhost') || 
                   origin.includes('127.0.0.1');
  const isLocalDev = origin.includes('127.0.0.1') || origin.includes('localhost');

  setCookie(c, 'sb-pkce-verifier', verifier, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isLocalDev ? 'Lax' : 'None',
    path: '/',
    maxAge: 300, // 5 minutes
  });

  console.log('✅ [Cookie] PKCE verifier stored (secure:', isSecure, 'sameSite:', isLocalDev ? 'Lax' : 'None', ')');
};

/**
 * Clear PKCE cookie
 */
const clearPKCECookie = (c: Context): void => {
  setCookie(c, 'sb-pkce-verifier', '', {
    path: '/',
    maxAge: 0,
  });
  console.log('✅ [Cookie] PKCE verifier cleared');
};

/**
 * GET /auth/google
 * Initiate Google OAuth flow
 */
export const initiateGoogleOAuth = async (c: Context<{ Bindings: CloudflareBindings }>) => {
  try {
    console.log('🟢 [Google OAuth] Initiating flow...');
    
    const redirectUrl = c.req.query('redirectUrl') || '/';
    const origin = getOrigin(c);
    const callbackUrl = `${origin}/auth/callback`;

    console.log('🟢 [Google OAuth] Callback URL:', callbackUrl);

    // Create PKCE storage
    const { storage, tempStore } = createPKCEStorage();
    const supabase = getSupabaseClient(c.env, storage);

    // Initiate OAuth - Supabase uses PKCE by default for OAuth
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
      },
    });

    if (oauthError) {
      console.error('❌ [Google OAuth] Error:', oauthError);
      return c.json({ success: false, message: oauthError.message }, 400);
    }

    // Store PKCE verifier in cookie
    const pkceVerifier = tempStore['pkce_code_verifier'] || tempStore['sb-pkce-code-verifier'];
    
    if (pkceVerifier) {
      setPKCECookie(c, pkceVerifier, origin);
    } else {
      console.warn('⚠️ [Google OAuth] No PKCE verifier captured');
    }

    console.log('✅ [Google OAuth] OAuth URL generated');
    return c.json({
      success: true,
      data: {
        url: data.url,
        provider: data.provider,
      },
    });
  } catch (error: any) {
    console.error('❌ [Google OAuth] Error:', error);
    return c.json({ success: false, message: error.message || 'Internal server error' }, 500);
  }
};

/**
 * Create storage with PKCE verifier
 */
const createStorageWithPKCE = (pkceVerifier: string): CustomStorage => ({
  getItem: (key: string) => {
    if (key === 'pkce_code_verifier' || key === 'sb-pkce-code-verifier') {
      console.log('🟢 [Storage] Providing PKCE verifier for key:', key);
      return pkceVerifier;
    }
    return null;
  },
  setItem: () => {},
  removeItem: () => {},
});

/**
 * GET /auth/callback
 * Handle OAuth callback (Google)
 */
export const handleOAuthCallback = async (c: Context<{ Bindings: CloudflareBindings }>) => {
  try {
    console.log('🟢 [OAuth Callback] Processing callback...');

    const code = c.req.query('code');
    const redirectUrl = c.req.query('redirectUrl') || '/';

    if (!code) {
      console.error('❌ [OAuth Callback] No authorization code');
      return c.json({ success: false, message: 'Authorization code missing' }, 400);
    }

    const pkceVerifier = getCookie(c, 'sb-pkce-verifier');
    
    if (!pkceVerifier) {
      console.warn('⚠️ [OAuth Callback] No PKCE verifier in cookie');
    }

    const storage = pkceVerifier ? createStorageWithPKCE(pkceVerifier) : undefined;
    const supabase = getSupabaseClient(c.env, storage);
    const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';

    // Exchange code for session
    console.log('🟢 [OAuth Callback] Exchanging code for session...');
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('❌ [OAuth Callback] Exchange error:', exchangeError);
      return c.json({ success: false, message: exchangeError.message }, 401);
    }

    if (!data?.user || !data?.session) {
      console.error('❌ [OAuth Callback] No user or session');
      return c.json({ success: false, message: 'Failed to establish session' }, 401);
    }

    console.log('✅ [OAuth Callback] Session established for user:', data.user.id);

    // Clear PKCE cookie
    clearPKCECookie(c);

    // Get location info
    const locationInfo = await getIpAndLocation(clientIp, c.env);

    // Check if profile exists and sync
    const isNewUser = !(await checkProfileExists(data.user.id, c));

    try {
      await syncUserProfile(
        data.user.id,
        {
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          email: data.user.email,
          phone: data.user.user_metadata?.phone,
          avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
          sign_in_method: 'google',
          provider: 'google',
        },
        locationInfo,
        isNewUser,
        c
      );
      console.log('✅ [OAuth Callback] Profile synced successfully');
    } catch (syncError: any) {
      console.error('❌ [OAuth Callback] Profile sync failed:', syncError);
      // Continue - user is authenticated
    }

    return c.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
        location: formatLocationData(locationInfo),
        redirectUrl,
      },
    });
  } catch (error: any) {
    console.error('❌ [OAuth Callback] Error:', error);
    return c.json({ success: false, message: error.message || 'Internal server error' }, 500);
  }
};

/**
 * POST /auth/reset-password
 * Send password reset email
 */
export const resetPassword = async (c: Context<{ Bindings: CloudflareBindings }>) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ success: false, message: 'Email is required' }, 400);
    }

    const supabase = getSupabaseClient(c.env);
    const origin = getOrigin(c);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    if (resetError) {
      console.error('❌ Password reset error:', resetError);
      return c.json({ success: false, message: resetError.message }, 400);
    }

    return c.json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error: any) {
    console.error('❌ Error in resetPassword:', error);
    return c.json({ success: false, message: error.message || 'Internal server error' }, 500);
  }
};

/**
 * GET /auth/session
 * Verify and return current session
 */
export const getSession = async (c: Context<{ Bindings: CloudflareBindings }>) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, message: 'No authorization token provided' }, 401);
    }

    const token = authHeader.substring(7);
    const supabase = getSupabaseClient(c.env);

    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      console.error('❌ Session verification error:', error);
      return c.json({ success: false, message: 'Invalid or expired token' }, 401);
    }

    return c.json({
      success: true,
      data: {
        user: data.user,
      },
    });
  } catch (error: any) {
    console.error('❌ Error in getSession:', error);
    return c.json({ success: false, message: error.message || 'Internal server error' }, 500);
  }
}