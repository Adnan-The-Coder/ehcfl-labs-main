/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Healthians Booking Controller
 * 
 * IMPORTANT: CHECKSUM CONFIGURATION
 * ---------------------------------
 * The Healthians API requires a checksum secret key for booking creation.
 * 
 * To configure:
 * 1. Contact Healthians support/business team to obtain your checksum secret key
 * 2. Update wrangler.jsonc file with the actual secret:
 *    "HEALTHIANS_CHECKSUM_SECRET": "your-actual-secret-from-healthians"
 * 3. For production, set in Cloudflare Workers environment variables
 * 
 * The checksum is generated using SHA-256 HMAC with format:
 * vendor_booking_id|zone_id|customer_calling_number|discounted_price|zipcode
 * 
 * Reference: https://partners.healthians.com/#/sample_checksum_code?sha256
 */
import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { bookings as bookingsTable } from '../../db/schema';
import { storeBookingInDB } from '../booking/booking';
import crypto from 'crypto';

interface CreateBookingRequest {
  // Healthians booking data
  customer: Array<{
    customer_id: string;
    customer_name: string;
    relation: string;
    age: number;
    dob: string;
    gender: string;
    contact_number: string;
    email?: string;
    application_number?: string;
    customer_remarks?: string;
  }>;
  slot: {
    slot_id: string;
  };
  package: Array<{
    deal_id: string[];
  }>;
  customer_calling_number: string;
  billing_cust_name: string;
  gender: string;
  mobile: string;
  email?: string;
  state: number;
  cityId: number;
  sub_locality: string;
  latitude: string;
  longitude: string;
  address: string;
  zipcode: string;
  landmark?: string;
  altmobile?: string;
  altemail?: string;
  hard_copy?: number;
  vendor_booking_id: string;
  vendor_billing_user_id: string;
  payment_option: 'prepaid' | 'cod';
  discounted_price: number;
  zone_id: number;
  client_id?: string;
  partial_paid_amount?: number;
  
  // Our DB fields
  user_uuid: string;
  access_token: string;
}

interface HealthiansBookingResponse {
  status: boolean;
  success?: boolean;
  booking_id?: string;
  id?: string;
  message?: string;
  data?: unknown;
  resCode?: string;
  code?: string;
}

interface BookingResponse {
  success: boolean;
  booking_id?: string;
  healthians_response?: HealthiansBookingResponse;
  database_record?: {
    id: number;
    booking_id: string;
    user_uuid: string;
    status: string;
    created_at: string;
  };
  message: string;
  error?: string;
  details?: unknown;
}

/**
 * Generate X-Checksum for Healthians booking
 * Healthians uses SHA-256 HMAC with pipe-separated values
 * 
 * Common formats to try:
 * Format 1: vendor_booking_id|zone_id|customer_calling_number|discounted_price|zipcode
 * Format 2: vendor_booking_id|customer_calling_number|discounted_price|zipcode
 * Format 3: All the booking payload as JSON string
 */
function generateChecksum(bookingData: CreateBookingRequest, secretKey: string): string {
  // Ensure all values are strings for consistency
  const vendorBookingId = String(bookingData.vendor_booking_id);
  const zoneId = String(bookingData.zone_id);
  const customerCallingNumber = String(bookingData.customer_calling_number);
  const discountedPrice = String(bookingData.discounted_price);
  const zipcode = String(bookingData.zipcode);

  // Format 1: Most common pattern for Healthians
  // vendor_booking_id|zone_id|customer_calling_number|discounted_price|zipcode
  const dataToHash = `${vendorBookingId}|${zoneId}|${customerCallingNumber}|${discountedPrice}|${zipcode}`;

  console.log('🔐 Checksum Input Data:', {
    vendor_booking_id: vendorBookingId,
    zone_id: zoneId,
    customer_calling_number: customerCallingNumber,
    discounted_price: discountedPrice,
    zipcode: zipcode,
    concatenated: dataToHash,
  });
  console.log('🔐 Secret Key Length:', secretKey ? secretKey.length : 0);
  console.log('🔐 Secret Key Present:', secretKey ? 'YES' : 'NO');

  // Hash with secret key using SHA256 HMAC
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(dataToHash);
  const checksumHex = hmac.digest('hex');
  
  console.log('🔐 Generated Checksum (hex):', checksumHex);
  console.log('🔐 Checksum Length:', checksumHex.length);
  
  return checksumHex;
}

