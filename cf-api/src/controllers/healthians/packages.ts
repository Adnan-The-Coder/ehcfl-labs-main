/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context } from 'hono';

interface PackageRequest {
  accessToken: string | undefined;
  zipcode: string;
  product_type?: string;
  start?: string;
  limit?: string;
}

export const getPartnerProducts = async (c: Context) => {
  try {
    const body: PackageRequest = await c.req.json().catch(() => ({}));
    const baseUrl = c.env.HEALTHIANS_BASE_URL as string;
    const partnerName = c.env.HEALTHIANS_PARTNER_NAME as string;
    const accessToken = body.accessToken || c.req.query('accessToken') || c.req.header('X-Access-Token');

    // Validate required parameters
    if (!body.zipcode) {
      return c.json(
        {
          success: false,
          error: 'Zipcode is required',
        },
        400
      );
    }

    if (!accessToken) {
      return c.json(
        {
          success: false,
          error: 'Access token is required. Call /healthians/auth first',
        },
        401
      );
    }

    if (!baseUrl || !partnerName) {
      return c.json(
        {
          success: false,
          error: 'Healthians configuration not found',
        },
        500
      );
    }

    const url = `${baseUrl}/api/${partnerName}/getPartnerProducts`;

    const productType = body.product_type || 'profile';
    const start = body.start || '0';
    const limit = body.limit || '100';

    const payload = {
      zipcode: body.zipcode,
      product_type: productType,
      start,
      limit,
    };

    console.log('Fetching Healthians packages...');
    console.log('URL:', url);
    console.log('Zipcode:', body.zipcode);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Healthians packages fetch failed:', errorData);
      return c.json(
        {
          success: false,
          error: 'Failed to fetch packages from Healthians',
          details: errorData,
        },
        response.status as any
      );
    }

    const data: any = await response.json();

    // Check response format
    if (!data) {
      return c.json(
        {
          success: false,
          error: 'Invalid response from Healthians',
        },
        502
      );
    }

    // Handle Healthians success response
    if (data.status === 'success' || data.resCode === '1000' || (Array.isArray(data.data) && data.data.length >= 0)) {
      return c.json({
        success: true,
        packages: data.data || [],
        message: data.message || 'Packages fetched successfully',
        zipcode: body.zipcode,
        total: (data.data || []).length,
      });
    }

    // Handle Healthians error response
    return c.json(
      {
        success: false,
        error: data.message || 'Failed to fetch packages',
        details: data,
      },
      400
    );
  } catch (error: any) {
    console.error('Healthians packages exception:', error.message);
    return c.json(
      {
        success: false,
        error: 'Unexpected error while fetching packages',
        details: error.message,
      },
      500
    );
  }
};
