/**
 * Development debugging utilities
 */

export function logDateDebug() {
  const now = new Date();
  const istDate = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const istDateString = `${year}-${month}-${day}`;
  
  console.log('🕐 Date Debug Info:');
  console.log('  Current UTC:', now.toISOString());
  console.log('  Local Timezone Offset (minutes):', now.getTimezoneOffset());
  console.log('  IST Date String:', istDateString);
  console.log('  Browser Local Date:', new Date().toLocaleDateString());
  
  return {
    utcNow: now.toISOString(),
    istDateString,
    localDateString: new Date().toLocaleDateString(),
  };
}

export function logDateRange(minDate: Date, maxDate: Date) {
  console.log('📅 Date Range:');
  console.log('  Min Selectable:', minDate.toLocaleDateString(), minDate.toISOString());
  console.log('  Max Selectable:', maxDate.toLocaleDateString(), maxDate.toISOString());
}

export function logServiceabilityRequest(payload: Record<string, any>) {
  console.log('🔍 Serviceability Request:', {
    slot_date: payload.slot_date,
    zipcode: payload.zipcode,
    lat: payload.lat,
    long: payload.long,
  });
}
