export const API_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || 'http://127.0.0.1:8787';

export const API_ENDPOINTS = {
    // userProfile Endpoints 
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
}