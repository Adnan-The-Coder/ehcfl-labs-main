# Healthians Booking Integration - Complete Implementation Guide

## Overview

The EHCFLabs platform now fully integrates with Healthians API for booking management. The complete flow:

1. **User selects packages** → Cart
2. **User enters details** → Booking page (multi-step)
3. **System validates serviceability** → Gets zone_id and slots from Healthians
4. **User confirms booking** → System creates booking via Healthians API
5. **Payment processing** → Razorpay (optional, can use CoD)
6. **Confirmation page** → Shows booking details with TAT info

## Architecture

```
┌─────────────────┐
│   Frontend UI   │
│   (React/Vite)  │
└────────┬────────┘
         │
    ┌────▼─────────────────────┐
    │   Booking Page Flow:      │
    │ 1. Customer Details       │
    │ 2. Address               │
    │ 3. Date & Time Slot      │
    │ 4. Review & Payment      │
    └────┬─────────────────────┘
         │
    ┌────▼──────────────────────────────────┐
    │  Service Layer (healthiansApi.ts)     │
    │ - getAccessToken()                     │
    │ - checkServiceability()                │
    │ - createHealthiansBooking()            │
    └────┬──────────────────────────────────┘
         │
    ┌────▼────────────────────────────────────────┐
    │   cf-api (Cloudflare Workers)              │
    │ POST /healthians/booking                   │
    │  - Validates all data                       │
    │  - Generates checksum                       │
    │  - Calls Healthians createBooking_v3        │
    │  - Stores in D1 database                    │
    │  - Returns booking_id + TAT details         │
    └────┬────────────────────────────────────────┘
         │
    ┌────▼──────────────────────┐
    │  Healthians API           │
    │  (Production Endpoint)    │
    └──────────────────────────┘
```

## Frontend Implementation

### 1. Booking Page (`src/pages/Booking.tsx`)

The booking flow is a 4-step wizard:

**Step 1: Customer Details**
- Name, Age, Gender, Phone, Email
- Can add multiple customers/patients

**Step 2: Address**
- Collection address with landmark
- City, State, PIN code

**Step 3: Date & Time**
- Selects booking date (today onwards)
- Chooses available time slot
- Fetches from Healthians slot API

**Step 4: Review & Payment**
- Shows complete booking summary
- Pricing breakdown with coupons
- Payment method selection (Prepaid/CoD)
- Terms acceptance

### 2. Key Functions in Booking.tsx

```typescript
const handleConfirmBooking = async () => {
  // 1. Authenticate user via Supabase
  const { session } = await supabase.auth.getSession();
  
  // 2. Verify serviceability & get zone_id
  const serviceabilityResult = await checkServiceability(pincode);
  
  // 3. Build Healthians payload
  const healthiansPayload = {
    customer: [...], // Array of customers
    slot: { slot_id: "..." },
    package: [{ deal_id: [...] }],
    customer_calling_number: "...",
    mobile: "...",
    // ... other fields per Healthians API
    user_uuid: userUuid,
    access_token: await getAccessToken(),
  };
  
  // 4. Create booking via Healthians
  const result = await createHealthiansBooking(healthiansPayload);
  
  // 5. Process payment if needed (Razorpay)
  if (prepaid) {
    await processRazorpayPayment(...);
  }
  
  // 6. Navigate to confirmation with response data
  navigate('/confirmation', { 
    state: { 
      bookingId: result.booking_id,
      booking: {
        ...details,
        healthiansResponse: result.healthians_response,
      }
    }
  });
};
```

### 3. Confirmation Page (`src/pages/Confirmation.tsx`)

Displays:
- ✅ Booking confirmation with checkmark
- 📍 Booking ID (copyable)
- ⏱️ **TAT (Turnaround Time)** from Healthians response
- 💳 Payment status
- 📋 Booking summary
- 🔄 Next steps timeline

**TAT Calculation:**
```typescript
const tatDetails = booking?.healthiansResponse?.tatDetail;
const maxTatMinutes = parseInt(tatDetails?.max_tat); // e.g., 4305
const tatHours = Math.ceil(maxTatMinutes / 60);      // 72 hours
```

