# Healthians API Integration

## Overview

The Healthians API has been successfully migrated from Express backend to Cloudflare Workers using Hono.js. This provides a robust, scalable, and serverless implementation of all Healthians functionality.

## Architecture

### File Structure
```
cf-api/src/
├── controllers/healthians/
│   ├── auth.ts              # Token acquisition
│   ├── packages.ts          # Package fetching
│   └── serviceability.ts    # Service availability checking
├── routes/healthians.ts     # Route definitions
└── types.ts                 # TypeScript interfaces
```

### Endpoints

#### 1. **Authentication** - Get Healthians Access Token
**Endpoint:** `GET /healthians/auth`

**Description:** Acquires a Bearer token from Healthians API using partner credentials configured in environment variables.

**Request:**
```bash
curl -X GET https://api.example.com/healthians/auth
```

**Response (Success):**
```json
{
  "success": true,
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Healthians credentials not configured properly"
}
```

**Status Codes:**
- `200` - Success
- `500` - Configuration error
- `502` - Healthians authentication failed

---

#### 2. **Packages** - Get Health Packages by Zipcode
**Endpoint:** `POST /healthians/packages`

**Description:** Fetches all available health packages for a given zipcode.

**Request Body:**
```json
{
  "zipcode": "110001",
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "product_type": "profile",           // Optional (default: 'profile')
  "start": "0",                         // Optional (default: '0')
  "limit": "100"                        // Optional (default: '100')
}
```

**Alternative Header:**
```bash
curl -X POST https://api.example.com/healthians/packages \
  -H "X-Access-Token: eyJ0eXAiOiJKV1QiLCJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"zipcode": "110001"}'
```

**Response (Success):**
```json
{
  "success": true,
  "packages": [
    {
      "id": "pkg_123",
      "name": "Basic Health Checkup",
      "description": "Comprehensive health package",
      "price": 999,
      "tests": ["Blood Test", "ECG", "Ultrasound"],
      "validity": "1 Year"
    },
    ...
  ],
  "message": "Packages fetched successfully",
  "zipcode": "110001",
  "total": 15
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Zipcode is required"
}
```

**Status Codes:**
- `200` - Success
- `400` - Missing or invalid parameters
- `401` - Missing access token
- `500` - Server error
- `502` - Healthians API error

---

#### 3. **Serviceability** - Check Service Availability
**Endpoint:** `POST /healthians/serviceability`

**Description:** Checks if Healthians service is available at a given location with geolocation support.

**Request Body (Option 1 - With Coordinates):**
```json
{
  "latitude": 28.7041,
  "longitude": 77.1025,
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "slot_date": "2025-02-15",          // Optional (default: tomorrow)
  "amount": 1999,                      // Optional (default: 0)
  "isDeviceSlot": false               // Optional (default: false)
}
```

**Request Body (Option 2 - With Zipcode):**
```json
{
  "zipcode": "110001",
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "slot_date": "2025-02-15",
  "amount": 1999
}
```

**Request Body (Option 3 - IP-Based Geolocation):**
```json
{
  "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "clientIp": "1.2.3.4"               // Optional (auto-detected if not provided)
}
```

**Response (Success):**
```json
{
  "success": true,
  "serviceable": true,
  "message": "Service available at this location",
  "location": {
    "zipcode": "110001",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "address": "Delhi, 110001, India"
  },
  "slots_available": 5,
  "sample_slot": {
    "date": "2025-02-15",
    "time": "09:00 AM",
    "type": "home"
  },
  "all_slots": [...]
}
```

**Response (Not Serviceable):**
```json
{
  "success": true,
  "serviceable": false,
  "message": "Service not available at this location",
  "location": {
    "zipcode": "110001",
    "latitude": 28.7041,
    "longitude": 77.1025,
    "address": "Delhi, 110001, India"
  },
  "slots_available": 0,
  "sample_slot": null,
  "all_slots": []
}
```

**Status Codes:**
- `200` - Success (serviceable or not)
- `400` - Missing required parameters
- `401` - Missing access token
- `500` - Server error
- `502` - Healthians API error

