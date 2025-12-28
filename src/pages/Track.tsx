/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle2, Clock, Phone, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';
import { supabase } from '@/utils/supabase/client';

interface BookingStatus {
  code: string;
  label: string;
  timestamp: string;
  completed: boolean;
}

const Track = () => {
  const [searchType, setSearchType] = useState<'bookingId' | 'phone'>('bookingId');
  const [searchValue, setSearchValue] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const statusMapping: Record<string, { label: string; description: string }> = {
    confirmed: { label: 'Order Booked', description: 'Your booking has been received' },
    scheduled: { label: 'Pickup Scheduled', description: 'Sample collector will arrive soon' },
    reached: { label: 'Sample Collector Reached', description: 'Collector has arrived at location' },
    collected: { label: 'Sample Collected', description: 'Sample collected successfully' },
    lab: { label: 'Sample at Lab', description: 'Sample is being processed' },
    testing: { label: 'Tests in Progress', description: 'Your tests are being performed' },
    ready: { label: 'Report Ready', description: 'Your report is ready for download' },
  };

  const parseBooking = (raw: any) => ({
    id: raw.booking_id,
    customers: typeof raw.customers === 'string' ? JSON.parse(raw.customers) : raw.customers,
    address: typeof raw.address === 'string' ? JSON.parse(raw.address) : raw.address,
    packages: typeof raw.packages === 'string' ? JSON.parse(raw.packages) : raw.packages,
    coupon: raw.coupon ? (typeof raw.coupon === 'string' ? JSON.parse(raw.coupon) : raw.coupon) : null,
    date: raw.booking_date,
    timeSlot: raw.time_slot,
    totalPrice: raw.total_price,
    paymentMethod: raw.payment_method,
    status: raw.status,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  });

  const handleTrack = async () => {
    if (!searchValue) {
      toast({
        title: 'Missing input',
        description: `Please enter a ${searchType === 'bookingId' ? 'Booking ID' : 'phone number'}.`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setBooking(null);
    try {
      if (searchType === 'bookingId') {
        const res = await fetch(API_ENDPOINTS.getBookingById(searchValue));
        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.message || 'Booking not found');
        }
        setBooking(parseBooking(json.data));
      } else {
        // Try fetching only the current user's bookings; fall back to all
        const { data: { session } } = await supabase.auth.getSession();
        let res;
        if (session?.user?.id) {
          res = await fetch(API_ENDPOINTS.getBookingsByUserUUID(session.user.id));
        } else {
          res = await fetch(API_ENDPOINTS.getAllBookings);
        }
        const json = await res.json();
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.message || 'No bookings found');
        }
        const list: any[] = json.data;
        const matches = list.filter((b: any) => {
          const customers = typeof b.customers === 'string' ? JSON.parse(b.customers) : b.customers;
          return Array.isArray(customers) && customers.some((c: any) => `${c.phone}` === searchValue);
        });
        if (matches.length === 0) {
          throw new Error('No booking found for this phone number');
        }
        // Pick the most recent by created_at
        matches.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setBooking(parseBooking(matches[0]));
      }
    } catch (err) {
      console.error('Track error:', err);
      toast({
        title: 'Not Found',
        description: err instanceof Error ? err.message : 'No booking found with the provided details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusTimeline = (currentStatus: string) => {
    const statuses = ['confirmed', 'scheduled', 'reached', 'collected', 'lab', 'testing', 'ready'];
    const currentIndex = statuses.indexOf(currentStatus);
    
    return statuses.map((status, index) => ({
      ...statusMapping[status],
      status,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  // Poll status every 15s when tracking by booking ID
  useEffect(() => {
    let timer: number | undefined;
    const shouldPoll = Boolean(booking?.id) && searchType === 'bookingId';
    if (shouldPoll) {
      const poll = async () => {
        try {
          const res = await fetch(API_ENDPOINTS.getBookingById(booking.id));
          const json = await res.json();
          if (res.ok && json.success && json.data) {
            setBooking(parseBooking(json.data));
          }
        } catch (e) {
          // silent fail on polling
        }
      };
      timer = window.setInterval(poll, 15000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [booking?.id, searchType]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Track Your Booking</h1>
            <p className="text-muted-foreground mb-8">
              Enter your booking ID or phone number to track your order
            </p>

            <Card className="p-6 mb-8">
              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block">Search by:</Label>
                  <RadioGroup
                    value={searchType}
                    onValueChange={(value) => setSearchType(value as 'bookingId' | 'phone')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bookingId" id="bookingId" />
                      <Label htmlFor="bookingId" className="cursor-pointer">Booking ID</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="phone" id="phone" />
                      <Label htmlFor="phone" className="cursor-pointer">Phone Number</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="search">
                    {searchType === 'bookingId' ? 'Booking ID' : 'Phone Number'}
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="search"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder={
                        searchType === 'bookingId'
                          ? 'Enter booking ID (e.g., BKG1234567890)'
                          : 'Enter 10-digit phone number'
                      }
                    />
                    <Button onClick={handleTrack} disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        'Track Booking'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {booking && (
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold">Booking ID: {booking.id}</h2>
                      <p className="text-sm text-muted-foreground">
                        Booked on {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                      booking.status === 'ready' ? 'bg-success text-success-foreground' :
                      booking.status === 'collected' ? 'bg-primary text-primary-foreground' :
                      'bg-warning text-warning-foreground'
                    }`}>
                      {statusMapping[booking.status]?.label || 'In Progress'}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Status Timeline</h3>
                    <div className="space-y-4">
                      {getStatusTimeline(booking.status).map((status, index) => (
                        <div key={status.status} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                status.completed
                                  ? 'bg-success text-white'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {status.completed ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <Clock className="w-5 h-5" />
                              )}
                            </div>
                            {index < getStatusTimeline(booking.status).length - 1 && (
                              <div
                                className={`w-0.5 h-12 ${
                                  status.completed ? 'bg-success' : 'bg-muted'
                                }`}
                              />
                            )}
                          </div>
                          <div className="flex-1 pb-8">
                            <p className="font-medium">{status.label}</p>
                            <p className="text-sm text-muted-foreground">{status.description}</p>
                            {status.current && (
                              <p className="text-xs text-primary mt-1">Current Status</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Customer Details</h3>
                  <div className="space-y-3">
                    {booking.customers.map((customer: any, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium flex-shrink-0">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.age} years, {customer.gender}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Collection Address</h3>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm">
                        {booking.address.line1}, {booking.address.line2 && `${booking.address.line2}, `}
                        {booking.address.locality}
                        {booking.address.landmark && `, Near ${booking.address.landmark}`}
                      </p>
                      <p className="text-sm">
                        {booking.address.city}, {booking.address.state} - {booking.address.pinCode}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium">Collection Schedule</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.date).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">{booking.timeSlot}</p>
                  </div>
                </Card>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    Call Support
                  </Button>
                  {booking.status !== 'ready' && (
                    <>
                      <Button variant="outline" className="flex-1">
                        Reschedule
                      </Button>
                      <Button variant="outline" className="flex-1">
                        Cancel
                      </Button>
                    </>
                  )}
                  {booking.status === 'ready' && (
                    <Button className="flex-1">Download Report</Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Track;
