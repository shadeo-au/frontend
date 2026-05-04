import type { HeatSnapshot, HeatAlertLevel, DailyForecast } from './types';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

interface OMForecastResponse {
  current_weather?: {
    temperature: number;
    time: string;
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    uv_index_max: number[];
  };
}

export async function fetchHeatSnapshot(lat: number, lng: number): Promise<HeatSnapshot> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lng.toFixed(4),
    current_weather: 'true',
    daily: 'temperature_2m_max,temperature_2m_min,apparent_temperature_max,uv_index_max',
    timezone: 'Australia/Melbourne',
    forecast_days: '7',
  });

  let res: Response;
  try {
    res = await fetch(`${FORECAST_URL}?${params.toString()}`);
  } catch (err) {
    throw new HeatSnapshotError('network', err instanceof Error ? err.message : 'unknown');
  }
  if (!res.ok) {
    throw new HeatSnapshotError('http', `HTTP ${res.status}`);
  }

  const data = (await res.json()) as OMForecastResponse;

  const daily: DailyForecast[] = (data.daily?.time ?? []).map((date, i) => ({
    date,
    max: data.daily!.temperature_2m_max[i] ?? 0,
    min: data.daily!.temperature_2m_min[i] ?? 0,
    apparent_max: data.daily!.apparent_temperature_max[i] ?? 0,
    uv_max: data.daily!.uv_index_max[i] ?? 0,
  }));

  const today = daily[0];
  const max_today = today?.max ?? null;
  const apparent_max_today = today?.apparent_max ?? null;
  const uv_max_today = today?.uv_max ?? null;

  const consecutive_hot_days = countLeadingHotDays(daily, 32);
  const forecast_peak_3d = daily.slice(0, 3).reduce((m, d) => Math.max(m, d.max), 0);

  const alert_level = deriveAlertLevel(max_today, apparent_max_today, consecutive_hot_days);

  return {
    current_temp: data.current_weather?.temperature ?? null,
    max_today,
    apparent_max_today,
    uv_max_today,
    daily,
    alert_level,
    consecutive_hot_days,
    forecast_peak_3d,
  };
}

function countLeadingHotDays(daily: DailyForecast[], threshold: number): number {
  let n = 0;
  for (const d of daily) {
    if (d.max >= threshold) n++;
    else break;
  }
  return n;
}

function deriveAlertLevel(
  max: number | null,
  apparent: number | null,
  consecutive: number
): HeatAlertLevel {
  const t = Math.max(max ?? -Infinity, apparent ?? -Infinity);
  if (t >= 40 || (t >= 36 && consecutive >= 3)) return 'extreme';
  if (t >= 36 || (t >= 32 && consecutive >= 2)) return 'severe';
  if (t >= 30) return 'low';
  return 'none';
}

export class HeatSnapshotError extends Error {
  constructor(public readonly kind: 'network' | 'http', message: string) {
    super(message);
    this.name = 'HeatSnapshotError';
  }
}

export function alertLabel(level: HeatAlertLevel): string {
  switch (level) {
    case 'none': return 'No heat alert';
    case 'low': return 'Mild heat';
    case 'severe': return 'Heat alert';
    case 'extreme': return 'Extreme heat';
  }
}

export function uvBand(uv: number | null): { label: string; tone: 'sage' | 'sun' | 'peach' | 'ink' } {
  if (uv == null) return { label: 'Unknown', tone: 'ink' };
  if (uv < 3) return { label: 'Low', tone: 'sage' };
  if (uv < 6) return { label: 'Moderate', tone: 'sage' };
  if (uv < 8) return { label: 'High', tone: 'sun' };
  if (uv < 11) return { label: 'Very High', tone: 'sun' };
  return { label: 'Extreme', tone: 'peach' };
}
