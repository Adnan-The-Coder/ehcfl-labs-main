/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Healthians Booking Controller
 * 
 * IMPORTANT: CHECKSUM CONFIGURATION
 * ---------------------------------
 * The Healthians API requires a checksum for booking creation.
 * 
 * To configure (pick one):
 * 1) Direct override (for testing same payload as Postman/cURL):
 *    - Put a ready-made checksum in .dev.vars as HEALTHIANS_CHECKSUM
 *    - Or send header X-Checksum-Override with the exact checksum to forward
 * 2) HMAC generation (recommended for production):
 *    - Get your secret key from Healthians
 *    - Put it in .dev.vars / wrangler secrets as HEALTHIANS_CHECKSUM_SECRET
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

// Build checksum input strings for common formats
function buildChecksumFormats(bookingData: CreateBookingRequest) {
  const vendorBookingId = String(bookingData.vendor_booking_id);
  const zoneId = String(bookingData.zone_id);
  const customerCallingNumber = String(bookingData.customer_calling_number);
  const discountedPrice = String(bookingData.discounted_price);
  const zipcode = String(bookingData.zipcode);

  const format1 = `${vendorBookingId}|${zoneId}|${customerCallingNumber}|${discountedPrice}|${zipcode}`;
  const format2 = `${vendorBookingId}|${customerCallingNumber}|${discountedPrice}|${zipcode}`;
  return { format1, format2 };
}

function canonicalizeJson(obj: unknown): string {
  // Stable key order JSON stringify to avoid client/server diff
  const sorter = (value: any): any => {
    if (Array.isArray(value)) return value.map(sorter);
    if (value && typeof value === 'object') {
      const keys = Object.keys(value).sort();
      const out: Record<string, any> = {};
      for (const k of keys) out[k] = sorter((value as any)[k]);
      return out;
    }
    return value;
  };
  return JSON.stringify(sorter(obj));
}

function computeChecksumVariants(bookingData: CreateBookingRequest, secretKey?: string) {
  const { format1, format2 } = buildChecksumFormats(bookingData);
  const jsonStr = canonicalizeJson({
    customer: bookingData.customer,
    slot: bookingData.slot,
    package: bookingData.package,
    customer_calling_number: bookingData.customer_calling_number,
    billing_cust_name: bookingData.billing_cust_name,
    gender: bookingData.gender,
    mobile: bookingData.mobile,
    email: bookingData.email || '',
    state: bookingData.state,
    cityId: bookingData.cityId,
    sub_locality: bookingData.sub_locality,
    latitude: bookingData.latitude,
    longitude: bookingData.longitude,
    address: bookingData.address,
    zipcode: bookingData.zipcode,
    landmark: bookingData.landmark || '',
    altmobile: bookingData.altmobile || '',
    altemail: bookingData.altemail || '',
    hard_copy: bookingData.hard_copy ?? 0,
    vendor_booking_id: bookingData.vendor_booking_id,
    vendor_billing_user_id: bookingData.vendor_billing_user_id,
    payment_option: bookingData.payment_option,
    discounted_price: bookingData.discounted_price,
    zone_id: bookingData.zone_id,
    client_id: bookingData.client_id || '',
  });

  const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
  const hmac = (s: string) => secretKey ? crypto.createHmac('sha256', secretKey).update(s).digest('hex') : '';

  const variants = {
    hmac_format1: hmac(format1),
    hmac_format2: hmac(format2),
    sha_format1: sha(format1),
    sha_format2: sha(format2),
    sha_json: sha(jsonStr),
  };
  console.log('🔐 Checksum variants:', {
    input_format1: format1,
    input_format2: format2,
    hmac_format1: variants.hmac_format1,
    hmac_format2: variants.hmac_format2,
    sha_format1: variants.sha_format1,
    sha_format2: variants.sha_format2,
    sha_json: variants.sha_json,
  });
  return variants;
}

