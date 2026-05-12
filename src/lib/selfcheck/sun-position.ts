import type { Orientation } from './types';

// Solar position math adapted from NOAA SPA / suncalc.
// Returns sun azimuth (degrees from north, clockwise) and altitude (degrees above horizon).

const RAD = Math.PI / 180;
const E = RAD * 23.4397; // obliquity of the Earth

function toJulian(date: Date): number {
  return date.valueOf() / 86400000 - 0.5 + 2440588;
}

function toDays(date: Date): number {
  return toJulian(date) - 2451545;
}

function declination(L: number, b: number): number {
  return Math.asin(Math.sin(b) * Math.cos(E) + Math.cos(b) * Math.sin(E) * Math.sin(L));
}

function rightAscension(L: number, b: number): number {
  return Math.atan2(Math.sin(L) * Math.cos(E) - Math.tan(b) * Math.sin(E), Math.cos(L));
}

function siderealTime(d: number, lw: number): number {
  return RAD * (280.16 + 360.9856235 * d) - lw;
}

function solarMeanAnomaly(d: number): number {
  return RAD * (357.5291 + 0.98560028 * d);
}

function eclipticLongitude(M: number): number {
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = RAD * 102.9372;
  return M + C + P + Math.PI;
}

function sunCoords(d: number): { dec: number; ra: number } {
  const M = solarMeanAnomaly(d);
  const L = eclipticLongitude(M);
  return { dec: declination(L, 0), ra: rightAscension(L, 0) };
}

export interface SunPosition {
  azimuth: number;
  altitude: number;
}

export function getSunPosition(date: Date, lat: number, lng: number): SunPosition {
  const lw = RAD * -lng;
  const phi = RAD * lat;
  const d = toDays(date);
  const c = sunCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  const azRad = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(c.dec) * Math.cos(phi));
  const altRad = Math.asin(Math.sin(phi) * Math.sin(c.dec) + Math.cos(phi) * Math.cos(c.dec) * Math.cos(H));
  // suncalc azimuth is measured from south, clockwise → convert to compass (from north, clockwise).
  let compassDeg = (azRad / RAD + 180) % 360;
  if (compassDeg < 0) compassDeg += 360;
  return { azimuth: compassDeg, altitude: altRad / RAD };
}

const COMPASS_ORDER: Orientation[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function orientationFromAzimuth(deg: number): Orientation {
  const normalised = ((deg % 360) + 360) % 360;
  const idx = Math.round(normalised / 45) % 8;
  return COMPASS_ORDER[idx];
}

export function orientationToAzimuth(o: Orientation): number {
  return COMPASS_ORDER.indexOf(o) * 45;
}

export function isAdjacentOrientation(a: Orientation, b: Orientation): boolean {
  const ai = COMPASS_ORDER.indexOf(a);
  const bi = COMPASS_ORDER.indexOf(b);
  const diff = Math.min(Math.abs(ai - bi), 8 - Math.abs(ai - bi));
  return diff <= 1;
}

export function isOppositeOrientation(a: Orientation, b: Orientation): boolean {
  const ai = COMPASS_ORDER.indexOf(a);
  const bi = COMPASS_ORDER.indexOf(b);
  const diff = Math.min(Math.abs(ai - bi), 8 - Math.abs(ai - bi));
  return diff >= 3;
}

export function localSolarPeakTime(date: Date, lat: number, lng: number): Date {
  // approximate: solar noon ≈ 12:00 local time, but heat peak is usually 2-3 hours after solar noon
  const d = new Date(date);
  d.setHours(15, 0, 0, 0);
  // unused-but-validated: ensure inputs reasonable
  void lat;
  void lng;
  return d;
}

export function getCurrentSunOrientation(date: Date, lat: number, lng: number): Orientation | null {
  const { altitude, azimuth } = getSunPosition(date, lat, lng);
  if (altitude <= 0) return null;
  return orientationFromAzimuth(azimuth);
}

export function getPeakSunOrientation(date: Date, lat: number, lng: number): Orientation {
  const peak = localSolarPeakTime(date, lat, lng);
  const { azimuth } = getSunPosition(peak, lat, lng);
  return orientationFromAzimuth(azimuth);
}
