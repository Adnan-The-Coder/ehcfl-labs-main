# Frontend Integration Guide - Healthians API

## Overview

The frontend has been fully integrated with the new Cloudflare Workers Healthians API endpoints. All API calls now go through the modern cf-api infrastructure instead of the legacy Express backend.

## Architecture Changes

### Before (Express Backend)
```
Frontend → Express Backend (localhost:3001)
  ├── /healthians-auth
  ├── /healthians-packages
  ├── /healthians-serviceability
  └── /healthians-timeslots
```

### After (Cloudflare Workers)
```
Frontend → Cloudflare Workers (cf-api)
  ├── /healthians/auth (GET)
  ├── /healthians/packages (POST)
  ├── /healthians/serviceability (POST)
  └── (timeslots - coming soon)
```

## Updated Files

### 1. **[src/config/api.ts](src/config/api.ts)** - API Endpoints Configuration
Added three new Healthians endpoints:
```typescript
healthiansAuth: `${API_BASE_URL}/healthians/auth`
healthiansPackages: `${API_BASE_URL}/healthians/packages`
healthiansServiceability: `${API_BASE_URL}/healthians/serviceability`
```

### 2. **[src/services/healthiansApi.ts](src/services/healthiansApi.ts)** - Service Layer
Complete rewrite to use cf-api endpoints:

#### `getAccessToken()` 
- **Method:** GET `/healthians/auth`
- **Returns:** `string` - Bearer token for authenticated requests
- **Caching:** 1-hour TTL with auto-refresh
- **Logging:** Debug-friendly console logs with status indicators (✅, ❌, 🔐, etc.)

**Example:**
```typescript
const token = await getAccessToken();
// Returns: "eyJ0eXAiOiJKV1QiLCJhbGc..."
```

#### `getPackages(pincode?, search?)`
- **Method:** POST `/healthians/packages`
- **Params:** 
  - `pincode` (required) - Zip code for package lookup
  - `search` (optional) - Search term (currently not used)
- **Returns:** `Package[]` - Array of health packages
- **Error Handling:** Returns empty array on failure

**Example:**
```typescript
const packages = await getPackages('110001');
// Returns: [{ id, name, price, tests, ... }]
```

#### `checkServiceability(pincode?, latitude?, longitude?, slotDate?)`
- **Method:** POST `/healthians/serviceability`
- **Params:**
  - `pincode` (optional) - Zip code
  - `latitude`, `longitude` (optional) - GPS coordinates
  - `slotDate` (optional) - Booking date
- **Returns:** ServiceabilityResult with slots and location info
- **Geolocation:** Smart fallback (coords > zipcode > IP)

**Example:**
```typescript
const result = await checkServiceability('110001');
// Returns: {
//   isServiceable: true,
//   message: "Service available at this location",
//   location: { zipcode, latitude, longitude, address },
//   slotsAvailable: 5,
//   allSlots: [...]
// }
```

### 3. **[src/hooks/useHealthiansPackages.ts](src/hooks/useHealthiansPackages.ts)** - Package Hook
Already in place, now using updated service layer:
```typescript
const { data: packages, isLoading, error } = useHealthiansPackages(pincode);
```

### 4. **[src/hooks/useServiceability.ts](src/hooks/useServiceability.ts)** - NEW Serviceability Hook
New hook for checking service availability:

```typescript
const {
  data: result,
  isLoading,
  error,
} = useServiceability(
  pincode,
  latitude,
  longitude,
  slotDate,
  enabled // Control when to fetch
);

// result: {
//   isServiceable: boolean,
//   message: string,
//   location: { zipcode, latitude, longitude, address },
//   slotsAvailable: number,
//   sampleSlot: any,
//   allSlots: any[]
// }
```

## Integration Points

### 1. **Tests Page** - Package Discovery
Location: [src/pages/Tests.tsx](src/pages/Tests.tsx)

Already integrated with `useHealthiansPackages`:
```typescript
const { pincode } = usePincode();
const { data: apiPackages, isLoading, error } = useHealthiansPackages(pincode);

// Display packages with filters, search, sorting
```

**Flow:**
1. User enters/updates pincode
2. Tests page fetches packages for that pincode
3. Packages are displayed in grid/list view
4. User can filter, sort, and search

**Status:** ✅ Ready to use

