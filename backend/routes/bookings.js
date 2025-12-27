import express from 'express';
import axios from 'axios';
import Booking from '../models/Booking.js';
import BookingStatusHistory from '../models/BookingStatusHistory.js';
import crypto from 'crypto';

const router = express.Router();

// Generate HMAC SHA256 checksum
function generateChecksum(bookingDate, pincode, mobile, secretKey) {
  const data = `${bookingDate}${pincode}${mobile}${secretKey}`;
  return crypto
    .createHmac('sha256', secretKey)
    .update(data)
    .digest('hex');
}

// Create a booking
router.post('/', async (req, res) => {
  try {
    console.log('=== HEALTHIANS CREATE BOOKING: Starting ===');
    
    const { accessToken, bookingData } = req.body;

    const checksumKey = process.env.HEALTHIANS_PASSWORD; // Using password as checksum key
    const partnerName = process.env.HEALTHIANS_PARTNER_NAME;
    const baseUrl = process.env.HEALTHIANS_BASE_URL.replace('/api', ''); // Remove '/api' suffix for base URL

    if (!accessToken || !checksumKey || !partnerName) {
      console.error('Missing credentials:', {
        hasAccessToken: !!accessToken,
        hasChecksumKey: !!checksumKey,
        hasPartnerName: !!partnerName
      });
      return res.status(400).json({ error: 'Required credentials not configured' });
    }

    console.log('Configuration:', {
      partnerName,
      baseUrl,
      hasAccessToken: !!accessToken,
      hasChecksumKey: !!checksumKey
    });

    // Generate checksum
    const checksum = generateChecksum(
      bookingData.booking_date,
      bookingData.pincode,
      bookingData.mobile,
      checksumKey
    );

    console.log('Generated checksum:', checksum);

    // Prepare booking payload
    const bookingPayload = {
      booking_date: bookingData.booking_date,
      pincode: bookingData.pincode,
      mobile: bookingData.mobile,
      checksum: checksum,
      name: bookingData.customer_name,
      email: bookingData.email,
      age: bookingData.age,
      gender: bookingData.gender,
      address1: bookingData.address1,
      address2: bookingData.address2,
      locality: bookingData.locality,
      landmark: bookingData.landmark,
      city: bookingData.city,
      state: bookingData.state,
      test_ids: bookingData.packages.map(pkg => pkg.test_id), // Assuming packages have test_id
      total_amount: bookingData.total_amount,
      payment_method: bookingData.payment_method,
    };

    console.log('Sending booking request with payload:', bookingPayload);

    // Make the booking request to Healthians API
    const response = await axios.post(`${baseUrl}/api/v1/bookings`, bookingPayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    const data = response.data;
    console.log('Booking created successfully:', data.booking_id);

    // Store booking in MongoDB
    console.log('Storing booking in database...');
    const newBooking = new Booking({
      booking_id: data.booking_id,
      healthians_booking_id: data.booking_id,
      user_id: bookingData.user_id || null,
      customer_name: bookingData.customer_name,
      customer_email: bookingData.email,
      customer_phone: bookingData.mobile,
      customer_age: bookingData.age,
      customer_gender: bookingData.gender,
      address_line1: bookingData.address1,
      address_line2: bookingData.address2,
      locality: bookingData.locality,
      landmark: bookingData.landmark,
      city: bookingData.city,
      state: bookingData.state,
      pincode: bookingData.pincode,
      booking_date: bookingData.booking_date,
      time_slot: bookingData.time_slot,
      packages: bookingData.packages,
      total_amount: bookingData.total_amount,
      payment_method: bookingData.payment_method,
      status: 'confirmed',
    });

    const savedBooking = await newBooking.save();
    console.log('Booking stored in database successfully');

    res.json({
      status: 'success',
      booking_id: savedBooking.booking_id,
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create booking',
      details: error.response?.data || null
    });
  }
});

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .sort({ created_at: -1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get booking status history
router.get('/:bookingId/status-history', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Find the booking by healthians booking ID
    const booking = await Booking.findOne({ healthians_booking_id: bookingId });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Find the status history for this booking
    const statusHistory = await BookingStatusHistory.find({ booking_id: booking._id })
      .sort({ changed_at: 1 });

    res.json(statusHistory);
  } catch (error) {
    console.error('Error fetching booking status history:', error);
    res.status(500).json({ error: 'Failed to fetch booking status history' });
  }
});

export default router;