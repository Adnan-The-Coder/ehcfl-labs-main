import express from 'express';
import axios from 'axios';

const router = express.Router();

// Check serviceability for a pincode
router.post('/', async (req, res) => {
  try {
    const { accessToken, pincode } = req.body;
    const baseUrl = process.env.HEALTHIANS_BASE_URL.replace('/api', ''); // Remove '/api' suffix for base URL

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    console.log('Checking serviceability for pincode:', pincode);

    console.log('Making request to:', `${baseUrl}/api/v1/serviceability?pincode=${pincode}`);
    console.log('Access token being used:', accessToken ? 'present' : 'missing');
    
    const response = await axios.get(`${baseUrl}/api/v1/serviceability?pincode=${pincode}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000 // 10 second timeout
    });

    const serviceabilityData = response.data;
    console.log('Serviceability response:', serviceabilityData);

    res.json(serviceabilityData);
  } catch (error) {
    console.error('Error checking serviceability:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to check serviceability',
      details: error.response?.data || null
    });
  }
});

export default router;