import { API_ENDPOINTS } from '@/config/api';

export interface UserProfileData {
  full_name?: string;
  email?: string;
  avatar_url?: string;
  phone?: string;
}

/**
 * Sync user profile to database after authentication
 * The backend endpoint now handles both create and update (upsert)
 * So we just need to call createProfile regardless of whether it exists
 */
export async function syncUserProfileToDB(userId: string, userData: UserProfileData) {
  try {
    console.log('🔄 [ProfileSync] Syncing profile for user:', userId);

    const response = await fetch(API_ENDPOINTS.createProfile, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uuid: userId,
        ...userData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [ProfileSync] Sync failed:', error);
      throw new Error(error.message || 'Failed to sync profile');
    }

    const result = await response.json();
    console.log('✅ [ProfileSync] Profile synced successfully');
    return result;
  } catch (error: any) {
    console.error('❌ [ProfileSync] Error:', error);
    // Don't throw - profile sync failure shouldn't block authentication
    console.warn('⚠️ [ProfileSync] Profile sync failed, but user is authenticated');
    return null;
  }
}
