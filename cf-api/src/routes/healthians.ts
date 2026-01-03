import { Hono } from 'hono';
import type { CloudflareBindings } from '../types';
import { getAccessToken } from '../controllers/healthians/auth';
import { getPartnerProducts } from '../controllers/healthians/packages';
import { checkServiceabilityByLocationV2 } from '../controllers/healthians/serviceability';
import { getSlots } from '../controllers/healthians/slots';
import { 
  createHealthiansBooking,
  getHealthiansBooking,
  cancelHealthiansBooking,
} from '../controllers/healthians/booking';

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
// healthiansRoutes.post('/serviceability/v2',);
healthiansRoutes.post('/serviceability', checkServiceabilityByLocationV2);

/**
 * POST /healthians/slots
 * Get available slots for a specific date and location
 * Required: slot_date (YYYY-MM-DD format)
 * Optional: zone_id, zipcode, latitude, longitude, accessToken, get_ppmc_slots, has_female_patient
 * Returns: { success, zone_id, slot_date, slots[], total_slots, healthians_response }
 */
healthiansRoutes.post('/slots', getSlots);

/**
 * POST /healthians/booking
 * Create a booking via Healthians createBooking_v3 API
 * Automatically stores booking in database on success
 * Required: customer[], slot, package, customer_calling_number, mobile, billing_cust_name, 
 *          gender, email, state, cityId, sub_locality, latitude, longitude, address, 
 *          zipcode, vendor_booking_id, vendor_billing_user_id, payment_option, 
 *          discounted_price, zone_id, access_token, user_uuid
 * Optional: landmark, altmobile, altemail, hard_copy, client_id, partial_paid_amount
 * Returns: { success, booking_id, healthians_response, database_record }
 */
healthiansRoutes.post('/booking', createHealthiansBooking);

/**
 * GET /healthians/booking/:bookingId
 * Get booking details from database
 * Returns: { success, data: { id, booking_id, customers, address, packages, ... } }
 */
healthiansRoutes.get('/booking/:bookingId', getHealthiansBooking);

/**
 * PATCH /healthians/booking/:bookingId/cancel
 * Cancel a booking
 * Returns: { success, message, booking_id }
 */
healthiansRoutes.patch('/booking/:bookingId/cancel', cancelHealthiansBooking);

export default healthiansRoutes;
