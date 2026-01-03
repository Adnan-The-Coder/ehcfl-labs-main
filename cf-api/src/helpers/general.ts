export function getIndiaDate(offsetDays = 0): string {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  // Shift to IST and then add day offset in milliseconds
  const istMs = utcMs + (330 * 60000) + (offsetDays * 86400000);
  const ist = new Date(istMs);
  // Read components from shifted date to avoid UTC conversion issues
  const year = ist.getUTCFullYear();
  const month = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const day = String(ist.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