### 2. **Booking Page** - Serviceability Check
Location: [src/pages/Booking.tsx](src/pages/Booking.tsx)

**Recommended Integration:**
```typescript
import { useServiceability } from '@/hooks/useServiceability';

// In Booking component
const { pincode } = usePincode();
const { data: serviceability, isLoading } = useServiceability(
  pincode,
  undefined, // latitude
  undefined, // longitude
  bookingData.date
);

// Check before proceeding
if (!serviceability?.isServiceable) {
  return <Alert>Service not available in your area</Alert>;
}
```

**Status:** ⏳ Ready for integration

### 3. **Navbar / Hero** - Initial Setup
Location: [src/components/Navbar.tsx](src/components/Navbar.tsx) or [src/components/Hero.tsx](src/components/Hero.tsx)

When user selects/enters pincode:
```typescript
import { useServiceability } from '@/hooks/useServiceability';
import { usePincode } from '@/contexts/PincodeContext';

const { pincode, setIsServiceable } = usePincode();
const { data: serviceability } = useServiceability(pincode);

useEffect(() => {
  if (serviceability) {
    setIsServiceable(serviceability.isServiceable);
  }
}, [serviceability, setIsServiceable]);
```

**Status:** ⏳ Ready for integration

## API Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐                                            │
│  │ Navbar/Hero  │─────┐                                      │
│  └──────────────┘     │                                      │
│                       ├─→ Get Access Token                   │
│  ┌──────────────┐     │   GET /healthians/auth              │
│  │ Tests Page   │─────┤                                      │
│  └──────────────┘     ├─→ Fetch Packages                    │
│                       │   POST /healthians/packages          │
│  ┌──────────────┐     │                                      │
│  │ Booking Page │─────┤   (with Bearer Token)               │
│  └──────────────┘     │                                      │
│                       ├─→ Check Serviceability              │
│                       │   POST /healthians/serviceability   │
│                       │   (with Geolocation)                │
│                       │                                      │
│                       └─→ Use /bookings Endpoint            │
│                           POST /bookings (create booking)    │
│                                                               │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS
                               ↓
        ┌──────────────────────────────────────────┐
        │  Cloudflare Workers (cf-api)             │
        ├──────────────────────────────────────────┤
        │ GET  /healthians/auth                    │
        │ POST /healthians/packages                │
        │ POST /healthians/serviceability          │
        │ POST /bookings                           │
        └──────────────────────────┬───────────────┘
                                   │
                                   ↓
                    ┌──────────────────────────┐
                    │  Healthians API          │
                    │  (Third-party service)   │
                    └──────────────────────────┘
```

## Data Mapping

### Healthians Package → Frontend Package

```typescript
// Healthians Response
{
  deal_id: "123",
  test_name: "Complete Health Checkup",
  product_type: "package",
  price: 999,
  mrp: 1500
}

// Maps to Frontend Package
{
  id: "123",
  name: "Complete Health Checkup",
  price: 999,
  originalPrice: 1500,
  discount: 33,
  category: "Packages",
  description: "Complete Health Checkup - package",
  testsCount: 0,
  tests: [],
  sampleType: "Blood",
  fastingRequired: false,
  reportTime: "24 hours",
  popular: false
}
```

## Error Handling

### Access Token Errors
```typescript
try {
  const token = await getAccessToken();
} catch (error) {
  console.error('❌ Failed to get access token');
  // Show user: "Unable to load packages. Please try again."
}
```

### Package Fetch Errors
```typescript
const { data: packages, error } = useHealthiansPackages(pincode);

if (error) {
  return <Alert>Failed to load packages. Please try again.</Alert>;
}
```

### Serviceability Check Errors
```typescript
const { data: result, error } = useServiceability(pincode);

if (error) {
  return (
    <Alert>
      Unable to check service availability.
      Please try again or contact support.
    </Alert>
  );
}
```

## Environment Variables

Ensure these are set in your `.env`:

```env
VITE_BACKEND_API_BASE_URL=http://127.0.0.1:8787  # Local dev
# OR
VITE_BACKEND_API_BASE_URL=https://api.yourdomain.com  # Production
```

## Testing in Development

### 1. Start Cloudflare Workers locally
```bash
cd cf-api
wrangler dev
```

### 2. Start Frontend dev server
```bash
npm run dev
```

### 3. Test Healthians endpoints
```bash
# Test auth
curl http://127.0.0.1:8787/healthians/auth

