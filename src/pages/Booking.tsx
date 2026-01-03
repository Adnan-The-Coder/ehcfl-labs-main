import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { usePincode } from '@/contexts/PincodeContext';
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
import { processRazorpayPayment } from '@/utils/razorpay';
import { getAccessToken, createHealthiansBooking, checkServiceability } from '@/services/healthiansApi';
import { logDateDebug, logServiceabilityRequest } from '@/utils/debugUtils';

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
  zone_id?: string;
  latitude?: string;
  longitude?: string;
  zipcode?: string;
}

const LOCATION_CACHE_KEY = 'ehcf_booking_location';

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
  const { pincode } = usePincode();
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
  const [healthiansBookingResponse, setHealthiansBookingResponse] = useState<Record<string, unknown> | null>(null);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleNext = async () => {
    if (currentStep < 4) {
      // Step 2 → 3: Verify address and save location data
      if (currentStep === 2 && bookingData.address?.pinCode) {
        const pinCode = bookingData.address.pinCode.trim();
        
        if (!pinCode) {
          toast({
            variant: 'destructive',
            title: 'Invalid Pincode',
            description: 'Please enter a valid pincode',
          });
          return;
        }

        setIsSubmitting(true);
        
        try {
          // 1. Check serviceability
          console.log('1️⃣ Checking serviceability for:', pinCode);
          const result = await checkServiceability(pinCode);
          
          if (!result.isServiceable) {
            toast({
              variant: 'destructive',
              title: 'Location Not Serviceable',
              description: result.message || 'This area is not serviceable',
            });
            setIsSubmitting(false);
            return;
          }

          // 2. Extract location data
          const { zoneId, location } = result;
          if (!zoneId || !location?.latitude || !location?.longitude) {
            console.error('❌ Invalid response:', { zoneId, location });
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Could not retrieve location information',
            });
            setIsSubmitting(false);
            return;
          }

          // 3. Save to localStorage FIRST (before state update)
          const locationData = {
            zone_id: String(zoneId),
            latitude: String(location.latitude),
            longitude: String(location.longitude),
            zipcode: pinCode,
          };

          console.log('2️⃣ Saving to localStorage:', locationData);
          localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(locationData));
          
          // Verify save
          const saved = localStorage.getItem(LOCATION_CACHE_KEY);
          if (!saved) {
            toast({
              variant: 'destructive',
              title: 'Storage Error',
              description: 'Could not save location. Please enable localStorage.',
            });
            setIsSubmitting(false);
            return;
          }
          console.log('✅ Verified in localStorage:', saved);

          // 4. Update React state (this can be slow/async)
          console.log('3️⃣ Updating React state...');
          setBookingData(prev => ({
            ...prev,
            zone_id: String(zoneId),
            latitude: String(location.latitude),
            longitude: String(location.longitude),
            zipcode: pinCode,
          }));

          // 5. Navigate (DateTimeStep will read from localStorage)
          console.log('4️⃣ Navigating to DateTimeStep...');
          setCurrentStep(3);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setIsSubmitting(false);

        } catch (error) {
          console.error('❌ Error:', error);
          toast({
            variant: 'destructive',
            title: 'Verification Failed',
            description: error instanceof Error ? error.message : 'Unknown error',
          });
          setIsSubmitting(false);
        }
      } else {
        // Other steps: simple navigation
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
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
      // Debug logging
      console.log('📋 Booking Confirmation Starting...');
      logDateDebug();
      console.log('📅 Selected Date:', bookingData.date);
      
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
      const primaryCustomer = bookingData.customers[0];
      
      // Use zone_id obtained during address verification (step 2)
      if (!bookingData.zone_id) {
        toast({
          variant: 'destructive',
          title: 'Location Verification Required',
          description: 'Please go back and verify your address to proceed.',
        });
        setIsSubmitting(false);
        return;
      }

      const zoneId = bookingData.zone_id;

      console.log('✅ Using verified zone_id:', zoneId);
      
      // Prepare Healthians booking payload
      const discountedPrice = appliedCoupon ? totalPrice - appliedCoupon.discount : totalPrice;
      
      // Parse slot_id from selected time slot (format: "HH:MM-HH:MM|stm_id")
      const slotParts = bookingData.timeSlot.split('|');
      const slotId = slotParts[1] || slotParts[0];
      
      const healthiansPayload = {
        customer: bookingData.customers.map((cust, idx) => ({
          customer_id: `CUST-${userUuid.substring(0, 12)}-${idx}`,
          customer_name: cust.name.toUpperCase(),
          relation: idx === 0 ? 'self' : 'family',
          age: parseInt(cust.age),
          dob: cust.email || '', // Using email as placeholder; adjust if you have DOB field
          gender: cust.gender === 'Male' ? 'M' : cust.gender === 'Female' ? 'F' : 'O',
          contact_number: cust.phone,
          email: cust.email,
          application_number: `APP-${Date.now()}`,
          customer_remarks: '',
        })),
        slot: {
          slot_id: slotId,
        },
        package: [
          {
            deal_id: items.map(item => item.id),
          },
        ],
        customer_calling_number: primaryCustomer.phone,
        billing_cust_name: primaryCustomer.name.toUpperCase(),
        gender: primaryCustomer.gender === 'Male' ? 'M' : primaryCustomer.gender === 'Female' ? 'F' : 'O',
        mobile: primaryCustomer.phone,
        email: primaryCustomer.email,
        state: 26, // Default to Haryana (adjust as needed)
        cityId: 23, // Default to Gurgaon (adjust as needed)
        sub_locality: `${bookingData.address?.line1}, ${bookingData.address?.locality}`,
        latitude: String(28.5088974), // Default Gurgaon coords
        longitude: String(77.0750786),
        address: bookingData.address?.line1 || 'Address',
        zipcode: bookingData.address?.pinCode || pincode,
        landmark: bookingData.address?.landmark,
        altmobile: '',
        altemail: '',
        hard_copy: 0,
        vendor_booking_id: `VB-${userUuid.substring(0, 8)}-${Date.now()}`,
        vendor_billing_user_id: `CUST-${userUuid.substring(0, 12)}-0`,
        payment_option: bookingData.paymentMethod === 'prepaid' || bookingData.paymentMethod === 'online' ? 'prepaid' : 'cod',
        discounted_price: Math.round(discountedPrice),
        zone_id: parseInt(zoneId),
        client_id: '',
        user_uuid: userUuid,
        access_token: await getAccessToken(),
      };

      // Create booking in Healthians
      const healthiansResult = await createHealthiansBooking(healthiansPayload);

      if (!healthiansResult.success) {
        toast({
          variant: 'destructive',
          title: 'Booking Failed',
          description: healthiansResult.message || 'Failed to create booking with Healthians',
        });
        setIsSubmitting(false);
        return;
      }

      // Store Healthians response
      const healthiansBookingId = healthiansResult.booking_id || healthiansResult.healthians_response?.booking_id;
      setHealthiansBookingResponse(healthiansResult);

      // If online payment is selected, process payment
      if (bookingData.paymentMethod === 'prepaid' || bookingData.paymentMethod === 'online') {
        const finalAmount = appliedCoupon ? totalPrice - appliedCoupon.discount : totalPrice;
        const amountInPaise = Math.round(finalAmount * 100);

        await processRazorpayPayment(
          amountInPaise,
          userUuid,
          {
            name: primaryCustomer.name,
            email: primaryCustomer.email,
            phone: primaryCustomer.phone,
          },
          async (paymentDetails) => {
            try {
              clearCart();
              localStorage.removeItem(LOCATION_CACHE_KEY);
              
              toast({
                title: 'Booking Successful!',
                description: `Booking ID: ${healthiansBookingId}`,
              });

              navigate('/confirmation', { 
                state: { 
                  bookingId: healthiansBookingId, 
                  booking: {
                    id: healthiansBookingId,
                    ...bookingData,
                    packages: items,
                    totalPrice,
                    discountedPrice,
                    coupon: appliedCoupon,
                    status: 'confirmed',
                    paymentStatus: 'completed',
                    createdAt: new Date().toISOString(),
                    healthiansResponse: healthiansResult.healthians_response,
                  }
                } 
              });
            } catch (error) {
              console.error('Navigation after payment:', error);
              toast({
                variant: 'destructive',
                title: 'Navigation Error',
                description: 'Booking created but error navigating. Booking ID: ' + healthiansBookingId,
              });
            } finally {
              setIsSubmitting(false);
            }
          },
          (error) => {
            console.error('Payment error:', error);
            toast({
              variant: 'destructive',
              title: 'Payment Failed',
              description: error.message || 'Payment was not completed. Your booking is created but unpaid.',
            });
            // Still navigate to confirmation with unpaid status
            setTimeout(() => {
              navigate('/confirmation', { 
                state: { 
                  bookingId: healthiansBookingId, 
                  booking: {
                    id: healthiansBookingId,
                    ...bookingData,
                    packages: items,
                    totalPrice,
                    discountedPrice,
                    coupon: appliedCoupon,
                    status: 'confirmed',
                    paymentStatus: 'pending',
                    createdAt: new Date().toISOString(),
                    healthiansResponse: healthiansResult.healthians_response,
                  }
                } 
              });
            }, 1500);
            setIsSubmitting(false);
          }
        );
      } else {
        // Cash on delivery - no payment processing needed
        clearCart();
        localStorage.removeItem(LOCATION_CACHE_KEY);
        
        toast({
          title: 'Booking Confirmed!',
          description: `Booking ID: ${healthiansBookingId}`,
        });

        navigate('/confirmation', { 
          state: { 
            bookingId: healthiansBookingId, 
            booking: {
              id: healthiansBookingId,
              ...bookingData,
              packages: items,
              totalPrice,
              discountedPrice,
              coupon: appliedCoupon,
              status: 'confirmed',
              paymentStatus: 'pending',
              createdAt: new Date().toISOString(),
              healthiansResponse: healthiansResult.healthians_response,
            }
          } 
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        variant: 'destructive',
        title: 'Booking Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      });
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
                zoneId={bookingData.zone_id}
                latitude={bookingData.latitude}
                longitude={bookingData.longitude}
                zipcode={bookingData.zipcode}
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
