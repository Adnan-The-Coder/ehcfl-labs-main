export const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || 'http://127.0.0.1:8787';

export const API_ENDPOINTS = {
    apiBase: API_BASE_URL,
    
    // User Profile Endpoints 
    createProfile: `${API_BASE_URL}/users`, // Creating a new user profile
    getAllProfiles: `${API_BASE_URL}/users`, // Fetching all userProfiles
    getProfileByUUID: (uuid: string) => `${API_BASE_URL}/users/${uuid}`, // Fetching a specific userProfile by uuid
    updateProfileByUUID: (uuid: string) => `${API_BASE_URL}/users/${uuid}`, // Updating a specific userProfile by uuid

    // Booking Endpoints
    createBooking: `${API_BASE_URL}/bookings`, // Create a new booking
    getAllBookings: `${API_BASE_URL}/bookings`, // Fetch all bookings
    getBookingById: (bookingId: string) => `${API_BASE_URL}/bookings/${bookingId}`, // Fetch a specific booking by booking ID
    getBookingsByUserUUID: (userUuid: string) => `${API_BASE_URL}/bookings/user/${userUuid}`, // Fetch all bookings for a specific user
    updateBooking: (bookingId: string) => `${API_BASE_URL}/bookings/${bookingId}`, // Update a specific booking by booking ID
    deleteBooking: (bookingId: string) => `${API_BASE_URL}/bookings/${bookingId}`, // Delete a specific booking by booking ID

    // Auth Endpoints
    authSignIn: `${API_BASE_URL}/users/auth/signin`, // Email/password sign-in
    authGoogleOAuth: `${API_BASE_URL}/users/auth/google`, // Initiate Google OAuth
    authCallback: `${API_BASE_URL}/users/auth/callback`, // OAuth callback
    authResetPassword: `${API_BASE_URL}/users/auth/reset-password`, // Password reset
    authSession: `${API_BASE_URL}/users/auth/session`, // Verify session

    // Payment Endpoints
    createOrder: `${API_BASE_URL}/payment/create-order`, // Create Razorpay order
    verifyOrder: `${API_BASE_URL}/payment/verify-order`, // Verify Razorpay payment

    // Healthians API Endpoints
    healthiansAuth: `${API_BASE_URL}/healthians/auth`, // Get Healthians access token
    healthiansPackages: `${API_BASE_URL}/healthians/packages`, // Get packages by zipcode
    healthiansServiceability: `${API_BASE_URL}/healthians/serviceability`, // Check service availability
    healthiansSlots: `${API_BASE_URL}/healthians/slots`, // Get available slots for a date
    healthiansBooking: `${API_BASE_URL}/healthians/booking`, // Create Healthians booking
    healthiansBookingDetail: (bookingId: string) => `${API_BASE_URL}/healthians/booking/${bookingId}`, // Get booking details
    healthiansBookingCancel: (bookingId: string) => `${API_BASE_URL}/healthians/booking/${bookingId}/cancel`, // Cancel booking
}