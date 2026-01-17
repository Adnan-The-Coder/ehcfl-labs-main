/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc } from 'drizzle-orm';
import { userProfiles } from '../../db/schema';

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
    const db = drizzle(c.env.DB);
    const body = await c.req.json();
    const {
      full_name,
      email,
      uuid,
      avatar_url = 'https://avatar.iran.liara.run/public/boy?username=[8]',
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

    // Serialize user_login_info if it's an object
    const userLoginInfoString = user_login_info 
      ? (typeof user_login_info === 'string' ? user_login_info : JSON.stringify(user_login_info))
      : null;

    // Upsert: Try to insert, if uuid already exists it will be ignored and we'll update instead
    const now = new Date().toISOString();
    
    // First check if profile exists
    const existing = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.uuid, uuid))
      .limit(1);

    let result;
    if (existing.length > 0) {
      // Profile exists, update it
      console.log('User Profile exists, updating...');
      result = await db
        .update(userProfiles)
        .set({
          full_name,
          email: email.toLowerCase(),
          avatar_url,
          phone: phone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          pincode: pincode || null,
          email_notifications,
          user_login_info: userLoginInfoString,
          updated_at: now,
        })
        .where(eq(userProfiles.uuid, uuid))
        .returning();
      
      return c.json({
        success: true,
        message: 'Profile updated successfully!',
        data: {
          id: result[0].id,
          name: result[0].full_name,
          email: result[0].email,
          phone: result[0].phone,
          address: result[0].address,
          city: result[0].city,
          state: result[0].state,
          pincode: result[0].pincode,
          user_login_info: result[0].user_login_info,
          createdAt: result[0].created_at,
        }
      });
    } else {
      console.log('Creating new user profile...');
      result = await db
        .insert(userProfiles)
        .values({
          uuid,
          full_name,
          email: email.toLowerCase(),
          avatar_url,
          phone: phone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          pincode: pincode || null,
          email_notifications,
          user_login_info: userLoginInfoString,
          created_at: now,
          updated_at: now,
        })
        .returning();

      return c.json({
        success: true,
        message: 'Profile created successfully!',
        data: {
          id: result[0].id,
          name: result[0].full_name,
          email: result[0].email,
          phone: result[0].phone,
          address: result[0].address,
          city: result[0].city,
          state: result[0].state,
          pincode: result[0].pincode,
          user_login_info: result[0].user_login_info,
          createdAt: result[0].created_at,
        }
      });
    }

  } catch (error) {
    console.error('Profile Creation error:', error);
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
