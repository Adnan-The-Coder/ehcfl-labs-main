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
 * Uses geolocation (coordinates > zipcode > IP)
 * Calls cf-api /healthians/serviceability endpoint
 */
export async function checkServiceability(
  pincode?: string,
  latitude?: number,
  longitude?: number,
  slotDate?: string
) {
  try {
    console.log('🔍 Checking Healthians serviceability:', {
      pincode,
      hasCoordinates: !!(latitude && longitude),
      slotDate,
    });

    const accessToken = await getAccessToken();

    const payload: any = {
      accessToken,
      slot_date: slotDate,
      amount: 0,
      isDeviceSlot: false,
    };

    // Add location info
    if (latitude && longitude) {
      // Prefer lat/long keys; backend also supports latitude/longitude
      payload.lat = String(latitude);
      payload.long = String(longitude);
    } else if (pincode) {
      payload.zipcode = pincode;
    }

    const response = await fetch(API_ENDPOINTS.healthiansServiceability, {
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
      console.error('❌ Serviceability check failed:', errorData);
      throw new Error(errorData.error || 'Failed to check serviceability');
    }

    const data = await response.json();
    console.log('✅ Serviceability response received:', {
      success: data.success,
      serviceable: data.serviceable,
      location: data.location,
      slotsAvailable: data.slots_available,
    });

    // Be tolerant if backend omits success: infer from status/serviceable
    const success = data.success !== undefined ? data.success : (data.status === true || data.serviceable === true);
    if (!success) {
      throw new Error(data.error || data.message || 'Serviceability check failed');
    }

    return {
      isServiceable: data.serviceable === true,
      message: data.message || 'Serviceability check complete',
      location: data.location,
      slotsAvailable: data.slots_available || 0,
      sampleSlot: data.sample_slot,
      allSlots: data.all_slots || [],
      zoneId: data.zone_id,
    };
  } catch (error) {
    console.error('❌ Error checking serviceability:', error);
    return {
      isServiceable: false,
      message: 'Failed to check serviceability',
      location: null,
      slotsAvailable: 0,
      sampleSlot: null,
      allSlots: [],
    };
  }
}

/**
 * Get available time slots for booking
 * TODO: Implement when Healthians timeslots endpoint is available in cf-api
 */
export async function getTimeSlots(pincode: string, bookingDate: string) {
  try {
    console.log('⏰ Fetching time slots:', { pincode, bookingDate });
    
    // Temporary mock implementation
    // Will be replaced with actual cf-api call when endpoint is available
    console.log('⚠️ Time slots endpoint not yet migrated to cf-api');
    
    return [
      { time: '9:00 AM', available: true },
      { time: '10:00 AM', available: true },
      { time: '2:00 PM', available: true },
      { time: '3:00 PM', available: true },
    ];
  } catch (error) {
    console.error('❌ Error fetching time slots:', error);
    return [];
  }
}

/**
 * Create a booking with Healthians
 * TODO: Implement when Healthians create booking endpoint is available in cf-api
 */
export async function createBooking(bookingData: any) {
  try {
    console.log('📝 Creating Healthians booking:', bookingData);
    console.log('⚠️ Create booking endpoint not yet migrated to cf-api');
    
    throw new Error('Create booking endpoint coming soon');
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time booking updates
 * TODO: Implement with WebSocket when backend support is ready
 */
export function subscribeToBookingUpdates(bookingId: string, callback: (status: any) => void) {
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
