import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getMinSelectableDate } from '@/utils/dateUtils';
import { Clock, AlertCircle, Loader2 } from 'lucide-react';
import { getTimeSlots } from '@/services/healthiansApi';

interface Props {
  date: string;
  timeSlot: string;
  pinCode: string;
  zoneId?: string;
  latitude?: string;
  longitude?: string;
  zipcode?: string;
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

// Helper to safely retrieve location data synchronously
const getLocationFromCache = () => {
  try {
    const cached = localStorage.getItem('ehcf_booking_location');
    if (!cached) {
      console.log('❌ No cache in localStorage');
      return null;
    }
    
    const data = JSON.parse(cached);
    console.log('✅ Found cache:', data);
    
    // Return normalized structure
    return {
      zoneId: String(data.zone_id || ''),
      latitude: String(data.latitude || ''),
      longitude: String(data.longitude || ''),
      zipcode: String(data.zipcode || ''),
    };
  } catch (error) {
    console.error('❌ Cache read error:', error);
    return null;
  }
};

const DateTimeStep = ({ 
  date, 
  timeSlot, 
  onUpdate, 
  onNext, 
  onBack, 
  pinCode, 
  zoneId: propZoneId,
  latitude: propLatitude,
  longitude: propLongitude,
  zipcode: propZipcode,
}: Props) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    date ? new Date(date) : undefined
  );
  const [selectedSlot, setSelectedSlot] = useState(timeSlot);
  const [error, setError] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [slotError, setSlotError] = useState('');

  // ALWAYS read from localStorage (ignore props to avoid state sync issues)
  const getLocationData = () => {
    console.log('🔍 Reading from localStorage...');
    const cached = getLocationFromCache();
    
    if (!cached || !cached.zoneId || !cached.latitude || !cached.longitude || !cached.zipcode) {
      console.error('❌ No valid location in localStorage');
      return null;
    }

    console.log('✅ Location loaded from localStorage:', cached);
    return cached;
  };

  const today = getMinSelectableDate();
  const maxDate = new Date(today.getTime() + 7 * 86400000);

  // Fetch slots when date changes (location is read fresh inside effect)
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate) {
        setAvailableSlots([]);
        setSlotError('');
        return;
      }

      // Read location data INSIDE the effect to avoid dependency issues
      const locationData = getLocationData();
      
      if (!locationData) {
        console.error('❌ No location data');
        setSlotError('Location data not available. Please go back and verify your address.');
        setAvailableSlots([]);
        return;
      }

      const { zoneId, latitude, longitude, zipcode } = locationData;
      if (!zoneId || !latitude || !longitude || !zipcode) {
        console.error('❌ Incomplete location:', { zoneId, latitude, longitude, zipcode });
        setSlotError('Incomplete location information. Please verify your address.');
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

        console.log('📅 Fetching slots with location data:', {
          date: dateString,
          zoneId,
          latitude,
          longitude,
          zipcode,
        });

        const result = await getTimeSlots(
          dateString,
          zoneId,
          latitude,
          longitude,
          zipcode,
          0, // get_ppmc_slots
          0  // has_female_patient
        );

        if (!result.success) {
          throw new Error(result.message || 'Failed to fetch slots');
        }

        console.log('✅ Slots fetched:', result.slots?.length || 0);

        if (result.slots && Array.isArray(result.slots) && result.slots.length > 0) {
          setAvailableSlots(result.slots);
        } else {
          setSlotError('No slots available for selected date');
          setAvailableSlots([]);
        }
      } catch (err) {
        console.error('❌ Error fetching slots:', err);
        setSlotError(err instanceof Error ? err.message : 'Failed to load slots');
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate]); // ONLY depend on selectedDate, not locationData object

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
