/**
 * OSRM integration stub
 * TODO: Implement OSRM routing for more accurate travel times and distances
 */

export interface OSRMRoute {
  distance: number; // meters
  duration: number; // seconds
}

export interface OSRMResponse {
  routes: OSRMRoute[];
}

/**
 * Get route from OSRM service
 * @param fromLat Source latitude
 * @param fromLng Source longitude
 * @param toLat Destination latitude
 * @param toLng Destination longitude
 * @returns Promise with OSRM route data
 */
export async function getOSRMRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<OSRMRoute> {
  // TODO: Implement actual OSRM API call
  throw new Error('OSRM integration not yet implemented');
}

/**
 * Convert OSRM distance (meters) to kilometers
 */
export function osrmDistanceToKm(distanceMeters: number): number {
  return distanceMeters / 1000;
}

/**
 * Convert OSRM duration (seconds) to minutes
 */
export function osrmDurationToMinutes(durationSeconds: number): number {
  return Math.round(durationSeconds / 60);
}