// Helper: read first defined env entry from multiple possible keys (helps with casing mismatches)
function readEnvFirst(c: Context, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = (c.env as any)?.[k];
    if (v !== undefined && v !== null && String(v).length > 0) return String(v);
  }
  return undefined;
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
    // Allow multiple casings and both direct checksum and secret
    const checksumDirectEnv = readEnvFirst(c, [
      'HEALTHIANS_CHECKSUM',
      'Healthians_checksum',
      'HEALTHIANS_CHECKSUM_DIRECT',
    ]);
    const checksumSecret = (readEnvFirst(c, [
      'HEALTHIANS_CHECKSUM_SECRET',
      'Healthians_checksum_secret',
    ]) || c.env.HEALTHIANS_CHECKSUM_SECRET) as string | undefined;
    const checksumOverrideHeader = c.req.header('X-Checksum-Override') || c.req.header('X-Checksum');
    const checksumModeHeader = c.req.header('X-Checksum-Mode');

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

    // Determine checksum to send
    // Priority: request header override > env direct checksum > generated from secret > warning placeholder
    let checksum = '';
    let checksumWarning = '';
    let checksumSource: 'header-override' | 'env-direct' | 'generated-hmac' | 'missing' = 'missing';

    if (checksumOverrideHeader) {
      checksum = checksumOverrideHeader.trim();
      checksumSource = 'header-override';
    } else if (checksumDirectEnv) {
      checksum = checksumDirectEnv.trim();
      checksumSource = 'env-direct';
    } else if (checksumSecret) {
      const mode = (checksumModeHeader || readEnvFirst(c, ['HEALTHIANS_CHECKSUM_MODE']) || 'hmac_format1').toLowerCase();
      const variants = computeChecksumVariants(body, checksumSecret);
      switch (mode) {
        case 'hmac_format2':
          checksum = variants.hmac_format2; break;
        case 'sha_format1':
          checksum = variants.sha_format1; break;
        case 'sha_format2':
          checksum = variants.sha_format2; break;
        case 'sha_json':
          checksum = variants.sha_json; break;
        case 'hmac_format1':
        default:
          checksum = variants.hmac_format1; break;
      }
      checksumSource = 'generated-hmac';
    } else {
      console.warn('⚠️ HEALTHIANS_CHECKSUM or HEALTHIANS_CHECKSUM_SECRET not configured');
      checksumWarning = 'Checksum not configured. Provide X-Checksum-Override, HEALTHIANS_CHECKSUM, or HEALTHIANS_CHECKSUM_SECRET.';
      checksum = 'missing-checksum-secret';
      checksumSource = 'missing';
    }

    console.log('Creating Healthians booking:', {
      vendor_booking_id: body.vendor_booking_id,
      customers: body.customer.length,
      packages: body.package.length,
      zone_id: body.zone_id,
      checksum_status: checksumWarning || 'valid',
      checksum_source: checksumSource,
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
      is_ppmc_booking: (body as any).is_ppmc_booking ?? 0,
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
        'Authorization': accessToken && accessToken.startsWith('Bearer ')
          ? accessToken
          : `Bearer ${accessToken}`,
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

// Internal: compute or pick checksum following the same priority used in createHealthiansBooking
function resolveChecksum(c: Context, bookingData: CreateBookingRequest, fallbackSecret?: string) {
  // Allow multiple casings and both direct checksum and secret
  const checksumDirectEnv = readEnvFirst(c, [
    'HEALTHIANS_CHECKSUM',
    'Healthians_checksum',
    'HEALTHIANS_CHECKSUM_DIRECT',
  ]);
  const checksumSecret = (readEnvFirst(c, [
    'HEALTHIANS_CHECKSUM_SECRET',
    'Healthians_checksum_secret',
  ]) || fallbackSecret || (c.env as any)?.HEALTHIANS_CHECKSUM_SECRET) as string | undefined;

  const checksumOverrideHeader = c.req.header('X-Checksum-Override') || c.req.header('X-Checksum');
  const checksumModeHeader = c.req.header('X-Checksum-Mode');

  let checksum = '';
  let checksumWarning = '';
  let checksumSource: 'header-override' | 'env-direct' | 'generated-hmac' | 'missing' = 'missing';

  if (checksumOverrideHeader) {
    checksum = checksumOverrideHeader.trim();
    checksumSource = 'header-override';
  } else if (checksumDirectEnv) {
    checksum = checksumDirectEnv.trim();
    checksumSource = 'env-direct';
  } else if (checksumSecret) {
    const mode = (checksumModeHeader || readEnvFirst(c, ['HEALTHIANS_CHECKSUM_MODE']) || 'hmac_format1').toLowerCase();
    const variants = computeChecksumVariants(bookingData, checksumSecret);
    switch (mode) {
      case 'hmac_format2':
        checksum = variants.hmac_format2; break;
      case 'sha_format1':
        checksum = variants.sha_format1; break;
      case 'sha_format2':
        checksum = variants.sha_format2; break;
      case 'sha_json':
        checksum = variants.sha_json; break;
      case 'hmac_format1':
      default:
        checksum = variants.hmac_format1; break;
    }
    checksumSource = 'generated-hmac';
  } else {
    console.warn('⚠️ HEALTHIANS_CHECKSUM or HEALTHIANS_CHECKSUM_SECRET not configured');
    checksumWarning = 'Checksum not configured. Provide X-Checksum-Override, HEALTHIANS_CHECKSUM, or HEALTHIANS_CHECKSUM_SECRET.';
    checksum = 'missing-checksum-secret';
    checksumSource = 'missing';
  }

  return { checksum, checksumWarning, checksumSource };
}

// Internal: fetch zone_id via checkServiceabilityByLocation_v2
async function fetchZoneId(c: Context, latitude: string, longitude: string, zipcode: string): Promise<number | null> {
  try {
    const baseUrl = c.env.HEALTHIANS_BASE_URL as string;
    const partnerName = c.env.HEALTHIANS_PARTNER_NAME as string;
    const authHeader = c.req.header('Authorization');

    if (!baseUrl || !partnerName || !authHeader) return null;

    const url = `${baseUrl}/api/${partnerName}/checkServiceabilityByLocation_v2`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({ lat: latitude, long: longitude, zipcode, is_ppmc_booking: 0 }),
    });

    const data: any = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.warn('Serviceability failed for retry:', data);
      return null;
    }
    const zoneId = Number(data?.data?.zone_id);
    return Number.isFinite(zoneId) ? zoneId : null;
  } catch (err) {
    console.error('Zone id fetch error:', err);
    return null;
  }
}

