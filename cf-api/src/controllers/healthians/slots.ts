/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context } from 'hono';

interface SlotsRequest {
  slot_date: string; // YYYY-MM-DD
  zone_id?: string;
  zipcode?: string;
  latitude?: string;
  longitude?: string;
  get_ppmc_slots?: 0 | 1;
  has_female_patient?: 0 | 1;
  accessToken?: string;
}

/**
 * Get available slots for a given date and location
 * This is a dedicated endpoint that calls getSlotsByLocation API
 */
export const getSlots = async (c: Context) => {
  try {
    const body: SlotsRequest = await c.req.json().catch(() => ({}));

    const baseUrl = c.env.HEALTHIANS_BASE_URL as string;
    const partnerName = c.env.HEALTHIANS_PARTNER_NAME as string;
    
    // Get access token from body, query, or header
    let accessToken = body.accessToken || c.req.query('accessToken') || c.req.header('X-Access-Token');
    
    if (!accessToken) {
      // Try to get from auth endpoint
      try {
        const authResp = await fetch(`${baseUrl}/api/${partnerName}/getAccessToken`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            partner_name: partnerName,
            username: c.env.HEALTHIANS_USERNAME,
            password: c.env.HEALTHIANS_PASSWORD,
          }),
        });

        if (authResp.ok) {
          const authData: any = await authResp.json();
          accessToken = authData.access_token;
        }
      } catch (error) {
        console.error('Failed to auto-fetch access token:', error);
      }
    }

    if (!accessToken) {
      return c.json(
        { success: false, message: 'Access token is required' },
        400 as any
      );
    }

    // Validate required fields
    if (!body.slot_date) {
      return c.json(
        { success: false, message: 'slot_date is required in YYYY-MM-DD format' },
        400 as any
      );
    }

    // If we have zone_id from serviceability, use it; otherwise need coordinates or zipcode
    let zone_id = body.zone_id;
    let lat = body.latitude;
    let long = body.longitude;
    let zipcode = body.zipcode;

    console.log('📅 Getting slots with payload:', {
      slot_date: body.slot_date,
      zone_id,
      zipcode,
      has_lat_long: !!(lat && long),
    });

    // If no zone_id but we have zipcode, try to get it from serviceability check first
    if (!zone_id && (zipcode || (lat && long))) {
      try {
        console.log('⚠️ No zone_id provided, fetching from serviceability check');
        
        const svcPayload = {
          lat: lat || body.latitude,
          long: long || body.longitude,
          zipcode,
        };

        const svcResp = await fetch(`${baseUrl}/api/${partnerName}/checkServiceabilityByLocation_v2`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(svcPayload),
        });

        if (svcResp.ok) {
          const svcData: any = await svcResp.json();
          zone_id = svcData?.data?.zone_id;
          console.log('✅ Got zone_id from serviceability:', zone_id);
        }
      } catch (error) {
        console.error('Failed to get zone_id from serviceability:', error);
      }
    }

    if (!zone_id) {
      return c.json(
        { success: false, message: 'zone_id is required. Please check serviceability first.' },
        400 as any
      );
    }

    // Prepare slots request payload
    const slotsPayload = {
      slot_date: body.slot_date,
      zone_id: String(zone_id),
      lat: lat || '28.5088974', // Default to Gurgaon
      long: long || '77.0750786',
      get_ppmc_slots: body.get_ppmc_slots ?? 0,
      has_female_patient: body.has_female_patient ?? 0,
    };

    console.log('📍 Calling getSlotsByLocation with payload:', slotsPayload);

    const slotsUrl = `${baseUrl}/api/${partnerName}/getSlotsByLocation`;
    const slotsResp = await fetch(slotsUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(slotsPayload),
    });

    if (!slotsResp.ok) {
      const errorData: any = await slotsResp.json().catch(() => ({}));
      console.error('❌ Healthians getSlotsByLocation failed:', errorData);
      return c.json(
        {
          success: false,
          message: errorData?.message || 'Failed to fetch slots',
          details: errorData,
        },
        slotsResp.status as any
      );
    }

    const slotsData: any = await slotsResp.json();

    console.log('✅ Slots fetched successfully:', {
      slotsCount: slotsData.data?.length || 0,
      status: slotsData.status,
      resCode: slotsData.resCode,
    });

    // Return slots in standardized format
    return c.json({
      success: true,
      message: 'Slots retrieved successfully',
      zone_id,
      slot_date: body.slot_date,
      slots: slotsData.data || [],
      total_slots: slotsData.data?.length || 0,
      healthians_response: slotsData,
    });
  } catch (error) {
    console.error('❌ Error in getSlots:', error);
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch slots',
      },
      500 as any
    );
  }
};
