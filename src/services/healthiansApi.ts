import { API_ENDPOINTS, API_BASE_URL } from '@/config/api';

let cachedAccessToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Get or refresh Healthians access token
 * Calls cf-api /healthians/auth endpoint
 */
export async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedAccessToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log('✅ Using cached Healthians access token');
    return cachedAccessToken;
  }

  try {
    console.log('🔐 Fetching new Healthians access token from', API_ENDPOINTS.healthiansAuth);

    const response = await fetch(API_ENDPOINTS.healthiansAuth, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Healthians auth failed:', errorData);
      throw new Error(errorData.error || 'Failed to get access token');
    }

    const data = await response.json();
    console.log('✅ Auth response received:', {
      success: data.success,
      hasToken: !!data.access_token,
      expiresIn: data.expires_in,
    });

    if (!data.success || !data.access_token) {
      throw new Error('Invalid response structure: missing access_token');
    }

    cachedAccessToken = data.access_token;
    tokenExpiry = Date.now() + ((data.expires_in || 3600) * 1000);
    console.log('💾 Access token cached successfully');

    return data.access_token;
  } catch (error) {
    console.error('❌ Error getting Healthians access token:', error);
    throw error;
  }
}

/**
 * Get packages from Healthians API by zipcode
 * Calls cf-api /healthians/packages endpoint
 */
export async function getPackages(pincode?: string, search?: string) {
  try {
    console.log('📦 Fetching Healthians packages:', { pincode, search });

    if (!pincode) {
      console.warn('⚠️ Zipcode not provided, using fallback or empty list');
      return [];
    }

    const accessToken = await getAccessToken();

    const payload = {
      zipcode: pincode,
      accessToken,
      product_type: 'profile',
      start: '0',
      limit: '100',
    };

    const response = await fetch(API_ENDPOINTS.healthiansPackages, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Healthians packages fetch failed:', errorData);
      throw new Error(errorData.error || 'Failed to fetch packages');
    }

    const data = await response.json();
    console.log('✅ Packages response received:', {
      success: data.success,
      packagesCount: data.packages?.length || 0,
      zipcode: data.zipcode,
    });

    if (!data.success || !Array.isArray(data.packages)) {
      console.warn('⚠️ Invalid packages response, returning empty array');
      return [];
    }

    return data.packages || [];
  } catch (error) {
    console.error('❌ Error fetching Healthians packages:', error);
    return [];
  }
}

/**
 * Check Healthians service availability for a location
 * Uses checkServiceabilityByLocation_v2 logic
 * Fetches lat/long from zipcode via geolocation helpers
 * Calls cf-api /healthians/serviceability/v2 endpoint
 * 
 * curl reference:
 * curl -X POST "https://t25crm.healthians.co.in/api/[partner]/checkServiceabilityByLocation_v2" \
 *   --header "Authorization: Bearer $TOKEN" \
 *   --header "Content-Type: application/json" \
 *   --data '{ "lat": "17.3943916", "long": "78.4945016", "zipcode": "500027", "is_ppmc_booking": 0 }'
 */
export async function checkServiceability(pincode: string, isPpmcBooking: number = 0) {
  try {
    const cleanPincode = (pincode || '').trim();
    
    if (!cleanPincode || cleanPincode.length === 0) {
      throw new Error('Valid pincode is required');
    }

    if (!/^\d{6}$/.test(cleanPincode)) {
      throw new Error('Pincode must be exactly 6 digits');
    }

    console.log('🔍 Checking Healthians serviceability:', {
      pincode: cleanPincode,
      isPpmcBooking,
    });

    // Fetch geolocation from zipcode
    console.log('🌍 Fetching coordinates for zipcode:', cleanPincode);
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${cleanPincode}&country=IN&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'EHCFLabs/1.0',
        },
      }
    );

    if (!geoResponse.ok) {
      throw new Error(`Geolocation service error: ${geoResponse.status}`);
    }

    const geoData = await geoResponse.json() as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(geoData) || geoData.length === 0 || !geoData[0].lat || !geoData[0].lon) {
      throw new Error('Pincode not found in geolocation database. Please verify the pincode.');
    }

    const latitude = String(parseFloat(geoData[0].lat));
    const longitude = String(parseFloat(geoData[0].lon));
    
    if (!latitude || !longitude || latitude === 'NaN' || longitude === 'NaN') {
      throw new Error('Invalid coordinates retrieved from geolocation service');
    }

    console.log('✅ Geolocation resolved:', { latitude, longitude, pincode: cleanPincode });

    // Get access token
    let accessToken: string;
    try {
      accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to obtain access token');
      }
    } catch (tokenError) {
      console.error('❌ Access token error:', tokenError);
      throw new Error('Authentication failed. Please try again.');
    }

    const payload = {
      lat: latitude,
      long: longitude,
      zipcode: cleanPincode,
      is_ppmc_booking: isPpmcBooking,
    };

    console.log('📤 Sending serviceability request to:', API_ENDPOINTS.healthiansServiceability);

    const response = await fetch(API_ENDPOINTS.healthiansServiceability, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Serviceability API error:', {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      throw new Error(data.message || data.error || `Service error: ${response.status}`);
    }

    // Validate response structure
    if (!data.data || typeof data.data !== 'object') {
      console.error('❌ Invalid response structure from Healthians:', data);
      throw new Error('Invalid response from Healthians API');
    }

    const zoneId = data.data.zone_id;
    const isServiceable = data.status === true && !!zoneId;

    console.log('✅ Serviceability verified:', {
      isServiceable,
      zoneId,
      status: data.status,
      resCode: data.resCode,
    });

    return {
      success: true,
      isServiceable,
      status: data.status || false,
      zoneId: zoneId || null,
      message: data.message || (isServiceable ? 'Location is serviceable' : 'Location is not serviceable'),
      resCode: data.resCode,
      location: {
        zipcode: cleanPincode,
        latitude,
        longitude,
      },
      rawResponse: data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to check serviceability';
    console.error('❌ Serviceability check error:', {
      error: errorMessage,
      pincode,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      isServiceable: false,
      status: false,
      zoneId: null,
      message: errorMessage,
      location: {
        zipcode: null,
        latitude: null,
        longitude: null,
      },
      rawResponse: null,
    };
  }
}

