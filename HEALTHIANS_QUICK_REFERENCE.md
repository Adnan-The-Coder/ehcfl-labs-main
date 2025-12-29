# Quick Reference - Healthians API Integration

## One-Page Cheat Sheet

### Frontend Service Functions

#### Get Access Token
```typescript
import { getAccessToken } from '@/services/healthiansApi';

const token = await getAccessToken();
// Returns: "eyJ0eXAi..." (cached for 1 hour)
```

#### Fetch Packages
```typescript
import { useHealthiansPackages } from '@/hooks/useHealthiansPackages';

const { data: packages, isLoading } = useHealthiansPackages('110001');
// Returns: Package[] mapped from Healthians API
```

#### Check Serviceability
```typescript
import { useServiceability } from '@/hooks/useServiceability';

// By pincode
const { data: result } = useServiceability('110001');

// By coordinates
const { data: result } = useServiceability(undefined, 28.7041, 77.1025);

// result.isServiceable: boolean
// result.slotsAvailable: number
// result.allSlots: any[]
// result.location: { zipcode, latitude, longitude, address }
```

### API Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/healthians/auth` | GET | Get Bearer token | None |
| `/healthians/packages` | POST | Fetch packages by zipcode | Bearer token (in body) |
| `/healthians/serviceability` | POST | Check service availability | Bearer token (in body) |

### Response Examples

#### Auth Response
```json
{
  "success": true,
  "access_token": "eyJ0eXAi...",
  "refresh_token": "xyz...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

#### Packages Response
```json
{
  "success": true,
  "packages": [
    {
      "id": "pkg_123",
      "name": "Complete Health Checkup",
      "price": 999,
      "originalPrice": 1500,
      "discount": 33,
      "category": "Packages",
      ...
    }
  ],
  "zipcode": "110001",
  "total": 15
}
```

#### Serviceability Response
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
  "sample_slot": { "date": "2025-02-15", "time": "09:00 AM" },
  "all_slots": [...]
}
```

### Component Integration Examples

#### Tests Page (Already Integrated)
```typescript
import { useHealthiansPackages } from '@/hooks/useHealthiansPackages';
import { usePincode } from '@/contexts/PincodeContext';

export function Tests() {
  const { pincode } = usePincode();
  const { data: packages, isLoading, error } = useHealthiansPackages(pincode);
  
  return (
    <div>
      {isLoading && <Skeleton />}
      {error && <Alert>Failed to load packages</Alert>}
      {packages?.map(pkg => <PackageCard key={pkg.id} package={pkg} />)}
    </div>
  );
}
```

#### Booking Page (Ready for Integration)
```typescript
import { useServiceability } from '@/hooks/useServiceability';
import { usePincode } from '@/contexts/PincodeContext';

export function BookingPage() {
  const { pincode } = usePincode();
  const [bookingDate, setBookingDate] = useState('2025-02-15');
  
  const { data: serviceability, isLoading } = useServiceability(
    pincode,
    undefined,
    undefined,
    bookingDate
  );
  
  if (!serviceability?.isServiceable) {
    return <Alert>Service not available in {pincode}</Alert>;
  }
  
  return <BookingForm />;
}
```

#### Navbar (Ready for Integration)
```typescript
import { useServiceability } from '@/hooks/useServiceability';
import { usePincode } from '@/contexts/PincodeContext';

export function Navbar() {
  const { pincode, setIsServiceable } = usePincode();
  const { data: serviceability } = useServiceability(pincode);
  
  useEffect(() => {
    if (serviceability) {
      setIsServiceable(serviceability.isServiceable);
    }
  }, [serviceability]);
  
  return (
    <nav>
      {/* Show availability status */}
      {serviceability?.isServiceable && (
        <Badge>✅ Service Available</Badge>
      )}
    </nav>
  );
}
```

### Debugging Tips

#### Check Cache Status
```typescript
// Access token is cached for 1 hour
// To force refresh: clear localStorage
localStorage.removeItem('cached_token_key');
```

