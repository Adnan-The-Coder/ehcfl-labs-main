# Payment API Documentation

## Razorpay Integration Endpoints

All payment endpoints require Bearer token authentication with a valid user UUID.

### Authentication

Include the user's UUID in the Authorization header:
```
Authorization: Bearer <user-uuid>
```

The API validates that the UUID exists in the `userProfiles` table before processing payment requests.

---

## Endpoints

### 1. Create Order

**POST** `/payment/create-order`

Creates a new Razorpay order for payment processing.

**Headers:**
```
Authorization: Bearer <user-uuid>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 50000
}
```
- `amount` (number, required): Amount in smallest currency unit (paise for INR)
  - Example: 50000 paise = ₹500

**Success Response (200):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "order_MjrK8qJ9HxYZ7K",
    "entity": "order",
    "amount": 50000,
    "amount_paid": 0,
    "amount_due": 50000,
    "currency": "INR",
    "receipt": "receipt_1735372800000",
    "status": "created",
    "attempts": 0,
    "created_at": 1735372800
  }
}
```

**Error Responses:**

401 Unauthorized:
```json
{
  "success": false,
  "message": "Missing or invalid Authorization header. Use Bearer <uuid>"
}
```

400 Bad Request (User not found):
```json
{
  "success": false,
  "message": "User not found. Invalid UUID."
}
```

400 Bad Request (Invalid amount):
```json
{
  "success": false,
  "message": "Invalid amount. Must be a positive number."
}
```

---

### 2. Verify Order

**POST** `/payment/verify-order`

Verifies the payment signature from Razorpay to confirm payment authenticity.

**Headers:**
```
Authorization: Bearer <user-uuid>
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderId": "order_MjrK8qJ9HxYZ7K",
  "razorpayPaymentId": "pay_MjrKL1bY3nZ8aB",
  "razorpaySignature": "9ef49c3e5e8f3c5e5e8f3c5e5e8f3c5e5e8f3c5e5e8f3c5e5e8f3c5e5e8f3c5e"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "isOk": true,
  "message": "Payment verified successfully",
  "data": {
    "orderId": "order_MjrK8qJ9HxYZ7K",
    "paymentId": "pay_MjrKL1bY3nZ8aB"
  }
}
```

**Error Responses:**

400 Bad Request (Signature mismatch):
```json
{
  "success": false,
  "isOk": false,
  "message": "Payment verification failed. Invalid signature."
}
```

400 Bad Request (Missing fields):
```json
{
  "success": false,
  "isOk": false,
  "message": "Missing required fields: orderId, razorpayPaymentId, razorpaySignature"
}
```

---

## Environment Variables

Add the following to your `.env` file:

```env
RAZORPAY_LIVE_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_LIVE_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxx
```

For production deployment, set these as secrets in Wrangler:

```bash
npx wrangler secret put RAZORPAY_LIVE_KEY_ID
npx wrangler secret put RAZORPAY_LIVE_KEY_SECRET
```

---

## Integration Flow

1. **Frontend: Get User UUID**
   - Retrieve authenticated user's UUID from Supabase session
   
2. **Frontend: Create Order**
   ```typescript
   const response = await fetch('http://127.0.0.1:8787/payment/create-order', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${userUuid}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({ amount: 50000 }), // ₹500
   });
   const { data } = await response.json();
   const orderId = data.id;
   ```

3. **Frontend: Initialize Razorpay Checkout**
   ```typescript
   const options = {
     key: 'rzp_live_xxxxx', // Your Razorpay key_id
     amount: data.amount,
     currency: data.currency,
     order_id: orderId,
     name: 'EHCF Labs',
     description: 'Test Booking Payment',
     handler: async (response) => {
       // Step 4: Verify payment
       await verifyPayment(response);
     },
   };
   const razorpay = new Razorpay(options);
   razorpay.open();
   ```

4. **Frontend: Verify Payment**
   ```typescript
   const verifyPayment = async (response) => {
     const verifyResponse = await fetch('http://127.0.0.1:8787/payment/verify-order', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${userUuid}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         orderId: response.razorpay_order_id,
         razorpayPaymentId: response.razorpay_payment_id,
         razorpaySignature: response.razorpay_signature,
       }),
     });
     const result = await verifyResponse.json();
     if (result.isOk) {
       // Payment successful - proceed with booking
     }
   };
   ```

---

## Security Notes

1. **Always validate UUID**: The middleware checks that the UUID exists in the database before allowing payment operations.

2. **Signature verification**: The verify endpoint uses HMAC SHA256 to verify payment authenticity.

3. **Use secrets**: Never commit Razorpay credentials to version control. Use environment variables or Cloudflare secrets.

4. **Production keys**: Use test keys (`rzp_test_`) during development and live keys (`rzp_live_`) in production.

---

## Testing

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`

3. Start the dev server:
   ```bash
   npm run dev
   ```

4. Test create order:
   ```bash
   curl -X POST http://127.0.0.1:8787/payment/create-order \
     -H "Authorization: Bearer <valid-user-uuid>" \
     -H "Content-Type: application/json" \
     -d '{"amount": 50000}'
   ```

5. Test verify order:
   ```bash
   curl -X POST http://127.0.0.1:8787/payment/verify-order \
     -H "Authorization: Bearer <valid-user-uuid>" \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": "order_xxx",
       "razorpayPaymentId": "pay_xxx",
       "razorpaySignature": "signature_xxx"
     }'
   ```
