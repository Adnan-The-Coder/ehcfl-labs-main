import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getMinSelectableDate } from '@/utils/dateUtils';
import { Clock, AlertCircle, Loader2 } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';

interface Props {
  date: string;
  timeSlot: string;
  pinCode: string;
  zoneId?: string;
  onUpdate: (date: string, timeSlot: string) => void;
  onNext: () => void;
  onBack: () => void;
}

interface AvailableSlot {
  slot_time: string;
  end_time: string;
  stm_id: string;
  slot_date: string;
  is_peak_hours: string;
}

const DateTimeStep = ({ date, timeSlot, onUpdate, onNext, onBack, pinCode, zoneId }: Props) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    date ? new Date(date) : undefined
  );
  const [selectedSlot, setSelectedSlot] = useState(timeSlot);
  const [error, setError] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [slotError, setSlotError] = useState('');

  const today = getMinSelectableDate();
  const maxDate = new Date(today.getTime() + 7 * 86400000);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      setSlotError('');
      setSelectedSlot('');

      try {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        console.log('📅 Fetching slots for date:', dateString, 'Pincode:', pinCode);

        // Fetch access token first
        let accessToken = '';
        try {
          const authResp = await fetch(`${API_ENDPOINTS.apiBase}/healthians/auth`);
          if (authResp.ok) {
            const authData = await authResp.json();
            accessToken = authData.access_token;
            console.log('✅ Got access token from auth endpoint');
          }
        } catch (err) {
          console.warn('⚠️ Could not fetch access token:', err);
        }

        const response = await fetch(API_ENDPOINTS.healthiansSlots, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken && { 'X-Access-Token': accessToken }),
          },
          body: JSON.stringify({ 
            slot_date: dateString, 
            zipcode: pinCode,
            ...(zoneId && { zone_id: zoneId }),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch slots');
        }

        const data = await response.json();
        console.log('✅ Slots fetched:', data.slots?.length || 0);

        if (data.slots && Array.isArray(data.slots)) {
          setAvailableSlots(data.slots);
          if (data.slots.length === 0) {
            setSlotError('No slots available for selected date');
          }
        } else {
          setSlotError('No slots available for selected date');
        }
      } catch (err) {
        console.error('❌ Error fetching slots:', err);
        setSlotError(err instanceof Error ? err.message : 'Failed to load slots');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, pinCode, zoneId]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setError('');
  };

  const handleSlotSelect = (slot: AvailableSlot) => {
    const slotTime = slot.slot_time.substring(0, 5);
    setSelectedSlot(`${slotTime}-${slot.end_time.substring(0, 5)}|${slot.stm_id}`);
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

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    console.log('✅ Selected booking:', { date: dateString, slot: selectedSlot });
    onUpdate(dateString, selectedSlot);
    onNext();
  };

  const formatTimeSlot = (startTime: string, endTime: string) => {
    try {
      return `${startTime.substring(0, 5)} - ${endTime.substring(0, 5)}`;
    } catch {
      return `${startTime} - ${endTime}`;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Date & Time</h2>
        <p className="text-muted-foreground">Choose your preferred collection date and time. Available for today + 7 days</p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3">Select Date</h3>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < today || date > maxDate}
              className="rounded-md border pointer-events-auto"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Available: Today - {format(maxDate, 'MMM d')}
          </p>
        </div>

        {selectedDate && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Available Time Slots - {format(selectedDate, 'PPP')}
            </h3>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Loading available slots...</span>
              </div>
            ) : slotError ? (
              <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-amber-900">{slotError}</p>
                  <p className="text-sm text-amber-800 mt-1">Try selecting a different date</p>
                </div>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot.includes(slot.stm_id);
                  const slotDisplay = formatTimeSlot(slot.slot_time, slot.end_time);
                  const isPeakHours = slot.is_peak_hours === '1';

                  return (
                    <Button
                      key={slot.stm_id}
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => handleSlotSelect(slot)}
                      className={cn(
                        'justify-center text-sm h-auto py-2',
                        isSelected && 'ring-2 ring-primary',
                        isPeakHours && 'bg-orange-50 hover:bg-orange-100'
                      )}
                      title={isPeakHours ? 'Peak hours - high demand' : undefined}
                    >
                      <div className="text-center">
                        <div className="font-medium">{slotDisplay}</div>
                        {isPeakHours && <div className="text-xs text-orange-700">Peak</div>}
                      </div>
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No slots available for this date
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={loadingSlots || !selectedSlot}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default DateTimeStep;
