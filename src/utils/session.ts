/**
 * Session management utility for EHCF application
 * Handles localStorage-based session without Supabase client-side auth
 */

export interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
}

export interface UserData {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
    phone?: string;
  };
}

/**
 * Get the current session from localStorage
 */
export function getSession(): SessionData | null {
  try {
    const sessionData = localStorage.getItem('ehcf_session');
    if (!sessionData) return null;
    return JSON.parse(sessionData);
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get the current user from localStorage
 */
export function getUser(): UserData | null {
  try {
    const userData = localStorage.getItem('ehcf_user');
    if (!userData) return null;
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Get the user's ID from the session
 */
export function getUserId(): string | null {
  const user = getUser();
  return user?.id || null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const session = getSession();
  const user = getUser();
  return !!(session && user);
}

/**
 * Get the access token for API requests
 */
export function getAccessToken(): string | null {
  const session = getSession();
  return session?.access_token || null;
}

/**
 * Clear all session data (sign out)
 */
export function clearSession(): void {
  localStorage.removeItem('ehcf_session');
  localStorage.removeItem('ehcf_user');
  localStorage.removeItem('ehcf_user_location');
  localStorage.removeItem('authRedirectUrl');
}

/**
 * Store session and user data
 */
export function setSession(sessionData: SessionData, userData: UserData): void {
  localStorage.setItem('ehcf_session', JSON.stringify(sessionData));
  localStorage.setItem('ehcf_user', JSON.stringify(userData));
}

/**
 * Get user location from localStorage
 */
export function getUserLocation() {
  try {
    const locationData = localStorage.getItem('ehcf_user_location');
    if (!locationData) return null;
    return JSON.parse(locationData);
  } catch (error) {
    console.error('Error getting user location:', error);
    return null;
  }
}
