import express from 'express';
import axios from 'axios';

const router = express.Router();

// Get available packages for a pincode
router.post('/', async (req, res) => {
  try {
    const { accessToken, pincode, productType, search, start = '0', limit = '100' } = req.body;
    const baseUrl = process.env.HEALTHIANS_BASE_URL;
    const partnerName = process.env.HEALTHIANS_PARTNER_NAME;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    if (!pincode) {
      return res.status(400).json({ error: 'Pincode is required' });
    }

    console.log('=== PACKAGES API DEBUG ===');
    console.log('Pincode:', pincode);
    console.log('Base URL:', baseUrl);
    console.log('Partner Name:', partnerName);

    // Correct endpoint: getPartnerProducts
    const url = `${baseUrl}/api/${partnerName}/getPartnerProducts`;
    console.log('Full URL:', url);

    // product_type must be "profile" to get packages - empty string returns 0 results
    const requestBody = {
      zipcode: pincode,
      product_type: productType || 'profile',
      product_type_id: '',
      start: start,
      limit: limit,
      test_type: 'pathology',
      client_id: ''
    };
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));

    const response = await axios.post(
      url,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const packagesData = response.data;
    console.log('=== RESPONSE DEBUG ===');
    console.log('Response status:', packagesData?.status);
    console.log('Response message:', packagesData?.message);
    console.log('Response resCode:', packagesData?.resCode);
    console.log('Data type:', typeof packagesData?.data);
    console.log('Data is array:', Array.isArray(packagesData?.data));
    console.log('Data length:', packagesData?.data?.length || 0);
    
    if (packagesData?.data?.length > 0) {
      console.log('First package sample:', JSON.stringify(packagesData.data[0], null, 2));
    }
    console.log('=== END DEBUG ===');

    // Sending the packages data back
    res.json(packagesData);
  } catch (error) {
    console.error('Error fetching packages:', error.response?.data || error.message);
    res.status(500).json({
      error: error.message || 'Failed to fetch packages',
      details: error.response?.data || null,
    });
  }
});

export default router;
