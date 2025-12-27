import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { BookingData } from '@/pages/Booking';
import { Package } from '@/lib/mockData';
import { Loader2 } from 'lucide-react';

interface Props {
  bookingData: BookingData;
  items: (Package & { quantity: number })[];
  totalPrice: number;
  appliedCoupon: { code: string; discount: number } | null;
  onUpdate: (paymentMethod: string) => void;
  onConfirm: () => void;
  onBack: () => void;
}

const ReviewStep = ({ bookingData, items, totalPrice, appliedCoupon, onUpdate, onConfirm, onBack }: Props) => {
  const [paymentMethod, setPaymentMethod] = useState(bookingData.paymentMethod);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = () => {
    if (!agreedToTerms) return;
    setLoading(true);
    onUpdate(paymentMethod);
    setTimeout(() => {
      onConfirm();
    }, 2000);
  };

  const totalMRP = items.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
  const discount = totalMRP - totalPrice;
  const couponDiscount = appliedCoupon?.discount || 0;
  const finalPrice = totalPrice - couponDiscount;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Payment</h2>
        <p className="text-muted-foreground">Please review your booking details</p>
      </div>

      <div className="space-y-6">
        {/* Patients */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Patients</h3>
          <div className="space-y-2">
            {bookingData.customers.map((customer, index) => (
              <div key={index} className="text-sm">
                • {customer.name}, {customer.age}, {customer.gender}
              </div>
            ))}
          </div>
        </Card>

        {/* Tests/Packages */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Tests & Packages</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>• {item.name} {item.quantity > 1 && `(x${item.quantity})`}</span>
                <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Address */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Collection Address</h3>
          <p className="text-sm">
            {bookingData.address?.line1}, {bookingData.address?.line2 && `${bookingData.address.line2}, `}
            {bookingData.address?.locality}
            {bookingData.address?.landmark && `, Near ${bookingData.address.landmark}`}
            <br />
            {bookingData.address?.city}, {bookingData.address?.state} - {bookingData.address?.pinCode}
          </p>
        </Card>

        {/* Date & Time */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Date & Time</h3>
          <p className="text-sm">
            {bookingData.date && format(new Date(bookingData.date), 'PPP')} at {bookingData.timeSlot}
          </p>
        </Card>

        {/* Pricing */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Pricing</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total MRP</span>
              <span>₹{totalMRP.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-success">
              <span>Package discount</span>
              <span>-₹{discount.toLocaleString()}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-success">
                <span>Coupon ({appliedCoupon.code})</span>
                <span>-₹{couponDiscount}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total Payable</span>
              <span className="text-primary">₹{finalPrice.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Payment Method */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Payment Method</h3>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="prepaid" id="prepaid" />
              <Label htmlFor="prepaid">Prepaid (Online Payment)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cod" id="cod" />
              <Label htmlFor="cod">Cash on Delivery</Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Terms */}
        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
          />
          <Label htmlFor="terms" className="text-sm cursor-pointer">
            I agree to the Terms & Conditions and Privacy Policy
          </Label>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button onClick={handleConfirm} disabled={!agreedToTerms || loading} size="lg">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Confirm Booking'
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;