## Service Layer Integration

### healthiansApi.ts Functions

```typescript
// 1. Get access token (cached for 1 hour)
const accessToken = await getAccessToken();

// 2. Check serviceability with geolocation
const result = await checkServiceability(pincode);
// Returns: { isServiceable, zoneId, sampleSlot, location, ... }

// 3. Create booking via Healthians
const bookingResult = await createHealthiansBooking(bookingData);
// Returns: { success, booking_id, healthians_response, database_record }

// 4. Get booking details
const details = await getHealthiansBookingDetails(bookingId);

// 5. Cancel booking
const cancel = await cancelHealthiansBooking(bookingId);
```

## API Flow Details

### Request Flow

```
User Action: "Confirm Booking"
    ↓
Frontend: Collect all form data
    ↓
Service: checkServiceability(pincode)
    ├─→ GET /healthians/auth (cache token)
    └─→ POST /healthians/serviceability
        └─→ Returns: zoneId, slots, location
    ↓
Service: createHealthiansBooking(payload)
    ├─→ POST /healthians/booking (cf-api)
    │   ├─→ Validate payload
    │   ├─→ Generate HMAC-SHA256 checksum
    │   ├─→ POST to Healthians API
    │   │   └─→ Returns: booking_id, TAT details
    │   └─→ Store in D1 database
    │       └─→ Returns: database_record
    │
    ├→ If payment needed:
    │   └─→ initiate Razorpay checkout
    │       └─→ On success: navigate to confirmation
    │
    └─→ Navigate to confirmation page
```

### Response Data Structure

**Healthians Success Response:**
```json
{
  "status": true,
  "message": "Booking (1387716659374) placed successfully.",
  "booking_id": "1387716659374",
  "resCode": "RES0001",
  "tatDetail": {
    "max_tat": "4305",
    "time_unit": "In Minutes",
    "custWiseDetails": [
      {
        "tat": "4305",
        "vendor_customer_id": "CUYEFNRUQB343B"
      }
    ]
  }
}
```

**cf-api Response:**
```json
{
  "success": true,
  "booking_id": "1387716659374",
  "message": "Booking created successfully",
  "healthians_response": {
    "booking_id": "1387716659374",
    "message": "Booking (1387716659374) placed successfully.",
    "tatDetail": { ... }
  },
  "database_record": {
    "id": 1,
    "booking_id": "1387716659374",
    "user_uuid": "user-id",
    "status": "confirmed",
    "created_at": "2025-12-30T10:30:00Z"
  }
}
```

## Data Mapping

### Customer Data Mapping
```typescript
// Frontend Customer
{
  name: "Rahul Sharma",
  age: "31",
  gender: "Male",
  phone: "8377736411",
  email: "rahul@example.com"
}

// → Healthians Format
{
  customer_id: "CUST-user-id-0",
  customer_name: "RAHUL SHARMA",
  relation: "self",
  age: 31,
  dob: "15/05/1994",        // Required, currently using email placeholder
  gender: "M",              // M/F/O
  contact_number: "8377736411",
  email: "rahul@example.com"
}
```

### Address Mapping
```typescript
// Frontend Address
{
  line1: "Plot No-518",
  line2: "Phase III",
  locality: "Sector 19",
  landmark: "Near Toll",
  city: "Gurugram",
  state: "Haryana",
  pinCode: "122016"
}

// → Healthians Format
{
  state: 26,                    // State ID
  cityId: 23,                   // City ID
  sub_locality: "Plot No-518, Sector 19",
  address: "Plot No-518",
  zipcode: "122016",
  landmark: "Near Toll"
}
```

## Payment Integration

### Prepaid Flow
1. User selects "Prepaid" payment method
2. On booking confirmation:
   - Create booking via Healthians API
   - If successful, initiate Razorpay checkout
   - On payment success: Mark booking as paid
   - On payment failure: Booking remains created but unpaid

