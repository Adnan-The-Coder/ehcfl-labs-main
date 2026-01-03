/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context } from 'hono';

interface SlotsRequest {
  slot_date: string; // YYYY-MM-DD
  zone_id: string;
  lat: string;
  long: string;
  zipcode: string;
  get_ppmc_slots?: 0 | 1;
  has_female_patient?: 0 | 1;
}

/**
 * Get available slots for a given date and location
 * Matches curl implementation exactly:
 * curl -X POST 'https://t25crm.healthians.co.in/api/[partner]/getSlotsByLocation' \
 *   --header "Authorization: Bearer $TOKEN" \
 *   --data '{ "slot_date": "2026-01-04", "zone_id": "122", "lat": "17.3943916", "long": "78.4945016", "zipcode": "500027", "get_ppmc_slots": 0, "has_female_patient": 0 }'
 */
export const getSlots = async (c: Context) => {
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

    const body: SlotsRequest = await c.req.json();

    const { slot_date, zone_id, lat, long, zipcode, get_ppmc_slots, has_female_patient } = body;

    // Validate required fields
    if (!slot_date || !zone_id || !lat || !long || !zipcode) {
      return c.json(
        {
          success: false,
          error: 'Missing required parameters',
          required: ['slot_date', 'zone_id', 'lat', 'long', 'zipcode'],
        },
        400
      );
    }

    const slotsPayload = {
      slot_date,
      zone_id,
      lat,
      long,
      zipcode,
      get_ppmc_slots: get_ppmc_slots ?? 0,
      has_female_patient: has_female_patient ?? 0,
    };

    console.log('📅 Fetching slots with payload:', slotsPayload);

    const url = `${baseUrl}/api/${partnerName}/getSlotsByLocation`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(slotsPayload),
    });

    const responseData: any = await response.json();

    if (!response.ok) {
      console.error('❌ Healthians getSlotsByLocation failed:', responseData);
      return c.json(
        {
          success: false,
          error: 'Failed to fetch slots',
          details: responseData,
        },
        (response.status || 502) as any
      );
    }

    console.log('✅ Slots fetched successfully:', {
      status: responseData?.status,
      slotsCount: responseData?.data?.length || 0,
      resCode: responseData?.resCode,
    });

    // Return Healthians response with success wrapper
    // Response structure: { status, message, data: [...slots], resCode, code }
    return c.json({
      success: true,
      ...responseData,
    });
  } catch (error: any) {
    console.error('❌ Healthians slots exception:', error.message);
    return c.json(
      {
        success: false,
        error: 'Unexpected error while fetching slots',
        details: error.message,
      },
      500
    );
  }
};
