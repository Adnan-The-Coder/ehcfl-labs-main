import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  booking_id: {
    type: String,
    required: true,
    unique: true
  },
  healthians_booking_id: {
    type: String,
    required: true
  },
  user_id: {
    type: String,
    default: null
  },
  customer_name: {
    type: String,
    required: true
  },
  customer_email: {
    type: String
  },
  customer_phone: {
    type: String,
    required: true
  },
  customer_age: {
    type: Number,
    required: true
  },
  customer_gender: {
    type: String,
    required: true
  },
  address_line1: {
    type: String,
    required: true
  },
  address_line2: {
    type: String
  },
  locality: {
    type: String,
    required: true
  },
  landmark: {
    type: String
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  booking_date: {
    type: String, // Date string in format YYYY-MM-DD
    required: true
  },
  time_slot: {
    type: String,
    required: true
  },
  packages: {
    type: mongoose.Schema.Types.Mixed, // Can be array or object
    required: true
  },
  total_amount: {
    type: Number,
    required: true
  },
  payment_method: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'pending'
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

export default mongoose.model('Booking', bookingSchema);