/**
 * Get available time slots for booking
 * Calls cf-api /healthians/slots endpoint
 * Requires zone_id, lat, long, zipcode from serviceability check
 * 
 * curl reference:
 * curl -X POST 'https://t25crm.healthians.co.in/api/[partner]/getSlotsByLocation' \
 *   --header "Authorization: Bearer $TOKEN" \
 *   --data '{ "slot_date": "2026-01-04", "zone_id": "122", "lat": "17.3943916", "long": "78.4945016", "zipcode": "500027", "get_ppmc_slots": 0, "has_female_patient": 0 }'
 */
export async function getTimeSlots(
  slotDate: string,
  zoneId: string,
  lat: string,
  long: string,
  zipcode: string,
  getPpmcSlots: number = 0,
  hasFemalePatient: number = 0
) {
  try {
    // Validate and normalize inputs
    const cleanDate = (slotDate || '').trim();
    const cleanZoneId = String(zoneId || '').trim();
    const cleanLat = String(lat || '').trim();
    const cleanLong = String(long || '').trim();
    const cleanZipcode = (zipcode || '').trim();

    // Validate date format (YYYY-MM-DD)
    if (!cleanDate || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    // Validate all required parameters
    const missingParams: string[] = [];
    if (!cleanZoneId) missingParams.push('zoneId');
    if (!cleanLat || cleanLat === 'NaN') missingParams.push('latitude');
    if (!cleanLong || cleanLong === 'NaN') missingParams.push('longitude');
    if (!cleanZipcode) missingParams.push('zipcode');

    if (missingParams.length > 0) {
      throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
    }

    console.log('⏰ Fetching time slots:', {
      slotDate: cleanDate,
      zoneId: cleanZoneId,
      zipcode: cleanZipcode,
      coordinates: { lat: cleanLat, long: cleanLong },
    });

    // Get access token
    let accessToken: string;
    try {
      accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Failed to obtain access token');
      }
    } catch (tokenError) {
      console.error('❌ Access token error:', tokenError);
      throw new Error('Authentication failed. Please try again.');
    }

    const payload = {
      slot_date: cleanDate,
      zone_id: cleanZoneId,
      lat: cleanLat,
      long: cleanLong,
      zipcode: cleanZipcode,
      get_ppmc_slots: getPpmcSlots,
      has_female_patient: hasFemalePatient,
    };

    console.log('📤 Sending slots request to:', API_ENDPOINTS.healthiansSlots);

    const response = await fetch(API_ENDPOINTS.healthiansSlots, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Slots API error:', {
        status: response.status,
        statusText: response.statusText,
        data,
      });
      throw new Error(data.message || data.error || `Service error: ${response.status}`);
    }

    // Validate response structure
    if (!('data' in data)) {
      console.error('❌ Invalid slots response structure:', data);
      throw new Error('Invalid response from Healthians API');
    }

    const slots = Array.isArray(data.data) ? data.data : [];
    console.log('✅ Slots retrieved:', {
      count: slots.length,
      date: cleanDate,
      zoneId: cleanZoneId,
      resCode: data.resCode,
    });

    return {
      success: true,
      status: data.status || false,
      message: data.message || 'Slots retrieved',
      slots,
      resCode: data.resCode,
      rawResponse: data,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch slots';
    console.error('❌ Slots fetch error:', {
      error: errorMessage,
      parameters: { slotDate, zoneId, zipcode },
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      status: false,
      message: errorMessage,
      slots: [],
      rawResponse: null,
    };
  }
}

