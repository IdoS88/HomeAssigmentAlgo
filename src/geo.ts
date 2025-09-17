export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function euclideanMinutes(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dx = lat2 - lat1;
  const dy = lng2 - lng1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const km = distance * 111; // 1 degree ≈ 111km
  const hours = km / 50; // 50km/h average
  return Math.round(hours * 60);
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
