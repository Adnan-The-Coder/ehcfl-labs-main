import { useQuery } from "@tanstack/react-query";
import { checkServiceability } from "@/services/healthiansApi";

interface ServiceabilityResult {
  isServiceable: boolean;
  message: string;
  location?: {
    zipcode: string;
    latitude: number;
    longitude: number;
    address?: string;
  };
  slotsAvailable: number;
  sampleSlot?: any;
  allSlots: any[];
}

/**
 * Hook to check Healthians service availability
 * Supports multiple location methods: pincode, coordinates, or IP-based geolocation
 */
export function useServiceability(
  pincode?: string,
  latitude?: number,
  longitude?: number,
  slotDate?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['healthians-serviceability', pincode, latitude, longitude, slotDate],
    queryFn: async (): Promise<ServiceabilityResult> => {
      if (!pincode && (!latitude || !longitude)) {
        console.warn('⚠️ useServiceability: No location provided (pincode or coordinates)');
        return {
          isServiceable: false,
          message: 'No location provided',
          slotsAvailable: 0,
          allSlots: [],
        };
      }

      try {
        console.log('🔍 useServiceability: Checking availability...', {
          pincode,
          hasCoordinates: !!(latitude && longitude),
        });

        const result = await checkServiceability(
          pincode,
          latitude,
          longitude,
          slotDate
        );

        console.log('✅ useServiceability: Result received', {
          serviceable: result.isServiceable,
          slotsAvailable: result.slotsAvailable,
        });

        return result;
      } catch (error) {
        console.error('❌ useServiceability: Error checking serviceability', error);
        return {
          isServiceable: false,
          message: 'Failed to check service availability',
          slotsAvailable: 0,
          allSlots: [],
        };
      }
    },
    enabled: enabled && !!(pincode || (latitude && longitude)),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}
