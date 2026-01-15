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
  listFailedPaidBookings,
  retryFailedPaidBookings,
} from '../controllers/healthians/booking';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { bookings, healthiansWebhookLogs } from '../db/schema';
import crypto from 'crypto';

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

/**
 * GET /healthians/bookings/failed-paid
 * List failed bookings with completed payments
 */
healthiansRoutes.get('/bookings/failed-paid', listFailedPaidBookings);

/** 
 * POST /healthians/bookings/retry-failed-paid
 * Retries Healthians booking creation for all failed bookings with payment done
 * Requires Authorization: Bearer <healthians-token> (or X-Access-Token)
 */
healthiansRoutes.post('/bookings/retry-failed-paid', retryFailedPaidBookings);

/**
 * POST /healthians/webhook
 * Receives async events from Healthians and stores raw payloads
 * Implements basic signature verification (if headers present) and idempotency
 */
healthiansRoutes.post('/webhook', async (c) => {
  try {
    const db = drizzle(c.env.DB);

    // Read payload and headers
    const payload: Record<string, unknown> = await c.req.json().catch(() => ({}));
    const headersObj = Object.fromEntries(c.req.raw.headers);

    // Derive common fields
    const getStr = (obj: Record<string, unknown>, key: string): string | null => {
      const v = obj[key];
      return typeof v === 'string' ? v : null;
    };
    const eventType = getStr(payload, 'event_type') || getStr(payload, 'type') || 'unknown';
    const bookingId = getStr(payload, 'booking_id') || getStr(payload, 'vendor_booking_id');
    const eventId = getStr(payload, 'event_id') || getStr(payload, 'id');
    const signatureHeader =
      headersObj['x-signature'] ||
      headersObj['X-Signature'] ||
      headersObj['x-webhook-signature'] ||
      headersObj['X-Webhook-Signature'] ||
      headersObj['x-checksum'] ||
      headersObj['X-Checksum'] ||
      null;

    // Compute deterministic hash of payload for idempotency
    const payloadString = JSON.stringify(payload);
    const eventHash = crypto.createHash('sha256').update(payloadString).digest('hex');

    // Idempotency: if this eventHash already exists, acknowledge quickly
    const existing = await db
      .select()
      .from(healthiansWebhookLogs)
      .where(eq(healthiansWebhookLogs.event_hash, eventHash));
    if (existing && existing.length > 0) {
      return c.json({ success: true, message: 'Duplicate webhook ignored' });
    }

    // Optional signature verification using env secret (if present)
    const secret = c.env.HEALTHIANS_WEBHOOK_SECRET as string | undefined;
    let signatureValid: boolean | null = null;
    if (secret && signatureHeader) {
      // HMAC SHA256 of raw payload string
      const expected = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
      signatureValid = expected === signatureHeader;
      if (!signatureValid) {
        // Store but note invalid signature; continue to avoid dropping events
        console.warn('Healthians webhook signature invalid');
      }
    }

    // Store raw webhook
    await db.insert(healthiansWebhookLogs).values({
      event_id: eventId || null,
      event_hash: eventHash,
      event_type: String(eventType),
      booking_id: bookingId || null,
      payload: payloadString,
      headers: JSON.stringify(headersObj),
      signature: signatureHeader || null,
      processed: 0,
      received_at: new Date().toISOString(),
    }).run();

    // Process key events to update bookings
    if (bookingId) {
      switch (String(eventType)) {
        case 'BOOKING_CONFIRMED':
          await db
            .update(bookings)
            .set({ status: 'confirmed', updated_at: new Date().toISOString() })
            .where(eq(bookings.booking_id, bookingId))
            .run();
          break;
        case 'BOOKING_CANCELLED':
          await db
            .update(bookings)
            .set({ status: 'cancelled', updated_at: new Date().toISOString() })
            .where(eq(bookings.booking_id, bookingId))
            .run();
          break;
        case 'REPORT_READY':
          // Mark as completed; frontend can fetch report via Healthians
          await db
            .update(bookings)
            .set({ status: 'completed', updated_at: new Date().toISOString() })
            .where(eq(bookings.booking_id, bookingId))
            .run();
          break;
        case 'REFUND_STATUS':
        case 'PAYMENT_STATUS': {
          // If payload contains payment_status, update
          const ps = getStr(payload, 'payment_status');
          if (ps) {
            await db
              .update(bookings)
              .set({ payment_status: ps, updated_at: new Date().toISOString() })
              .where(eq(bookings.booking_id, bookingId))
              .run();
          }
          break;
        }
        default:
          // No-op for other events
          break;
      }
    }

    // Mark as processed
    await db
      .update(healthiansWebhookLogs)
      .set({ processed: 1, processed_at: new Date().toISOString() })
      .where(eq(healthiansWebhookLogs.event_hash, eventHash))
      .run();

    // Respond quickly
    return c.json({ success: true, signatureValid });
  } catch (err) {
    console.error('Healthians webhook error:', err);
    // Always respond 200 to avoid retries storm; include message for observability
    return c.json({ success: true, warning: 'handler-error' });
  }
});

export default healthiansRoutes;
