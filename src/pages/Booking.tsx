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
import { getUserId, isAuthenticated } from '@/utils/session';
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
  const [locationVerified, setLocationVerified] = useState(false);

  // Restore location data from localStorage on mount (if returning to step 3+)
  useState(() => {
    if (currentStep >= 3) {
      try {
        const cached = localStorage.getItem(LOCATION_CACHE_KEY);
        if (cached) {
          const locationData = JSON.parse(cached);
          if (locationData.zone_id && locationData.latitude && locationData.longitude && locationData.zipcode) {
            console.log('🔄 Restored location data from localStorage on mount');
            setBookingData(prev => ({
              ...prev,
              zone_id: locationData.zone_id,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              zipcode: locationData.zipcode,
            }));
            setLocationVerified(true);
          }
        }
      } catch (error) {
        console.error('❌ Failed to restore location data:', error);
      }
    }
  });

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
            timestamp: Date.now(), // Add timestamp for tracking
          };

          console.log('2️⃣ Saving to localStorage:', locationData);
          
          // Attempt save with retry logic
          let saveAttempts = 0;
          let saveSuccess = false;
          
          while (saveAttempts < 3 && !saveSuccess) {
            try {
              localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(locationData));
              
              // Immediate verification
              const saved = localStorage.getItem(LOCATION_CACHE_KEY);
              if (saved) {
                const parsedData = JSON.parse(saved);
                if (parsedData.zone_id && parsedData.latitude && parsedData.longitude && parsedData.zipcode) {
                  console.log('✅ Verified in localStorage (attempt ' + (saveAttempts + 1) + '):', saved);
                  saveSuccess = true;
                  break;
                }
              }
            } catch (err) {
              console.error('❌ Save attempt ' + (saveAttempts + 1) + ' failed:', err);
            }
            saveAttempts++;
          }
          
          if (!saveSuccess) {
            toast({
              variant: 'destructive',
              title: 'Storage Error',
              description: 'Could not save location data. Please enable localStorage and try again.',
            });
            setIsSubmitting(false);
            return;
          }

          // 4. Update React state with location data
          console.log('3️⃣ Updating React state...');
          setBookingData(prev => ({
            ...prev,
            zone_id: String(zoneId),
            latitude: String(location.latitude),
            longitude: String(location.longitude),
            zipcode: pinCode,
          }));
          
          // Set verification flag
          setLocationVerified(true);

          // 5. Navigate to next step - DateTimeStep will read from localStorage
          console.log('4️⃣ Navigating to DateTimeStep...');
          
          // Final verification before navigation
          const finalCheck = localStorage.getItem(LOCATION_CACHE_KEY);
          if (!finalCheck) {
            console.error('❌ Location data lost before navigation!');
            toast({
              variant: 'destructive',
              title: 'Verification Failed',
              description: 'Location data was not properly saved. Please try again.',
            });
            setIsSubmitting(false);
            return;
          }
          
          toast({
            title: 'Address Verified',
            description: 'Your location has been verified and saved successfully.',
          });
          
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
      } else if (currentStep === 3 && !locationVerified) {
        // Prevent access to DateTimeStep without verified location
        toast({
          variant: 'destructive',
          title: 'Location Required',
          description: 'Please complete address verification first.',
        });
        setCurrentStep(2);
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
      
      // Check if user is authenticated
      if (!isAuthenticated()) {
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'You must be logged in to complete booking. Please log in and try again.',
        });
        navigate('/cart');
        return;
      }

      const userUuid = getUserId();
      if (!userUuid) {
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: 'User ID not found. Please log in again.',
        });
        navigate('/cart');
        return;
      }
      const primaryCustomer = bookingData.customers[0];
      
      // Try to get zone_id from state first, then fallback to localStorage
      let zoneId = bookingData.zone_id;
      let locationData = null;
      
      if (!zoneId) {
        // Fallback to localStorage if state is empty
        const cachedLocation = localStorage.getItem(LOCATION_CACHE_KEY);
        if (cachedLocation) {
          try {
            locationData = JSON.parse(cachedLocation);
            zoneId = locationData.zone_id;
            console.log('✅ Retrieved zone_id from localStorage:', zoneId);
            // Update state with cached location data
            setBookingData(prev => ({
              ...prev,
              zone_id: zoneId,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              zipcode: locationData.zipcode,
            }));
          } catch (error) {
            console.error('❌ Failed to parse cached location:', error);
          }
        }
      }
      
      if (!zoneId) {
        toast({
          variant: 'destructive',
          title: 'Location Verification Required',
          description: 'Please go back and verify your address to proceed.',
        });
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Using verified zone_id:', zoneId);
      console.log('✅ Booking Data:', { zone_id: zoneId, latitude: bookingData.latitude || locationData?.latitude, longitude: bookingData.longitude || locationData?.longitude, zipcode: bookingData.zipcode || bookingData.address?.pinCode });
      
      // Prepare Healthians booking payload
      const discountedPrice = appliedCoupon ? totalPrice - appliedCoupon.discount : totalPrice;
      
      // Parse slot_id from selected time slot (format: "HH:MM-HH:MM|stm_id")
      const slotParts = bookingData.timeSlot.split('|');
      const slotId = slotParts[1] || slotParts[0];
      
      // Helper function to map gender to single character
      const mapGender = (gender: string): string => {
        const g = gender.toLowerCase().trim();
        if (g === 'male' || g === 'm') return 'M';
        if (g === 'female' || g === 'f') return 'F';
        return 'O'; // Other
      };
      
      const healthiansPayload = {
        address: bookingData.address?.line1 || 'Address',
        altemail: '',
        altmobile: '',
        billing_cust_name: primaryCustomer.name.toUpperCase(),
        cityId: 23,
        client_id: '',
        customer: bookingData.customers.map((cust, idx) => ({
          age: parseInt(cust.age),
          application_number: `APP-${Date.now()}`,
          contact_number: cust.phone,
          customer_id: `CUST-${userUuid.substring(0, 12)}-${idx}`,
          customer_name: cust.name.toUpperCase(),
          customer_remarks: '',
          dob: '',
          email: cust.email || '',
          gender: mapGender(cust.gender),
          relation: idx === 0 ? 'self' : 'family',
        })),
        customer_calling_number: primaryCustomer.phone,
        discounted_price: Math.round(discountedPrice),
        email: primaryCustomer.email || '',
        gender: mapGender(primaryCustomer.gender),
        hard_copy: 0,
        landmark: bookingData.address?.landmark || '',
        latitude: String(bookingData.latitude || locationData?.latitude || '28.5088974'),
        longitude: String(bookingData.longitude || locationData?.longitude || '77.0750786'),
        mobile: primaryCustomer.phone,
        package: [
          {
            deal_id: items.map(item => item.id),
          },
        ],
        payment_option: bookingData.paymentMethod === 'prepaid' || bookingData.paymentMethod === 'online' ? 'prepaid' : 'cod',
        slot: {
          slot_id: slotId,
        },
        state: 26,
        sub_locality: `${bookingData.address?.line1}, ${bookingData.address?.locality}`,
        vendor_billing_user_id: `CUST-${userUuid.substring(0, 12)}-0`,
        vendor_booking_id: `VB-${userUuid.substring(0, 8)}-${Date.now()}`,
        zipcode: String(bookingData.zipcode || bookingData.address?.pinCode || pincode),
        zone_id: parseInt(zoneId),
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
