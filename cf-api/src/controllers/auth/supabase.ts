import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { getCookie, setCookie } from 'hono/cookie';
import { CloudflareBindings } from '../../types';

/**
 * Initialize Supabase client with environment variables
 */
const getSupabaseClient = (env: CloudflareBindings, storage?: Parameters<typeof createClient>[2]['auth']['storage']) => { 
  const supabaseUrl = env.SUPABASE_URL;
  // Prefer service role for server-side auth, but fall back to anon for local/dev if absent
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be configured (use .dev.vars or wrangler secrets).');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storage,
    }
  });
};

/**
 * Get IP address and geolocation data
 */
const getIpAndLocation = async (ip: string, env: any) => {
  try {
    const IP_INFO_TOKEN = env.IP_INFO_TOKEN || 'db04343f368c67';
    
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
    console.error('❌ Error fetching location:', error);
    return {
      ip,
      city: 'Unknown',
      region: 'Unknown',
      country: 'Unknown',
      loc: '0,0',
      org: 'Unknown',
      postal: 'Unknown',
      timezone: 'Unknown'
    };
  }
};

/**
 * Create or update user profile in the database
 */
const syncUserProfile = async (userId: string, userData: any, locationInfo: any, isNewUser: boolean, c: Context) => {
  try {
    console.log('📝 [DB Sync] Starting profile sync for user:', userId);
    console.log('📝 [DB Sync] User data:', JSON.stringify(userData, null, 2));
    console.log('📝 [DB Sync] Is new user:', isNewUser);
    
    const db = c.env.DB;
    if (!db) {
      console.error('❌ [DB Sync] D1 database binding not found!');
      throw new Error('Database not configured');
    }
    
    const { drizzle } = await import('drizzle-orm/d1');
    const { eq } = await import('drizzle-orm');
    const { userProfiles } = await import('../../db/schema');
    const dbInstance = drizzle(db);

    if (isNewUser) {
      // Create new profile
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
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('📝 [DB Sync] Inserting new profile:', JSON.stringify(newProfile, null, 2));
      const result = await dbInstance.insert(userProfiles).values(newProfile);
      console.log('✅ [DB Sync] Profile created successfully for user:', userId);
      console.log('✅ [DB Sync] Insert result:', JSON.stringify(result, null, 2));
      return newProfile;
    } else {
      // Update existing profile
      const existingProfile = await dbInstance
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.uuid, userId))
        .limit(1);

      let existingLoginInfo: any = {};
      if (existingProfile[0]?.user_login_info) {
        try {
          existingLoginInfo = typeof existingProfile[0].user_login_info === 'string'
            ? JSON.parse(existingProfile[0].user_login_info)
            : existingProfile[0].user_login_info;
        } catch (e) {
          existingLoginInfo = {};
        }
      }

      const userLoginInfo = JSON.stringify({
        last_sign_in: new Date().toISOString(),
        sign_in_method: userData.sign_in_method || 'email',
        provider: userData.provider || 'email',
        sign_in_count: (existingLoginInfo?.sign_in_count || 0) + 1,
        ip_address: locationInfo?.ip || existingLoginInfo?.ip_address || 'unknown',
      });

      console.log('📝 [DB Sync] Updating existing profile...');
      const updateData = {
        avatar_url: userData.avatar_url || userData.picture || existingProfile[0]?.avatar_url,
        full_name: userData.full_name || userData.name || existingProfile[0]?.full_name,
        user_login_info: userLoginInfo,
        updated_at: new Date().toISOString(),
      };
      console.log('📝 [DB Sync] Update data:', JSON.stringify(updateData, null, 2));
      
      const result = await dbInstance
        .update(userProfiles)
        .set(updateData)
        .where(eq(userProfiles.uuid, userId));

      console.log('✅ [DB Sync] Profile updated successfully for user:', userId);
      console.log('✅ [DB Sync] Update result:', JSON.stringify(result, null, 2));
      return { ...existingProfile[0], user_login_info: userLoginInfo };
    }
  } catch (error) {
    console.error('❌ Error syncing user profile:', error);
    throw error;
  }
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
          accountNotFound: true 
        }, 401);
      }
      return c.json({ success: false, message: signInError.message }, 401);
    }

    if (!data?.user || !data?.session) {
      return c.json({ success: false, message: 'Authentication failed' }, 401);
    }

    // Get location info
    const locationInfo = await getIpAndLocation(clientIp, c.env);

    // Check if profile exists
    const db = c.env.DB;
    const { drizzle } = await import('drizzle-orm/d1');
    const { eq } = await import('drizzle-orm');
    const { userProfiles } = await import('../../db/schema');
    const dbInstance = drizzle(db);

    const existingProfile = await dbInstance
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.uuid, data.user.id))
      .limit(1);

    const isNewUser = !existingProfile || existingProfile.length === 0;

    // Sync user profile
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

    // Format location data for frontend
    const formattedLocation = {
      coordinates: locationInfo.loc,
      city: locationInfo.city,
      region: locationInfo.region,
      country: locationInfo.country,
      postal: locationInfo.postal,
      timezone: locationInfo.timezone,
      address: `${locationInfo.city}, ${locationInfo.region}, ${locationInfo.country} ${locationInfo.postal}`,
      lastUpdated: new Date().toISOString()
    };

    return c.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
        location: formattedLocation,
      },
    });
  } catch (error: any) {
    console.error('❌ Error in emailSignIn:', error);
    return c.json({ success: false, message: error.message || 'Internal server error' }, 500);
  }
};

