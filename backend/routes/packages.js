import express from 'express';
import axios from 'axios';

const router = express.Router();

// Get available packages
router.post('/', async (req, res) => {
  try {
    const { accessToken, pincode } = req.body;
    const baseUrl = process.env.HEALTHIANS_BASE_URL.replace('/api', ''); // Remove '/api' suffix for base URL

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    console.log('Fetching packages for pincode:', pincode);

    const response = await axios.get(`${baseUrl}/api/v1/packages?pincode=${pincode}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    const packagesData = response.data;
    console.log('Packages response received');

    res.json(packagesData);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch packages',
      details: error.response?.data || null
    });
  }
});

export default router;