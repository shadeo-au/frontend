import profiles from '@mock/area-profiles.json';
import suburbIndex from '@mock/suburb-index.json';
import coolPlacesData from '@mock/cool-places-by-suburb.json';
import type { AreaProfile, CoolPlace, SuburbIndexEntry } from './types';

const profilesMap = profiles as Record<string, AreaProfile>;
const coolPlacesMap = coolPlacesData as Record<string, CoolPlace[]>;
const suburbList = (suburbIndex as { suburbs: SuburbIndexEntry[] }).suburbs;

export function getAreaProfile(suburbKey: string): AreaProfile | null {
  return profilesMap[suburbKey] ?? null;
}

export function getCoolPlaces(suburbKey: string): CoolPlace[] {
  return coolPlacesMap[suburbKey] ?? [];
}

export function listSuburbs(): SuburbIndexEntry[] {
  return suburbList;
}

export function searchSuburbs(query: string): SuburbIndexEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return suburbList.slice(0, 6);
  return suburbList.filter((s) =>
    s.name.toLowerCase().includes(q) ||
    s.postcode.includes(q) ||
    s.key.includes(q.replace(/\s+/g, '-'))
  );
}

export function findSuburbByKey(key: string): SuburbIndexEntry | null {
  return suburbList.find((s) => s.key === key) ?? null;
}
