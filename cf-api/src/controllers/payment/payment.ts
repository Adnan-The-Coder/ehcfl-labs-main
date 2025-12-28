/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context } from 'hono';
import Razorpay from 'razorpay';
import crypto from 'crypto';

export const createOrder = async (c: Context) => {
  try {
    const { amount } = await c.req.json();

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return c.json({
        success: false,
        message: 'Invalid amount. Must be a positive number.',
      }, 400);
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: c.env.RAZORPAY_LIVE_KEY_ID as string,
      key_secret: c.env.RAZORPAY_LIVE_KEY_SECRET as string,
    });

    // Create order
    const order = await razorpay.orders.create({
      amount: amount, // Amount in smallest currency unit (paise for INR)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });

    return c.json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });

  } catch (error: any) {
    console.error('Create order error:', error);
    return c.json({
      success: false,
      message: error?.message || 'Failed to create order',
    }, 500);
  }
};

const generateSignature = (orderId: string, paymentId: string, keySecret: string): string => {
  const hmac = crypto.createHmac('sha256', keySecret);
  hmac.update(`${orderId}|${paymentId}`);
  return hmac.digest('hex');
};

export const verifyOrder = async (c: Context) => {
  try {
    const { orderId, razorpayPaymentId, razorpaySignature } = await c.req.json();

    // Validate required fields
    if (!orderId || !razorpayPaymentId || !razorpaySignature) {
      return c.json({
        success: false,
        isOk: false,
        message: 'Missing required fields: orderId, razorpayPaymentId, razorpaySignature',
      }, 400);
    }

    const keySecret = c.env.RAZORPAY_LIVE_KEY_SECRET as string;

    // Generate signature
    const expectedSignature = generateSignature(orderId, razorpayPaymentId, keySecret);

    // Compare signatures
    if (expectedSignature !== razorpaySignature) {
      return c.json({
        success: false,
        isOk: false,
        message: 'Payment verification failed. Invalid signature.',
      }, 400);
    }

    // TODO: Update database with payment status
    // You can update booking payment_status to 'completed' here
    // Example:
    // const userUuid = c.get('userUuid');
    // await db.update(bookings).set({ payment_status: 'completed' }).where(eq(bookings.user_uuid, userUuid));

    return c.json({
      success: true,
      isOk: true,
      message: 'Payment verified successfully',
      data: {
        orderId,
        paymentId: razorpayPaymentId,
      },
    });

  } catch (error: any) {
    console.error('Verify order error:', error);
    return c.json({
      success: false,
      isOk: false,
      message: error?.message || 'Payment verification failed',
    }, 500);
  }
};
