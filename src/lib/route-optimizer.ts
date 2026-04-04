/**
 * Calculate distance in km between two lat/lng points using Haversine formula
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Estimate travel time in minutes from distance in km
 * Average speed ~60 km/h for technicians
 */
export function estimateTravelMinutes(km: number): number {
  return Math.round(km / 60 * 60); // ~60 km/h average
}

/**
 * Nearest-neighbor TSP heuristic for ordering interventions within a day.
 * Returns indices in optimized order.
 */
export function optimizeOrder<T extends { lat: number; lng: number }>(
  points: T[],
  startLat?: number,
  startLng?: number
): T[] {
  if (points.length <= 1) return [...points];

  const remaining = points.map((p, i) => ({ ...p, _origIdx: i }));
  const result: typeof remaining = [];
  let curLat = startLat ?? remaining[0].lat;
  let curLng = startLng ?? remaining[0].lng;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(curLat, curLng, remaining[i].lat, remaining[i].lng);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const chosen = remaining.splice(bestIdx, 1)[0];
    result.push(chosen);
    curLat = chosen.lat;
    curLng = chosen.lng;
  }

  return result;
}

/**
 * Calculate travel times between consecutive stops (including home -> first and last -> home)
 */
export function calculateTravelTimes(
  stops: { lat: number; lng: number }[],
  homeLat?: number,
  homeLng?: number
): { travelFromPrev: number[]; travelToFirst: number; travelFromLast: number } {
  const travelFromPrev: number[] = [];

  let travelToFirst = 0;
  let travelFromLast = 0;

  if (stops.length === 0) return { travelFromPrev, travelToFirst, travelFromLast };

  // Home to first stop
  if (homeLat != null && homeLng != null) {
    travelToFirst = estimateTravelMinutes(haversineKm(homeLat, homeLng, stops[0].lat, stops[0].lng));
  }

  // Between stops
  travelFromPrev.push(travelToFirst);
  for (let i = 1; i < stops.length; i++) {
    const km = haversineKm(stops[i - 1].lat, stops[i - 1].lng, stops[i].lat, stops[i].lng);
    travelFromPrev.push(estimateTravelMinutes(km));
  }

  // Last stop to home
  if (homeLat != null && homeLng != null) {
    travelFromLast = estimateTravelMinutes(
      haversineKm(stops[stops.length - 1].lat, stops[stops.length - 1].lng, homeLat, homeLng)
    );
  }

  return { travelFromPrev, travelToFirst, travelFromLast };
}
