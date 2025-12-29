import { Hono } from 'hono';
import type { CloudflareBindings } from '../types';
import { getAccessToken } from '../controllers/healthians/auth';
import { getPartnerProducts } from '../controllers/healthians/packages';
import { getServiceability } from '../controllers/healthians/serviceability';

const healthiansRoutes = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * GET /healthians/auth
 * Get Healthians access token using partner credentials
 * No authentication required
 * Returns: { success, access_token, refresh_token, token_type, expires_in }
 */
healthiansRoutes.get('/auth', getAccessToken);

/**
 * POST /healthians/packages
 * Get health packages by zipcode
 * Required: accessToken (from auth), zipcode
 * Optional: product_type (default: 'profile'), start (default: '0'), limit (default: '100')
 * Returns: { success, packages, message, zipcode, total }
 */
healthiansRoutes.post('/packages', getPartnerProducts);

/**
 * POST /healthians/serviceability
 * Check service availability with geolocation
 * Required: accessToken
 * Optional: zipcode, latitude, longitude, slot_date, amount, isDeviceSlot, clientIp
 * Uses dual-geolocation: coordinates > zipcode > IP geolocation > fallback
 * Returns: { success, serviceable, message, location, slots_available, sample_slot, all_slots }
 */
healthiansRoutes.post('/serviceability', getServiceability);

export default healthiansRoutes;
