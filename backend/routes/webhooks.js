import express from 'express';
import Booking from '../models/Booking.js';
import BookingStatusHistory from '../models/BookingStatusHistory.js';
import WebhookLog from '../models/WebhookLog.js';

const router = express.Router();

// Webhook endpoint to receive status updates from Healthians
router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    
    console.log('Webhook received:', payload);

    // Log the webhook
    const webhookLog = new WebhookLog({
      event_type: payload.event_type || 'unknown',
      booking_id: payload.booking_id,
      payload: payload,
      processed: false,
    });
    
    await webhookLog.save();
    console.log('Webhook logged successfully');

    // Process the webhook based on event type
    if (payload.event_type === 'status_updated' && payload.booking_id) {
      // Find the booking by healthians_booking_id
      const booking = await Booking.findOne({ healthians_booking_id: payload.booking_id });
      
      if (!booking) {
        console.error('Booking not found for healthians_booking_id:', payload.booking_id);
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Update booking status
      booking.status = payload.status || 'updated';
      await booking.save();

      // Add status history
      const statusHistory = new BookingStatusHistory({
        booking_id: booking._id,
        status: payload.status || 'updated',
        status_message: payload.message,
        webhook_data: payload,
      });
      
      await statusHistory.save();

      // Mark webhook as processed
      await WebhookLog.updateMany(
        { booking_id: payload.booking_id, processed: false },
        { processed: true }
      );

      console.log('Webhook processed successfully for booking:', payload.booking_id);
    }

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: error.message || 'Failed to process webhook' });
  }
});

export default router;