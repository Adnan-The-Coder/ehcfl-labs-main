import express from 'express';
import axios from 'axios';

const router = express.Router();

// Get available time slots
router.post('/', async (req, res) => {
  try {
    const { accessToken, pincode, bookingDate, lat, long, amount } = req.body;
    const baseUrl = process.env.HEALTHIANS_BASE_URL;
    const partnerName = process.env.HEALTHIANS_PARTNER_NAME;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    if (!pincode || !bookingDate) {
      return res.status(400).json({ error: 'Pincode and booking date are required' });
    }

    console.log('Fetching time slots for:', { pincode, bookingDate });

    // Use partner-specific endpoint
    const url = `${baseUrl}/api/${partnerName}/getSlotsByZipCode_v1`;

    const response = await axios.post(url, 
      {
        zipcode: pincode,
        slot_date: bookingDate,
        lat: lat?.toString() || '20.5937',
        long: long?.toString() || '78.9629',
        amount: amount || 0,
        isDeviceSlot: 0
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000
      }
    );

    const timeSlotsData = response.data;
    console.log('Time slots response:', timeSlotsData?.status, timeSlotsData?.data?.length || 0, 'slots');

    res.json(timeSlotsData);
  } catch (error) {
    console.error('Error fetching time slots:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch time slots',
      details: error.response?.data || null
    });
  }
});

export default router;