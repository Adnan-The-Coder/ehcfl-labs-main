# Healthians API Integration - Visual Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                                       │
│                     (React + ViteJS Frontend)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐     │
│  │   Tests Page     │    │  Booking Page    │    │  Navbar/Hero     │     │
│  │                  │    │                  │    │                  │     │
│  │ Browse packages  │    │ Multi-step flow  │    │ Show location    │     │
│  │ Filter & search  │    │ with payment     │    │ & availability   │     │
│  │ by pincode       │    │                  │    │                  │     │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘     │
│           │                       │                       │                │
│           └───────────┬───────────┴───────────┬───────────┘                │
│                       │                       │                            │
│                       ▼                       ▼                            │
│    ┌──────────────────────────────────────────────────┐                   │
│    │     Healthians API Service Layer                 │                   │
│    │  (src/services/healthiansApi.ts)                 │                   │
│    │                                                   │                   │
│    │  • getAccessToken() → GET /healthians/auth      │                   │
│    │  • getPackages() → POST /healthians/packages    │                   │
│    │  • checkServiceability() → POST /health./svc    │                   │
│    │  • getTimeSlots() [TODO]                        │                   │
│    │  • createBooking() [TODO]                       │                   │
│    └────────────────────┬─────────────────────────────┘                   │
│                         │                                                  │
│                         ▼                                                  │
│    ┌──────────────────────────────────────────────────┐                   │
│    │   React Query Hooks & Context                    │                   │
│    │                                                   │                   │
│    │  • useHealthiansPackages(pincode)               │                   │
│    │  • useServiceability(pincode, coords)           │                   │
│    │  • usePincode() → PincodeContext                │                   │
│    └────────────────────┬─────────────────────────────┘                   │
│                         │                                                  │
└─────────────────────────┼──────────────────────────────────────────────────┘
                          │ HTTPS
                          │ (API_BASE_URL = http://127.0.0.1:8787)
                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CLOUDFLARE WORKERS (cf-api)                              │
│                      Hono.js Framework + D1                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │  Middleware & Request Handling                                   │       │
│  │  • CORS (Allow frontend origins)                               │       │
│  │  • Security Headers                                            │       │
│  │  • Request ID tracking                                         │       │
│  │  • Conditional logging                                         │       │
│  └────────────────────────────────┬────────────────────────────────┘       │
│                                   │                                         │
│  ┌────────────────────────────────▼────────────────────────────────┐       │
│  │           Route: /healthians                                     │       │
│  ├──────────────────────────────────────────────────────────────────┤       │
│  │                                                                   │       │
│  │  GET  /auth                                                      │       │
│  │  ├─→ auth.ts Controller                                         │       │
│  │  │   └─→ Fetch Healthians access token (HTTP Basic auth)       │       │
│  │  │       └─→ Returns: { access_token, refresh_token, ... }    │       │
│  │  │                                                              │       │
│  │  POST /packages                                                 │       │
│  │  ├─→ packages.ts Controller                                    │       │
│  │  │   ├─→ Validate: accessToken, zipcode required             │       │
│  │  │   └─→ Call Healthians: getPartnerProducts                 │       │
│  │  │       └─→ Returns: { packages[], status, message }        │       │
│  │  │                                                              │       │
│  │  POST /serviceability                                           │       │
│  │  ├─→ serviceability.ts Controller                             │       │
│  │  │   ├─→ Smart Geolocation Detection:                         │       │
│  │  │   │   1. Use provided coordinates (lat/long)              │       │
│  │  │   │   2. Geocode zipcode (Nominatim OpenStreetMap)        │       │
│  │  │   │   3. Detect IP location (ipapi.co)                    │       │
│  │  │   │   4. Fallback: India center (20.59°, 78.96°)         │       │
│  │  │   │                                                         │       │
│  │  │   └─→ Call Healthians: getSlotsByZipCode_v1               │       │
│  │  │       └─→ Returns: { serviceable, location, slots[] }     │       │
│  │  │                                                              │       │
│  │  GET  /timeslots [COMING SOON]                                │       │
│  │  POST /create-booking [COMING SOON]                           │       │
│  │                                                                  │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐       │
│  │  Other Routes                                                   │       │
│  ├────────────────────────────────────────────────────────────────┤       │
│  │  • /users          → User profile management                   │       │
│  │  • /bookings       → Booking CRUD (database)                  │       │
│  │  • /payment        → Razorpay integration                     │       │
│  │  • /health         → Health check endpoint                    │       │
│  │  • /ready          → Readiness probe                          │       │
│  │  • /metrics        → Performance metrics                      │       │
│  └────────────────────────────────────────────────────────────────┘       │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────┐       │
│  │  Environment Configuration (wrangler.jsonc)                    │       │
│  ├────────────────────────────────────────────────────────────────┤       │
│  │  HEALTHIANS_BASE_URL = "https://app.healthians.com"           │       │
│  │  HEALTHIANS_PARTNER_NAME = "partner_name"                     │       │
│  │  HEALTHIANS_USERNAME = "username"                             │       │
│  │  HEALTHIANS_PASSWORD = "password"                             │       │
│  │                                                                  │       │
│  │  D1 Database (SQLite on Cloudflare)                           │       │
│  │  ├─ userProfiles                                              │       │
│  │  ├─ bookings                                                  │       │
│  │  └─ bookingStatusHistory                                      │       │
│  └────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└──────────────────────────┬───────────────────────────────────────────────────┘
                           │ HTTPS
                           │
                           ├──────────────────────────┬──────────────────────┐
                           │                          │                      │
                           ▼                          ▼                      ▼
┌────────────────────────────────┐  ┌────────────────────────┐  ┌─────────────────────┐
│    Healthians API              │  │  Payment Services      │  │  Other Services     │
│                                │  │                        │  │                     │
│ • getAccessToken               │  │ Razorpay API           │  │ IPInfo.io (IP→geo)  │
│ • getPartnerProducts (packages)│  │ • Create orders        │  │ Nominatim (zip→geo) │
│ • getSlotsByZipCode (slots)    │  │ • Verify signatures    │  │ Supabase Auth       │
│ • createBooking [TODO]         │  │                        │  │                     │
│ • webhooks [TODO]              │  │                        │  │                     │
│                                │  │                        │  │                     │
└────────────────────────────────┘  └────────────────────────┘  └─────────────────────┘
  https://app.healthians.com         https://api.razorpay.com   https://api.ipinfo.io
                                                                  https://nominatim.org
                                                                  https://supabase.com
```

## Data Flow Diagrams

### 1. Authentication & Token Flow

```
Frontend
   │
   └─→ getAccessToken()
        │
        └─→ Check localStorage for cached token
             ├─ YES: Token valid? ──→ Return cached token
             │                        (refresh for 1 hour more)
             │
             └─ NO: Fetch new token
                  │
                  └─→ GET /healthians/auth
                       │
                       └─→ Cloudflare Workers
                            │
                            └─→ Basic Auth (username:password)
                                 │
                                 └─→ POST https://app.healthians.com/api/...
                                      │
                                      └─→ { access_token, refresh_token, expires_in }
                                           │
                                           └─→ Cache for 1 hour
                                                │
                                                └─→ Return to frontend
```

### 2. Package Discovery Flow

```
User
  │
  ├─→ Enters/Updates Pincode (localStorage)
  │
  └─→ Tests Page Component
       │
       └─→ useHealthiansPackages(pincode)
            │
            └─→ React Query Hook
                 │
                 ├─ Cached? ──→ YES: Return cached packages (5 min TTL)
                 │
                 └─ NO: Call service
                      │
                      └─→ getAccessToken()
                           │ (might use cached token)
                           │
                           ├─→ getPackages('110001')
                           │    │
                           │    └─→ POST /healthians/packages
                           │         {
                           │           zipcode: '110001',
                           │           accessToken: '...',
                           │           product_type: 'profile',
                           │           start: '0',
                           │           limit: '100'
                           │         }
                           │
                           └─→ Cloudflare Workers
                                │
                                └─→ POST https://app.healthians.com/api/.../getPartnerProducts
                                     │
                                     └─→ { packages: [...], status, message }
                                          │
                                          └─→ Map Healthians → Frontend format
                                               │
                                               └─→ Cache for 5 minutes
                                                    │
                                                    └─→ Display in UI
                                                         └─→ Filters, Search, Sorting
```

### 3. Serviceability Check Flow

```
Booking Flow
   │
   ├─→ User selects pincode/date
   │
   └─→ useServiceability(pincode, undefined, undefined, date)
        │
        └─→ React Query Hook
             │
             ├─ Cached? ──→ YES: Return cached result (5 min TTL)
             │
             └─ NO: Call service
                  │
                  └─→ checkServiceability('110001', undefined, undefined, '2025-02-15')
                       │
                       └─→ getAccessToken()
                            │
                            └─→ POST /healthians/serviceability
                                 {
                                   zipcode: '110001',
                                   accessToken: '...',
                                   slot_date: '2025-02-15',
                                   amount: 0,
                                   isDeviceSlot: false
                                 }
                                 │
                                 └─→ Cloudflare Workers: Geolocation Detection
                                      │
                                      ├─ Has coordinates? ──→ Use them
                                      │
                                      ├─ Has zipcode? ──→ Geocode with Nominatim
                                      │                   https://nominatim.org
                                      │                   └─→ { lat, long, address }
                                      │
                                      ├─ No coords/zipcode? ──→ Detect IP location
                                      │                        https://ipapi.co
                                      │                        └─→ { lat, long }
                                      │
                                      └─ Failed? ──→ Fallback: India center (20.59°, 78.96°)
                                           │
                                           └─→ POST https://app.healthians.com/.../getSlotsByZipCode_v1
                                                {
                                                  zipcode: '110001',
                                                  slot_date: '2025-02-15',
                                                  latitude: 28.7041,
                                                  longitude: 77.1025,
                                                  amount: 0,
                                                  isDeviceSlot: false
                                                }
                                                │
                                                └─→ { serviceable, slots, location }
                                                     │
                                                     └─→ Return to frontend
                                                          │
                                                          ├─ serviceable=true? ──→ Show slots & proceed
                                                          │
                                                          └─ serviceable=false? ──→ Show unavailable message
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                 Page Components                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Tests Page    │  │ Booking Page │  │ MyOrders     │   │
│  │                 │  │              │  │              │   │
│  │ Uses:           │  │ Uses:        │  │ Uses:        │   │
│  │ - useHealthians │  │ - useService │  │ - API fetch  │   │
│  │   Packages      │  │   ability    │  │ - useToast   │   │
│  │ - usePincode    │  │ - useCart    │  │              │   │
│  │ - useState      │  │ - useUser    │  │              │   │
│  └────────┬────────┘  └──────┬───────┘  └──────┬───────┘   │
│           │                  │                  │            │
└───────────┼──────────────────┼──────────────────┼────────────┘
            │                  │                  │
            ├──────────────────┼──────────────────┤
            │                  │                  │
            ▼                  ▼                  ▼
         ┌──────────────────────────────────────────┐
         │        Shared State Management            │
         ├──────────────────────────────────────────┤
         │                                            │
         │  • PincodeContext (pincode, serviceable) │
         │  • CartContext (items, totalPrice)       │
         │  • useUser (session, user data)          │
         │  • useToast (notifications)              │
         │                                            │
         └────────────┬─────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
    ┌────────┐  ┌──────────┐  ┌──────────┐
    │ Hooks  │  │ Services │  │ Contexts │
    │        │  │          │  │          │
    │- use.. │  │- health..│  │- Pincode │
    │Packages│  │  Api.ts  │  │- Cart    │
    │- use.. │  │- razorpay│  │- Auth    │
    │Service │  │  .ts     │  │          │
    │ability │  │          │  │          │
    │        │  │          │  │          │
    └────────┘  └──────────┘  └──────────┘
        │            │              │
        └────────────┼──────────────┘
                     │
                     ▼
            ┌────────────────────┐
            │  API Configuration │
            │  (api.ts)          │
            │                    │
            │ BASE_URL + endpoints
            └────────────────────┘
```

## Error Handling Flow

```
API Call
   │
   ├─→ Try Request
   │
   ├─→ Network Error? ──→ Catch → Log Error → Return Default
   │
   ├─→ HTTP Error (4xx/5xx)? ──→ Parse Error Message → User Alert
   │    ├─ 400: Invalid parameters → Show form errors
   │    ├─ 401: Missing token → Retry with new token
   │    ├─ 500: Server error → Show generic error
   │    └─ 502: Healthians error → Show "Contact support"
   │
   ├─→ Invalid Response Format? ──→ Log & Return Default
   │
   └─→ Success ──→ Parse → Cache → Return Data
        │
        ├─ Display in UI
        └─ Update state
```

## Caching Strategy

```
Frontend Caching Layers
│
├─ Layer 1: TanStack Query Cache
│  ├─ Duration: 5 minutes (default)
│  ├─ Keys: [queryKey, params]
│  ├─ Automatic refetch on stale
│  └─ Manual invalidation possible
│
├─ Layer 2: Token Cache
│  ├─ Type: In-memory (cachedAccessToken)
│  ├─ Duration: 1 hour (from API)
│  ├─ Auto-refresh on expiry
│  └─ Fallback: Always fetchable
│
└─ Layer 3: localStorage
   ├─ pincode
   ├─ is_serviceable
   └─ user_preferences
```

## Deployment Topology

```
Development
  └─ localhost:8787 (wrangler dev)
     └─ /healthians/* routes

Staging
  └─ staging.yourdomain.com
     └─ Deployed to Cloudflare Workers

Production
  └─ api.yourdomain.com
     └─ Deployed to Cloudflare Workers
        └─ Auto-scaling
        └─ 99.99% uptime SLA
        └─ Global edge caching
```

This comprehensive visual architecture provides a complete picture of how the Healthians API integration works across the entire EHCF Labs platform.
