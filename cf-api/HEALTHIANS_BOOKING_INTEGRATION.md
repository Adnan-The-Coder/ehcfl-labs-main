# Healthians Booking Integration Guide

## Overview

This guide documents the complete Healthians booking integration in the EHCFLabs platform. The system implements the Healthians `createBooking_v3` API with full support for:

- Multi-customer bookings
- Multiple packages per booking
- Partial payment handling
- Checksum-based security
- Automatic database storage
- Full booking lifecycle management

## API Endpoints

### 1. Create Booking
**Endpoint:** `POST /healthians/booking`

Creates a new booking via Healthians and automatically stores it in the database.

**Request Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "customer": [
    {
      "customer_id": "CUYEFNRUQB343B",
      "customer_name": "RAHUL SHARMA",
      "relation": "self",
      "age": 31,
      "dob": "05/07/1994",
      "gender": "M",
      "contact_number": "8377736411",
      "email": "rahul@example.com",
      "application_number": "APNO001-12/445_1(100)-9ADU",
      "customer_remarks": "PPMC customer remark"
    }
  ],
  "slot": {
    "slot_id": "11432603"
  },
  "package": [
    {
      "deal_id": ["profile_1", "parameter_625", "package_119"]
    }
  ],
  "customer_calling_number": "8377736411",
  "billing_cust_name": "RAHUL SHARMA",
  "gender": "M",
  "mobile": "8377736411",
  "email": "rahulsharma@gmail.com",
  "state": 26,
  "cityId": 23,
  "sub_locality": "Plot No-518, Phase III, Udyog Vihar III, Sector 19, Gurugram, Haryana 122016, India",
  "latitude": "28.512195944534703",
  "longitude": "77.08483249142313",
  "address": "Sector 19",
  "zipcode": "122016",
  "landmark": "Near Toll",
  "altmobile": "9877823482",
  "altemail": "rahul.sh201@gmail.com",
  "hard_copy": 0,
  "vendor_booking_id": "897234897232333",
  "vendor_billing_user_id": "CUYEFNRUQB343B",
  "payment_option": "prepaid",
  "discounted_price": 400,
  "zone_id": 53,
  "client_id": "",
  "user_uuid": "uuid-of-logged-in-user",
  "access_token": "healthians-access-token"
}
```

**Response (Success):**
```json
{
  "success": true,
  "booking_id": "healthians-booking-id",
  "message": "Booking created successfully",
  "healthians_response": {
    "booking_id": "HB123456789",
    "id": "123456",
    "message": "Booking created successfully"
  },
  "database_record": {
    "id": 1,
    "booking_id": "HB123456789",
    "user_uuid": "uuid-of-logged-in-user",
    "status": "confirmed",
    "created_at": "2025-12-30T10:30:00Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Error message",
  "details": {
    "status": false,
    "message": "Healthians error message",
    "resCode": "ERROR_CODE"
  }
}
```

### 2. Get Booking Details
**Endpoint:** `GET /healthians/booking/:bookingId`

Retrieves booking details from the database.

**Response:**
```json
{
  "success": true,
  "message": "Booking fetched successfully",
  "data": {
    "id": 1,
    "booking_id": "HB123456789",
    "user_uuid": "uuid-of-user",
    "customers": [...],
    "address": {...},
    "booking_date": "2025-12-30",
    "time_slot": "11432603",
    "packages": [...],
    "total_price": 400,
    "payment_method": "prepaid",
    "payment_status": "pending",
    "status": "confirmed",
    "created_at": "2025-12-30T10:30:00Z",
    "updated_at": "2025-12-30T10:30:00Z"
  }
}
```

### 3. Cancel Booking
**Endpoint:** `PATCH /healthians/booking/:bookingId/cancel`

Cancels an existing booking.

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "booking_id": "HB123456789"
}
```

## Frontend Integration

### Using the Service Layer

```typescript
import { 
  createHealthiansBooking,
  getHealthiansBookingDetails,
  cancelHealthiansBooking,
  getAccessToken
} from '@/services/healthiansApi';

// Create a booking
const bookingData = {
  customer: [...],
  slot: { slot_id: "11432603" },
  package: [...],
  customer_calling_number: "8377736411",
  mobile: "8377736411",
  email: "user@example.com",
  billing_cust_name: "User Name",
  gender: "M",
  state: 26,
  cityId: 23,
  sub_locality: "Address",
  latitude: "28.512",
  longitude: "77.084",
  address: "Street Address",
  zipcode: "122016",
  landmark: "Landmark",
  vendor_booking_id: "VENDOR-ID-123",
  vendor_billing_user_id: "CUST-ID-123",
  payment_option: "prepaid",
  discounted_price: 400,
  zone_id: 53,
  user_uuid: "user-uuid",
  access_token: "token-from-auth"
};

const result = await createHealthiansBooking(bookingData);

if (result.success) {
  console.log('Booking created:', result.booking_id);
  // Navigate to confirmation page
} else {
  console.error('Booking failed:', result.message);
  // Show error toast
}
```

### Integration with Checkout Flow

In your booking/checkout page:

```typescript
const handleBookingSubmit = async (formData: BookingFormData) => {
  const accessToken = await getAccessToken();
  
  const bookingPayload = {
    ...formData,
    access_token: accessToken,
    user_uuid: currentUser.id,
    payment_option: 'prepaid',
    vendor_booking_id: generateVendorBookingId(),
    vendor_billing_user_id: currentUser.customerId,
  };
  
  const result = await createHealthiansBooking(bookingPayload);
  
  if (result.success) {
    // Update payment status
    updatePaymentStatus(result.booking_id, 'pending');
    
    // Navigate to confirmation
    navigate(`/confirmation/${result.booking_id}`);
  }
};
```

## Checksum Generation

The system uses HMAC-SHA256 for request signing:

```typescript
function generateChecksum(bookingData: CreateBookingRequest, secretKey: string): string {
  const dataToHash = JSON.stringify({
    vendor_booking_id: bookingData.vendor_booking_id,
    customer_calling_number: bookingData.customer_calling_number,
    mobile: bookingData.mobile,
    email: bookingData.email || '',
    zipcode: bookingData.zipcode,
    discounted_price: bookingData.discounted_price,
    zone_id: bookingData.zone_id,
  });

  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(dataToHash);
  return hmac.digest('hex');
}
```

## Database Schema

Bookings are stored in the `bookings` table with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Primary key |
| booking_id | text | Healthians booking ID (unique) |
| user_uuid | text | User identifier |
| customers | text (JSON) | Array of customer details |
| address | text (JSON) | Booking address details |
| booking_date | text | Date of booking |
| time_slot | text | Slot ID |
| packages | text (JSON) | Array of booked packages |
| total_price | real | Total amount |
| coupon | text (JSON) | Applied coupon (nullable) |
| payment_method | text | 'prepaid' or 'cod' |
| payment_status | text | 'pending', 'completed', 'failed' |
| status | text | 'confirmed', 'completed', 'cancelled' |
| created_at | text | Timestamp |
| updated_at | text | Timestamp |

## Environment Configuration

Add these variables to `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "HEALTHIANS_BASE_URL": "https://app.healthians.com",
    "HEALTHIANS_PARTNER_NAME": "your-partner-name",
    "HEALTHIANS_USERNAME": "your-username",
    "HEALTHIANS_PASSWORD": "your-password",
    "HEALTHIANS_CHECKSUM_SECRET": "your-checksum-secret-key"
  }
}
```

## Required Fields for createBooking_v3

### Customer Details
- `customer_id`: Partner's unique customer ID
- `customer_name`: Full name
- `relation`: Relationship (self, family, etc.)
- `age`: Age in years
- `dob`: Date of birth (DD/MM/YYYY)
- `gender`: M/F/O
- `contact_number`: Phone number
- `email`: Email address
- `application_number`: Optional, partner's reference
- `customer_remarks`: Optional, any notes

### Booking Details
- `slot_id`: From getSlotsByLocation response
- `deal_id`: Array of package/parameter IDs
- `zone_id`: From checkServiceabilityByLocation_v2 response
- `payment_option`: 'prepaid' or 'cod'

### Address Details
- `state`: State ID (numeric)
- `cityId`: City ID (numeric)
- `sub_locality`: Full address line
- `latitude`: Decimal latitude
- `longitude`: Decimal longitude
- `address`: Short address description
- `zipcode`: Postal code
- `landmark`: Optional landmark
- `altmobile`: Optional alternate phone

### Identification
- `vendor_booking_id`: Partner's unique booking ID (must be unique)
- `vendor_billing_user_id`: Partner's user ID for billing

## Error Handling

Common error responses:

```json
{
  "success": false,
  "message": "Customer calling number and mobile has to be same",
  "details": {
    "status": false,
    "message": "Customer calling number and mobile has to be same",
    "resCode": "RES0005"
  }
}
```

## Notes

1. **Customer Calling Number & Mobile**: Must be identical per Healthians requirements
2. **Zone ID**: Must be obtained from `checkServiceabilityByLocation_v2` API
3. **Slot ID**: Must be from `getSlotsByLocation` for the corresponding zone
4. **Vendor Booking ID**: Must be unique across all bookings
5. **Partial Payments**: When using partial payment, set `partial_paid_amount > 0` and `payment_option: 'prepaid'`
6. **Client ID**: Optional, use for multi-entity integrations (HDFC Ergo: 1001, Bajaj Allianz: 1002, etc.)

## Sample Flow

1. User searches location → `checkServiceabilityByLocation_v2` → get zone_id
2. User selects date → `getSlotsByLocation` → get available slots
3. User selects slot and packages → form booking data
4. Submit → `createBooking_v3` → booking created in Healthians and DB
5. Process payment → update payment_status
6. Booking complete

## Testing

Test the booking endpoint:

```bash
curl -X POST http://127.0.0.1:8787/healthians/booking \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-access-token" \
  -d @booking-payload.json
```

Example test payload saved as `booking-payload.json`:
```json
{
  "customer": [
    {
      "customer_id": "TEST-001",
      "customer_name": "Test User",
      "relation": "self",
      "age": 30,
      "dob": "15/05/1994",
      "gender": "M",
      "contact_number": "9876543210",
      "email": "test@example.com"
    }
  ],
  "slot": {
    "slot_id": "684302242"
  },
  "package": [
    {
      "deal_id": ["profile_1"]
    }
  ],
  "customer_calling_number": "9876543210",
  "billing_cust_name": "Test User",
  "gender": "M",
  "mobile": "9876543210",
  "email": "test@example.com",
  "state": 26,
  "cityId": 23,
  "sub_locality": "Test Area, Gurugram",
  "latitude": "28.5088974",
  "longitude": "77.0750786",
  "address": "Test Street",
  "zipcode": "122016",
  "vendor_booking_id": "VB-TEST-001",
  "vendor_billing_user_id": "TEST-001",
  "payment_option": "prepaid",
  "discounted_price": 500,
  "zone_id": 53,
  "user_uuid": "test-user-uuid"
}
```

## Version History

- **v1.0** (2025-12-30): Initial implementation of createBooking_v3 integration with database storage