/**
 * Create booking via Healthians createBooking_v3 API
 * Then store booking details in D1 database
 */
export const createHealthiansBooking = async (c: Context) => {
  try {
    const body: CreateBookingRequest = await c.req.json().catch(() => ({}));

    const baseUrl = c.env.HEALTHIANS_BASE_URL as string;
    const partnerName = c.env.HEALTHIANS_PARTNER_NAME as string;
    const accessToken = body.access_token || c.req.header('X-Access-Token');
    const checksumSecret = c.env.HEALTHIANS_CHECKSUM_SECRET as string;

    // Validate required fields
    if (!body.vendor_booking_id || !body.customer_calling_number || !body.mobile) {
      return c.json(
        {
          success: false,
          message: 'Missing required fields: vendor_booking_id, customer_calling_number, mobile',
        },
        400
      );
    }

    if (!accessToken) {
      return c.json(
        {
          success: false,
          message: 'Access token is required',
        },
        400
      );
    }

    if (!baseUrl || !partnerName) {
      return c.json(
        {
          success: false,
          message: 'Healthians configuration not found',
        },
        500
      );
    }

    // Validate customer array
    if (!Array.isArray(body.customer) || body.customer.length === 0) {
      return c.json(
        {
          success: false,
          message: 'At least one customer is required',
        },
        400
      );
    }

    // Validate packages array
    if (!Array.isArray(body.package) || body.package.length === 0) {
      return c.json(
        {
          success: false,
          message: 'At least one package is required',
        },
        400
      );
    }

    // Validate required numeric fields
    if (!body.zone_id || typeof body.zone_id !== 'number') {
      return c.json(
        {
          success: false,
          message: 'Valid zone_id is required',
        },
        400
      );
    }

    if (!body.discounted_price || typeof body.discounted_price !== 'number' || body.discounted_price <= 0) {
      return c.json(
        {
          success: false,
          message: 'Valid discounted_price is required',
        },
        400
      );
    }

    // Validate slot
    if (!body.slot || !body.slot.slot_id) {
      return c.json(
        {
          success: false,
          message: 'Valid slot with slot_id is required',
        },
        400
      );
    }

    // Validate address fields
    if (!body.zipcode || !/^\d{6}$/.test(body.zipcode)) {
      return c.json(
        {
          success: false,
          message: 'Valid 6-digit zipcode is required',
        },
        400
      );
    }

    // Validate checksum secret (warning only, don't block booking)
    let checksum = '';
    let checksumWarning = '';
    
    if (!checksumSecret) {
      console.warn('⚠️ HEALTHIANS_CHECKSUM_SECRET not configured');
      checksumWarning = 'Checksum secret not configured. Healthians sync will likely fail.';
      checksum = 'missing-checksum-secret';
    } else if (checksumSecret === 'your-checksum-secret-key' || checksumSecret === 'default-secret') {
      console.warn('⚠️ WARNING: Using placeholder HEALTHIANS_CHECKSUM_SECRET!');
      checksumWarning = 'Using placeholder checksum secret. Contact Healthians support for actual secret.';
      checksum = generateChecksum(body, checksumSecret);
    } else {
      // Generate checksum with validated secret
      checksum = generateChecksum(body, checksumSecret);
    }

    console.log('Creating Healthians booking:', {
      vendor_booking_id: body.vendor_booking_id,
      customers: body.customer.length,
      packages: body.package.length,
      zone_id: body.zone_id,
      checksum_status: checksumWarning || 'valid',
    });

    // Prepare Healthians API request
    const healthiansPayload = {
      customer: body.customer,
      slot: body.slot,
      package: body.package,
      customer_calling_number: body.customer_calling_number,
      billing_cust_name: body.billing_cust_name,
      gender: body.gender,
      mobile: body.mobile,
      email: body.email || '',
      state: body.state,
      cityId: body.cityId,
      sub_locality: body.sub_locality,
      latitude: body.latitude,
      longitude: body.longitude,
      address: body.address,
      zipcode: body.zipcode,
      landmark: body.landmark || '',
      altmobile: body.altmobile || '',
      altemail: body.altemail || '',
      hard_copy: body.hard_copy ?? 0,
      vendor_booking_id: body.vendor_booking_id,
      vendor_billing_user_id: body.vendor_billing_user_id,
      payment_option: body.payment_option,
      discounted_price: body.discounted_price,
      zone_id: body.zone_id,
      client_id: body.client_id || '',
      ...(body.partial_paid_amount && { partial_paid_amount: body.partial_paid_amount }),
    };

    const url = `${baseUrl}/api/${partnerName}/createBooking_v3`;
    console.log("healthians booking payload", healthiansPayload);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Checksum': checksum,
      },
      body: JSON.stringify(healthiansPayload),
    });

    console.log('Healthians createBooking_v3 response status:', response.status);

    const db = drizzle(c.env.DB);
    let healthiansResponse: HealthiansBookingResponse | null = null;
    let healthiansSyncStatus: 'pending' | 'synced' | 'failed' = 'pending';
    let healthiansBookingId: string | null = null;
    let healthiansError: string | null = checksumWarning || null;

    // Try to process Healthians response
    if (!response.ok) {
      const errorData = await safeJson(response);
      console.error('⚠️ Healthians booking creation failed:', errorData);
      
      healthiansSyncStatus = 'failed';
      const apiError = (errorData as any)?.message || (errorData as any)?.code || `HTTP ${response.status} error`;
      healthiansError = checksumWarning 
        ? `${checksumWarning} | API Error: ${apiError}`
        : apiError;
      healthiansResponse = errorData as HealthiansBookingResponse;

      console.log('📝 Healthians API failed, storing booking locally to allow payment...');
    } else {
      healthiansResponse = await response.json() as HealthiansBookingResponse;
      console.log('Healthians booking response:', {
        success: healthiansResponse?.success || healthiansResponse?.status,
        booking_id: healthiansResponse?.booking_id || healthiansResponse?.id,
        message: healthiansResponse?.message,
      });

      // Check both 'success' and 'status' fields as Healthians API may return either
      const isSuccess = healthiansResponse.success === true || healthiansResponse.status === true;
      
      if (isSuccess) {
        healthiansSyncStatus = 'synced';
        healthiansBookingId = healthiansResponse.booking_id || healthiansResponse.id || null;
        console.log('✅ Healthians booking successful:', healthiansBookingId);
      } else {
        healthiansSyncStatus = 'failed';
        healthiansError = healthiansResponse?.message || 'Healthians booking creation failed';
        console.log('⚠️ Healthians returned error:', healthiansError);
      }
    }

    // Store booking in database regardless of Healthians API status
    // This allows user to proceed with payment even if Healthians sync fails
    const localBookingId = healthiansBookingId || body.vendor_booking_id;
    
    let dbRecord;
    try {
      dbRecord = await storeBookingInDB(db, {
        booking_id: localBookingId,
        user_uuid: body.user_uuid || 'guest',
        customers: body.customer,
        address: {
          line1: body.address,
          locality: body.sub_locality,
          landmark: body.landmark || '',
          city: body.cityId.toString(),
          state: body.state.toString(),
          zipCode: body.zipcode,
          latitude: body.latitude,
          longitude: body.longitude,
        },
        booking_date: new Date().toISOString().split('T')[0],
        time_slot: body.slot.slot_id,
        packages: body.package,
        total_price: body.discounted_price,
        coupon: null,
        payment_method: body.payment_option,
        payment_status: body.payment_option === 'prepaid' ? 'pending' : 'cod_pending',
        status: 'confirmed',
        healthians_booking_id: healthiansBookingId || undefined,
        healthians_sync_status: healthiansSyncStatus,
        healthians_sync_attempts: 1,
        healthians_last_error: healthiansError || undefined,
        healthians_response: healthiansResponse || undefined,
      });

      console.log('✅ Booking stored in local database:', {
        id: dbRecord.id,
        booking_id: dbRecord.booking_id,
        healthians_sync_status: dbRecord.healthians_sync_status,
      });
    } catch (dbError) {
      console.error('❌ Critical: Failed to store booking in database:', dbError);
      // Database storage is critical - if this fails, we cannot proceed
      return c.json(
        {
          success: false,
          message: 'Failed to store booking in database',
          error: dbError instanceof Error ? dbError.message : 'Database error',
          healthians_status: healthiansSyncStatus,
          healthians_error: healthiansError,
        },
        500
      );
    }

    // Return success response to allow payment to proceed
    // Include sync status so frontend knows if Healthians booking succeeded
    return c.json({
      success: true,
      booking_id: localBookingId,
      message: healthiansSyncStatus === 'synced' 
        ? 'Booking created successfully' 
        : 'Booking saved. Healthians sync will be retried later.',
      healthians_sync_status: healthiansSyncStatus,
      healthians_booking_id: healthiansBookingId,
      healthians_error: healthiansError,
      database_record: {
        id: dbRecord.id,
        booking_id: dbRecord.booking_id,
        user_uuid: dbRecord.user_uuid,
        status: dbRecord.status,
        healthians_sync_status: dbRecord.healthians_sync_status,
        created_at: dbRecord.created_at,
      },
      healthians_response: healthiansSyncStatus === 'synced' ? {
        booking_id: healthiansBookingId,
        message: healthiansResponse?.message,
      } : undefined,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Healthians booking exception:', errorMessage, errorStack);
    return c.json(
      {
        success: false,
        message: 'Unexpected error while creating booking',
        error: errorMessage,
      },
      500
    );
  }
};

