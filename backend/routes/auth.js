import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Get Healthians access token
router.post('/', async (req, res) => {
  try {
    const partnerId = process.env.HEALTHIANS_USERNAME; 
    const partnerKey = process.env.HEALTHIANS_PASSWORD; 
    const baseUrl = process.env.HEALTHIANS_BASE_URL;

    if (!partnerId || !partnerKey) {
      console.error('Missing Healthians credentials');
      return res.status(400).json({ error: 'Healthians credentials not configured' });
    }

    const authPayload = {
      username: partnerId,
      password: partnerKey,
    };

    console.log('Requesting Healthians access token...');

    console.log('Making request to:', `${baseUrl}/api/v1/auth`);
    console.log('Auth payload:', authPayload);
    
    const response = await axios.get(`${baseUrl}/api/v1/auth`, authPayload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000 // 15 second timeout
    });

    const authData = response.data;
    console.log('Full Healthians auth response:', response);
    console.log('Healthians auth response received:', authData);

    // Check if the response has the expected access_token
    if (!authData.access_token) {
      console.error('Healthians API did not return access_token:', authData);
      return res.status(500).json({ 
        error: 'Healthians API did not return valid access token',
        received: authData
      });
    }

    // Return the access token
    res.json({
      access_token: authData.access_token,
      expires_in: authData.expires_in,
      token_type: authData.token_type
    });
  } catch (error) {
    console.error('Error getting Healthians access token:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get access token',
      details: error.response?.data || null
    });
  }
});

export default router;