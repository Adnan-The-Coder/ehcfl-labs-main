import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle2, Clock, Phone, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  const handleTrack = () => {
    const bookings = JSON.parse(localStorage.getItem('ehcf-bookings') || '[]');
    
    let foundBooking = null;
    if (searchType === 'bookingId') {
      foundBooking = bookings.find((b: any) => b.id === searchValue);
    } else {
      foundBooking = bookings.find((b: any) => 
        b.customers.some((c: any) => c.phone === searchValue)
      );
    }

    if (foundBooking) {
      setBooking(foundBooking);
    } else {
      toast({
        title: 'Not Found',
        description: 'No booking found with the provided details',
        variant: 'destructive',
      });
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
                    <Button onClick={handleTrack}>Track Booking</Button>
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
