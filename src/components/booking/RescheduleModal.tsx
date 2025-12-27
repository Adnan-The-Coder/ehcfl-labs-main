import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  booking: any;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TIME_SLOTS = [
  '07:00 AM - 08:00 AM',
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '12:00 PM - 01:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM',
];

const RescheduleModal = ({ booking, open, onClose, onSuccess }: Props) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState('');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 15);

  const handleReschedule = () => {
    if (!selectedDate || !selectedSlot) {
      toast({
        title: 'Error',
        description: 'Please select both date and time slot',
        variant: 'destructive',
      });
      return;
    }

    const bookings = JSON.parse(localStorage.getItem('ehcf-bookings') || '[]');
    const updatedBookings = bookings.map((b: any) =>
      b.id === booking.id
        ? {
            ...b,
            date: selectedDate.toISOString(),
            timeSlot: selectedSlot,
            status: 'scheduled',
          }
        : b
    );
    localStorage.setItem('ehcf-bookings', JSON.stringify(updatedBookings));

    toast({
      title: 'Rescheduled Successfully',
      description: `Your booking has been rescheduled to ${format(selectedDate, 'PPP')} at ${selectedSlot}`,
    });

    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Reschedule Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Current Schedule</p>
            <p className="font-medium">
              {new Date(booking.date).toLocaleDateString()} at {booking.timeSlot}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Select New Date</h3>
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < tomorrow || date > maxDate}
                className="rounded-md border pointer-events-auto"
              />
            </div>
          </div>

          {selectedDate && (
            <div>
              <h3 className="font-semibold mb-3">
                Select Time Slot - {format(selectedDate, 'PPP')}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <Button
                    key={slot}
                    variant={selectedSlot === slot ? 'default' : 'outline'}
                    onClick={() => setSelectedSlot(slot)}
                    className="justify-start"
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleReschedule} className="flex-1">
              Confirm Reschedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleModal;