### CoD (Cash on Delivery) Flow
1. User selects "Cash on Delivery"
2. On booking confirmation:
   - Create booking via Healthians API
   - No payment processing
   - Booking status: "confirmed", payment_status: "pending"
   - Amount collected during sample collection

## Error Handling

### Serviceability Failures
```typescript
if (!serviceabilityResult.isServiceable) {
  toast.error(serviceabilityResult.message);
  // Stay on current page, allow user to change location
}
```

### Booking Failures
```typescript
if (!healthiansResult.success) {
  toast.error(healthiansResult.message);
  // Log detailed error for support
  // Show retry option
}
```

### Payment Failures
```typescript
// Payment fails but booking is already created
// Show message: "Booking created but payment failed"
// Option to retry payment or proceed with CoD
```

## Database Schema

Bookings stored in `bookings` table:
- `booking_id`: Healthians booking ID
- `user_uuid`: User identifier
- `customers`: JSON array of customers
- `address`: JSON object with address details
- `booking_date`: Date of booking
- `time_slot`: Slot ID from Healthians
- `packages`: JSON array of booked packages
- `total_price`: Original amount
- `payment_method`: 'prepaid' or 'cod'
- `payment_status`: 'pending', 'completed', 'failed'
- `status`: 'confirmed', 'completed', 'cancelled'
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Testing Checklist

- [ ] Customer details validation (all fields required)
- [ ] Address selection and validation
- [ ] Slot availability based on pincode
- [ ] Serviceability check integration
- [ ] Prepaid booking flow with Razorpay
- [ ] CoD booking flow
- [ ] Confirmation page displays TAT correctly
- [ ] Booking ID copy functionality
- [ ] Payment status displays correctly
- [ ] Error handling for failed bookings
- [ ] Error handling for failed payments
- [ ] Multiple customer bookings
- [ ] Coupon application in final price

## Configuration

### Environment Variables

**Frontend (VITE):**
```env
VITE_BACKEND_API_BASE_URL=http://127.0.0.1:8787  # Development
VITE_RAZORPAY_KEY_ID=your-key-id
```

**Backend (wrangler.jsonc):**
```jsonc
{
  "vars": {
    "HEALTHIANS_BASE_URL": "https://app.healthians.com",
    "HEALTHIANS_PARTNER_NAME": "your-partner-name",
    "HEALTHIANS_USERNAME": "your-username",
    "HEALTHIANS_PASSWORD": "your-password",
    "HEALTHIANS_CHECKSUM_SECRET": "your-secret"
  }
}
```

## Known Limitations & TODO

1. **DOB Field**: Currently using email as placeholder in Healthians payload. Need to add DOB picker in customer details form.
2. **State/City IDs**: Hardcoded to Haryana (26) and Gurgaon (23). Should auto-map based on user location.
3. **Package Mapping**: Currently sending package IDs directly. May need to map to Healthians deal_ids.
4. **Multi-slot Support**: Currently uses first available slot. Should allow user slot selection.
5. **Cancellation**: API endpoint exists but not integrated in UI.

## Support & Debugging

**Enable Logging:**
```typescript
// All Healthians service calls log to console:
// ✅ Success: "✅ Booking created successfully"
// ❌ Error: "❌ Healthians booking creation failed"
```

**Check Network Requests:**
1. Open DevTools → Network tab
2. Look for `POST /healthians/booking` requests
3. Inspect response for error details
4. Check for CORS issues

**Common Issues:**
- **"Access token is required"**: Check getAccessToken() caching
- **"Service not available"**: Verify serviceability check returns zone_id
- **"Invalid Slot Date"**: Confirm slot_date is today or later (IST)
- **Checksum mismatch**: Verify HEALTHIANS_CHECKSUM_SECRET in wrangler.jsonc

## Future Enhancements

1. Add DOB picker to customer form
2. Implement state/city selection with auto-detection
3. Add cancellation flow in UI
4. Show real-time slot availability
5. Add booking history in user profile
6. Implement SMS notifications
7. Add WhatsApp booking option
8. Enable online payment via multiple gateways
9. Add test result downloading
10. Implement referral system integration
