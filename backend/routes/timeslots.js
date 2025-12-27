import express from 'express';
import axios from 'axios';

const router = express.Router();

// Get available time slots
router.post('/', async (req, res) => {
  try {
    const { accessToken, pincode, bookingDate } = req.body;
    const baseUrl = process.env.HEALTHIANS_BASE_URL.replace('/api', ''); // Remove '/api' suffix for base URL

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    console.log('Fetching time slots for:', { pincode, bookingDate });

    const response = await axios.get(`${baseUrl}/api/v1/timeslots?pincode=${pincode}&date=${bookingDate}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    const timeSlotsData = response.data;
    console.log('Time slots response:', timeSlotsData);

    res.json(timeSlotsData);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch time slots',
      details: error.response?.data || null
    });
  }
});

export default router;