/**
 * List failed Healthians bookings where payment appears completed
 */
export const listFailedPaidBookings = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const failed = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.healthians_sync_status, 'failed'));

    const completedStatuses = new Set(['completed', 'paid', 'captured', 'success']);
    const eligible = failed.filter((b) => completedStatuses.has(String(b.payment_status)));

    return c.json({
      success: true,
      total_failed: failed.length,
      total_eligible: eligible.length,
      bookings: eligible.map((b) => ({
        id: b.id,
        booking_id: b.booking_id,
        user_uuid: b.user_uuid,
        total_price: b.total_price,
        payment_status: b.payment_status,
        healthians_last_error: b.healthians_last_error,
        created_at: b.created_at,
      })),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ success: false, message: 'Failed to list bookings', error: errorMessage }, 500);
  }
};

/**
 * Retry Healthians booking creation for all failed bookings with completed payment
 * Requires Authorization: Bearer <healthians-token> (or X-Access-Token), will be forwarded.
 */
export const retryFailedPaidBookings = async (c: Context) => {
  try {
    const baseUrl = c.env.HEALTHIANS_BASE_URL as string;
    const partnerName = c.env.HEALTHIANS_PARTNER_NAME as string;
    const authHeader = c.req.header('Authorization');
    const accessToken = c.req.header('X-Access-Token');

    if (!baseUrl || !partnerName) {
      return c.json({ success: false, message: 'Healthians configuration not found' }, 500);
    }

    if (!authHeader && !accessToken) {
      return c.json({ success: false, message: 'Authorization or X-Access-Token is required' }, 401);
    }

    const db = drizzle(c.env.DB);
    const failed = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.healthians_sync_status, 'failed'));

    const completedStatuses = new Set(['completed', 'paid', 'captured', 'success']);
    const candidates = failed.filter((b) => completedStatuses.has(String(b.payment_status)));

    const results: Array<{ booking_id: string; status: 'retried' | 'skipped' | 'failed'; message?: string; healthians_booking_id?: string }> = [];

    for (const b of candidates) {
      try {
        const customers = safeJsonParse<any[]>(b.customers, []);
        const address = safeJsonParse<any>(b.address, {});
        const packages = safeJsonParse<any[]>(b.packages, []);

        if (!customers.length || !packages.length || !address?.zipCode || !b.time_slot) {
          results.push({ booking_id: b.booking_id, status: 'skipped', message: 'Insufficient stored data' });
          continue;
        }

        const primary = customers[0] || {};
        const zipcode = String(address.zipCode || '');
        const latitude = String(address.latitude || '');
        const longitude = String(address.longitude || '');

        // Compute/lookup zone_id if missing
        let zoneId = await fetchZoneId(c, latitude, longitude, zipcode);
        if (!zoneId && typeof (address.zone_id) === 'number') zoneId = address.zone_id;
        if (!zoneId) {
          results.push({ booking_id: b.booking_id, status: 'skipped', message: 'zone_id unavailable' });
          continue;
        }

        const payload: CreateBookingRequest = {
          customer: customers,
          slot: { slot_id: String(b.time_slot) },
          package: packages,
          customer_calling_number: String(primary.contact_number || primary.phone || ''),
          billing_cust_name: String(primary.customer_name || primary.name || ''),
          gender: String(primary.gender || ''),
          mobile: String(primary.contact_number || ''),
          email: String(primary.email || ''),
          state: parseInt(String(address.state || '0')) || 0,
          cityId: parseInt(String(address.city || '0')) || 0,
          sub_locality: String(address.locality || ''),
          latitude,
          longitude,
          address: String(address.line1 || ''),
          zipcode,
          landmark: String(address.landmark || ''),
          altmobile: '',
          altemail: '',
          hard_copy: 0,
          vendor_booking_id: b.booking_id,
          vendor_billing_user_id: String(primary.customer_id || ''),
          payment_option: 'prepaid',
          discounted_price: Number(b.total_price) || 0,
          zone_id: Number(zoneId),
          client_id: undefined,
          partial_paid_amount: undefined,
          user_uuid: b.user_uuid,
          access_token: accessToken || '',
        };

        const { checksum, checksumSource } = resolveChecksum(c, payload);

        const url = `${baseUrl}/api/${partnerName}/createBooking_v3`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': authHeader
              ? (authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`)
              : (accessToken && accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`),
            'X-Checksum': checksum,
          },
          body: JSON.stringify({
            customer: payload.customer,
            slot: payload.slot,
            package: payload.package,
            customer_calling_number: payload.customer_calling_number,
            billing_cust_name: payload.billing_cust_name,
            gender: payload.gender,
            mobile: payload.mobile,
            email: payload.email || '',
            state: payload.state,
            cityId: payload.cityId,
            sub_locality: payload.sub_locality,
            latitude: payload.latitude,
            longitude: payload.longitude,
            address: payload.address,
            zipcode: payload.zipcode,
            is_ppmc_booking: 0,
            landmark: payload.landmark || '',
            altmobile: payload.altmobile || '',
            altemail: payload.altemail || '',
            hard_copy: payload.hard_copy ?? 0,
            vendor_booking_id: payload.vendor_booking_id,
            vendor_billing_user_id: payload.vendor_billing_user_id,
            payment_option: payload.payment_option,
            discounted_price: payload.discounted_price,
            zone_id: payload.zone_id,
            client_id: payload.client_id || '',
          }),
        });

        const respJson = await safeJson(response);
        const isSuccess = response.ok && ((respJson as any)?.success === true || (respJson as any)?.status === true);

        if (isSuccess) {
          const hId = (respJson as any)?.booking_id || (respJson as any)?.id || null;
          await db
            .update(bookingsTable)
            .set({
              healthians_booking_id: hId,
              healthians_sync_status: 'synced',
              healthians_sync_attempts: (Number(b.healthians_sync_attempts) || 0) + 1,
              healthians_last_error: null,
              healthians_response: JSON.stringify(respJson || {}),
              updated_at: new Date().toISOString(),
            })
            .where(eq(bookingsTable.booking_id, b.booking_id))
            .run();

          results.push({ booking_id: b.booking_id, status: 'retried', healthians_booking_id: hId || undefined });
        } else {
          const errMsg = (respJson as any)?.message || (respJson as any)?.code || `HTTP ${response.status}`;
          await db
            .update(bookingsTable)
            .set({
              healthians_sync_status: 'failed',
              healthians_sync_attempts: (Number(b.healthians_sync_attempts) || 0) + 1,
              healthians_last_error: String(errMsg),
              healthians_response: JSON.stringify(respJson || {}),
              updated_at: new Date().toISOString(),
            })
            .where(eq(bookingsTable.booking_id, b.booking_id))
            .run();

          results.push({ booking_id: b.booking_id, status: 'failed', message: errMsg });
        }
      } catch (innerErr: any) {
        results.push({ booking_id: b.booking_id, status: 'failed', message: innerErr?.message || 'retry error' });
      }
    }

    const summary = {
      success: true,
      total_candidates: candidates.length,
      retried: results.filter(r => r.status === 'retried').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      results,
    };

    return c.json(summary);
  } catch (error: any) {
    console.error('Retry failed:', error?.message);
    return c.json({ success: false, message: 'Retry operation error', error: error?.message }, 500);
  }
};