/**
 * Get booking details from Healthians and local database
 */
export const getHealthiansBooking = async (c: Context) => {
  try {
    const bookingId = c.req.param('bookingId');

    if (!bookingId) {
      return c.json(
        {
          success: false,
          message: 'Booking ID is required',
        },
        400
      );
    }

    const db = drizzle(c.env.DB);

    // Fetch from local database
    const booking = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.booking_id, bookingId))
      .limit(1);

    if (!booking || booking.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Booking not found',
        },
        404
      );
    }

    const bookingRecord = booking[0];
    return c.json({
      success: true,
      message: 'Booking fetched successfully',
      data: {
        id: bookingRecord.id,
        booking_id: bookingRecord.booking_id,
        user_uuid: bookingRecord.user_uuid,
        customers: safeJsonParse(bookingRecord.customers, []),
        address: safeJsonParse(bookingRecord.address, {}),
        booking_date: bookingRecord.booking_date,
        time_slot: bookingRecord.time_slot,
        packages: safeJsonParse(bookingRecord.packages, []),
        total_price: bookingRecord.total_price,
        payment_method: bookingRecord.payment_method,
        payment_status: bookingRecord.payment_status,
        status: bookingRecord.status,
        created_at: bookingRecord.created_at,
        updated_at: bookingRecord.updated_at,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching Healthians booking:', errorMessage);
    return c.json(
      {
        success: false,
        message: 'Error fetching booking',
        error: errorMessage,
      },
      500
    );
  }
};

/**
 * Cancel a booking
 */
export const cancelHealthiansBooking = async (c: Context) => {
  try {
    const bookingId = c.req.param('bookingId');
    const db = drizzle(c.env.DB);

    if (!bookingId) {
      return c.json(
        {
          success: false,
          message: 'Booking ID is required',
        },
        400
      );
    }

    // Update booking status to cancelled
    const result = await db
      .update(bookingsTable)
      .set({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .where(eq(bookingsTable.booking_id, bookingId))
      .returning();

    if (!result || result.length === 0) {
      return c.json(
        {
          success: false,
          message: 'Booking not found or already cancelled',
        },
        404
      );
    }

    return c.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking_id: bookingId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error cancelling booking:', errorMessage);
    return c.json(
      {
        success: false,
        message: 'Error cancelling booking',
        error: errorMessage,
      },
      500
    );
  }
};

async function safeJson(resp: Response): Promise<unknown | undefined> {
  try {
    return await resp.json();
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    return undefined;
  }
}

function safeJsonParse<T = unknown>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Failed to parse JSON string:', error);
    return fallback;
  }
}
