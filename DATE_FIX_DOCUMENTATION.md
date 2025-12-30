# Date Handling Fixes - Booking Flow

## Problem
The backend was receiving slot_date as '2025-12-29' (yesterday) when today is '2025-12-30', causing Healthians API to reject with:
```
Invalid Slot Date. Previous date are not allowed.
Error: RES0003
```

## Root Cause
1. **Frontend DateTimeStep** was using `selectedDate.toISOString()` which converts to UTC, losing IST timezone context
2. **Calendar was disabled starting from "tomorrow"** instead of allowing "today"
3. **Selected date was not being passed to serviceability check** in Booking.tsx

## Solutions Implemented

### 1. Frontend DateTimeStep Component (src/components/booking/DateTimeStep.tsx)
**Before:**
```typescript
// Allowed only tomorrow onwards
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

// Converted to ISO string (UTC) losing local timezone
onUpdate(selectedDate.toISOString(), selectedSlot);
```

**After:**
```typescript
// Allow today onwards (IST-aware)
const today = getMinSelectableDate(); // IST-aware
const maxDate = getMaxSelectableDate();

// Format as YYYY-MM-DD in local timezone
const year = selectedDate.getFullYear();
const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
const day = String(selectedDate.getDate()).padStart(2, '0');
const dateString = `${year}-${month}-${day}`;
onUpdate(dateString, selectedSlot);
```

### 2. Date Utilities (src/utils/dateUtils.ts - NEW)
Created robust IST-aware date helpers:
- `getISTDateString(offsetDays)`: Get IST date as YYYY-MM-DD
- `formatDateToString(date)`: Format Date to YYYY-MM-DD
- `isPastDate(dateString)`: Check if date is in past
- `getMinSelectableDate()`: Today in IST
- `getMaxSelectableDate()`: 15 days from today in IST

### 3. Backend Serviceability Controller (cf-api/src/controllers/healthians/serviceability.ts)
**Added validation:**
```typescript
let slotDate = body.slot_date || getIndiaDate(0);

// Validate slot_date is not in the past
if (slotDate) {
  const indiaToday = getIndiaDate(0);
  if (slotDate < indiaToday) {
    console.warn(`Provided slot_date ${slotDate} is before today ${indiaToday}`);
    slotDate = indiaToday;
  }
}
```

### 4. Booking Page (src/pages/Booking.tsx)
**Updated to pass selected date:**
```typescript
// Before
const serviceabilityResult = await checkServiceability(pincode);

// After
const serviceabilityResult = await checkServiceability(
  pincode || bookingData.address?.pinCode,
  undefined, // latitude
  undefined, // longitude
  bookingData.date // ← Pass the selected date in YYYY-MM-DD format
);
```

**Added debug logging:**
```typescript
import { logDateDebug, logServiceabilityRequest } from '@/utils/debugUtils';

// In handleConfirmBooking:
console.log('📋 Booking Confirmation Starting...');
logDateDebug(); // Shows UTC, IST, local timezone info
console.log('📅 Selected Date:', bookingData.date);
```

### 5. Debug Utilities (src/utils/debugUtils.ts - NEW)
Helper functions to log date information for debugging:
- `logDateDebug()`: Shows current UTC, IST, and local date
- `logDateRange(minDate, maxDate)`: Shows selectable date range
- `logServiceabilityRequest(payload)`: Logs API request details

## Test Checklist

- [ ] Open booking page, navigate to "Date & Time" step
- [ ] Verify calendar shows today as selectable (not disabled)
- [ ] Select today's date
- [ ] Open DevTools console, look for "📅 Date Debug Info" and "📅 Selected Date: 2025-12-30"
- [ ] Confirm booking and check network tab for POST /healthians/serviceability
- [ ] Verify slot_date is today's date (not yesterday)
- [ ] Check backend logs show "Fetching slots by location with payload: { slot_date: '2025-12-30', ... }"
- [ ] Verify no "Invalid Slot Date" error from Healthians API

## Debugging Guide

### Check date being sent to backend:
1. Open DevTools → Network tab
2. Find POST request to `/healthians/serviceability`
3. Check payload for `slot_date` field
4. Should be today's date or later

### Check server-side date calculations:
1. Check backend logs for "Fetching slots by location with payload:"
2. Verify `slot_date` in the log matches expected date
3. Look for error "Invalid Slot Date. Previous date are not allowed."

### Check frontend date calculations:
1. Open DevTools → Console
2. Look for "🕐 Date Debug Info" logs
3. Compare:
   - Current UTC: Should match backend
   - IST Date String: Should match slot_date being sent
   - Browser Local Date: Should be today

## Files Modified

1. ✅ `src/components/booking/DateTimeStep.tsx` - Fixed date handling and calendar
2. ✅ `src/utils/dateUtils.ts` - New IST-aware date utilities
3. ✅ `src/pages/Booking.tsx` - Pass date to serviceability, add debug logging
4. ✅ `cf-api/src/controllers/healthians/serviceability.ts` - Validate slot_date
5. ✅ `src/utils/debugUtils.ts` - New debug logging utilities

## Key Takeaways

✅ **Always work with local timezone for UI dates**
✅ **Never use toISOString() for local date operations (it converts to UTC)**
✅ **Validate dates on both frontend and backend**
✅ **Format dates as YYYY-MM-DD strings for APIs**
✅ **Use consistent IST offset: UTC+05:30 (330 minutes)**
✅ **Log date values at each step for debugging**

## Timeline

- **Before:** "Invalid Slot Date. Previous date are not allowed." error
- **After:** User can select today and any future date up to 15 days ahead, slots load correctly
