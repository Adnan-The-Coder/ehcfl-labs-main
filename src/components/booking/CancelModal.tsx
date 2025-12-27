import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';

interface Props {
  booking: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CANCEL_REASONS = [
  'Change of plans',
  'Found better price',
  'Booked by mistake',
  'Medical advice',
  'Other',
];

const CancelModal = ({ booking, open, onClose, onSuccess }: Props) => {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCancel = () => {
    if (!reason) {
      toast({
        title: 'Error',
        description: 'Please select a reason for cancellation',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const bookings = JSON.parse(localStorage.getItem('ehcf-bookings') || '[]');
      const updatedBookings = bookings.map((b: any) =>
        b.id === booking.id
          ? {
              ...b,
              status: 'cancelled',
              cancelReason: reason,
              cancelComments: comments,
              cancelledAt: new Date().toISOString(),
            }
          : b
      );
      localStorage.setItem('ehcf-bookings', JSON.stringify(updatedBookings));

      toast({
        title: 'Booking Cancelled',
        description: 'Your booking has been cancelled successfully',
      });

      setLoading(false);
      onSuccess();
      onClose();
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-warning" />
            Cancel Booking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Booking ID</p>
            <p className="font-medium">{booking.id}</p>
            <p className="text-sm mt-2">
              {booking.packages.map((p: any) => p.name).join(', ')}
            </p>
          </div>

          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
            <p className="text-sm text-destructive font-medium">
              Are you sure you want to cancel this booking?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This action cannot be undone. Any applicable refund will be processed within 5-7 business days.
            </p>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Cancellation *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason" className="mt-2">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="comments">Additional Comments (Optional)</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any additional details..."
              className="mt-2"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Cancelling...' : 'Yes, Cancel Booking'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CancelModal;
