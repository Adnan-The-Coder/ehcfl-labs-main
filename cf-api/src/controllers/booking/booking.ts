/* eslint-disable @typescript-eslint/no-explicit-any */
import { Context } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc, and } from 'drizzle-orm';
import { bookings } from '../../db/schema';

export const getAllBookings = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    
    const allBookings = await db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.created_at));
    
    return c.json({
      success: true,
      message: 'Bookings fetched successfully!',
      data: allBookings,
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return c.json({ success: false, message: 'Internal server error.' }, 500);
  }
};

export const createBooking = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const body = await c.req.json();
    const {
      booking_id,
      user_uuid,
      customers,
      address,
      booking_date,
      time_slot,
      packages,
      total_price,
      coupon,
      payment_method,
      payment_status = 'pending',
      status = 'confirmed',
    } = body;

    // Basic Validation
    if (!booking_id || !user_uuid || !customers || !address || !booking_date || !time_slot || !packages || total_price === undefined || !payment_method) {
      return c.json({ success: false, message: 'All required fields must be provided.' }, 400);
    }

    // Serialize JSON fields if they're objects
    const customersString = typeof customers === 'string' ? customers : JSON.stringify(customers);
    const addressString = typeof address === 'string' ? address : JSON.stringify(address);
    const packagesString = typeof packages === 'string' ? packages : JSON.stringify(packages);
    const couponString = coupon ? (typeof coupon === 'string' ? coupon : JSON.stringify(coupon)) : null;

    // Insert into bookings table
    const result = await db.insert(bookings).values({
      booking_id,
      user_uuid,
      customers: customersString,
      address: addressString,
      booking_date,
      time_slot,
      packages: packagesString,
      total_price,
      coupon: couponString,
      payment_method,
      payment_status,
      status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).returning();

    return c.json({
      success: true,
      message: 'Booking created successfully!',
      data: {
        id: result[0].id,
        booking_id: result[0].booking_id,
        status: result[0].status,
        createdAt: result[0].created_at,
      }
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    return c.json({
      success: false,
      message: 'Internal server error. Please try again later.',
    }, 500);
  }
};

export const getBookingById = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const bookingId = c.req.param('bookingId');

    if (!bookingId) {
      return c.json({ success: false, message: 'Booking ID is required.' }, 400);
    }

    const booking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.booking_id, bookingId))
      .limit(1);

    if (booking.length === 0) {
      return c.json({ success: false, message: 'Booking not found.' }, 404);
    }

    return c.json({
      success: true,
      message: 'Booking fetched successfully!',
      data: booking[0],
    });
  } catch (error) {
    console.error('Error fetching booking by ID:', error);
    return c.json({ success: false, message: 'Internal server error.' }, 500);
  }
};

export const getBookingsByUserUUID = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const userUuid = c.req.param('userUuid');

    if (!userUuid) {
      return c.json({ success: false, message: 'User UUID is required.' }, 400);
    }

    const userBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.user_uuid, userUuid))
      .orderBy(desc(bookings.created_at));

    return c.json({
      success: true,
      message: 'User bookings fetched successfully!',
      data: userBookings,
    });
  } catch (error) {
    console.error('Error fetching bookings by user UUID:', error);
    return c.json({ success: false, message: 'Internal server error.' }, 500);
  }
};

export const updateBooking = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const bookingId = c.req.param('bookingId');
    const body = await c.req.json();

    if (!bookingId) {
      return c.json({ success: false, message: 'Booking ID is required.' }, 400);
    }

    // Only allow updating specific fields
    const allowedFields = [
      'status', 'payment_status', 'booking_date', 'time_slot', 'address'
    ];
    const updateData: Record<string, any> = {};

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        // Serialize address if it's an object
        if (key === 'address' && typeof body[key] === 'object') {
          updateData[key] = JSON.stringify(body[key]);
        } else {
          updateData[key] = body[key];
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return c.json({ success: false, message: 'No valid fields to update.' }, 400);
    }

    updateData.updated_at = new Date().toISOString();

    const result = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.booking_id, bookingId))
      .run();

    const res = result as any;

    if (!res.success) {
      return c.json({ success: false, message: 'Booking not found or nothing changed.' }, 404);
    }

    return c.json({ success: true, message: 'Booking updated successfully.' });
  } catch (error) {
    console.error('Error updating booking:', error);
    return c.json({ success: false, message: 'Internal server error.' }, 500);
  }
};

export const deleteBooking = async (c: Context) => {
  try {
    const db = drizzle(c.env.DB);
    const bookingId = c.req.param('bookingId');

    if (!bookingId) {
      return c.json({ success: false, message: 'Booking ID is required.' }, 400);
    }

    const result = await db
      .delete(bookings)
      .where(eq(bookings.booking_id, bookingId))
      .run();

    const res = result as any;

    if (!res.success) {
      return c.json({ success: false, message: 'Booking not found.' }, 404);
    }

    return c.json({ success: true, message: 'Booking deleted successfully.' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return c.json({ success: false, message: 'Internal server error.' }, 500);
  }
};
