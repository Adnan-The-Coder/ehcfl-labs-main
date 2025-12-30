import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Copy, Download, ShoppingBag, Clock, AlertCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  // Extract TAT details from Healthians response
  const healthiansResponse = booking?.healthiansResponse;
  const tatDetails = healthiansResponse?.tatDetail;
  const maxTatMinutes = tatDetails?.max_tat ? parseInt(tatDetails.max_tat) : null;
  const tatHours = maxTatMinutes ? Math.ceil(maxTatMinutes / 60) : null;

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
                {healthiansResponse?.message || 'Your booking has been successfully placed'}
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

            {/* TAT Information */}
            {tatHours && (
              <Alert className="mb-6 border-primary/20 bg-primary/5">
                <Clock className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <span className="font-semibold">Reports Ready in:</span> <span className="text-primary font-bold">{tatHours} hours</span> from sample collection
                  {tatDetails?.custWiseDetails && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Estimated turnaround time: {maxTatMinutes} minutes
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Payment Status */}
            {booking?.paymentStatus && (
              <Card className="p-4 mb-6 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                    <p className="font-semibold capitalize">
                      {booking.paymentStatus === 'completed' ? (
                        <span className="text-success">Paid Successfully</span>
                      ) : booking.paymentStatus === 'pending' ? (
                        <span className="text-amber-600">Pending</span>
                      ) : (
                        <span className="text-destructive">Failed</span>
                      )}
                    </p>
                  </div>
                  {booking.discountedPrice && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Amount</p>
                      <p className="text-xl font-bold">₹{booking.discountedPrice.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

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
                      Your booking has been received and registered with Healthians
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
                      Within 2 hours before your collection time
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
                      {booking?.date && new Date(booking.date).toLocaleDateString('en-IN', { 
                        weekday: 'short',
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })} at {booking?.timeSlot}
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
                      {tatHours ? `Within ${tatHours} hours after collection` : 'Within 24-48 hours after collection'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Details Summary */}
            {booking?.packages && (
              <Card className="p-4 mb-6 bg-muted/30">
                <h3 className="font-semibold mb-3">Booking Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Number of Patients</p>
                    <p className="font-medium">{booking.customers?.length || 1}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Number of Tests</p>
                    <p className="font-medium">{booking.packages?.length || 'Multiple'}</p>
                  </div>
                  {booking.coupon && (
                    <div>
                      <p className="text-muted-foreground">Discount Applied</p>
                      <p className="font-medium text-success">₹{booking.coupon.discount}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button onClick={() => navigate('/track')} className="w-full">
                Track Booking
              </Button>
              <Button variant="outline" onClick={() => window.print()} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={() => navigate('/tests')} className="w-full">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Book Another
              </Button>
            </div>

            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> A confirmation SMS has been sent to your registered phone number. Keep your booking ID safe for future reference.
              </p>
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Confirmation;
