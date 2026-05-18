export const DEFAULT_WEATHER_SUITABILITY_ENDPOINT =
  'https://d22z6whz3d.execute-api.ap-southeast-2.amazonaws.com/api/weather-suitability'

const VALID_TRIP_DATES = new Set(['today', 'tomorrow'])

export const normaliseTripDate = (value) => {
  const tripDate = String(value || '').trim().toLowerCase()
  return VALID_TRIP_DATES.has(tripDate) ? tripDate : 'today'
}

export const weatherSuitabilityEndpoint = (env = {}) => {
  const endpoint = String(env.VITE_WEATHER_SUITABILITY_ENDPOINT || '').trim()
  return endpoint || DEFAULT_WEATHER_SUITABILITY_ENDPOINT
}

export const buildWeatherRequest = (tripDate, place) => {
  const resolvedTripDate = normaliseTripDate(tripDate)
  const lat = Number(place?.lat)
  const lng = Number(place?.lng)
  const label = place?.name || place?.address || 'Selected starting point'

  return {
    key: `${resolvedTripDate}:${lat},${lng}`,
    body: {
      tripDate: resolvedTripDate,
      startingPoint: {
        lat,
        lng,
        label,
      },
    },
  }
}

export const formatTripDateLabel = (tripDate, date, locale = 'en-AU') => {
  const resolvedTripDate = normaliseTripDate(tripDate)
  const prefix = resolvedTripDate === 'tomorrow' ? 'Planning for tomorrow' : 'Going today'
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return prefix
  const formatted = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(parsed)
  return `${prefix} - ${formatted}`
}

export const buildWeatherFactorCard = (factor, index) => {
  const text = String(factor || '').trim()
  const lower = text.toLowerCase()
  let icon = 'material-symbols:info-outline-rounded'
  let label = 'Weather note'
  let tone = 'neutral'

  if (/(rain|rainfall|precip|wet|storm|drizzle)/.test(lower)) {
    icon = 'material-symbols:water-drop'
    label = 'Rainfall'
    tone = 'rain'
  } else if (/humid/.test(lower)) {
    icon = 'material-symbols:humidity-percentage-rounded'
    label = 'Humidity'
    tone = 'humidity'
  } else if (/wind/.test(lower)) {
    icon = 'material-symbols:air-rounded'
    label = 'Wind'
    tone = 'wind'
  } else if (/(temp|heat|warm|hot|cool|cold)/.test(lower)) {
    icon = 'material-symbols:device-thermostat'
    label = 'Temperature'
    tone = 'temperature'
  }

  return {
    key: `factor-${index}-${text}`,
    label,
    icon,
    title: text,
    tone,
  }
}