/**
 * GET /auth/google
 * Initiate Google OAuth flow
 */
export const initiateGoogleOAuth = async (c: Context<{ Bindings: CloudflareBindings }>) => {
  try {
    console.log('🔵 [Google OAuth] Initiating Google OAuth flow...');
    const redirectUrl = c.req.query('redirectUrl') || '/';
    console.log('🔵 [Google OAuth] Redirect URL:', redirectUrl);

    // In-memory storage to capture PKCE verifier and set it as cookie
    const tempStore: Record<string, string> = {};
    const storage = {
      getItem: (key: string) => {
        console.log('🔵 [Storage] getItem:', key, '=', tempStore[key] || 'null');
        return tempStore[key] ?? null;
      },
      setItem: (key: string, value: string) => { 
        console.log('🔵 [Storage] setItem:', key, '=', value.substring(0, 20) + '...');
        tempStore[key] = value; 
      },
      removeItem: (key: string) => { 
        console.log('🔵 [Storage] removeItem:', key);
        delete tempStore[key]; 
      },
    };

    const supabase = getSupabaseClient(c.env, storage);

    // Get origin with fallback to localhost for dev
    let origin = c.req.header('origin') || c.req.header('referer')?.split('/').slice(0, 3).join('/') || '';
    
    // Fallback to localhost if no origin (for local development)
    if (!origin) {
      origin = 'http://localhost:8080';
      console.warn('⚠️ [Google OAuth] No origin header, using fallback:', origin);
    }
    
    console.log('🔵 [Google OAuth] Origin:', origin);
    
    // Use simple callback URL - redirectUrl will be stored in localStorage
    const callbackUrl = `${origin}/auth/callback`;
    console.log('🔵 [Google OAuth] Callback URL:', callbackUrl);
    
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Ensure Authorization Code (PKCE) flow so frontend receives ?code=
        flowType: 'pkce',
        redirectTo: callbackUrl,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline'
        }
      },
    });

    if (oauthError) {
      console.error('❌ [Google OAuth] Initiation error:', oauthError);
      return c.json({ success: false, message: oauthError.message }, 400);
    }

    // Persist PKCE verifier for the callback exchange
    const pkceVerifier = tempStore['pkce_code_verifier'] || tempStore['sb-pkce-code-verifier'];
    console.log('🔵 [Google OAuth] PKCE verifier captured:', pkceVerifier ? 'YES' : 'NO');
    
    if (pkceVerifier) {
      // Determine if we're in a secure context (HTTPS or localhost for dev)
      const isSecure = origin.startsWith('https://') || origin.includes('localhost') || origin.includes('127.0.0.1');
      const isLocalDev = origin.includes('127.0.0.1') || origin.includes('localhost');
      
      setCookie(c, 'sb-pkce-verifier', pkceVerifier, {
        httpOnly: true,
        secure: isSecure, // true for HTTPS (including localhost over HTTPS)
        sameSite: isLocalDev ? 'Lax' : 'None', // None for cross-origin, Lax for local dev
        path: '/',
        maxAge: 300,
      });
      console.log('✅ [Google OAuth] PKCE verifier stored in cookie (secure:', isSecure, 'sameSite:', isLocalDev ? 'Lax' : 'None', 'origin:', origin, ')');
    } else {
      console.warn('⚠️ [Google OAuth] No PKCE verifier captured!');
    }

    console.log('✅ [Google OAuth] OAuth URL generated:', data.url?.substring(0, 50) + '...');
    return c.json({
      success: true,
      data: {
        url: data.url,
        provider: data.provider
      },
    });
  } catch (error: any) {
    console.error('❌ [Google OAuth] Error in initiateGoogleOAuth:', error);
    return c.json({ success: false, message: error.message || 'Internal server error' }, 500);
  }
};

