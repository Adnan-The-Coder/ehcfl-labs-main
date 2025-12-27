import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

// Get Healthians access token
router.post('/', async (req, res) => {
  try {
    const baseUrl = process.env.HEALTHIANS_BASE_URL;
    const partnerName = process.env.HEALTHIANS_PARTNER_NAME;
    const username = process.env.HEALTHIANS_USERNAME;
    const password = process.env.HEALTHIANS_PASSWORD;

    if (!baseUrl || !partnerName || !username || !password) {
      return res.status(500).json({
        error: 'Healthians credentials not configured properly',
      });
    }

    const url = `${baseUrl}/api/${partnerName}/getAccessToken`;

    console.log('Requesting Healthians access token...');
    console.log('GET', url);

    const response = await axios.get(url, {
      auth: {
        username,
        password, // api_secret_key
      },
      headers: {
        Accept: 'application/json',
      },
      timeout: 15000,
      validateStatus: () => true, // avoid axios throwing
    });

    console.log('Healthians auth status:', response.status);
    console.log('Healthians auth response:', response.data);

    if (response.status !== 200 || !response.data?.access_token) {
      return res.status(502).json({
        error: 'Failed to get Healthians access token',
        response: response.data,
      });
    }

    return res.json({
      success: true,
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      token_type: 'Bearer',
      expires_in: 3600,
    });

  } catch (error) {
    console.error('Healthians auth exception:', error.message);

    return res.status(500).json({
      error: 'Unexpected error while getting Healthians token',
      details: error.response?.data ?? null,
    });
  }
});

export default router;