#### View Console Logs
```
✅ Using cached Healthians access token
🔐 Fetching new Healthians access token from http://localhost:8787/healthians/auth
📦 Fetching Healthians packages: { pincode: "110001" }
🔍 Checking Healthians serviceability: { pincode: "110001" }
❌ Error fetching packages
```

#### Test Raw API
```bash
# Get token
curl http://localhost:8787/healthians/auth

# Fetch packages
curl -X POST http://localhost:8787/healthians/packages \
  -H "Content-Type: application/json" \
  -d '{
    "zipcode": "110001",
    "accessToken": "YOUR_TOKEN_HERE"
  }'
```

### Error Codes

| Status | Error | Action |
|--------|-------|--------|
| 200 | None | Success ✅ |
| 400 | Missing zipcode | Provide required parameter |
| 401 | Missing access token | Call auth endpoint first |
| 500 | Config error | Check env vars in wrangler.jsonc |
| 502 | Healthians API error | Contact Healthians support |

### Environment Setup

#### Local Development (.env)
```env
VITE_BACKEND_API_BASE_URL=http://127.0.0.1:8787
```

#### Cloudflare Workers (wrangler.jsonc)
```jsonc
"vars": {
  "HEALTHIANS_BASE_URL": "https://app.healthians.com",
  "HEALTHIANS_PARTNER_NAME": "partner_name",
  "HEALTHIANS_USERNAME": "username",
  "HEALTHIANS_PASSWORD": "password"
}
```

### Data Flow

```
User Updates Pincode
        ↓
useHealthiansPackages Hook
        ↓
healthiansApi.getAccessToken()
        ↓ (with Bearer token)
healthiansApi.getPackages(pincode)
        ↓
Fetch from /healthians/packages
        ↓
Map Healthians → Frontend Package
        ↓
Display in Tests Page
```

```
User Starts Booking
        ↓
useServiceability Hook
        ↓
healthiansApi.checkServiceability(pincode)
        ↓ (with geolocation detection)
Fetch from /healthians/serviceability
        ↓
Parse Response
        ↓
Show Availability & Slots
```

### Common Operations

#### Get packages for a pincode
```typescript
const packages = await getPackages('110001');
```

#### Check if service is available
```typescript
const result = await checkServiceability('110001');
if (!result.isServiceable) {
  alert('Service not available');
}
```

#### Get slots with coordinates
```typescript
const result = await checkServiceability(
  undefined,  // no pincode
  28.7041,    // latitude (Delhi)
  77.1025,    // longitude (Delhi)
  '2025-02-15' // booking date
);
```

### File Locations

| File | Purpose |
|------|---------|
| `src/config/api.ts` | API endpoint URLs |
| `src/services/healthiansApi.ts` | API service functions |
| `src/hooks/useHealthiansPackages.ts` | Package fetching hook |
| `src/hooks/useServiceability.ts` | Serviceability checking hook |
| `src/contexts/PincodeContext.tsx` | Pincode state management |
| `cf-api/src/controllers/healthians/` | Backend controllers |
| `cf-api/src/routes/healthians.ts` | Backend routes |
| `cf-api/wrangler.jsonc` | Configuration |

### Performance Notes

- **Token Caching:** 1 hour TTL (auto-refresh after expiry)
- **Package Query:** Cache for 5 minutes (TanStack Query default)
- **Serviceability Check:** Cache for 5 minutes (TanStack Query default)
- **Stale Updates:** Automatic refetch when data is 5+ minutes old

### TODO Items

- [ ] Add serviceability check in Booking page
- [ ] Show service unavailable message with alternatives
- [ ] Implement timeslots endpoint in backend
- [ ] Migrate create booking to cf-api
- [ ] Add webhook handling for booking updates
- [ ] Implement token refresh mechanism

### Support Links

- **API Docs:** [HEALTHIANS_API.md](cf-api/HEALTHIANS_API.md)
- **Integration Guide:** [FRONTEND_INTEGRATION_GUIDE.md](FRONTEND_INTEGRATION_GUIDE.md)
- **Backend README:** [cf-api/README.md](cf-api/README.md)
- **Main README:** [README.md](README.md)