---

## Geolocation Priority

The serviceability endpoint uses intelligent geolocation with the following priority:

1. **Provided Coordinates** - If `latitude` and `longitude` are provided
2. **Zipcode** - If `zipcode` is provided (uses Nominatim OpenStreetMap)
3. **Client IP** - If neither coordinates nor zipcode are provided (uses ipapi.co)
4. **Fallback** - India center coordinates (20.5937, 78.9629) if geolocation fails

---

## Environment Variables

Configure these in `wrangler.jsonc` or Cloudflare Workers Dashboard:

```jsonc
{
  "vars": {
    // Healthians API Configuration
    "HEALTHIANS_BASE_URL": "https://app.healthians.com",
    "HEALTHIANS_PARTNER_NAME": "your_partner_name",
    "HEALTHIANS_USERNAME": "your_username",
    "HEALTHIANS_PASSWORD": "your_password"
  }
}
```

**Note:** Replace placeholders with actual credentials provided by Healthians.

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": "Additional technical details (if available)"
}
```

### Common Error Codes

| Status | Error | Solution |
|--------|-------|----------|
| 400 | Missing required parameter | Provide all required fields |
| 401 | Access token is required | Call `/healthians/auth` first |
| 500 | Healthians credentials not configured | Set env vars properly |
| 502 | Failed to get Healthians token | Verify credentials are correct |
| 503 | Service unavailable | Check Healthians API status |

---

## Usage Examples

### Frontend Integration

```typescript
// Step 1: Get access token
const authResponse = await fetch('/healthians/auth', { method: 'GET' });
const { access_token } = await authResponse.json();

// Step 2: Get packages for zipcode
const packagesResponse = await fetch('/healthians/packages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    zipcode: '110001',
    accessToken: access_token
  })
});
const { packages } = await packagesResponse.json();

// Step 3: Check serviceability
const serviceResponse = await fetch('/healthians/serviceability', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    zipcode: '110001',
    accessToken: access_token
  })
});
const { serviceable, slots } = await serviceResponse.json();
```

### Backend-to-Backend

```bash
# Get token
TOKEN=$(curl -s https://api.example.com/healthians/auth | jq -r '.access_token')

# Fetch packages
curl -X POST https://api.example.com/healthians/packages \
  -H "X-Access-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"zipcode": "110001"}'

# Check serviceability
curl -X POST https://api.example.com/healthians/serviceability \
  -H "X-Access-Token: $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"zipcode": "110001"}'
```

---

## Testing

Run tests locally with Wrangler:

```bash
# Development
wrangler dev

# Test auth
curl http://localhost:8787/healthians/auth

# Test packages
curl -X POST http://localhost:8787/healthians/packages \
  -H "Content-Type: application/json" \
  -d '{"zipcode": "110001", "accessToken": "your_token"}'

# Test serviceability
curl -X POST http://localhost:8787/healthians/serviceability \
  -H "Content-Type: application/json" \
  -d '{"zipcode": "110001", "accessToken": "your_token"}'
```

---

## Migration Notes

### From Express to Hono.js

| Aspect | Express | Hono.js |
|--------|---------|---------|
| Auth | HTTP Basic (auth.js) | Env-based credentials |
| Packages | Bearer token (packages.js) | X-Access-Token header |
| Serviceability | Dual geolocation (serviceability.js) | Enhanced with fallback |
| Error Handling | status=502/500 | Consistent JSON responses |
| Deployment | Node.js/PM2 | Cloudflare Workers |

---

## Future Enhancements

- [ ] Token caching/refresh mechanism
- [ ] Rate limiting per API key
- [ ] Webhook support for booking status
- [ ] Healthians timeslots migration
- [ ] Healthians create booking endpoint
- [ ] Analytics and logging integration

---

## Support

For issues or questions:
1. Check environment variables in `wrangler.jsonc`
2. Enable detailed logging: `ENABLE_DETAILED_LOGGING=true`
3. Review request/response in browser DevTools
4. Contact Healthians support for API-specific issues
