import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import CustomerDetailsStep from '@/components/booking/CustomerDetailsStep';
import AddressStep from '@/components/booking/AddressStep';
import DateTimeStep from '@/components/booking/DateTimeStep';
import ReviewStep from '@/components/booking/ReviewStep';
import { CheckCircle2 } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { API_ENDPOINTS } from '@/config/api';
import { useToast } from '@/hooks/use-toast';

export interface Customer {
  name: string;
  age: string;
  gender: string;
  phone: string;
  email: string;
}

export interface Address {
  line1: string;
  line2: string;
  locality: string;
  landmark: string;
  city: string;
  state: string;
  pinCode: string;
}

export interface BookingData {
  customers: Customer[];
  address: Address | null;
  date: string;
  timeSlot: string;
  paymentMethod: string;
}

const steps = [
  { id: 1, name: 'Customer Details' },
  { id: 2, name: 'Address' },
  { id: 3, name: 'Date & Time' },
  { id: 4, name: 'Review & Payment' },
];

const Booking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, totalPrice, clearCart } = useCart();
  const appliedCoupon = location.state?.appliedCoupon || null;
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    customers: [],
    address: null,
    date: '',
    timeSlot: '',
    paymentMethod: 'prepaid',
  });

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    
    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'You must be logged in to complete booking. Please log in and try again.',
        });
        navigate('/cart');
        return;
      }

      const userUuid = session.user.id;
      const bookingId = `BKG${Date.now()}`;
      
      // Prepare booking payload
      const bookingPayload = {
        booking_id: bookingId,
        user_uuid: userUuid,
        customers: bookingData.customers,
        address: bookingData.address,
        booking_date: bookingData.date,
        time_slot: bookingData.timeSlot,
        packages: items,
        total_price: totalPrice,
        coupon: appliedCoupon,
        payment_method: bookingData.paymentMethod,
        payment_status: 'pending',
        status: 'confirmed',
      };

      // Make API call to create booking
      const response = await fetch(API_ENDPOINTS.createBooking, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to create booking');
      }

      // Clear cart and navigate to confirmation
      clearCart();
      
      toast({
        title: 'Booking Confirmed!',
        description: `Your booking ID is ${bookingId}`,
      });

      navigate('/confirmation', { 
        state: { 
          bookingId, 
          booking: {
            id: bookingId,
            ...bookingData,
            packages: items,
            totalPrice,
            coupon: appliedCoupon,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
          }
        } 
      });
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        variant: 'destructive',
        title: 'Booking Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / 4) * 100;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Progress */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        step.id < currentStep
                          ? 'bg-success text-white'
                          : step.id === currentStep
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step.id < currentStep ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span className="text-xs text-center hidden sm:block">{step.name}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="h-0.5 bg-muted flex-1 mx-2" />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Content */}
          <Card className="max-w-4xl mx-auto p-6 sm:p-8">
            {currentStep === 1 && (
              <CustomerDetailsStep
                customers={bookingData.customers}
                onUpdate={(customers) => setBookingData({ ...bookingData, customers })}
                onNext={handleNext}
              />
            )}
            {currentStep === 2 && (
              <AddressStep
                address={bookingData.address}
                onUpdate={(address) => setBookingData({ ...bookingData, address })}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 3 && (
              <DateTimeStep
                date={bookingData.date}
                timeSlot={bookingData.timeSlot}
                pinCode={bookingData.address?.pinCode || ''}
                onUpdate={(date, timeSlot) =>
                  setBookingData({ ...bookingData, date, timeSlot })
                }
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 4 && (
              <ReviewStep
                bookingData={bookingData}
                items={items}
                totalPrice={totalPrice}
                appliedCoupon={appliedCoupon}
                onUpdate={(paymentMethod) =>
                  setBookingData({ ...bookingData, paymentMethod })
                }
                onConfirm={handleConfirmBooking}
                onBack={handleBack}
                isSubmitting={isSubmitting}
              />
            )}
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Booking;
