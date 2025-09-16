import { haversineKm, euclideanMinutes } from './geo.js';

/**
 * OSRM integration with caching and fallback to Haversine
 */

// Cache for route metrics to avoid repeated API calls
const routeCache = new Map<string, { km: number; minutes: number }>();

/**
 * Convert [lat, lng] to [lng, lat] for OSRM API
 * OSRM expects longitude first, then latitude
 */
export function toLonLat([lat, lng]: [number, number]): [number, number] {
  return [lng, lat];
}

/**
 * Create cache key for route between two points
 */
function createCacheKey(latA: number, lngA: number, latB: number, lngB: number): string {
  // Round coordinates to avoid cache misses due to tiny differences
  const roundedA = `${Math.round(latA * 1000000)},${Math.round(lngA * 1000000)}`;
  const roundedB = `${Math.round(latB * 1000000)},${Math.round(lngB * 1000000)}`;
  return `${roundedA};${roundedB}`;
}

/**
 * Get route metrics from OSRM API with fallback to Haversine
 * @param latA Source latitude
 * @param lngA Source longitude
 * @param latB Destination latitude
 * @param lngB Destination longitude
 * @returns Object with distance in km and time in minutes
 */
export async function routeMetrics(
  latA: number,
  lngA: number,
  latB: number,
  lngB: number,
): Promise<{ km: number; minutes: number }> {
  // Check cache first
  const cacheKey = createCacheKey(latA, lngA, latB, lngB);
  const cached = routeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Convert coordinates for OSRM API (lon, lat order)
    const [lngA_osrm, latA_osrm] = toLonLat([latA, lngA]);
    const [lngB_osrm, latB_osrm] = toLonLat([latB, lngB]);

    // Build OSRM API URL
    const url = `https://router.project-osrm.org/route/v1/driving/${lngA_osrm},${latA_osrm};${lngB_osrm},${latB_osrm}?overview=false&annotations=duration,distance`;

    // Make API request
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error(`OSRM route error: ${data.message || 'No route found'}`);
    }

    const route = data.routes[0];
    const distanceMeters = route.distance;
    const durationSeconds = route.duration;

    // Convert to our units
    const km = distanceMeters / 1000;
    const minutes = Math.round(durationSeconds / 60);

    const result = { km, minutes };

    // Cache the result
    routeCache.set(cacheKey, result);

    return result;

  } catch (error) {
    console.warn(`OSRM API failed for route (${latA}, ${lngA}) -> (${latB}, ${lngB}):`, error);
    
    // Fallback to Haversine distance with 40 km/h speed estimate
    const km = haversineKm(latA, lngA, latB, lngB);
    const minutes = Math.round(km * 60 / 40); // 40 km/h = 1.5 km/minute

    const result = { km, minutes };

    // Cache the fallback result too
    routeCache.set(cacheKey, result);

    return result;
  }
}

/**
 * Travel engine function type
 */
export type TravelEngine = (latA: number, lngA: number, latB: number, lngB: number) => Promise<{ km: number; minutes: number }>;

/**
 * Create a travel engine that uses either OSRM or Haversine
 * @param options Configuration options
 * @returns Travel engine function
 */
export function createTravelEngine({ useOsrm }: { useOsrm: boolean }): TravelEngine {
  if (useOsrm) {
    return routeMetrics;
  } else {
    // Return Haversine-based engine
    return async (latA: number, lngA: number, latB: number, lngB: number) => {
      const km = haversineKm(latA, lngA, latB, lngB);
      const minutes = euclideanMinutes(latA, lngA, latB, lngB);
      return { km, minutes };
    };
  }
}

/**
 * Clear the route cache (useful for testing)
 */
export function clearRouteCache(): void {
  routeCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: routeCache.size,
    keys: Array.from(routeCache.keys()),
  };
}