import { Context } from 'hono';
import { createClient } from '@supabase/supabase-js';

/**
 * Initialize Supabase client with environment variables
 */
const getSupabaseClient = (env: any) => {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in wrangler.jsonc');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
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
    const db = c.env.DB;
    const { drizzle } = await import('drizzle-orm/d1');
    const { eq } = await import('drizzle-orm');
    const { usersTable } = await import('../../db/schema');
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

      await dbInstance.insert(usersTable).values(newProfile);
      console.log('✅ Profile created for user:', userId);
      return newProfile;
    } else {
      // Update existing profile
      const existingProfile = await dbInstance
        .select()
        .from(usersTable)
        .where(eq(usersTable.uuid, userId))
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

      await dbInstance
        .update(usersTable)
        .set({
          avatar_url: userData.avatar_url || userData.picture || existingProfile[0]?.avatar_url,
          full_name: userData.full_name || userData.name || existingProfile[0]?.full_name,
          user_login_info: userLoginInfo,
          updated_at: new Date().toISOString(),
        })
        .where(eq(usersTable.uuid, userId));

      console.log('✅ Profile updated for user:', userId);
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
export const emailSignIn = async (c: Context) => {
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
    const { usersTable } = await import('../../db/schema');
    const dbInstance = drizzle(db);

    const existingProfile = await dbInstance
      .select()
      .from(usersTable)
      .where(eq(usersTable.uuid, data.user.id))
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
export const initiateGoogleOAuth = async (c: Context) => {
  try {
    const redirectUrl = c.req.query('redirectUrl') || '/';
    const supabase = getSupabaseClient(c.env);

    const origin = c.req.header('origin') || c.req.header('referer')?.split('/').slice(0, 3).join('/') || '';
    
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Ensure Authorization Code (PKCE) flow so frontend receives ?code=
        flowType: 'pkce',
        redirectTo: `${origin}/auth/callback?redirectUrl=${encodeURIComponent(redirectUrl)}`,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline'
        }
      },
    });

    if (oauthError) {
      console.error('❌ Google OAuth initiation error:', oauthError);
      return c.json({ success: false, message: oauthError.message }, 400);
    }

    return c.json({
      success: true,
      data: {
        url: data.url,
        provider: data.provider
      },
    });
  } catch (error: any) {
    console.error('❌ Error in initiateGoogleOAuth:', error);
    return c.json({ success: false, message: error.message || 'Internal server error' }, 500);
  }
};

/**
 * GET /auth/callback
 * Handle OAuth callback (Google)
 */
export const handleOAuthCallback = async (c: Context) => {
  try {
    const code = c.req.query('code');
    const redirectUrl = c.req.query('redirectUrl') || '/';

    if (!code) {
      return c.json({ success: false, message: 'Authorization code missing' }, 400);
    }

    const supabase = getSupabaseClient(c.env);
    const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';

    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('❌ Code exchange error:', exchangeError);
      return c.json({ success: false, message: exchangeError.message }, 401);
    }

    if (!data?.user || !data?.session) {
      return c.json({ success: false, message: 'Failed to establish session' }, 401);
    }

    // Get location info
    const locationInfo = await getIpAndLocation(clientIp, c.env);

    // Check if profile exists
    const db = c.env.DB;
    const { drizzle } = await import('drizzle-orm/d1');
    const { eq } = await import('drizzle-orm');
    const { usersTable } = await import('../../db/schema');
    const dbInstance = drizzle(db);

    const existingProfile = await dbInstance
      .select()
      .from(usersTable)
      .where(eq(usersTable.uuid, data.user.id))
      .limit(1);

    const isNewUser = !existingProfile || existingProfile.length === 0;

    // Sync user profile
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
export const resetPassword = async (c: Context) => {
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
export const getSession = async (c: Context) => {
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
