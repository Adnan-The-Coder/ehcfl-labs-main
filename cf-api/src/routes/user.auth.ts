import { Hono } from 'hono';
import { 
  getAllProfiles, 
  createProfile, 
  getProfileByUUID, 
  updateProfileByUUID 
} from '../controllers/user/auth';
import {
  emailSignIn,
  initiateGoogleOAuth,
  handleOAuthCallback,
  resetPassword,
  getSession
} from '../controllers/auth/supabase';

const userRoutes = new Hono();

// ===== Authentication Routes =====
// Email/password sign-in
userRoutes.post('/auth/signin', emailSignIn);

// Initiate Google OAuth flow
userRoutes.get('/auth/google', initiateGoogleOAuth);

// OAuth callback handler
userRoutes.get('/auth/callback', handleOAuthCallback);

// Password reset
userRoutes.post('/auth/reset-password', resetPassword);

// Verify session
userRoutes.get('/auth/session', getSession);

// ===== Profile Routes =====
// Fetch all user profiles
userRoutes.get('/', getAllProfiles);

// Create a new user profile
userRoutes.post('/', createProfile);

// Fetch a single profile by UUID
userRoutes.get('/:uuid', getProfileByUUID);

// Update a profile by UUID
userRoutes.put('/:uuid', updateProfileByUUID);
userRoutes.patch('/:uuid', updateProfileByUUID);

export default userRoutes;
