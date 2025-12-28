import { Hono } from 'hono';
import { 
  getAllProfiles, 
  createProfile, 
  getProfileByUUID, 
  updateProfileByUUID 
} from '../controllers/user/auth';

const userRoutes = new Hono();

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
