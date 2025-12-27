import express from 'express';
import axios from 'axios';
import requestIp from 'request-ip';

const router = express.Router();

// Serviceability check - supports both pincode-based and IP-based geolocation
router.post('/', async (req, res) => {
  try {
    const { accessToken, pincode } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    const baseUrl = process.env.HEALTHIANS_BASE_URL;
    const partnerName = process.env.HEALTHIANS_PARTNER_NAME;

    let zipcode = pincode;
    let latitude = null;
    let longitude = null;
    let city = null;
    let region = null;
    let country_name = null;
    let clientIp = null;

    /* -------------------------
       1. If pincode provided, use it directly
       Otherwise, try IP-based geolocation
    --------------------------*/
    if (!zipcode) {
      // Get client IP
      clientIp = requestIp.getClientIp(req)?.replace('::ffff:', '') || '';
      
      // Skip IP geolocation for localhost
      if (clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1') {
        try {
          const geoRes = await axios.get(
            `https://ipapi.co/${clientIp}/json/`,
            { timeout: 5000 }
          );

          zipcode = geoRes.data.postal;
          latitude = geoRes.data.latitude;
          longitude = geoRes.data.longitude;
          city = geoRes.data.city;
          region = geoRes.data.region;
          country_name = geoRes.data.country_name;
        } catch (geoError) {
          console.error('IP geolocation failed:', geoError.message);
        }
      }
    }

    if (!zipcode) {
      return res.status(400).json({
        error: 'Pincode is required (unable to detect from IP)',
        message: 'Please provide a pincode in the request'
      });
    }

    /* -------------------------
       2. Get coordinates for pincode if not already available
       Using a free geocoding service
    --------------------------*/
    if (!latitude || !longitude) {
      try {
        // Use Nominatim (OpenStreetMap) for geocoding Indian pincodes
        const geocodeRes = await axios.get(
          `https://nominatim.openstreetmap.org/search?postalcode=${zipcode}&country=India&format=json&limit=1`,
          { 
            timeout: 5000,
            headers: { 'User-Agent': 'EHCF-Labs-Healthcare-App' }
          }
        );

        if (geocodeRes.data && geocodeRes.data.length > 0) {
          latitude = parseFloat(geocodeRes.data[0].lat);
          longitude = parseFloat(geocodeRes.data[0].lon);
          city = geocodeRes.data[0].display_name?.split(',')[0] || null;
        } else {
          // Fallback: use default coordinates for India if geocoding fails
          latitude = 20.5937;  // Center of India
          longitude = 78.9629;
        }
      } catch (geocodeError) {
        console.error('Geocoding failed:', geocodeError.message);
        // Use fallback coordinates
        latitude = 20.5937;
        longitude = 78.9629;
      }
    }

    /* -------------------------
       3. Valid slot date (tomorrow)
    --------------------------*/
    const slotDate = new Date();
    slotDate.setDate(slotDate.getDate() + 1);
    const formattedDate = slotDate.toISOString().split('T')[0];

    console.log('Checking serviceability:', { zipcode, formattedDate, latitude, longitude });

    /* -------------------------
       4. Call Healthians Slots API
    --------------------------*/
    const url = `${baseUrl}/api/${partnerName}/getSlotsByZipCode_v1`;

    const slotResponse = await axios.post(
      url,
      {
        zipcode: zipcode,
        slot_date: formattedDate,
        lat: latitude.toString(),
        long: longitude.toString(),
        amount: 0,
        isDeviceSlot: 0
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('Slots API response:', slotResponse.data?.status, slotResponse.data?.message);

    const slots = slotResponse.data?.data || [];

    /* -------------------------
       5. Serviceability logic
    --------------------------*/
    if (slotResponse.data?.status === true && Array.isArray(slots) && slots.length > 0) {
      return res.json({
        status: true,
        serviceable: true,
        message: 'Service available in your area',
        location: {
          ip: clientIp,
          city: city || slots[0]?.city,
          region,
          country: country_name || 'India',
          zipcode,
          latitude,
          longitude
        },
        slot_date: formattedDate,
        slots_available: slots.length,
        sample_slot: {
          slot_id: slots[0].stm_id,
          slot_time: slots[0].slot_time
        }
      });
    }

    // No slots available
    return res.json({
      status: false,
      serviceable: false,
      message: slotResponse.data?.message || 'No slots available for this location',
      location: {
        zipcode,
        city
      }
    });

  } catch (error) {
    console.error(
      'Serviceability error:',
      error.response?.data || error.message
    );

    return res.status(502).json({
      status: false,
      error: 'Failed to check serviceability',
      details: error.response?.data ?? null
    });
  }
});

export default router;
