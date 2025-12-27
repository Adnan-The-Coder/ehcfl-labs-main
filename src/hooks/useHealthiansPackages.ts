import { useQuery } from "@tanstack/react-query";
import { getPackages } from "@/services/healthiansApi";
import { Package } from "@/lib/mockData";

// Map Healthians API response to our Package interface
function mapHealthiansPackage(apiPackage: any): Package {
  const price = parseFloat(apiPackage.price || 0);
  const originalPrice = parseFloat(apiPackage.mrp || price);
  const discount = originalPrice > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return {
    id: apiPackage.deal_id || apiPackage.product_type_id || String(Math.random()),
    name: apiPackage.test_name || "Unnamed Package",
    price,
    originalPrice,
    discount,
    testsCount: 0, // Not provided in this endpoint response
    tests: [],     // Not provided in this endpoint response
    description: `${apiPackage.test_name || 'Package'} - ${apiPackage.product_type || 'Test'}`,
    sampleType: "Blood",
    fastingRequired: false,
    reportTime: "24 hours",
    popular: false,
    category: apiPackage.product_type === 'package' ? 'Packages' : 
              apiPackage.product_type === 'profile' ? 'Health Profiles' : 
              'Individual Tests',
  };
}

export function useHealthiansPackages(pincode?: string, search?: string) {
  return useQuery({
    queryKey: ['healthians-packages', pincode, search],
    queryFn: async () => {
      console.log('useHealthiansPackages: Starting query with', { pincode, search });
      try {
        const packages = await getPackages(pincode, search);
        console.log('useHealthiansPackages: Received packages', {
          count: packages?.length,
          hasPackages: !!packages
        });
        
        if (!packages || packages.length === 0) {
          console.warn('useHealthiansPackages: No packages returned from API');
          return [];
        }
        
        const mapped = packages.map(mapHealthiansPackage);
        console.log('useHealthiansPackages: Mapped packages', { count: mapped.length });
        return mapped;
      } catch (error) {
        console.error('useHealthiansPackages: Query failed', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
