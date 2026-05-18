import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  DEFAULT_WEATHER_SUITABILITY_ENDPOINT,
  buildWeatherFactorCard,
  buildWeatherRequest,
  demoStartPlace,
  formatTripDateLabel,
  normaliseTripDate,
  shouldShowDemoStart,
  weatherSuitabilityEndpoint,
} from './weather-suitability.js'

describe('weather suitability helpers', () => {
  it('normalises trip date selection to today or tomorrow', () => {
    assert.equal(normaliseTripDate('tomorrow'), 'tomorrow')
    assert.equal(normaliseTripDate('today'), 'today')
    assert.equal(normaliseTripDate('later'), 'today')
    assert.equal(normaliseTripDate(undefined), 'today')
  })

  it('builds a request key and API body from trip timing and start place', () => {
    const place = {
      lat: '-37.8136',
      lng: '144.9631',
      name: 'Melbourne CBD',
    }

    const request = buildWeatherRequest('tomorrow', place)

    assert.equal(request.key, 'tomorrow:-37.8136,144.9631')
    assert.deepEqual(request.body, {
      tripDate: 'tomorrow',
      startingPoint: {
        lat: -37.8136,
        lng: 144.9631,
        label: 'Melbourne CBD',
      },
    })
  })

  it('preserves today and tomorrow as model-path inputs in the API body', () => {
    const place = {
      lat: -37.8136,
      lng: 144.9631,
      address: 'Melbourne CBD',
    }

    assert.equal(buildWeatherRequest('today', place).body.tripDate, 'today')
    assert.equal(buildWeatherRequest('tomorrow', place).body.tripDate, 'tomorrow')
  })

  it('falls back to the deployed endpoint when no env override is present', () => {
    assert.equal(weatherSuitabilityEndpoint({}), DEFAULT_WEATHER_SUITABILITY_ENDPOINT)
  })

  it('uses the Vite env endpoint override when provided', () => {
    assert.equal(
      weatherSuitabilityEndpoint({
        VITE_WEATHER_SUITABILITY_ENDPOINT: 'http://127.0.0.1:8000/api/weather-suitability',
      }),
      'http://127.0.0.1:8000/api/weather-suitability',
    )
  })

  it('only shows the demo Melbourne start option when explicitly enabled', () => {
    assert.equal(shouldShowDemoStart({ DEV: true }), false)
    assert.equal(shouldShowDemoStart({ VITE_ENABLE_DEMO_START: 'true' }), true)
    assert.equal(shouldShowDemoStart({}), false)
  })

  it('provides a supported Central Melbourne demo starting point', () => {
    assert.deepEqual(demoStartPlace(), {
      id: 'demo-melbourne-cbd',
      name: 'Melbourne CBD',
      address: 'Melbourne CBD, VIC',
      lat: -37.8136,
      lng: 144.9631,
    })
  })

  it('formats trip date semantics for weather guidance display', () => {
    assert.equal(formatTripDateLabel('today', '2026-05-16'), 'Going today · 16 May')
    assert.equal(formatTripDateLabel('tomorrow', '2026-05-16'), 'Planning for tomorrow · 16 May')
    assert.equal(formatTripDateLabel('later', 'bad-date'), 'Going today')
  })

  it('classifies weather factor cards with user-facing labels and tones', () => {
    assert.deepEqual(buildWeatherFactorCard('Recent rainfall may affect the walking experience', 0), {
      key: 'factor-0-Recent rainfall may affect the walking experience',
      label: 'Rainfall',
      icon: 'material-symbols:water-drop',
      title: 'Recent rainfall may affect the walking experience',
      tone: 'rain',
    })

    assert.deepEqual(buildWeatherFactorCard('Humidity may influence outdoor comfort', 1), {
      key: 'factor-1-Humidity may influence outdoor comfort',
      label: 'Humidity',
      icon: 'material-symbols:humidity-percentage-rounded',
      title: 'Humidity may influence outdoor comfort',
      tone: 'humidity',
    })
  })
})
