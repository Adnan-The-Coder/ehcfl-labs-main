/* eslint-disable @typescript-eslint/no-explicit-any */
import { GeoLocation } from "../types";

/**
 * Get geolocation from IP address using ipapi.co
 */
export const getGeoFromIP = async (clientIp: string): Promise<GeoLocation | null> => {
  try {
    console.log('Getting geolocation from IP:', clientIp);
    const response = await fetch(`https://ipapi.co/${clientIp}/json/`);
    if (!response.ok) return null;

    const data: any = await response.json();
    if (data.latitude && data.longitude) {
      return {
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        address: `${data.city}, ${data.postal}, ${data.country_name}`,
        postal: data.postal ?? null,
        city: data.city ?? null,
        region: data.region ?? null,
        country_name: data.country_name ?? null,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting geo from IP:', error);
    return null;
  }
};


/**
 * Get coordinates from zipcode using Nominatim (OpenStreetMap)
 */
export const getGeoFromZipcode = async (zipcode: string): Promise<GeoLocation | null> => {
  try {
    console.log('Getting geolocation from zipcode:', zipcode);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${zipcode}&country=IN&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'EHCFLabs/1.0',
        },
      }
    );

    if (!response.ok) return null;
    const data: any = await response.json();

    if (data && data[0]) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        address: data[0].address,
      };
    }

    // Fallback to India center coordinates
    console.warn('Zipcode not found in Nominatim, using fallback coordinates');
    return {
      latitude: 20.5937,
      longitude: 78.9629,
      address: 'India (Fallback Center)',
    };
  } catch (error) {
    console.error('Error getting geo from zipcode:', error);
    // Return fallback India center coordinates
    return {
      latitude: 20.5937,
      longitude: 78.9629,
      address: 'India (Fallback Center)',
    };
  }
};


/**
 * Get IP address and geolocation data
 */
export const getIpAndLocation = async (ip: string, env: any) => {
  try {
    const IP_INFO_TOKEN = env.IP_INFO_TOKEN || 'db04343f368c67';
    
    const geoResponse = await fetch(`https://ipinfo.io/${ip}/json?token=${IP_INFO_TOKEN}`);
    const geoData:{city:string, 
                  region:string, 
                  country:string, 
                  loc:string, 
                  postal:string,
                  org:string, 
                  timezone:string} = await geoResponse.json();
    
    return {
      ip,
      city: geoData.city || 'Unknown',
      region: geoData.region || 'Unknown',
      country: geoData.country || 'Unknown',
      loc: geoData.loc || '0,0',
      org: geoData.org || 'Unknown',
      postal: geoData.postal || 'Unknown',
      timezone: geoData.timezone || 'Unknown'
    };
  } catch (error) {
    console.error('❌ Error fetching location:', error);
    return {
      ip,
      city: 'Unknown',
      region: 'Unknown',
      country: 'Unknown',
      loc: '0,0',
      org: 'Unknown',
      postal: 'Unknown',
      timezone: 'Unknown'
    };
  }
};