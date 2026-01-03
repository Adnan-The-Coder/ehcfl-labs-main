/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context } from 'hono';

/**
 * Check Healthians service availability for a location
 * Delegates to checkServiceabilityByLocationV2
 * The frontend handles geolocation and fetches lat/long before calling this
 */
export const getServiceability = async (c: Context) => {
  // Keep legacy /serviceability endpoint in sync with /serviceability/v2
  return checkServiceabilityByLocationV2(c);
};

/**
 * Check Healthians service availability for a location using V2 API
 * Requires lat, long, zipcode, and is_ppmc_booking in request body
 * Frontend handles geolocation and passes pre-computed coordinates
 * 
 * Response structure from Healthians API:
 * {
 *   "status": true,
 *   "message": "This Lat Long is serviceable.",
 *   "data": { "zone_id": "122" },
 *   "resCode": "RES0001",
 *   "code": 200
 * }
 */
export const checkServiceabilityByLocationV2 = async (c: Context) => {
  try {
    const baseUrl = c.env.HEALTHIANS_BASE_URL as string;
    const partnerName = c.env.HEALTHIANS_PARTNER_NAME as string;

    const authHeader = c.req.header('Authorization');

    if (!baseUrl || !partnerName) {
      return c.json(
        {
          success: false,
          error: 'Healthians configuration missing',
        },
        500
      );
    }

    if (!authHeader) {
      return c.json(
        {
          success: false,
          error: 'Authorization header is required',
        },
        401
      );
    }

    const body = await c.req.json();

    const { lat, long, zipcode, is_ppmc_booking } = body;

    // Basic validation
    if (!lat || !long || !zipcode || is_ppmc_booking === undefined) {
      return c.json(
        {
          success: false,
          error: 'Missing required parameters',
          required: ['lat', 'long', 'zipcode', 'is_ppmc_booking'],
        },
        400
      );
    }

    const url = `${baseUrl}/api/${partnerName}/checkServiceabilityByLocation_v2`;

    console.log('🔍 Checking Healthians serviceability...');
    console.log('📍 Coordinates:', { lat, long, zipcode });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Forward Bearer token
      },
      body: JSON.stringify({
        lat,
        long,
        zipcode,
        is_ppmc_booking,
      }),
    });

    const responseData: any = await response.json();

    if (!response.ok) {
      console.error('❌ Healthians serviceability failed:', responseData);

      return c.json(
        {
          success: false,
          error: 'Failed to check serviceability',
          details: responseData,
        },
        (response.status || 502) as any
      );
    }

    console.log('✅ Serviceability check successful:', {
      status: responseData?.status,
      message: responseData?.message,
      zoneId: responseData?.data?.zone_id,
      resCode: responseData?.resCode,
    });

    // Return the Healthians response as-is with success wrapper
    // Response structure: { status, message, data: { zone_id }, resCode, code }
    return c.json({
      success: true,
      ...responseData,
    });
  } catch (error: any) {
    console.error('❌ Healthians serviceability exception:', error.message);

    return c.json(
      {
        success: false,
        error: 'Unexpected error while checking serviceability',
        details: error.message,
      },
      500
    );
  }
};
