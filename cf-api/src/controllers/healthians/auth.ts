/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context } from 'hono';

export const getAccessToken = async (c: Context) => {
  try {
    const baseUrl = c.env.HEALTHIANS_BASE_URL as string;
    const partnerName = c.env.HEALTHIANS_PARTNER_NAME as string;
    const username = c.env.HEALTHIANS_USERNAME as string;
    const password = c.env.HEALTHIANS_PASSWORD as string;

    if (!baseUrl || !partnerName || !username || !password) {
      return c.json(
        { success: false, error: 'Healthians credentials not configured properly' },
        500
      );
    }

    const url = `${baseUrl}/api/${partnerName}/getAccessToken`;

    const basicAuth = btoa(`${username}:${password}`);

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow', 
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
    });

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();

    // 🔍 Log raw response when debugging
    console.error('Healthians raw response:', rawText);

    if (!response.ok) {
      return c.json(
        {
          success: false,
          error: 'Failed to get Healthians access token',
          status: response.status,
          response: rawText,
        },
        502
      );
    }

    if (!contentType.includes('application/json')) {
      return c.json(
        {
          success: false,
          error: 'Healthians returned non-JSON response',
          response: rawText,
        },
        502
      );
    }

    const data = JSON.parse(rawText);

    if (!data?.access_token) {
      return c.json(
        {
          success: false,
          error: 'Invalid response from Healthians',
          details: data,
        },
        502
      );
    }

    return c.json({
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? null,
      token_type: 'Bearer',
      expires_in: data.expires_in ?? 3600,
    });
  } catch (error: any) {
    console.error('Healthians auth exception:', error);
    return c.json(
      {
        success: false,
        error: 'Unexpected error while getting Healthians token',
        details: error.message,
      },
      500
    );
  }
};
