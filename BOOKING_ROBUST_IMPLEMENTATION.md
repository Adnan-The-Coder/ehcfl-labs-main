# Complete Robust Booking Implementation Guide

## Overview
This document describes the complete booking mechanism from frontend to database, with proper validation, real-time slot fetching, and comprehensive parameter handling according to Healthians createBooking_v3 API specifications.

## Implementation Changes

### 1. Frontend DateTimeStep Component (`src/components/booking/DateTimeStep.tsx`)

**Key Changes:**
- ✅ Calendar now allows **today + 7 days** (matches Healthians API spec)
- ✅ **Real slot fetching** from backend when date is selected
- ✅ Loads slots dynamically instead of hardcoded
- ✅ Shows actual Healthians slot times (HH:MM - HH:MM format)
- ✅ Displays peak hours indicators
- ✅ Loading states with spinner
- ✅ Error handling with helpful messages

**Slot Structure:**
```typescript
interface AvailableSlot {
  slot_time: string;      // HH:MM:SS from Healthians
  end_time: string;       // HH:MM:SS
  stm_id: string;         // Slot ID
  slot_date: string;      // YYYY-MM-DD
  is_peak_hours: string;  // "0" or "1"
}
```

**Selected Slot Format:**
```
"09:00-10:00|684302242"  // "start-end|stm_id"
```

### 2. Backend Slots Endpoint (`cf-api/src/controllers/healthians/slots.ts`)

**New Dedicated Endpoint:**
```
POST /healthians/slots

Request:
{
  slot_date: "2025-12-30",     // YYYY-MM-DD format
  zone_id?: "122",             // Optional, fetched from serviceability if not provided
  zipcode?: "500027",
  latitude?: "28.5",
  longitude?: "77.0",
  accessToken?: "token"
}

Response:
{
  success: true,
  zone_id: "122",
  slot_date: "2025-12-30",
  slots: [                     // Array of AvailableSlot objects
    {
      stm_id: "684302242",
      slot_time: "09:00:00",
      end_time: "10:00:00",
      is_peak_hours: "0",
      slot_date: "2025-12-30",
      ...
    },
    ...
  ],
  total_slots: 15,
  healthians_response: { ... }
}
```

**Features:**
- Validates slot_date format (YYYY-MM-DD)
- Fetches zone_id from serviceability if needed
- Handles geolocation fallback
- Proper error messages
- Detailed logging

### 3. Booking Validation (`src/utils/bookingValidation.ts`)

**Complete validation for all Healthians parameters:**

```typescript
// Validate customer data
validateCustomer(customer): ValidationResult

// Validate address
validateAddress(address): ValidationResult

// Validate slot
validateSlot(slot): ValidationResult

// Validate package
validatePackage(pkg): ValidationResult

// Validate billing details
validateBillingDetails(billing): ValidationResult

// Validate complete payload
validateBookingPayload(payload): ValidationResult
```

**Validation Includes:**
- ✅ Mandatory field checks
- ✅ Data type validation
- ✅ Format validation (emails, phone numbers, dates, zipcodes)
- ✅ Range validation (age 5-120, latitude/longitude bounds)
- ✅ Relation field validation (self, spouse, child, etc.)
- ✅ Payment option validation (cod/prepaid)
- ✅ Array non-empty checks

**Result Structure:**
```typescript
interface ValidationResult {
  valid: boolean;
  errors: string[];      // Critical errors that prevent booking
  warnings: string[];    // Non-critical issues
}
```

### 4. API Configuration Update (`src/config/api.ts`)

**Added new endpoint:**
```typescript
healthiansSlots: `${API_BASE_URL}/healthians/slots`
```

### 5. Routes Update (`cf-api/src/routes/healthians.ts`)

**Added route:**
```typescript
healthiansRoutes.post('/slots', getSlots);
```

## Healthians createBooking_v3 API Parameters

### Customer Array
```json
{
  "customer_id": "CUST-xyz-0",
  "customer_name": "JOHN DOE",           // Alphanumeric + special chars
  "relation": "self",                    // self|spouse|child|parent|grand parent|sibling|friend|native|neighbour|colleague|others
  "age": 31,                             // 5-120
  "dob": "15/05/1994",                   // DD/MM/YYYY (optional)
  "gender": "M",                         // M|F|O
  "contact_number": "9876543210",        // (optional)
  "email": "john@example.com",           // (optional)
  "application_number": "APP-12345",     // (optional)
  "customer_remarks": "",                // (optional)
  "sample_collected": "N"                // N|Y (optional, default N)
}
```

### Slot Object
```json
{
  "slot_id": "684302242"  // From getSlotsByLocation API
}
```

### Package Array
```json
{
  "deal_id": ["profile_1", "parameter_1"]  // From getPartnerProducts API
}
```

