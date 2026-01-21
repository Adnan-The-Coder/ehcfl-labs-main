/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Healthians Booking Controller
 * 
 * IMPORTANT: CHECKSUM CONFIGURATION
 * ---------------------------------
 * The Healthians API requires a checksum for booking creation.
 * 
 * Configuration:
 * - Set HEALTHIANS_CHECKSUM_KEY in .dev.vars / wrangler secrets
 * - The checksum is generated using HMAC-SHA256 with ALL booking data fields
 * - Fields are sorted alphabetically for consistent, deterministic hashing
 * - JSON structure is maintained for proper payload validation
 * 
 * Reference: https://partners.healthians.com/#/sample_checksum_code?sha256
 * API Docs: https://documenter.getpostman.com/view/981593/SWLmWPKY?version=latest
 */
import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { bookings as bookingsTable } from '../../db/schema';
import { storeBookingInDB } from '../booking/booking';
import crypto from 'crypto';
import { ServerResponse } from 'http';

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
 * Create booking via Healthians createBooking_v3 API
 * Then store booking details in D1 database
 */
export const createHealthiansBooking = async (c: Context) => {
  try {
    const body: CreateBookingRequest = await c.req.json().catch(() => ({}));

    const baseUrl = c.env.HEALTHIANS_BASE_URL as string;
    const partnerName = c.env.HEALTHIANS_PARTNER_NAME as string;
    const accessToken = body.access_token || c.req.header('X-Access-Token');
    const checksumKey = c.env.HEALTHIANS_CHECKSUM_KEY as string | undefined;

    // Validate checksum key
    if (!checksumKey) {
      return c.json(
        {
          success: false,
          message: 'HEALTHIANS_CHECKSUM_KEY not configured',
        },
        500
      );
    }

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

    // Use checksum key directly
    if (!checksumKey) {
      return c.json(
        {
          success: false,
          message: 'HEALTHIANS_CHECKSUM_KEY not configured',
        },
        500
      );
    }

    console.log('Creating Healthians booking:', {
      vendor_booking_id: body.vendor_booking_id,
      customers: body.customer.length,
      packages: body.package.length,
      zone_id: body.zone_id,
      checksum_configured: true,
    });

    // Build the exact payload that will be sent to Healthians
    // This ensures checksum is calculated on the same data
    const healthiansPayload = {
      address: body.address,
      altemail: body.altemail || '',
      altmobile: body.altmobile || '',
      billing_cust_name: body.billing_cust_name,
      cityId: body.cityId,
      client_id: body.client_id || '',
      customer: body.customer,
      customer_calling_number: body.customer_calling_number,
      discounted_price: body.discounted_price,
      email: body.email || '',
      gender: body.gender,
      hard_copy: body.hard_copy ?? 0,
      landmark: body.landmark || '',
      latitude: body.latitude,
      longitude: body.longitude,
      mobile: body.mobile,
      package: body.package,
      payment_option: body.payment_option,
      slot: body.slot,
      state: body.state,
      sub_locality: body.sub_locality,
      vendor_billing_user_id: body.vendor_billing_user_id,
      vendor_booking_id: body.vendor_booking_id,
      zipcode: body.zipcode,
      zone_id: body.zone_id,
      ...(body.partial_paid_amount && { partial_paid_amount: body.partial_paid_amount }),
    };

    // Generate checksum from the exact payload that will be sent
    const checksum = generateChecksum(healthiansPayload, checksumKey);

    const url = `${baseUrl}/api/${partnerName}/createBooking_v3`;
    
    // Log the actual request being sent for debugging
    console.log('📋 Request Payload:', JSON.stringify(healthiansPayload));
    console.log('✅ Checksum Header:', checksum);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': accessToken && accessToken.startsWith('Bearer ')
          ? accessToken
          : `Bearer ${accessToken}`,
        'X-Checksum': checksum,
      },
      body: JSON.stringify(healthiansPayload),
    });


    console.log('Healthians createBooking_v3 response status:', response.status);
    console.log("Healthians Response Received: ", response);

    const db = drizzle(c.env.DB);
    let healthiansResponse: HealthiansBookingResponse | null = null;
    let healthiansSyncStatus: 'pending' | 'synced' | 'failed' = 'pending';
    let healthiansBookingId: string | null = null;
    let healthiansError: string | null = null;

    // Try to process Healthians response
    if (!response.ok) {
      const errorData = await safeJson(response);
      console.error('⚠️ Healthians booking creation failed:', errorData);
      
      healthiansSyncStatus = 'failed';
      const apiError = (errorData as any)?.message || (errorData as any)?.code || `HTTP ${response.status} error`;
      healthiansError = apiError;
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

/**
 * Create a deterministic JSON string with sorted keys
 * This ensures consistent checksum generation regardless of property order
 * @param obj - The object to stringify
 * @returns Sorted JSON string
 */
function createDeterministicJson(obj: any): string {
  if (obj === null || obj === undefined) return '';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  
  if (Array.isArray(obj)) {
    return JSON.stringify(obj.map(item => createDeterministicJsonObject(item)));
  }
  
  return JSON.stringify(createDeterministicJsonObject(obj));
}

function createDeterministicJsonObject(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => createDeterministicJsonObject(item));
  }
  
  const keys = Object.keys(obj).sort();
  const sorted: Record<string, any> = {};
  
  for (const key of keys) {
    sorted[key] = createDeterministicJsonObject(obj[key]);
  }
  
  return sorted;
}

/**
 * Generate a checksum using HMAC-SHA256 algorithm
 * Calculates checksum on the exact payload that will be sent to Healthians API
 * Properly handles key encoding and data formatting
 * @param payload - The exact payload object being sent to Healthians
 * @param key - The secret key used for generating the checksum
 * @returns The generated checksum in hex format
 */
function generateChecksum(payload: any, key: string): string {
  // Create deterministic JSON string with sorted keys for consistent hashing
  const dataString = createDeterministicJson(payload);

  console.log('🔐 Checksum Input Data:', dataString);
  console.log('🔐 Key Type:', typeof key);
  console.log('🔐 Key Length:', key.length);
  console.log('🔐 Key Value (first 10 chars):', key.substring(0, 10));
  
  // Ensure key is properly encoded as UTF-8
  // crypto.createHmac expects key as string or buffer, both work with utf-8
  const hmac = crypto.createHmac('sha256', key);
  
  // Update with data (also UTF-8 encoded by default)
  hmac.update(dataString, 'utf8');
  
  // Get hex digest
  const checksumHex = hmac.digest('hex');
  
  console.log('🔐 HMAC Algorithm: SHA256');
  console.log('🔐 Data Encoding: UTF-8');
  console.log('🔐 Key Encoding: UTF-8');
  console.log('🔐 Output Encoding: Hex');
  console.log('🔐 Generated Checksum:', checksumHex);
  console.log('🔐 Checksum Length:', checksumHex.length);
  
  return checksumHex;
}

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
