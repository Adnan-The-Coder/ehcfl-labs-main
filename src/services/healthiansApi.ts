import axios from 'axios';

let cachedAccessToken: string | null = null;
let tokenExpiry: number | null = null;

// Get or refresh access token
export async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedAccessToken && tokenExpiry && Date.now() < tokenExpiry) {
    console.log('Using cached access token');
    return cachedAccessToken;
  }
  try {
    console.log('Fetching new access token...');
    console.log('API URL being used:', `${import.meta.env.VITE_API_URL}/healthians-auth`);
    console.log("HIT /healthians-auth")


    
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/healthians-auth`, {});
    const data = response.data;
    console.log('Full auth response:', response);
    console.log('Auth response data:', data);

    console.log('Auth response received:', data);

    if (data && data.access_token) {
      cachedAccessToken = data.access_token;
      // Set expiry to 1 hour from now
      tokenExpiry = Date.now() + (60 * 60 * 1000);
      console.log('Access token cached successfully');
      return data.access_token;
    }

    console.error('Invalid auth response structure:', data);
    throw new Error('Failed to get access token: Invalid response structure');
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

// Get packages from Healthians API
export async function getPackages(pincode?: string, search?: string) {
  try {
    console.log('Fetching packages with params:', { pincode, search });
    const accessToken = await getAccessToken();

    console.log('Fetching packages from backend...');
    
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/healthians-packages`, {
      accessToken,
      pincode,
      search,
    });
    const data = response.data;

    console.log('Packages response received:', {
      hasData: !!data,
      hasStatus: 'status' in data,
      status: data?.status,
      hasDataArray: 'data' in data,
      dataLength: Array.isArray(data?.data) ? data.data.length : 'N/A'
    });

    if (data && data.status && data.data) {
      console.log(`Successfully fetched ${data.data.length} packages`);
      return data.data || [];
    }

    console.error('Invalid packages response structure:', data);
    throw new Error(data?.message || 'Failed to fetch packages: Invalid response structure');
  } catch (error) {
    console.error('Error fetching packages:', error);
    throw error;
  }
}

// Check serviceability for a pincode
export async function checkServiceability(pincode: string) {
  try {
    console.log('Checking serviceability for pincode:', pincode);
    const accessToken = await getAccessToken();

    const response = await axios.post(`${import.meta.env.VITE_API_URL}/healthians-serviceability`, {
      accessToken,
      pincode,
    });
    const data = response.data;

    console.log('Serviceability response:', data);

    const rawStatus = (data as any)?.status ?? (data as any)?.success;
    const isServiceable =
      rawStatus === true ||
      rawStatus === 'true' ||
      rawStatus === 1 ||
      rawStatus === '1' ||
      rawStatus === 'success';

    return {
      isServiceable,
      message: (data as any)?.message ?? (data as any)?.msg,
    };
  } catch (error) {
    console.error('Error checking serviceability, falling back to packages:', error);
    try {
      const packages = await getPackages(pincode);
      const isServiceable = Array.isArray(packages) && packages.length > 0;
      return {
        isServiceable,
        message: isServiceable
          ? 'Service available in your area'
          : 'Service not available in this area',
      };
    } catch (fallbackError) {
      console.error('Fallback serviceability check via packages failed:', fallbackError);
      return {
        isServiceable: false,
        message: 'Failed to check serviceability',
      };
    }
  }
}

// Get available time slots
export async function getTimeSlots(pincode: string, bookingDate: string) {
  try {
    console.log('Fetching time slots for:', { pincode, bookingDate });
    const accessToken = await getAccessToken();

    const response = await axios.post(`${import.meta.env.VITE_API_URL}/healthians-timeslots`, {
      accessToken,
      pincode,
      bookingDate,
    });
    const data = response.data;

    console.log('Time slots response:', data);

    if (data.status === 'success') {
      return data.timeslots || [];
    }

    throw new Error(data.message || 'Failed to fetch time slots');
  } catch (error) {
    console.error('Error fetching time slots:', error);
    throw error;
  }
}

// Create a booking
export async function createBooking(bookingData: any) {
  try {
    console.log('Creating booking with data:', bookingData);
    const accessToken = await getAccessToken();

    const response = await axios.post(`${import.meta.env.VITE_API_URL}/healthians-create-booking`, {
      accessToken,
      bookingData,
    });
    const data = response.data;

    console.log('Booking response:', data);

    if (data.status === 'success') {
      return data;
    }

    throw new Error(data.message || 'Failed to create booking');
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

// Listen to real-time booking updates - This will need to be implemented with WebSocket or polling
export function subscribeToBookingUpdates(bookingId: string, callback: (status: any) => void) {
  console.log('Real-time booking updates not implemented in MongoDB version yet');
  
  // For now, we'll implement a polling mechanism
  const interval = setInterval(async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/healthians-create-booking`);
      const bookings = response.data;
      const updatedBooking = bookings.find((b: any) => b.booking_id === bookingId);
      
      if (updatedBooking) {
        callback(updatedBooking);
      }
    } catch (error) {
      console.error('Error polling for booking updates:', error);
    }
  }, 10000); // Poll every 10 seconds

  return () => {
    clearInterval(interval);
    console.log('Stopped polling for booking updates');
  };
}

// Get bookings for current user
export async function getUserBookings() {
  try {
    console.log('Fetching user bookings...');
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/healthians-create-booking`);
    const data = response.data;

    console.log(`Fetched ${data?.length || 0} bookings`);
    return data || [];
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
}

// Get booking status history
export async function getBookingStatusHistory(bookingId: string) {
  try {
    console.log('Fetching booking status history for:', bookingId);
    
    // Fetch the status history for the specific booking
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/healthians-create-booking/${bookingId}/status-history`);
    const data = response.data;

    console.log(`Fetched ${data?.length || 0} status history entries`);
    return data || [];
  } catch (error) {
    console.error('Error fetching booking status history:', error);
    throw error;
  }
}
