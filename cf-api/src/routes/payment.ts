import { Hono,Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { userProfiles } from '../db/schema';
import { createOrder, verifyOrder } from '../controllers/payment/payment';

const paymentRoutes = new Hono();

// Auth middleware - validates Bearer token (UUID) exists in database
paymentRoutes.use('/*', async (c:Context, next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        message: 'Missing or invalid Authorization header. Use Bearer <uuid>',
      }, 401);
    }

    const userUuid = authHeader.replace('Bearer ', '').trim();

    if (!userUuid) {
      return c.json({
        success: false,
        message: 'Invalid token format',
      }, 401);
    }

    // Check if user exists in database
    const db = drizzle(c.env.DB);
    const user = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.uuid, userUuid))
      .limit(1);

    if (user.length === 0) {
      return c.json({
        success: false,
        message: 'User not found. Invalid UUID.',
      }, 400);
    }

    // Store user UUID in context for use in controllers
    c.set('userUuid', userUuid);
    c.set('user', user[0]);
    
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({
      success: false,
      message: 'Authentication failed',
    }, 500);
  }
});

// Create Razorpay order
paymentRoutes.post('/create-order', createOrder);

// Verify Razorpay payment
paymentRoutes.post('/verify-order', verifyOrder);

export default paymentRoutes;
