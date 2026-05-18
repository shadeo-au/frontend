import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { demoRoutePayload, shouldUseDemoRouteFallback } from './demo-route.js'

describe('demo route fallback helpers', () => {
  it('only enables demo route fallback when explicitly configured', () => {
    assert.equal(shouldUseDemoRouteFallback({ DEV: true }), false)
    assert.equal(shouldUseDemoRouteFallback({ VITE_ENABLE_DEMO_ROUTE_FALLBACK: 'true' }), true)
    assert.equal(shouldUseDemoRouteFallback({}), false)
  })

  it('builds a route payload compatible with route recommendation parsing', () => {
    const payload = demoRoutePayload({ destinationType: 'pharmacy', preferShade: true })

    assert.equal(payload.eligible, true)
    assert.equal(payload.destinationType, 'pharmacy')
    assert.equal(payload.options.length, 1)
    assert.equal(payload.options[0].destination.name, 'Demo Pharmacy')
    assert.equal(payload.options[0].route.length > 1, true)
    assert.equal(payload.options[0].routeSummary.preferShade, true)
  })
})
