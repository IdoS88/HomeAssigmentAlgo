/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate Euclidean distance between two points
 * Returns estimated travel time in minutes (rough approximation)
 */
export function euclideanMinutes(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  // Simple Euclidean distance in degrees
  const dx = lat2 - lat1;
  const dy = lng2 - lng1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Rough conversion: 1 degree ≈ 111km, assume 50km/h average speed
  const km = distance * 111;
  const hours = km / 50;
  return Math.round(hours * 60); // Convert to minutes
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
