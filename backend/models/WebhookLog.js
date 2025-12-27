import mongoose from 'mongoose';

const webhookLogSchema = new mongoose.Schema({
  event_type: {
    type: String,
    required: true
  },
  booking_id: {
    type: String // Healthians booking ID
  },
  payload: {
    type: mongoose.Schema.Types.Mixed, // JSON data
    required: true
  },
  processed: {
    type: Boolean,
    default: false
  },
  error: {
    type: String
  }
}, {
  timestamps: {
    createdAt: 'received_at'
  }
});

export default mongoose.model('WebhookLog', webhookLogSchema);