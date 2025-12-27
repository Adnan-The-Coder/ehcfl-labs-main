# EHCF Labs - V1 Implementation Analysis
## Healthians Integration + Razorpay (Target: Dec 31, 2025)

**Document Generated:** December 27, 2025  
**Purpose:** Comprehensive rundown of what's implemented, what's pending, and what needs debugging for production readiness.

---

## 📊 Executive Summary

| Area | Status | Completion |
|------|--------|------------|
| Healthians Authentication | ✅ Implemented (needs testing) | 70% |
| Packages/Tests Listing | ✅ Implemented (needs testing) | 75% |
| Serviceability Check | ✅ Implemented (needs testing) | 75% |
| Time Slots | ✅ Implemented (needs testing) | 70% |
| Create Booking | ⚠️ Partial (local storage + API skeleton) | 50% |
| Booking Status | ⚠️ Partial (webhooks ready, no polling) | 40% |
| Cancel/Reschedule | ❌ Local storage only | 20% |
| Reports Download | ❌ Not implemented | 0% |
| Razorpay Integration | ❌ Not implemented | 0% |
| Frontend-Backend Connection | ⚠️ Partial (booking still uses localStorage) | 50% |

---

## ✅ WHAT'S ALREADY IMPLEMENTED

### 1. Backend Infrastructure

**Server Setup** ([backend/server.js](backend/server.js))
- ✅ Express.js server with CORS enabled
- ✅ MongoDB connection via Mongoose
- ✅ Route structure properly organized
- ✅ Error handling middleware
- ✅ Environment variables configured

**Database Models:**
- ✅ [Booking.js](backend/models/Booking.js) - Stores booking details
- ✅ [BookingStatusHistory.js](backend/models/BookingStatusHistory.js) - Status tracking
- ✅ [WebhookLog.js](backend/models/WebhookLog.js) - Webhook logging

**API Routes:**

| Route | File | Status |
|-------|------|--------|
| `/api/healthians-auth` | [auth.js](backend/routes/auth.js) | ✅ Implemented |
| `/api/healthians-packages` | [packages.js](backend/routes/packages.js) | ✅ Implemented |
| `/api/healthians-serviceability` | [serviceability.js](backend/routes/serviceability.js) | ✅ Implemented |
| `/api/healthians-timeslots` | [timeslots.js](backend/routes/timeslots.js) | ✅ Implemented |
| `/api/healthians-create-booking` | [bookings.js](backend/routes/bookings.js) | ✅ Implemented |
| `/api/healthians-webhook` | [webhooks.js](backend/routes/webhooks.js) | ✅ Implemented |

### 2. Frontend Services

**API Service** ([src/services/healthiansApi.ts](src/services/healthiansApi.ts))
- ✅ `getAccessToken()` - Token caching with 1-hour expiry
- ✅ `getPackages()` - Fetch packages from Healthians
- ✅ `checkServiceability()` - PIN code validation with fallback
- ✅ `getTimeSlots()` - Fetch available time slots
- ✅ `createBooking()` - Create booking (calls backend)
- ✅ `getUserBookings()` - Fetch all bookings
- ✅ `getBookingStatusHistory()` - Get status history
- ✅ `subscribeToBookingUpdates()` - Polling mechanism (every 10 seconds)

### 3. Frontend UI

**Fully Built Pages:**
- ✅ Home page ([Index.tsx](src/pages/Index.tsx))
- ✅ Tests listing with filters ([Tests.tsx](src/pages/Tests.tsx))
- ✅ Cart page ([Cart.tsx](src/pages/Cart.tsx))
- ✅ Booking flow with 4 steps ([Booking.tsx](src/pages/Booking.tsx))
- ✅ Confirmation page ([Confirmation.tsx](src/pages/Confirmation.tsx))
- ✅ My Orders page ([MyOrders.tsx](src/pages/MyOrders.tsx))
- ✅ Track order page ([Track.tsx](src/pages/Track.tsx))

