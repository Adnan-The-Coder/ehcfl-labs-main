/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { bookings as bookingsTable } from '../../db/schema';
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

interface BookingResponse {
  success: boolean;
  booking_id?: string;
  healthians_response?: any;
  database_record?: any;
  message: string;
}

/**
 * Generate X-Checksum for Healthians booking
 * Healthians uses SHA-256 hash for checksum
 */
function generateChecksum(bookingData: CreateBookingRequest, secretKey: string): string {
  // Create a sorted string representation of booking data
  // Include key fields that identify the booking
  const dataToHash = JSON.stringify({
    vendor_booking_id: bookingData.vendor_booking_id,
    customer_calling_number: bookingData.customer_calling_number,
    mobile: bookingData.mobile,
    email: bookingData.email || '',
    zipcode: bookingData.zipcode,
    discounted_price: bookingData.discounted_price,
    zone_id: bookingData.zone_id,
  });

  // Hash with secret key
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(dataToHash);
  return hmac.digest('hex');
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

    // Generate checksum (use empty secret as fallback if not provided)
    const checksum = generateChecksum(body, checksumSecret || 'default-secret');

    console.log('Creating Healthians booking:', {
      vendor_booking_id: body.vendor_booking_id,
      customers: body.customer.length,
      packages: body.package.length,
      zone_id: body.zone_id,
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

    if (!response.ok) {
      const errorData = await safeJson(response);
      console.error('Healthians booking creation failed:', errorData);
      return c.json(
        {
          success: false,
          message: errorData?.message || 'Failed to create booking with Healthians',
          details: errorData,
        },
        response.status as any
      );
    }

    const healthiansResponse = await response.json();
    console.log('Healthians booking response:', {
      success: healthiansResponse?.success,
      booking_id: healthiansResponse?.booking_id,
      message: healthiansResponse?.message,
    });

    if (!healthiansResponse.success) {
      return c.json(
        {
          success: false,
          message: healthiansResponse?.message || 'Healthians booking creation failed',
          healthians_response: healthiansResponse,
        },
        400
      );
    }

    // Now store the booking in D1 database
    const db = drizzle(c.env.DB);
    const healthiansBookingId = healthiansResponse.booking_id || healthiansResponse.id;

    if (!healthiansBookingId) {
      return c.json(
        {
          success: false,
          message: 'Healthians booking created but no booking ID returned',
          healthians_response: healthiansResponse,
        },
        400
      );
    }

    const dbResult = await db.insert(bookingsTable).values({
      booking_id: healthiansBookingId,
      user_uuid: body.user_uuid || 'guest',
      customers: JSON.stringify(body.customer),
      address: JSON.stringify({
        line1: body.address,
        locality: body.sub_locality,
        landmark: body.landmark,
        city: body.cityId,
        state: body.state,
        zipCode: body.zipcode,
        latitude: body.latitude,
        longitude: body.longitude,
      }),
      booking_date: new Date().toISOString().split('T')[0], // Today's date
      time_slot: body.slot.slot_id,
      packages: JSON.stringify(body.package),
      total_price: body.discounted_price,
      coupon: null,
      payment_method: body.payment_option,
      payment_status: body.payment_option === 'prepaid' ? 'pending' : 'pending',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).returning();

    console.log('Booking stored in database:', {
      id: dbResult[0]?.id,
      booking_id: dbResult[0]?.booking_id,
    });

    return c.json({
      success: true,
      booking_id: healthiansBookingId,
      message: 'Booking created successfully',
      healthians_response: {
        booking_id: healthiansResponse.booking_id,
        id: healthiansResponse.id,
        message: healthiansResponse.message,
      },
      database_record: {
        id: dbResult[0]?.id,
        booking_id: dbResult[0]?.booking_id,
        user_uuid: dbResult[0]?.user_uuid,
        status: dbResult[0]?.status,
        created_at: dbResult[0]?.created_at,
      },
    });
  } catch (error: any) {
    console.error('Healthians booking exception:', error.message);
    return c.json(
      {
        success: false,
        message: 'Unexpected error while creating booking',
        error: error.message,
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
      .where(
        (col) => col.booking_id === bookingId
      )
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
        customers: JSON.parse(bookingRecord.customers),
        address: JSON.parse(bookingRecord.address),
        booking_date: bookingRecord.booking_date,
        time_slot: bookingRecord.time_slot,
        packages: JSON.parse(bookingRecord.packages),
        total_price: bookingRecord.total_price,
        payment_method: bookingRecord.payment_method,
        payment_status: bookingRecord.payment_status,
        status: bookingRecord.status,
        created_at: bookingRecord.created_at,
        updated_at: bookingRecord.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error fetching Healthians booking:', error.message);
    return c.json(
      {
        success: false,
        message: 'Error fetching booking',
        error: error.message,
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
    await db
      .update(bookingsTable)
      .set({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .where((col) => col.booking_id === bookingId);

    return c.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking_id: bookingId,
    });
  } catch (error: any) {
    console.error('Error cancelling booking:', error.message);
    return c.json(
      {
        success: false,
        message: 'Error cancelling booking',
        error: error.message,
      },
      500
    );
  }
};

async function safeJson(resp: Response): Promise<any | undefined> {
  try {
    return await resp.json();
  } catch {
    return undefined;
  }
}
