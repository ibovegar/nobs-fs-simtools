// Spherical-earth navigation maths for the flight-plan profile. Pure and unit-tested.
// A sphere is accurate to well under 1% for these distances: plenty for a TOD.

export const EARTH_RADIUS_NM = 3440.065
export const FEET_PER_METRE = 3.28084
export const METRES_PER_NM = 1852

export interface LatLon {
  lat: number
  lon: number
}

const rad = (deg: number) => (deg * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

/** Central angle between two points, radians (haversine). */
function angularDistance(a: LatLon, b: LatLon): number {
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Great-circle distance in nautical miles. */
export function greatCircleNm(a: LatLon, b: LatLon): number {
  return angularDistance(a, b) * EARTH_RADIUS_NM
}

/** Initial true bearing from a to b, 0–360°. */
export function initialBearingDeg(a: LatLon, b: LatLon): number {
  const φ1 = rad(a.lat)
  const φ2 = rad(b.lat)
  const Δλ = rad(b.lon - a.lon)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (deg(Math.atan2(y, x)) + 360) % 360
}

/** The point `distanceNm` from `p` on true bearing `bearingDeg`. */
export function offsetLatLon(p: LatLon, bearingDeg: number, distanceNm: number): LatLon {
  const δ = distanceNm / EARTH_RADIUS_NM
  const θ = rad(bearingDeg)
  const φ1 = rad(p.lat)
  const λ1 = rad(p.lon)
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ))
  const λ2 =
    λ1 +
    Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2))
  return { lat: deg(φ2), lon: ((deg(λ2) + 540) % 360) - 180 }
}

/**
 * Where `p` is relative to the great circle a → b: distance along it from a (negative
 * behind a) and across it (positive right of track), both in nautical miles.
 */
export function alongTrack(p: LatLon, a: LatLon, b: LatLon): { alongNm: number; crossNm: number } {
  const δ13 = angularDistance(a, p)
  if (δ13 === 0) return { alongNm: 0, crossNm: 0 }
  const θ13 = rad(initialBearingDeg(a, p))
  const θ12 = rad(initialBearingDeg(a, b))
  const δxt = Math.asin(Math.sin(δ13) * Math.sin(θ13 - θ12))
  const δat = Math.acos(Math.max(-1, Math.min(1, Math.cos(δ13) / Math.cos(δxt))))
  const sign = Math.cos(θ13 - θ12) < 0 ? -1 : 1
  return { alongNm: sign * δat * EARTH_RADIUS_NM, crossNm: δxt * EARTH_RADIUS_NM }
}