# Test packages
curl -X POST http://127.0.0.1:8787/healthians/packages \
  -H "Content-Type: application/json" \
  -d '{"zipcode": "110001", "accessToken": "token_here"}'

# Test serviceability
curl -X POST http://127.0.0.1:8787/healthians/serviceability \
  -H "Content-Type: application/json" \
  -d '{"zipcode": "110001", "accessToken": "token_here"}'
```

### 4. Check browser console
All API calls include detailed logging:
- ✅ Success indicators
- ❌ Error indicators
- 🔐 Auth operations
- 📦 Package operations
- 🔍 Serviceability checks

## Common Issues & Solutions

### Issue: "Access token not configured"
**Solution:** Check that Healthians credentials are set in `wrangler.jsonc`:
```jsonc
"vars": {
  "HEALTHIANS_BASE_URL": "https://app.healthians.com",
  "HEALTHIANS_PARTNER_NAME": "your_partner",
  "HEALTHIANS_USERNAME": "username",
  "HEALTHIANS_PASSWORD": "password"
}
```

### Issue: CORS errors
**Solution:** CORS is configured in cf-api. Check that your frontend URL is in `ALLOWED_ORIGINS`:
```typescript
const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:5173", // Vite
  "https://yourdomain.com",
]);
```

### Issue: Packages returning empty array
**Solution:** 
1. Verify pincode is valid for Healthians service
2. Check that access token is obtained successfully
3. Look for error logs in browser console

### Issue: Serviceability check failing
**Solution:**
1. Ensure pincode or coordinates are provided
2. Check network request in DevTools
3. Verify Healthians API is responding

## Next Steps

### Frontend Pages to Update
- [ ] Add serviceability check in Booking page before step 2
- [ ] Show unavailable areas message with fallback options
- [ ] Add slot availability display (when timeslots endpoint is ready)
- [ ] Integration tests for API flows

### Backend Features Coming Soon
- [ ] Healthians timeslots migration (get available booking slots)
- [ ] Healthians create booking migration (finalize Healthians bookings)
- [ ] Webhook handling (receive booking status updates)
- [ ] Token refresh mechanism (auto-refresh expiring tokens)

## Support & Debugging

### Enable Detailed Logging
In `cf-api/wrangler.jsonc`:
```jsonc
"vars": {
  "ENABLE_DETAILED_LOGGING": "true"
}
```

### View cf-api Logs
```bash
cd cf-api
wrangler tail
```

### Common Log Messages
- `✅ Using cached Healthians access token` - Token reused within TTL
- `🔐 Fetching new Healthians access token` - New token being acquired
- `📦 Fetching Healthians packages` - Package list requested
- `🔍 Checking Healthians serviceability` - Availability being checked
- `❌ Healthians packages fetch failed` - API error occurred

## Architecture Summary

```
┌─ Frontend (ViteJS + React) ─────────────────┐
│                                              │
│ • Sign-in (Supabase + Geolocation)         │
│ • Tests/Packages (from Healthians API)      │
│ • Booking Flow (multi-step with payment)    │
│ • Track Orders (status polling)             │
│                                              │
└────────────────┬─────────────────────────────┘
                 │
                 ├── /api (Bookings CRUD)
                 ├── /payment (Razorpay)
                 └── /healthians (NEW - Packages, Serviceability)
                 │
        ┌────────▼──────────────────┐
        │ Cloudflare Workers (cf-api) │
        │                             │
        │ • D1 Database (SQLite)      │
        │ • User Profiles             │
        │ • Bookings Management       │
        │ • Payment Processing        │
        │ • Healthians Integration    │
        │                             │
        └────────┬──────────────────┘
                 │
        ┌────────▼─────────────────────┐
        │ External APIs                 │
        │                               │
        │ • Healthians (packages, auth) │
        │ • Razorpay (payments)         │
        │ • Supabase (authentication)   │
        │ • IPInfo.io (geolocation)     │
        │ • Nominatim (geocoding)       │
        │                               │
        └────────────────────────────┘
```

This integration provides a robust, scalable, and maintainable solution for managing health packages and serviceability checks in your EHCF Labs platform.
