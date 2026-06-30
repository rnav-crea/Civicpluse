import { Issue } from '../types';

/**
 * Haversine formula: distance between two GPS points in meters.
 */
export function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Minimum distance from a point P to a line segment AB (in meters).
 */
function pointToSegmentDistanceMeters(
  pLat: number, pLng: number,
  aLat: number, aLng: number,
  bLat: number, bLng: number
): number {
  // Convert to flat XY (good enough for short segments in a city)
  const metersPerDeg = 111320;
  const cosLat = Math.cos(((aLat + bLat) / 2) * Math.PI / 180);

  const ax = aLng * metersPerDeg * cosLat;
  const ay = aLat * metersPerDeg;
  const bx = bLng * metersPerDeg * cosLat;
  const by = bLat * metersPerDeg;
  const px = pLng * metersPerDeg * cosLat;
  const py = pLat * metersPerDeg;

  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return Math.hypot(px - ax, py - ay);

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const closestX = ax + t * dx;
  const closestY = ay + t * dy;
  return Math.hypot(px - closestX, py - closestY);
}

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface HazardOnRoute {
  issue: Issue;
  distanceFromRouteMeters: number;
  distanceAlongRouteKm: number; // Approx. km from start
}

/**
 * Find all issues within `radiusMeters` of any segment of the given polyline route.
 * Returns them sorted by position along the route (closest to start first).
 */
export function findHazardsOnRoute(
  routePoints: RoutePoint[],
  issues: Issue[],
  radiusMeters: number = 300
): HazardOnRoute[] {
  if (routePoints.length < 2) return [];

  const hazards: HazardOnRoute[] = [];
  const alreadyAdded = new Set<string>();

  // Precompute cumulative distances along route
  const cumDist: number[] = [0];
  for (let i = 1; i < routePoints.length; i++) {
    cumDist.push(
      cumDist[i - 1] +
        haversineMeters(
          routePoints[i - 1].lat, routePoints[i - 1].lng,
          routePoints[i].lat, routePoints[i].lng
        )
    );
  }
  const totalRouteMeters = cumDist[cumDist.length - 1];

  for (const issue of issues) {
    if (issue.status === 'RESOLVED') continue; // Skip resolved issues
    if (alreadyAdded.has(issue.id)) continue;

    let minDist = Infinity;
    let closestSegmentFrac = 0;
    let closestSegmentCumDist = 0;

    for (let i = 0; i < routePoints.length - 1; i++) {
      const dist = pointToSegmentDistanceMeters(
        issue.location.lat, issue.location.lng,
        routePoints[i].lat, routePoints[i].lng,
        routePoints[i + 1].lat, routePoints[i + 1].lng
      );

      if (dist < minDist) {
        minDist = dist;
        // Find approx fraction along segment for distance calculation
        const segLen = haversineMeters(
          routePoints[i].lat, routePoints[i].lng,
          routePoints[i + 1].lat, routePoints[i + 1].lng
        );
        closestSegmentFrac = segLen > 0 ? Math.min(1, (cumDist[i] + segLen * 0.5) / totalRouteMeters) : 0;
        closestSegmentCumDist = cumDist[i];
      }
    }

    if (minDist <= radiusMeters) {
      hazards.push({
        issue,
        distanceFromRouteMeters: Math.round(minDist),
        distanceAlongRouteKm: parseFloat((closestSegmentCumDist / 1000).toFixed(1))
      });
      alreadyAdded.add(issue.id);
    }
  }

  // Sort by position along route (closest to start first)
  return hazards.sort((a, b) => a.distanceAlongRouteKm - b.distanceAlongRouteKm);
}

/**
 * Compute a safety score 0-100 based on the hazards detected.
 * More hazards + higher severity = lower score.
 */
export function computeSafetyScore(hazards: HazardOnRoute[]): number {
  if (hazards.length === 0) return 100;
  const totalPenalty = hazards.reduce((sum, h) => sum + h.issue.severity * 5, 0);
  return Math.max(0, Math.min(100, 100 - totalPenalty));
}

/**
 * Generate a straight-line polyline between two points with intermediate samples.
 * Used as a fallback when no real Directions API route is available.
 */
export function generateStraightLineRoute(
  startLat: number, startLng: number,
  endLat: number, endLng: number,
  steps: number = 50
): RoutePoint[] {
  const points: RoutePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({
      lat: startLat + t * (endLat - startLat),
      lng: startLng + t * (endLng - startLng)
    });
  }
  return points;
}

/**
 * Named landmark quick-select locations for the demo (Visakhapatnam focus).
 */
export const DEMO_LOCATIONS: Record<string, RoutePoint> = {
  'MVP Colony Market': { lat: 17.6960, lng: 83.2120 },
  'Beach Road Bus Stop': { lat: 17.6840, lng: 83.2260 },
  'MG Road, Prema Hospital': { lat: 17.6885, lng: 83.2195 },
  'Park Street Crossroad': { lat: 17.6920, lng: 83.2240 },
  'Gajuwaka Main Road': { lat: 17.6790, lng: 83.2080 },
  'Visakhapatnam Railway Station': { lat: 17.7139, lng: 83.2989 },
  'VUDA Park': { lat: 17.7025, lng: 83.3225 },
  'Rushikonda Beach': { lat: 17.7644, lng: 83.3704 },
};
