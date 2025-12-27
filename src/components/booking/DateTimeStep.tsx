import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Props {
  date: string;
  timeSlot: string;
  pinCode: string;
  onUpdate: (date: string, timeSlot: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const TIME_SLOTS = {
  morning: [
    '07:00 AM - 08:00 AM',
    '08:00 AM - 09:00 AM',
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
  ],
  afternoon: [
    '12:00 PM - 01:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM',
  ],
  evening: [
    '04:00 PM - 05:00 PM',
    '05:00 PM - 06:00 PM',
  ],
};

const DateTimeStep = ({ date, timeSlot, onUpdate, onNext, onBack }: Props) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    date ? new Date(date) : undefined
  );
  const [selectedSlot, setSelectedSlot] = useState(timeSlot);
  const [error, setError] = useState('');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 15);

  const unavailableSlots = ['10:00 AM - 11:00 AM', '02:00 PM - 03:00 PM'];

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot('');
    setError('');
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    setError('');
  };

  const handleNext = () => {
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }
    onUpdate(selectedDate.toISOString(), selectedSlot);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Date & Time</h2>
        <p className="text-muted-foreground">Choose your preferred collection date and time</p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3">Select Date</h3>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < tomorrow || date > maxDate}
              className="rounded-md border pointer-events-auto"
            />
          </div>
        </div>

        {selectedDate && (
          <div>
            <h3 className="font-semibold mb-3">
              Available Time Slots - {format(selectedDate, 'PPP')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Morning</p>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.morning.map((slot) => {
                    const isUnavailable = unavailableSlots.includes(slot);
                    return (
                      <Button
                        key={slot}
                        variant={selectedSlot === slot ? 'default' : 'outline'}
                        onClick={() => !isUnavailable && handleSlotSelect(slot)}
                        disabled={isUnavailable}
                        className={cn('justify-start', isUnavailable && 'opacity-50')}
                      >
                        {slot}
                        {isUnavailable && ' (Unavailable)'}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Afternoon</p>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.afternoon.map((slot) => {
                    const isUnavailable = unavailableSlots.includes(slot);
                    return (
                      <Button
                        key={slot}
                        variant={selectedSlot === slot ? 'default' : 'outline'}
                        onClick={() => !isUnavailable && handleSlotSelect(slot)}
                        disabled={isUnavailable}
                        className={cn('justify-start', isUnavailable && 'opacity-50')}
                      >
                        {slot}
                        {isUnavailable && ' (Unavailable)'}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Evening</p>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.evening.map((slot) => (
                    <Button
                      key={slot}
                      variant={selectedSlot === slot ? 'default' : 'outline'}
                      onClick={() => handleSlotSelect(slot)}
                      className="justify-start"
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default DateTimeStep;
