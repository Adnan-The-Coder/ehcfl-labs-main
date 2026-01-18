/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc } from 'drizzle-orm';
import { userProfiles } from '../../db/schema';
import { parseUserLoginInfo } from '../../helpers/general';
import { UpsertProfileData, UserLoginInfo } from '../../types';


/**
 * Centralized function to upsert user profile
 * Used by both auth flow and direct profile creation
 */
export const upsertProfile = async (
  db: any,
  profileData: UpsertProfileData
): Promise<{ success: boolean; data?: any; message?: string; isNew?: boolean }> => {
  try {
    const dbInstance = drizzle(db);
    const now = new Date().toISOString();

    // Check if profile exists
    const existing = await dbInstance
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.uuid, profileData.uuid))
      .limit(1);

    const profileExists = existing.length > 0;

    if (profileExists) {

      let updatedLoginInfo: UserLoginInfo | undefined;
      if (profileData.user_login_info) {
        const existingLoginInfo = parseUserLoginInfo(existing[0].user_login_info);
        updatedLoginInfo = {
          last_sign_in: profileData.user_login_info.last_sign_in || now,
          sign_in_method: profileData.user_login_info.sign_in_method || existingLoginInfo.sign_in_method || 'email',
          provider: profileData.user_login_info.provider || existingLoginInfo.provider || 'email',
          sign_in_count: (existingLoginInfo.sign_in_count || 0) + 1,
          ip_address: profileData.user_login_info.ip_address || existingLoginInfo.ip_address || 'unknown',
        };
      }

      const updateData: any = {
        updated_at: now,
      };

      // Only update fields that are provided
      if (profileData.full_name !== undefined) updateData.full_name = profileData.full_name;
      if (profileData.email !== undefined) updateData.email = profileData.email.toLowerCase();
      if (profileData.phone !== undefined) updateData.phone = profileData.phone;
      if (profileData.avatar_url !== undefined) updateData.avatar_url = profileData.avatar_url;
      if (profileData.address !== undefined) updateData.address = profileData.address;
      if (profileData.city !== undefined) updateData.city = profileData.city;
      if (profileData.state !== undefined) updateData.state = profileData.state;
      if (profileData.pincode !== undefined) updateData.pincode = profileData.pincode;
      if (profileData.email_notifications !== undefined) updateData.email_notifications = profileData.email_notifications;
      if (updatedLoginInfo) updateData.user_login_info = JSON.stringify(updatedLoginInfo);

      const result = await dbInstance
        .update(userProfiles)
        .set(updateData)
        .where(eq(userProfiles.uuid, profileData.uuid))
        .returning();

      console.log('✅ [Profile] Updated successfully');
      return { success: true, data: result[0], isNew: false };
    } else {
      // Create new profile

      const newLoginInfo: UserLoginInfo = {
        last_sign_in: profileData.user_login_info?.last_sign_in || now,
        sign_in_method: profileData.user_login_info?.sign_in_method || 'email',
        provider: profileData.user_login_info?.provider || 'email',
        sign_in_count: 1,
        ip_address: profileData.user_login_info?.ip_address || 'unknown',
      };

      const newProfile = {
        uuid: profileData.uuid,
        full_name: profileData.full_name || '',
        email: profileData.email.toLowerCase(),
        phone: profileData.phone || null,
        avatar_url: profileData.avatar_url || 'https://avatar.iran.liara.run/public/boy?username=[8]',
        address: profileData.address || null,
        city: profileData.city || null,
        state: profileData.state || null,
        pincode: profileData.pincode || null,
        email_notifications: (profileData.email_notifications ?? true).toString(),
        user_login_info: JSON.stringify(newLoginInfo),
        created_at: now,
        updated_at: now,
      };

      const result = await dbInstance
        .insert(userProfiles)
        .values(newProfile)
        .returning();

      console.log('✅ [Profile] Created successfully');
      return { success: true, data: result[0], isNew: true };
    }
  } catch (error) {
    console.error('❌ [Profile] Upsert error:', error);
    return { success: false, message: 'Failed to upsert profile' };
  }
};

