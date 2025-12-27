import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bookingRoutes from './routes/bookings.js';
import webhookRoutes from './routes/webhooks.js';
import authRoutes from './routes/auth.js';
import packagesRoutes from './routes/packages.js';
import serviceabilityRoutes from './routes/serviceability.js';
import timeslotsRoutes from './routes/timeslots.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/healthians-auth', authRoutes);
app.use('/api/healthians-packages', packagesRoutes);
app.use('/api/healthians-serviceability', serviceabilityRoutes);
app.use('/api/healthians-timeslots', timeslotsRoutes);
app.use('/api/healthians-create-booking', bookingRoutes);
app.use('/api/healthians-webhook', webhookRoutes);

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare_booking')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;