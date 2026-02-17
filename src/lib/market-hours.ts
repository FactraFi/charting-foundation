/**
 * Check if the US stock market is currently open.
 * Market hours: 9:30 AM – 4:00 PM Eastern, Mon–Fri.
 * This is a client-side approximation (does not account for holidays).
 */
export function isMarketOpen(): boolean {
  const now = new Date();
  // Convert to Eastern Time using Intl
  const etStr = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const et = new Date(etStr);
  const day = et.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const hours = et.getHours();
  const minutes = et.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes >= 570 && totalMinutes < 960; // 9:30=570, 16:00=960
}
