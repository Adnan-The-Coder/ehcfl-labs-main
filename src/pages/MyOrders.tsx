import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Clock, CheckCircle2, XCircle, Calendar, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RescheduleModal from '@/components/booking/RescheduleModal';
import CancelModal from '@/components/booking/CancelModal';
import AddOnModal from '@/components/booking/AddOnModal';

const MyOrders = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [addOnModalOpen, setAddOnModalOpen] = useState(false);

  useEffect(() => {
    const savedBookings = JSON.parse(localStorage.getItem('ehcf-bookings') || '[]');
    setBookings(savedBookings);
  }, []);

  const activeBookings = bookings.filter(
    (b) => b.status !== 'cancelled' && b.status !== 'ready' && b.status !== 'completed'
  );
  const completedBookings = bookings.filter(
    (b) => b.status === 'ready' || b.status === 'completed'
  );
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');

  const handleReschedule = (booking: any) => {
    setSelectedBooking(booking);
    setRescheduleModalOpen(true);
  };

  const handleCancel = (booking: any) => {
    setSelectedBooking(booking);
    setCancelModalOpen(true);
  };

  const handleAddOn = (booking: any) => {
    setSelectedBooking(booking);
    setAddOnModalOpen(true);
  };

  const handleDownloadReport = (bookingId: string) => {
    // Mock download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `report-${bookingId}.pdf`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'scheduled':
        return (
          <Badge className="bg-warning text-warning-foreground">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'reached':
      case 'collected':
      case 'lab':
      case 'testing':
        return (
          <Badge className="bg-primary text-primary-foreground">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'ready':
      case 'completed':
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const BookingCard = ({ booking }: { booking: any }) => (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-lg">
              {booking.packages.map((p: any) => p.name).join(', ')}
            </h3>
            {getStatusBadge(booking.status)}
          </div>
          <p className="text-sm text-muted-foreground">Booking ID: {booking.id}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(booking.date).toLocaleDateString()}
            </span>
            <span>{booking.timeSlot}</span>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
          <div>
            <p className="text-muted-foreground">Patient(s)</p>
            <p className="font-medium">{booking.customers.map((c: any) => c.name).join(', ')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Amount</p>
            <p className="font-medium">₹{booking.totalPrice.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/track', { state: { bookingId: booking.id } })}
          >
            Track Order
          </Button>
          
          {(booking.status === 'ready' || booking.status === 'completed') && (
            <Button size="sm" onClick={() => handleDownloadReport(booking.id)}>
              <Download className="w-4 h-4 mr-1" />
              Download Report
            </Button>
          )}
          
          {booking.status !== 'cancelled' && booking.status !== 'ready' && booking.status !== 'completed' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReschedule(booking)}
              >
                Reschedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddOn(booking)}
              >
                Add Tests
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancel(booking)}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );

  if (bookings.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-4 py-16">
            <Card className="max-w-md mx-auto p-8 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't placed any orders. Start by booking a test!
              </p>
              <Button onClick={() => navigate('/tests')}>Browse Tests</Button>
            </Card>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">My Orders</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="active">
                Active ({activeBookings.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedBookings.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled ({cancelledBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeBookings.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No active bookings</p>
                </Card>
              ) : (
                activeBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedBookings.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No completed bookings</p>
                </Card>
              ) : (
                completedBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {cancelledBookings.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No cancelled bookings</p>
                </Card>
              ) : (
                cancelledBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-8 text-center">
            <Button variant="outline" onClick={() => navigate('/tests')}>
              <ShoppingBag className="w-4 h-4 mr-2" />
              Book New Test
            </Button>
          </div>
        </div>
      </div>
      <Footer />

      {selectedBooking && (
        <>
          <RescheduleModal
            booking={selectedBooking}
            open={rescheduleModalOpen}
            onClose={() => {
              setRescheduleModalOpen(false);
              setSelectedBooking(null);
            }}
            onSuccess={() => {
              const savedBookings = JSON.parse(localStorage.getItem('ehcf-bookings') || '[]');
              setBookings(savedBookings);
            }}
          />
          <CancelModal
            booking={selectedBooking}
            open={cancelModalOpen}
            onClose={() => {
              setCancelModalOpen(false);
              setSelectedBooking(null);
            }}
            onSuccess={() => {
              const savedBookings = JSON.parse(localStorage.getItem('ehcf-bookings') || '[]');
              setBookings(savedBookings);
            }}
          />
          <AddOnModal
            booking={selectedBooking}
            open={addOnModalOpen}
            onClose={() => {
              setAddOnModalOpen(false);
              setSelectedBooking(null);
            }}
            onSuccess={() => {
              const savedBookings = JSON.parse(localStorage.getItem('ehcf-bookings') || '[]');
              setBookings(savedBookings);
            }}
          />
        </>
      )}
    </>
  );
};

export default MyOrders;