### Complete Booking Payload
```json
{
  "customer": [{...}],
  "slot": {
    "slot_id": "684302242"
  },
  "package": [
    {
      "deal_id": ["profile_1", "profile_2"]
    }
  ],
  "customer_calling_number": "9876543210",
  "billing_cust_name": "JOHN DOE",
  "gender": "M",
  "mobile": "9876543210",
  "email": "john@example.com",
  "state": 26,                           // (optional)
  "cityId": 23,                          // (optional)
  "sub_locality": "Sector 19, Gurgaon",
  "latitude": "28.5088974",
  "longitude": "77.0750786",
  "address": "Plot No-518, Sector 19",
  "zipcode": "122016",
  "landmark": "Near Toll",
  "altmobile": "",                       // (optional)
  "altemail": "",                        // (optional)
  "hard_copy": 0,                        // Always 0
  "vendor_booking_id": "VB-abc123-timestamp",
  "vendor_billing_user_id": "CUST-xyz",
  "payment_option": "prepaid",           // cod|prepaid
  "discounted_price": 900,               // Integer only
  "zone_id": "122",
  "client_id": "",                       // (optional)
  "user_uuid": "user-id",
  "access_token": "token"
}
```

## Date & Time Handling

### Slot Date Format
- **Healthians expects:** `YYYY-MM-DD` format
- **User timezone:** Properly handled with IST utilities
- **Validation:** No past dates allowed

### Slot Time
- **From API:** `HH:MM:SS` format
- **Display:** `HH:MM - HH:MM` format
- **Storage:** `HH:MM-HH:MM|stm_id` format

## Booking Flow

```
1. User selects packages → Cart
    ↓
2. User enters details → Booking page step 1-2
    ↓
3. User selects date → Calendar (today + 7 days)
    ↓
4. Frontend fetches slots → POST /healthians/slots
    ↓
5. Backend calls Healthians getSlotsByLocation API
    ↓
6. Slots displayed in UI → User selects time
    ↓
7. Validation → All parameters validated
    ↓
8. Create booking → POST /healthians/booking
    ↓
9. Backend calls Healthians createBooking_v3
    ↓
10. Store in database → D1 database
    ↓
11. Payment processing (if prepaid) → Razorpay
    ↓
12. Navigate to confirmation → Show TAT details
```

## Database Storage

Booking stored with all fields:
- `booking_id`: Healthians booking ID
- `user_uuid`: User identifier
- `customers`: JSON array of customer details
- `address`: JSON object with address
- `packages`: JSON array of booked packages
- `slot_info`: JSON with slot details
- `total_price`: Original amount
- `discounted_price`: After discount
- `payment_method`: prepaid|cod
- `payment_status`: pending|completed|failed
- `status`: confirmed|completed|cancelled
- `healthians_response`: Full API response
- `created_at`, `updated_at`: Timestamps

## Error Handling

### Frontend Errors
```typescript
// Date validation
"Please select a date"

// Slot loading
"No slots available for selected date"
"Failed to load slots"

// Booking validation
"At least one customer is required"
"customer_name contains invalid characters"
"age must be between 5-120"
"Email format is invalid"
"Zipcode must be 6 digits"
```

### Backend Errors
```
Invalid slot_date format
No zone_id provided
Access token required
Service not available
Booking creation failed
```

## Testing Checklist

- [ ] Calendar allows selecting today (not tomorrow)
- [ ] Calendar max is today + 7 days
- [ ] Slots fetch on date selection
- [ ] Slots display in 24-hour format (HH:MM)
- [ ] Peak hours marked with indicator
- [ ] Validation catches all mandatory fields
- [ ] Validation detects invalid email/phone
- [ ] Validation detects age out of range
- [ ] Validation detects invalid zipcode
- [ ] Booking payload contains all required fields
- [ ] Slot ID properly passed to backend
- [ ] Payment flow works (Razorpay)
- [ ] Booking stored in database
- [ ] TAT details displayed in confirmation
- [ ] CoD option skips payment

## Implementation Checklist

✅ DateTimeStep updated (real slots + 7-day limit)
✅ Backend slots endpoint created
✅ Booking validation utilities created
✅ API endpoint configured
✅ Routes updated

## Next Steps

1. **Update Booking.tsx:**
   - Parse selected slot format (HH:MM-HH:MM|stm_id)
   - Extract stm_id for API
   - Apply validation on submit
   - Use proper error messages

2. **Test End-to-End:**
   - Select date → Slots load
   - Select time → Slot ID captured
   - Submit → Validation runs
   - Create booking → Success/error

3. **Database Verification:**
   - Check booking record created
   - Verify all fields stored
   - Check Healthians response saved

## Key Improvements

🎯 **Real slot data from Healthians API**
🎯 **Proper date/time handling with IST**
🎯 **Comprehensive parameter validation**
🎯 **7-day availability window (matches API)**
🎯 **Peak hour indicators**
🎯 **Proper error messages & recovery**
🎯 **Loading states & UX feedback**
🎯 **Complete database storage**

## API Compliance

✅ Uses Healthians createBooking_v3 API
✅ Supports all mandatory fields
✅ Supports all optional fields
✅ Proper validation per specs
✅ Correct date/time formats
✅ Complete error handling
