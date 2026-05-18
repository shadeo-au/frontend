export const shouldUseDemoRouteFallback = (env = {}) => env.VITE_ENABLE_DEMO_ROUTE_FALLBACK === 'true'

export const demoRoutePayload = ({ destinationType = 'pharmacy', preferShade = false } = {}) => ({
  mode: 'destination_type',
  status: 'demo',
  eligible: true,
  destinationType,
  options: [
    {
      optionId: 'demo-cooler-route',
      destination: {
        name: demoDestinationName(destinationType),
        address: 'Melbourne CBD, VIC',
        lat: -37.813175,
        lng: 144.965724,
        type: destinationType,
      },
      route: [
        [144.9631, -37.8136],
        [144.9638, -37.8131],
        [144.9645, -37.8128],
        [144.965724, -37.813175],
      ],
      routeSummary: {
        walkingDistanceMeters: 325,
        elderlyWalkingDurationMinutes: 5,
        shadeCoverage: preferShade ? 0.46 : 0.26,
        preferShade,
        slopeCoverage: 1,
        averageSlopePercent: 2.1,
        maxSlopePercent: 6,
        steepDistanceMeters: 0,
      },
      facilities: [
        {
          id: 'demo-bench',
          name: 'Demo bench near route',
          type: 'bench',
          lat: -37.81335,
          lng: 144.9634,
          distanceToRouteMeters: 10,
        },
        {
          id: 'demo-fountain',
          name: 'Demo drinking fountain near route',
          type: 'drinking_fountain',
          lat: -37.81275,
          lng: 144.9648,
          distanceToRouteMeters: 14,
        },
      ],
      facilitySummary: {
        bench: 1,
        drinking_fountain: 1,
        toilet: 0,
      },
      score: preferShade ? 72 : 66,
      routeScore: preferShade ? 72 : 66,
      routeRating: 3,
      ratingLabel: preferShade ? 'Good' : 'Moderate',
      ratingReason: 'Demo route for local preview when the live route service is unavailable.',
      scoreBreakdown: {
        shade: preferShade ? 26 : 15,
        facilities: 18,
        distance: 18,
        slope: 14,
        shadeCoverage: preferShade ? 0.46 : 0.26,
        distanceMeters: 325,
        weights: {
          shade: 38,
          facilities: 27,
          distance: 20,
          slope: 15,
        },
      },
    },
  ],
})

const demoDestinationName = (destinationType) => {
  const names = {
    pharmacy: 'Demo Pharmacy',
    clinic: 'Demo Clinic',
    grocery: 'Demo Grocery',
    cafe: 'Demo Cafe',
    park: 'Demo Park',
  }
  return names[destinationType] || 'Demo Destination'
}
