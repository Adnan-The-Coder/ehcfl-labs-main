/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context } from 'hono';

interface ServiceabilityRequest {
  zipcode?: string;
  latitude?: number;
  longitude?: number;
  lat?: string | number;
  long?: string | number;
  slot_date?: string;
  amount?: number;
  isDeviceSlot?: boolean;
  accessToken: string;
  clientIp?: string;
  get_ppmc_slots?: 0 | 1;
  has_female_patient?: 0 | 1;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  postal?: string | null;
  city?: string | null;
  region?: string | null;
  country_name?: string | null;
}

/**
 * Get geolocation from IP address using ipapi.co
 */
const getGeoFromIP = async (clientIp: string): Promise<GeoLocation | null> => {
  try {
    console.log('Getting geolocation from IP:', clientIp);
    const response = await fetch(`https://ipapi.co/${clientIp}/json/`);
    if (!response.ok) return null;

    const data: any = await response.json();
    if (data.latitude && data.longitude) {
      return {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        address: `${data.city}, ${data.postal}, ${data.country_name}`,
        postal: data.postal ?? null,
        city: data.city ?? null,
        region: data.region ?? null,
        country_name: data.country_name ?? null,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting geo from IP:', error);
    return null;
  }
};

/**
 * Get coordinates from zipcode using Nominatim (OpenStreetMap)
 */
const getGeoFromZipcode = async (zipcode: string): Promise<GeoLocation | null> => {
  try {
    console.log('Getting geolocation from zipcode:', zipcode);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${zipcode}&country=IN&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'EHCFLabs/1.0',
        },
      }
    );

    if (!response.ok) return null;
    const data: any = await response.json();

    if (data && data[0]) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        address: data[0].address,
      };
    }

    // Fallback to India center coordinates
    console.warn('Zipcode not found in Nominatim, using fallback coordinates');
    return {
      latitude: 20.5937,
      longitude: 78.9629,
      address: 'India (Fallback Center)',
    };
  } catch (error) {
    console.error('Error getting geo from zipcode:', error);
    // Return fallback India center coordinates
    return {
      latitude: 20.5937,
      longitude: 78.9629,
      address: 'India (Fallback Center)',
    };
  }
};