**Booking Flow Components:**
- ✅ CustomerDetailsStep - Patient details collection
- ✅ AddressStep - Address collection
- ✅ DateTimeStep - Date/time slot selection (static slots)
- ✅ ReviewStep - Order review & payment method
- ✅ RescheduleModal - Reschedule UI
- ✅ CancelModal - Cancel UI with reasons
- ✅ AddOnModal - Add tests to existing booking

---

## ❌ WHAT'S NOT IMPLEMENTED (V1 Required)

### 1. 🔴 CRITICAL: Razorpay Payment Integration

**Completely Missing:**
- No Razorpay SDK installed
- No payment order creation endpoint
- No payment verification endpoint
- No payment callback handling
- No refund handling

**Required Implementation:**

```
Backend:
├── routes/payment.js
│   ├── POST /create-order (create Razorpay order)
│   ├── POST /verify (verify payment signature)
│   └── POST /refund (process refunds)

Frontend:
├── services/paymentApi.ts
│   ├── createPaymentOrder()
│   ├── verifyPayment()
│   └── initiateRefund()
```

**Environment Variables Needed:**
```
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

### 2. 🔴 CRITICAL: Booking Flow Not Connected to Backend

**Current State:** The [Booking.tsx](src/pages/Booking.tsx#L78-L95) `handleConfirmBooking()` saves to **localStorage only**:
```typescript
const handleConfirmBooking = () => {
  const bookingId = `BKG${Date.now()}`;
  // ... 
  localStorage.setItem('ehcf-bookings', JSON.stringify(bookings)); // ❌ Not calling API
};
```

**Required:**
- Integrate with `createBooking()` from healthiansApi.ts
- Send booking to Healthians API via backend
- Handle payment flow before creating booking
- Store in MongoDB (not just localStorage)

### 3. 🔴 CRITICAL: Cancel/Reschedule APIs Not Integrated

**Current State:** 
- [RescheduleModal.tsx](src/components/booking/RescheduleModal.tsx#L41-L65) - Uses localStorage only
- [CancelModal.tsx](src/components/booking/CancelModal.tsx#L34-L65) - Uses localStorage only

**Required Backend Routes:**
```
POST /api/healthians-cancel-booking
POST /api/healthians-reschedule-booking
```

**Healthians API Integration Needed:**
- Check Healthians API docs for cancel/reschedule endpoints
- Implement checksum generation for these actions
- Update MongoDB status on success

### 4. 🔴 CRITICAL: Reports Download

**Completely Missing:**
- No endpoint to fetch reports from Healthians
- No download functionality

**Required:**
```
Backend:
├── routes/reports.js
│   ├── GET /:bookingId/status (check if report ready)
│   └── GET /:bookingId/download (fetch & serve report)
```

### 5. 🟠 IMPORTANT: Dynamic Time Slots from Healthians

**Current State:** [DateTimeStep.tsx](src/components/booking/DateTimeStep.tsx#L14-L30) uses static hardcoded slots:
```typescript
const TIME_SLOTS = {
  morning: ['07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM', ...],
  afternoon: ['12:00 PM - 01:00 PM', ...],
  evening: ['04:00 PM - 05:00 PM', ...]
};
```

**Required:**
- Fetch actual available slots from Healthians API
- Pass pincode + date to `/api/healthians-timeslots`
- Show only slots returned by API

### 6. 🟠 IMPORTANT: Booking Status Polling/Webhook Processing

**Current State:**
- Webhook endpoint exists but no status update notification to frontend
- Polling implemented but not connected to UI properly
- [Track.tsx](src/pages/Track.tsx) only reads from localStorage

**Required:**
- Connect Track page to MongoDB data
- Implement WebSocket or SSE for real-time updates
- Or enhance polling to update UI properly

---

## 🔧 BUGS & ISSUES TO FIX

### 1. 🐛 Auth API Method Bug

**File:** [backend/routes/auth.js](backend/routes/auth.js#L30)

**Issue:** Using `axios.get` with a body payload:
```javascript
const response = await axios.get(`${baseUrl}/api/v1/auth`, authPayload, {
  headers: { 'Content-Type': 'application/json' }
});
```

**Problem:** GET requests don't have a body. Should likely be POST or the payload needs to be query params.

**Fix:** Verify Healthians API documentation for correct method.

### 2. 🐛 Base URL Manipulation

**Multiple Files:** packages.js, serviceability.js, timeslots.js, bookings.js

**Issue:** Inconsistent base URL handling:
```javascript
const baseUrl = process.env.HEALTHIANS_BASE_URL.replace('/api', '');
// Then uses: `${baseUrl}/api/v1/...`
```

**Problem:** If `HEALTHIANS_BASE_URL` doesn't end with `/api`, this breaks.

**Current .env:** `HEALTHIANS_BASE_URL="https://t25crm.healthians.co.in"` - No `/api` suffix

**Fix:** Standardize URL construction or remove the `.replace('/api', '')` calls.

### 3. 🐛 Missing Error Handling in Frontend

**File:** [src/services/healthiansApi.ts](src/services/healthiansApi.ts)

**Issues:**
- No retry logic on failed API calls (except in React Query)
- No user-friendly error messages
- Console.error only, no UI feedback

### 4. 🐛 Package Mapping Incomplete

**File:** [src/hooks/useHealthiansPackages.ts](src/hooks/useHealthiansPackages.ts#L5-L26)

**Issues:**
```typescript
return {
  testsCount: 0, // Not provided in this endpoint response
  tests: [],     // Not provided in this endpoint response
};
```

**Problem:** Tests included in packages aren't mapped - need to check Healthians API response structure.

### 5. 🐛 Token Caching Issue

**File:** [src/services/healthiansApi.ts](src/services/healthiansApi.ts#L3-L4)

**Issue:** Token cached in module-level variables:
```typescript
let cachedAccessToken: string | null = null;
let tokenExpiry: number | null = null;
```

**Problem:** On page refresh or new tab, token is lost. Consider localStorage caching.

### 6. 🐛 Booking Model - Missing payment_status

**File:** [backend/models/Booking.js](backend/models/Booking.js)

**Missing Fields:**
```javascript
// Need to add:
payment_status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
payment_id: { type: String },  // Razorpay payment ID
order_id: { type: String },    // Razorpay order ID
refund_status: { type: String },
refund_amount: { type: Number },
```

### 7. 🐛 Environment Variables Exposed

**File:** [.env](.env)

**Issue:** Contains actual credentials that are visible. Ensure `.env` is in `.gitignore`.

---

## 📋 COMPLETE V1 TODO LIST

### Backend Tasks

| # | Task | Priority | Complexity |
|---|------|----------|------------|
| 1 | Fix auth.js - verify correct HTTP method | 🔴 Critical | Low |
| 2 | Standardize HEALTHIANS_BASE_URL handling | 🔴 Critical | Low |
| 3 | Add Razorpay routes (create-order, verify, refund) | 🔴 Critical | High |
| 4 | Add cancel booking route + Healthians API | 🔴 Critical | Medium |
| 5 | Add reschedule booking route + Healthians API | 🔴 Critical | Medium |
| 6 | Add reports download route | 🔴 Critical | Medium |
| 7 | Update Booking model with payment fields | 🟠 Important | Low |
| 8 | Add payment webhook for Razorpay | 🟠 Important | Medium |
| 9 | Add status polling job (if Healthians has no webhooks) | 🟡 Nice-to-have | Medium |
| 10 | Add proper logging (replace console.log) | 🟡 Nice-to-have | Low |

### Frontend Tasks

| # | Task | Priority | Complexity |
|---|------|----------|------------|
| 1 | Connect booking flow to backend API | 🔴 Critical | High |
| 2 | Implement Razorpay checkout in ReviewStep | 🔴 Critical | High |
| 3 | Fetch dynamic time slots from API | 🔴 Critical | Medium |
| 4 | Connect cancel modal to backend | 🔴 Critical | Low |
| 5 | Connect reschedule modal to backend | 🔴 Critical | Low |
| 6 | Connect Track page to MongoDB data | 🔴 Critical | Medium |
| 7 | Implement report download | 🔴 Critical | Medium |
| 8 | Add token caching in localStorage | 🟠 Important | Low |
| 9 | Add proper error toasts for API failures | 🟠 Important | Low |
| 10 | Fix package mapping (testsCount, tests array) | 🟠 Important | Medium |

### DevOps / Production Tasks

| # | Task | Priority | Complexity |
|---|------|----------|------------|
| 1 | Secure environment variables | 🔴 Critical | Low |
| 2 | Set up production MongoDB | 🔴 Critical | Medium |
| 3 | Configure CORS for production domain | 🔴 Critical | Low |
| 4 | Set up SSL/HTTPS | 🔴 Critical | Medium |
| 5 | Add rate limiting | 🟠 Important | Low |
| 6 | Set up PM2 or similar for Node process | 🟠 Important | Low |
| 7 | Add health check endpoint | 🟡 Nice-to-have | Low |

---

## 🔐 ENVIRONMENT VARIABLES NEEDED

### Current (.env)
```
✅ VITE_API_URL
✅ PORT
✅ HEALTHIANS_BASE_URL
✅ HEALTHIANS_PARTNER_NAME
✅ HEALTHIANS_USERNAME
✅ HEALTHIANS_PASSWORD
✅ MONGODB_URI
```

### Missing (Need to Add)
```
❌ RAZORPAY_KEY_ID
❌ RAZORPAY_KEY_SECRET
❌ RAZORPAY_WEBHOOK_SECRET (for payment webhooks)
```

---

## 📦 DEPENDENCIES TO ADD

```json
// Backend - package.json
{
  "dependencies": {
    "razorpay": "^2.x.x"  // Razorpay SDK
  }
}
```

```javascript
// Frontend - install Razorpay checkout script
// Add to index.html: <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

