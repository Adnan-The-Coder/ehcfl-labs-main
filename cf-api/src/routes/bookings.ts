import { Hono } from 'hono';
import { 
  getAllBookings, 
  createBooking, 
  getBookingById, 
  getBookingsByUserUUID,
  updateBooking,
  deleteBooking
} from '../controllers/booking/booking';

const bookingRoutes = new Hono();

// Fetch all bookings
bookingRoutes.get('/', getAllBookings);

// Create a new booking
bookingRoutes.post('/', createBooking);

// Fetch a single booking by booking ID
bookingRoutes.get('/:bookingId', getBookingById);

// Fetch all bookings for a specific user
bookingRoutes.get('/user/:userUuid', getBookingsByUserUUID);

// Update a booking by booking ID
bookingRoutes.put('/:bookingId', updateBooking);
bookingRoutes.patch('/:bookingId', updateBooking);

// Delete a booking by booking ID
bookingRoutes.delete('/:bookingId', deleteBooking);

export default bookingRoutes;
