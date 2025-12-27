import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Copy, Download, ShoppingBag } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { bookingId, booking } = location.state || {};

  if (!bookingId) {
    navigate('/');
    return null;
  }

  const copyBookingId = () => {
    navigator.clipboard.writeText(bookingId);
    toast({
      title: 'Copied!',
      description: 'Booking ID copied to clipboard',
    });
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-12 h-12 text-success" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
              <p className="text-muted-foreground">
                Your booking has been successfully placed
              </p>
            </div>

            <div className="bg-muted rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Booking ID</p>
                  <p className="text-lg font-bold">{bookingId}</p>
                </div>
                <Button variant="outline" size="icon" onClick={copyBookingId}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="font-semibold text-lg">What's Next?</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Booking confirmed</p>
                    <p className="text-sm text-muted-foreground">
                      Your booking has been received
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Sample collector assigned</p>
                    <p className="text-sm text-muted-foreground">
                      Within 2 hours before collection time
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Sample collection</p>
                    <p className="text-sm text-muted-foreground">
                      {booking?.date && new Date(booking.date).toLocaleDateString()} at {booking?.timeSlot}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Report ready</p>
                    <p className="text-sm text-muted-foreground">
                      Within 24-48 hours after collection
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button onClick={() => navigate('/track')} className="w-full">
                Track Booking
              </Button>
              <Button variant="outline" onClick={() => window.print()} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download Details
              </Button>
              <Button variant="outline" onClick={() => navigate('/tests')} className="w-full">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Book Another Test
              </Button>
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Confirmation;