## 🔄 RECOMMENDED IMPLEMENTATION ORDER

### Week 1 (Dec 27-29): Core Backend Fixes
1. ✏️ Fix auth.js HTTP method
2. ✏️ Standardize base URL handling
3. ✏️ Test all existing Healthians endpoints with Postman
4. ✏️ Add Razorpay integration (routes + SDK)

### Week 2 (Dec 30-31): Frontend Integration
1. ✏️ Connect booking flow to backend
2. ✏️ Implement Razorpay checkout
3. ✏️ Connect cancel/reschedule to backend
4. ✏️ Add dynamic time slots
5. ✏️ Connect Track page to real data

### Post V1: Report Download + Polish
1. Reports download endpoint
2. Real-time status updates
3. Error handling improvements

---

## 📝 HEALTHIANS API ENDPOINTS TO VERIFY

Based on your codebase, these endpoints are being used:
```
GET  /api/v1/auth (verify if GET or POST)
GET  /api/v1/packages?pincode={pincode}
GET  /api/v1/serviceability?pincode={pincode}
GET  /api/v1/timeslots?pincode={pincode}&date={date}
POST /api/v1/bookings
```

**Need to document/implement:**
```
??? /api/v1/bookings/{id}/cancel
??? /api/v1/bookings/{id}/reschedule
??? /api/v1/bookings/{id}/status
??? /api/v1/reports/{bookingId}
```

---

## ✅ PRODUCTION CHECKLIST

Before going live:

- [ ] All Healthians API endpoints tested with real credentials
- [ ] Razorpay test mode payments working
- [ ] MongoDB production instance set up
- [ ] Environment variables secured (not in git)
- [ ] HTTPS configured
- [ ] CORS configured for production domain
- [ ] Error logging set up
- [ ] Booking flow end-to-end tested
- [ ] Payment flow end-to-end tested
- [ ] Cancel/Reschedule flow tested
- [ ] Report download tested

---

**Document Version:** 1.0  
**Last Updated:** December 27, 2025