export const getServiceability = async (c: Context) => {
  try {
    const body: ServiceabilityRequest = await c.req.json().catch(() => ({}));

    const baseUrl = c.env.HEALTHIANS_BASE_URL as string;
    const partnerName = c.env.HEALTHIANS_PARTNER_NAME as string;
    const accessToken = body.accessToken || c.req.header('X-Access-Token');

    // Capture client IP for response enrichment
    const clientIp = body.clientIp || c.req.header('X-Forwarded-For') || c.req.header('CF-Connecting-IP') || null;

    if (!accessToken) {
      // Mirror backend behavior: 400 on missing token
      return c.json(
        {
          error: 'Access token is required',
        },
        400 as any
      );
    }

    if (!baseUrl || !partnerName) {
      return c.json(
        {
          success: false,
          error: 'Healthians configuration not found',
        },
        500
      );
    }

    // Determine geolocation source
    let geoLocation: GeoLocation | null = null;

    // Normalize input lat/long from either lat/long or latitude/longitude
    const inputLat = (body.lat ?? body.latitude) as string | number | undefined;
    const inputLong = (body.long ?? body.longitude) as string | number | undefined;

    // Priority 1: Use provided coordinates
    if (inputLat != null && inputLong != null) {
      geoLocation = {
        latitude: typeof inputLat === 'string' ? parseFloat(inputLat) : inputLat,
        longitude: typeof inputLong === 'string' ? parseFloat(inputLong) : inputLong,
        address: 'User Provided',
      };
      console.log('Using provided coordinates');
    }
    // Priority 2: Get from zipcode
    else if (body.zipcode) {
      geoLocation = await getGeoFromZipcode(body.zipcode);
      console.log('Got location from zipcode:', geoLocation);
    }
    // Priority 3: Get from client IP
    else {
      const ipForLookup = clientIp || '';
      // Skip IP geolocation for localhost
      const isLocal = ipForLookup === '127.0.0.1' || ipForLookup === '::1' || ipForLookup === '';
      geoLocation = isLocal ? null : await getGeoFromIP(ipForLookup);
      console.log('Got location from IP:', geoLocation);

      // If IP geolocation fails, use fallback
      if (!geoLocation) {
        geoLocation = {
          latitude: 20.5937,
          longitude: 78.9629,
          address: 'India (Fallback Center)',
        };
      }
    }

    if (!geoLocation) {
      return c.json(
        {
          success: false,
          error: 'Unable to determine location',
        },
        400
      );
    }

    // Determine zipcode if not provided; attempt to use IP-derived postal
    let zipcode = body.zipcode || undefined as string | undefined;
    if (!zipcode && geoLocation && geoLocation.postal) {
      zipcode = geoLocation.postal || undefined;
    }
    // If geoLocation.address contains a postal, we could parse it, but ipapi gives postal directly.
    // We can't fetch postal from the earlier helper, so only rely on body for now.

    // If still no zipcode, mirror backend error response
    if (!zipcode) {
      return c.json(
        {
          error: 'Pincode is required (unable to detect from IP)',
          message: 'Please provide a pincode in the request',
        },
        400 as any
      );
    }

    // First: check serviceability by location (v2) to get zone_id
    let slotDate = body.slot_date || getIndiaDate(0);
    
    // Validate slot_date is not in the past
    if (slotDate) {
      const indiaToday = getIndiaDate(0); // Today in IST
      if (slotDate < indiaToday) {
        console.warn(`Provided slot_date ${slotDate} is before today ${indiaToday}, using today's date`);
        slotDate = indiaToday;
      }
    }
    
    const svcPayload = {
      lat: String(geoLocation.latitude),
      long: String(geoLocation.longitude),
      zipcode,
    };

    console.log('Checking serviceability v2 with payload:', svcPayload);

    const svcUrl = `${baseUrl}/api/${partnerName}/checkServiceabilityByLocation_v2`;

    const svcResp = await fetch(svcUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(svcPayload),
    });

    if (!svcResp.ok) {
      const errorData = await safeJson(svcResp);
      console.error('Healthians checkServiceabilityByLocation_v2 failed:', errorData);
      return c.json(
        {
          success: false,
          status: false,
          serviceable: false,
          message: errorData?.message || 'Failed to check serviceability',
          details: errorData,
        },
        svcResp.status as any
      );
    }

    const svcData: any = await svcResp.json();

    console.log('Serviceability v2 response:', {
      status: svcData?.status,
      message: svcData?.message,
      zone_id: svcData?.data?.zone_id,
      resCode: svcData?.resCode,
      code: svcData?.code,
    });

    const zoneId = svcData?.data?.zone_id;
    const isServiceableResp = svcData?.status === true && !!zoneId;
    if (!isServiceableResp) {
      // Not serviceable
      return c.json({
        success: true,
        status: false,
        serviceable: false,
        message: svcData?.message || 'This location is not serviceable.',
        location: {
          ip: clientIp,
          city: geoLocation?.city || (typeof (geoLocation as any)?.address === 'object' ? ((geoLocation as any).address.city || (geoLocation as any).address.town || (geoLocation as any).address.village) : undefined) || zipcode,
          region: geoLocation?.region || (typeof (geoLocation as any)?.address === 'object' ? ((geoLocation as any).address.state || (geoLocation as any).address.region) : undefined),
          country: geoLocation?.country_name || 'India',
          zipcode,
          latitude: geoLocation.latitude,
          longitude: geoLocation.longitude,
        },
      });
    }

    // Second: get slots by location using zone_id
    const slotsPayload = {
      slot_date: slotDate,
      zone_id: String(zoneId),
      lat: String(geoLocation.latitude),
      long: String(geoLocation.longitude),
      zipcode,
      get_ppmc_slots: body.get_ppmc_slots ?? 0,
      has_female_patient: body.has_female_patient ?? 0,
    };

    console.log('Fetching slots by location with payload:', slotsPayload);

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
      const errorData = await safeJson(slotsResp);
      console.error('Healthians getSlotsByLocation failed:', errorData);
      const invalidDate = (errorData?.resCode === 'RES0003') ||
        (typeof errorData?.message === 'string' && errorData.message.toLowerCase().includes('invalid slot date'));
      if (invalidDate) {
        // Treat as serviceable but no slots for the provided date
        return c.json({
          success: true,
          status: true,
          serviceable: true,
          message: 'Location is serviceable but no slots for selected date',
          location: {
            ip: clientIp,
            city: (typeof (geoLocation as any)?.address === 'object' ? ((geoLocation as any).address.city || (geoLocation as any).address.town || (geoLocation as any).address.village) : undefined) || geoLocation?.city || zipcode,
            region: (typeof (geoLocation as any)?.address === 'object' ? ((geoLocation as any).address.state || (geoLocation as any).address.region) : undefined) || geoLocation?.region,
            country: geoLocation?.country_name || 'India',
            zipcode,
            latitude: geoLocation.latitude,
            longitude: geoLocation.longitude,
          },
          zone_id: String(zoneId),
          slot_date: slotDate,
          slots_available: 0,
          sample_slot: null,
          all_slots: [],
        });
      }
      return c.json(
        {
          success: false,
          status: true,
          serviceable: true,
          message: errorData?.message || 'Failed to fetch slots for location',
          details: errorData,
        },
        slotsResp.status as any
      );
    }

    const slotsData: any = await slotsResp.json();
    const slotsArray = Array.isArray(slotsData?.data) ? slotsData.data : [];
    const slotsAvailableCount = slotsArray.length;

    // Derive city and region if possible from address (Nominatim), else fallback
    let city: string | null = null;
    let region: string | null = null;
    let country: string | null = 'India';
    const addr = (geoLocation as any)?.address;
    if (addr && typeof addr === 'object') {
      city = addr.city || addr.town || addr.village || null;
      region = addr.state || addr.region || null;
      country = addr.country || country;
    }
    // Prefer IP-derived city/region/country if available
    if (!city && geoLocation?.city) city = geoLocation.city;
    if (!region && geoLocation?.region) region = geoLocation.region;
    if (geoLocation?.country_name) country = geoLocation.country_name;
    if (!city) {
      city = zipcode; // fallback as seen in expected UI example
    }

    console.log('Parsed serviceability result:', {
      serviceable: true,
      slotsCount: slotsAvailableCount,
      message: slotsData?.message,
      city,
      region,
      country,
    });

    // Align response shape to expected frontend contract
    // Mirror backend success response shape when serviceable
    if (slotsArray.length > 0) {
      return c.json({
        success: true,
        status: true,
        serviceable: true,
        message: 'Service available in your area',
        location: {
          ip: clientIp,
          city: city || slotsArray[0]?.city || zipcode,
          region,
          country: country || 'India',
          zipcode,
          latitude: geoLocation.latitude,
          longitude: geoLocation.longitude,
        },
        zone_id: String(zoneId),
        slot_date: slotDate,
        slots_available: slotsArray.length,
        sample_slot: {
          slot_id: slotsArray[0]?.stm_id ?? slotsArray[0]?.slot_id ?? slotsArray[0]?.id,
          slot_time: slotsArray[0]?.slot_time ?? slotsArray[0]?.time,
        },
        all_slots: slotsArray,
      });
    }

    // Serviceable but no slots on selected date
    return c.json({
      success: true,
      status: true,
      serviceable: true,
      message: 'Location is serviceable but no slots for selected date',
      location: {
        ip: clientIp,
        city,
        region,
        country: country || 'India',
        zipcode,
        latitude: geoLocation.latitude,
        longitude: geoLocation.longitude,
      },
      zone_id: String(zoneId),
      slot_date: slotDate,
      slots_available: 0,
      sample_slot: null,
      all_slots: [],
    });
  } catch (error: any) {
    console.error('Healthians serviceability exception:', error.message);
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

/**
 * Helper to get tomorrow's date in YYYY-MM-DD format
 */
function getNextDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * Helper to get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

async function safeJson(resp: Response): Promise<any | undefined> {
  try {
    return await resp.json();
  } catch {
    return undefined;
  }
}

/**
 * Get date string in India Standard Time (UTC+05:30)
 */
function getIndiaDate(offsetDays = 0): string {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  // Shift to IST and then add day offset in milliseconds
  const istMs = utcMs + (330 * 60000) + (offsetDays * 86400000);
  const ist = new Date(istMs);
  // Read components from shifted date to avoid UTC conversion issues
  const year = ist.getUTCFullYear();
  const month = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const day = String(ist.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
