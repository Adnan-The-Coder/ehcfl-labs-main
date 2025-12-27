import mongoose from 'mongoose';

const bookingStatusHistorySchema = new mongoose.Schema({
  booking_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  status: {
    type: String,
    required: true
  },
  status_message: {
    type: String
  },
  webhook_data: {
    type: mongoose.Schema.Types.Mixed // JSON data
  }
}, {
  timestamps: {
    createdAt: 'changed_at'
  }
});

export default mongoose.model('BookingStatusHistory', bookingStatusHistorySchema);