/**
 * Create a booking with Healthians createBooking_v3 API
 * Sends booking data to cf-api which calls Healthians and stores in DB
 */
export async function createHealthiansBooking(bookingData: Record<string, unknown>) {
  try {
    const vendorBookingId = bookingData.vendor_booking_id as unknown;
    const customers = bookingData.customer as unknown;
    const packages = bookingData.package as unknown;
    
    console.log('📝 Creating Healthians booking via cf-api:', {
      vendor_booking_id: vendorBookingId,
      customers: Array.isArray(customers) ? customers.length : 0,
      packages: Array.isArray(packages) ? packages.length : 0,
    });

    if (!bookingData.vendor_booking_id || !bookingData.customer || !bookingData.package) {
      throw new Error('Missing required booking fields');
    }

    const accessToken = await getAccessToken();

    // Remove internal fields that should NOT be sent to Healthians API
    // Only send fields that Healthians expects
    const { user_uuid, access_token, ...cleanPayload } = bookingData as any;

    // Stringify payload exactly once - send to backend for checksum calculation
    // Use the clean payload without internal fields
    const payloadString = JSON.stringify(cleanPayload);

    console.log('📤 Sending booking request to:', API_ENDPOINTS.healthiansBooking);
    console.log('🔐 Authorization: Bearer [token]');
    console.log('📋 Payload keys:', Object.keys(cleanPayload).sort().join(', '));

    const response = await fetch(API_ENDPOINTS.healthiansBooking, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: payloadString,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Healthians booking creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: Failed to create booking`);
    }

    const data = await response.json();
    console.log('✅ Booking created successfully:', {
      booking_id: data.booking_id,
      healthians_booking_id: data.healthians_response?.booking_id,
      database_id: data.database_record?.id,
    });

    return {
      success: true,
      booking_id: data.booking_id,
      healthians_response: data.healthians_response,
      database_record: data.database_record,
      message: data.message,
    };
  } catch (error) {
    console.error('❌ Error creating Healthians booking:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create booking',
      error,
    };
  }
}

/**
 * Get booking details from Healthians database
 */
export async function getHealthiansBookingDetails(bookingId: string) {
  try {
    console.log('🔍 Fetching Healthians booking details:', bookingId);

    const response = await fetch(API_ENDPOINTS.healthiansBookingDetail(bookingId), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Booking fetch failed:', errorData);
      throw new Error(errorData.message || 'Failed to fetch booking');
    }

    const data = await response.json();
    console.log('✅ Booking details fetched:', data.data);

    return {
      success: true,
      data: data.data,
      message: data.message,
    };
  } catch (error) {
    console.error('❌ Error fetching booking details:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch booking',
      error,
    };
  }
}

/**
 * Cancel a Healthians booking
 */
export async function cancelHealthiansBooking(bookingId: string) {
  try {
    console.log('🚫 Cancelling Healthians booking:', bookingId);

    const response = await fetch(API_ENDPOINTS.healthiansBookingCancel(bookingId), {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Booking cancellation failed:', errorData);
      throw new Error(errorData.message || 'Failed to cancel booking');
    }

    const data = await response.json();
    console.log('✅ Booking cancelled:', data);

    return {
      success: true,
      message: data.message,
      booking_id: data.booking_id,
    };
  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to cancel booking',
      error,
    };
  }
}


/**
 * Subscribe to real-time booking updates
 * TODO: Implement with WebSocket when backend support is ready
 */
export function subscribeToBookingUpdates(bookingId: string, callback: (status: Record<string, unknown>) => void) {
  console.log('📡 Real-time booking updates not yet implemented');
  
  const unsubscribe = () => {
    console.log('Unsubscribed from booking updates');
  };

  return unsubscribe;
}

/**
 * Get bookings for current user
 * Note: User bookings are managed through /bookings endpoint, not Healthians
 */
export async function getUserBookings() {
  try {
    console.log('📋 Fetching user bookings from database');
    // Use the main bookings endpoint instead
    const response = await fetch(API_ENDPOINTS.getAllBookings, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user bookings');
    }

    const data = await response.json();
    console.log('✅ User bookings fetched:', data.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching user bookings:', error);
    return [];
  }
}

/**
 * Get booking status history
 * TODO: Implement when booking status history is available
 */
export async function getBookingStatusHistory(bookingId: string) {
  try {
    console.log('📊 Fetching booking status history:', bookingId);
    
    // Temporary mock implementation
    return [
      { status: 'pending', timestamp: new Date(), message: 'Booking created' },
      { status: 'confirmed', timestamp: new Date(), message: 'Booking confirmed' },
    ];
  } catch (error) {
    console.error('❌ Error fetching booking status history:', error);
    return [];
  }
}