/**
 * GET /auth/callback
 * Handle OAuth callback (Google)
 */
export const handleOAuthCallback = async (c: Context<{ Bindings: CloudflareBindings }>) => {
  try {
    console.log('🟢 [OAuth Callback] Processing OAuth callback...');
    const code = c.req.query('code');
    const redirectUrl = c.req.query('redirectUrl') || '/';
    console.log('🟢 [OAuth Callback] Code received:', code ? 'YES' : 'NO');
    console.log('🟢 [OAuth Callback] Redirect URL:', redirectUrl);

    if (!code) {
      console.error('❌ [OAuth Callback] No authorization code in URL');
      return c.json({ success: false, message: 'Authorization code missing' }, 400);
    }

    const pkceVerifier = getCookie(c, 'sb-pkce-verifier');
    console.log('🟢 [OAuth Callback] PKCE verifier from cookie:', pkceVerifier ? 'FOUND' : 'MISSING');
    
    const storage = pkceVerifier
      ? {
          getItem: (key: string) => {
            if (key === 'pkce_code_verifier' || key === 'sb-pkce-code-verifier') {
              console.log('🟢 [Storage] Providing PKCE verifier for key:', key);
              return pkceVerifier;
            }
            return null;
          },
          setItem: () => {},
          removeItem: () => {},
        }
      : undefined;

    if (!pkceVerifier) {
      console.warn('⚠️ [OAuth Callback] No PKCE verifier available - exchange may fail');
    }

    const supabase = getSupabaseClient(c.env, storage);
    const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    console.log('🟢 [OAuth Callback] Client IP:', clientIp);

    // Exchange code for session
    console.log('🟢 [OAuth Callback] Exchanging code for session...');
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('❌ [OAuth Callback] Code exchange error:', exchangeError);
      console.error('❌ [OAuth Callback] Error details:', JSON.stringify(exchangeError, null, 2));
      return c.json({ success: false, message: exchangeError.message }, 401);
    }

    if (!data?.user || !data?.session) {
      console.error('❌ [OAuth Callback] No user or session in response');
      return c.json({ success: false, message: 'Failed to establish session' }, 401);
    }

    console.log('✅ [OAuth Callback] Session established for user:', data.user.id);
    console.log('✅ [OAuth Callback] User email:', data.user.email);

    // Clear one-time PKCE verifier cookie after successful exchange
    setCookie(c, 'sb-pkce-verifier', '', {
      path: '/',
      maxAge: 0,
    });

    // Get location info
    const locationInfo = await getIpAndLocation(clientIp, c.env);

    // Check if profile exists
    const db = c.env.DB;
    const { drizzle } = await import('drizzle-orm/d1');
    const { eq } = await import('drizzle-orm');
    const { userProfiles } = await import('../../db/schema');
    const dbInstance = drizzle(db);

    const existingProfile = await dbInstance
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.uuid, data.user.id))
      .limit(1);

    const isNewUser = !existingProfile || existingProfile.length === 0;

    // Sync user profile
    console.log('🟢 [OAuth Callback] Syncing user profile to DB...');
    console.log('🟢 [OAuth Callback] User metadata:', JSON.stringify(data.user.user_metadata, null, 2));
    console.log('🟢 [OAuth Callback] Is new user:', isNewUser);
    
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
      console.log('✅ [OAuth Callback] User profile synced successfully');
    } catch (syncError: any) {
      console.error('❌ [OAuth Callback] Profile sync failed:', syncError);
      console.error('❌ [OAuth Callback] Sync error details:', JSON.stringify(syncError, null, 2));
      // Continue even if profile sync fails - user is authenticated
    }

    // Format location data for frontend
    const formattedLocation = {
      coordinates: locationInfo.loc,
      city: locationInfo.city,
      region: locationInfo.region,
      country: locationInfo.country,
      postal: locationInfo.postal,
      timezone: locationInfo.timezone,
      address: `${locationInfo.city}, ${locationInfo.region}, ${locationInfo.country} ${locationInfo.postal}`,
      lastUpdated: new Date().toISOString()
    };

    return c.json({
      success: true,
      data: {
        user: data.user,
        session: data.session,
        location: formattedLocation,
        redirectUrl,
      },
    });
  } catch (error: any) {
    console.error('❌ Error in handleOAuthCallback:', error);
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
    const origin = c.req.header('origin') || c.req.header('referer')?.split('/').slice(0, 3).join('/') || '';

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
};