export const getAllProfiles = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    
    const profiles = await db
      .select()
      .from(userProfiles)
      .orderBy(desc(userProfiles.created_at));
    
    return c.json({
      success: true,
      message: 'Profiles fetched successfully!',
      data: profiles,
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return c.json({ success: false, message: 'Internal server error.' }, 500);
  }
};

export const createProfile = async (c: Context) => {
  try {
    const body = await c.req.json();
    const {
      full_name,
      email,
      uuid,
      avatar_url,
      phone,
      address,
      city,
      state,
      pincode,
      email_notifications,
      user_login_info,
    } = body;

    // Basic Validation
    if (!full_name || !email || !uuid) {
      return c.json({ success: false, message: 'Full Name, Email and UUID fields are required.' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ success: false, message: 'Invalid email address.' }, 400);
    }

    // Parse user_login_info if provided
    let loginInfo: Partial<UserLoginInfo> | undefined;
    if (user_login_info) {
      loginInfo = typeof user_login_info === 'string' 
        ? JSON.parse(user_login_info) 
        : user_login_info;
    }

    // Use centralized upsert function
    const result = await upsertProfile(c.env.DB, {
      uuid,
      full_name,
      email,
      phone,
      avatar_url,
      address,
      city,
      state,
      pincode,
      email_notifications,
      user_login_info: loginInfo,
    });

    if (!result.success) {
      return c.json({ success: false, message: result.message || 'Failed to create/update profile' }, 500);
    }

    return c.json({
      success: true,
      message: result.isNew ? 'Profile created successfully!' : 'Profile updated successfully!',
      data: {
        id: result.data.id,
        name: result.data.full_name,
        email: result.data.email,
        phone: result.data.phone,
        address: result.data.address,
        city: result.data.city,
        state: result.data.state,
        pincode: result.data.pincode,
        user_login_info: result.data.user_login_info,
        createdAt: result.data.created_at,
      }
    });

  } catch (error) {
    console.error('❌ Profile Creation error:', error);
    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.',
    }, 500);
  }
};

export const getProfileByUUID = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const uuid = c.req.param('uuid');

    if (!uuid) {
      return c.json({ success: false, message: 'UUID is required.' }, 400);
    }

    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.uuid, uuid))
      .limit(1);

    if (profile.length === 0) {
      return c.json({ success: false, message: 'Profile not found.' }, 404);
    }

    return c.json({
      success: true,
      message: 'Profile fetched successfully!',
      data: profile[0],
    });
  } catch (error) {
    console.error('Error fetching profile by UUID:', error);
    return c.json({ success: false, message: 'Internal server error.' }, 500);
  }
};

export const updateProfileByUUID = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const uuid = c.req.param('uuid');
    const body = await c.req.json();

    if (!uuid) {
      return c.json({ success: false, message: 'UUID is required.' }, 400);
    }

    // Only allow updating fields that exist in the schema
    const allowedFields = [
      'full_name', 'avatar_url', 'phone', 'address', 'city', 'state', 'pincode',
      'email_notifications', 'user_login_info',
    ];
    const updateData: Record<string, any> = {};

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        // Serialize user_login_info if it's an object
        if (key === 'user_login_info' && typeof body[key] === 'object') {
          updateData[key] = JSON.stringify(body[key]);
        } else {
          updateData[key] = body[key];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return c.json({ success: false, message: 'No valid fields to update.' }, 400);
    }

    updateData.updated_at = new Date().toISOString();

    const result = await db
      .update(userProfiles)
      .set(updateData)
      .where(eq(userProfiles.uuid, uuid))
      .run();

    const res = result as any;

    if (!res.success) {
      return c.json({ success: false, message: 'Profile not found or nothing changed.' }, 404);
    }

    return c.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Error updating profile by UUID:', error);
    return c.json({ success: false, message: 'Internal server error.' }, 500);
  }
};
