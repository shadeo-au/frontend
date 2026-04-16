<template>
  <main class="route-planner-page" :class="{ 'is-route-view': isRouteView }">
    <div class="planner-scene" aria-hidden="true"></div>
    <div class="planner-scene-overlay" aria-hidden="true"></div>

    <div
      v-if="showPlannerIntro"
      class="planner-intro-backdrop"
      role="presentation"
      @click.self="showPlannerIntro = false"
    >
      <section
        class="planner-intro-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="planner-intro-title"
      >
        <button class="planner-intro-close" type="button" aria-label="Close planner introduction" @click="showPlannerIntro = false">
          ×
        </button>
        <p class="planner-intro-kicker">WELCOME TO GREENPATH</p>
        <h2 id="planner-intro-title">GreenPath supports safer everyday travel for older adults.</h2>
        <p class="planner-intro-copy">
          This planner is designed to help older adults make comfortable and confident daily trips, not just the shortest ones.
        </p>

        <ol class="planner-intro-points">
          <li>Choose the type of destination you want to visit.</li>
          <li>
            We will recommend one <strong class="planner-intro-highlight">unique</strong> destination.
            Distance is not our only priority. We also consider comfort, cooler walking conditions,
            nearby rest facilities, and access to public toilets.
          </li>
        </ol>

        <p class="planner-intro-warning">
          GreenPath currently supports Central Melbourne only: CBD, Docklands, Southbank, Kensington,
          North Melbourne, West Melbourne, East Melbourne, Parkville, Carlton, and South Yarra.
        </p>

        <button class="btn btn-primary planner-intro-action" type="button" @click="showPlannerIntro = false">
          Start Planning
        </button>
      </section>
    </div>

    <section class="planner-shell" v-if="!isRouteView">
      <!-- ── Step 1: Starting point ──────────────────────────── -->
      <article class="planner-card planner-step-card" :class="{ 'step-confirmed': hasStartLocation }">
        <div class="planner-step-badge">
          <span class="planner-step-num">1</span> Starting Point
        </div>

        <!-- Confirmed state -->
        <div v-if="hasStartLocation" class="planner-confirmed-row">
          <span class="planner-confirmed-check">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
          <div class="planner-confirmed-info">
            <strong>{{ locationLabel }}</strong>
            <small>{{ locationMeta }}</small>
          </div>
          <button class="planner-confirmed-change-btn" type="button" @click="changeLocation" :disabled="isLoadingPlan">
            Change
          </button>
        </div>

        <!-- Selection state -->
        <template v-else>
          <h1 class="planner-step-title">Where are you starting from?</h1>
          <p class="planner-step-desc">Choose your starting point to unlock nearby route options.</p>
          <div class="planner-loc-options">
            <button
              class="planner-loc-opt"
              :class="{ 'is-loading': isLocating }"
              @click="useMyLocation"
              :disabled="isLocating || isLoadingPlan"
            >
              <span class="planner-loc-opt-icon planner-loc-opt-icon--gps">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M4.22 4.22l2.83 2.83m9.9 9.9 2.83 2.83M2 12h4m12 0h4M4.22 19.78l2.83-2.83m9.9-9.9 2.83-2.83"/></svg>
              </span>
              <span class="planner-loc-opt-body">
                <strong>{{ isLocating ? 'Detecting location…' : 'Use my current location' }}</strong>
                <small>Automatically detect via GPS</small>
              </span>
            </button>
            <button
              class="planner-loc-opt planner-loc-opt--map"
              @click="openMapPicker"
              :disabled="isLoadingPlan || isLocating"
            >
              <span class="planner-loc-opt-icon planner-loc-opt-icon--map">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
              </span>
              <span class="planner-loc-opt-body">
                <strong>Pick a point on the map</strong>
                <small>Drop a pin in Central Melbourne</small>
              </span>
            </button>
          </div>
          <p v-if="errorMessage" class="planner-loc-error-msg">{{ errorMessage }}</p>
        </template>
      </article>

      <article v-if="isPickingOnMap" class="planner-card planner-map-picker-card" ref="pickerCardEl">
        <div class="planner-map-picker-head">
          <div>
            <p class="planner-map-picker-kicker">MAP PICKER</p>
            <h2>Select a starting point in Central Melbourne</h2>
          </div>
          <button class="planner-map-picker-close" type="button" @click="cancelMapPicker">Close</button>
        </div>

        <p class="planner-map-picker-copy">
          The map is focused on the supported area so you can quickly drop a starting point inside Central Melbourne.
        </p>

        <div class="planner-map-picker-frame">
          <div ref="pickerMapEl" class="planner-picker-map"></div>
        </div>

        <p class="planner-map-picker-range">
          Supported area: CBD, Docklands, Southbank, Kensington, North Melbourne, West Melbourne,
          East Melbourne, Parkville, Carlton, and South Yarra.
        </p>

        <p v-if="pickerMessage" class="planner-map-picker-message">{{ pickerMessage }}</p>

        <div class="planner-map-picker-actions">
          <button class="btn planner-change-btn" type="button" @click="cancelMapPicker">Cancel</button>
          <button class="btn btn-primary planner-confirm-pick-btn" type="button" @click="confirmMapLocation" :disabled="!pendingMapLocation">
            Use selected point
          </button>
        </div>
      </article>

      <!-- ── Step 2: Destination type (unlocked after location set) ── -->
      <article v-if="hasStartLocation" class="planner-card planner-step-card planner-step-type" ref="typeSectionEl">
        <div class="planner-step-badge planner-step-badge--two">
          <span class="planner-step-num">2</span> Destination Type
        </div>
        <h2 class="planner-step-title">Where would you like to go?</h2>
        <p class="planner-step-desc">Pick a category and we'll find the best match for your journey.</p>
        <div class="planner-type-grid">
          <button
            v-for="item in destinationTypes"
            :key="item.id"
            class="planner-type-card"
            :class="{ active: selectedType === item.id }"
            :disabled="isLoadingPlan || isLocating"
            @click="selectedType = item.id"
          >
            <span class="planner-type-icon" aria-hidden="true">
              <img :src="item.icon" alt="" />
            </span>
            <span class="planner-type-name">{{ item.label }}</span>
          </button>
        </div>
      </article>

      <section v-if="hasStartLocation" class="planner-result-anchor" ref="resultAnchorEl">
        <article v-if="hasSelectedType && isLoadingPlan" class="planner-card planner-result-loading-card">
          <span class="planner-spinner" aria-hidden="true"></span>
          <h3>Finding your best route…</h3>
          <p>We're searching for an ideal destination and planning a comfortable journey for you.</p>
        </article>

        <article v-else-if="hasSelectedType && hasDestination" class="planner-card planner-result-card">
          <figure class="planner-result-image-wrap">
            <img :src="resultImage" :alt="`${selectedTypeLabel} route preview`" loading="lazy" />
            <figcaption>Top pick for accessibility</figcaption>
          </figure>

          <div class="planner-result-content">
            <h3>{{ result.destination.name }}</h3>

            <div class="planner-metric-row">
              <span class="planner-metric-chip">
                <img :src="walkIcon" alt="" aria-hidden="true" />
                <strong>{{ distanceMetric.value }}</strong>
                <em>{{ distanceMetric.unit }}</em>
                <small>away</small>
              </span>
              <span class="planner-metric-chip">
                <img :src="timeIcon" alt="" aria-hidden="true" />
                <strong>{{ walkMetric.value }}</strong>
                <em>{{ walkMetric.unit }}</em>
                <small>walk</small>
              </span>
            </div>

            <div class="planner-feature-grid">
              <div class="planner-feature-item">
                <img :src="benchIcon" alt="" />
                <p>{{ facilityBreakdown.bench }} places to rest</p>
              </div>
              <div class="planner-feature-item">
                <img :src="toiletIcon" alt="" />
                <p>{{ facilityBreakdown.toilet }} public toilets nearby</p>
              </div>
              <div class="planner-feature-item">
                <img :src="slopeIcon" alt="" />
                <p>{{ slopeSummary }}</p>
              </div>
              <div class="planner-feature-item">
                <img :src="treesIcon" alt="" />
                <p>{{ shadeSummary }}</p>
              </div>
            </div>

            <div class="planner-summary-actions">
              <button class="btn btn-primary planner-see-route-btn" @click="openRouteView" :disabled="!canSeeRoute || isLoadingPlan">
                See route
              </button>
              <button class="btn planner-change-btn" @click="clearDestinationChoice" :disabled="isLoadingPlan || isLocating">
                Change destination
              </button>
            </div>
          </div>
        </article>

        <article
          v-else-if="hasSelectedType && hasSearched && !isLoadingPlan && !hasDestination && !errorMessage"
          class="planner-card planner-no-result-card"
        >
          <h3>No nearby {{ selectedTypeLabel.toLowerCase() }} found</h3>
          <p>We could not find a suitable destination near this location. Try another type or update your location.</p>
          <div class="planner-summary-actions">
            <button class="btn planner-change-btn" @click="clearDestinationChoice">Try another type</button>
            <button class="btn btn-light planner-location-btn" @click="useMyLocation" :disabled="isLocating">
              {{ isLocating ? 'Locating...' : 'Update my location' }}
            </button>
          </div>
        </article>

        <article v-else-if="hasSelectedType && hasSearched && !isLoadingPlan && !!errorMessage" class="planner-card planner-no-result-card">
          <h3>Service temporarily unavailable</h3>
          <p>{{ errorMessage }}</p>
          <div class="planner-summary-actions">
            <button class="btn planner-change-btn" @click="requestPlan">Try again</button>
            <button class="btn btn-light planner-location-btn" @click="useMyLocation" :disabled="isLocating">
              {{ isLocating ? 'Locating...' : 'Update my location' }}
            </button>
          </div>
        </article>
      </section>
    </section>

    <section class="planner-route-shell" v-else>
      <aside class="planner-route-panel rv-panel">
        <button class="planner-back-btn rv-back-btn" @click="isRouteView = false">← Back to search</button>

        <div class="rv-dest-header">
          <div class="rv-dest-icon-wrap">
            <img :src="selectedTypeIconUrl" alt="" />
          </div>
          <div class="rv-dest-info">
            <p class="rv-dest-type-label">{{ selectedTypeLabel }}</p>
            <h2 class="rv-dest-name">{{ result.destination?.name }}</h2>
          </div>
        </div>

        <div class="rv-stats-row">
          <div class="rv-stat-card">
            <div class="rv-stat-main">
              <strong>{{ walkMinutes }}</strong>
              <strong>MIN</strong>
            </div>
            <span>Walking time</span>
          </div>
          <div class="rv-stat-card">
            <div class="rv-stat-main">
              <strong>{{ distanceMetric.value }}</strong>
              <strong>{{ distanceMetric.unit.toUpperCase() }}</strong>
            </div>
            <span>Distance away</span>
          </div>
        </div>

        <div class="rv-section">
          <h3>Along the way</h3>
          <div class="rv-fac-grid">
            <div class="rv-fac-card rv-fac-bench" v-if="facilityBreakdown.bench > 0">
              <img :src="benchIcon" alt="" />
              <div>
                <strong>{{ facilityBreakdown.bench }}</strong>
                <span>Benches</span>
              </div>
            </div>
            <div class="rv-fac-card rv-fac-toilet" v-if="facilityBreakdown.toilet > 0">
              <img :src="toiletIcon" alt="" />
              <div>
                <strong>{{ facilityBreakdown.toilet }}</strong>
                <span>Toilets</span>
              </div>
            </div>
            <div class="rv-fac-card rv-fac-fountain" v-if="facilityBreakdown.drinking_fountain > 0">
              <img :src="fountainIcon" alt="" />
              <div>
                <strong>{{ facilityBreakdown.drinking_fountain }}</strong>
                <span>Fountains</span>
              </div>
            </div>
            <div
              v-if="facilityBreakdown.bench === 0 && facilityBreakdown.toilet === 0 && facilityBreakdown.drinking_fountain === 0"
              class="rv-no-facilities"
            >
              No rest stops available along this route
            </div>
          </div>
        </div>

        <div class="rv-section rv-legend-section">
          <h3>Map legend</h3>
          <div class="rv-legend-list">
            <div class="rv-legend-row">
              <div class="rv-legend-icon rv-licon-start">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="4" r="2.5"/><path d="M10 8.5c-1.1 0-2 .9-2 2v4h2v5h4v-5h2v-4c0-1.1-.9-2-2-2h-4z"/></svg>
              </div>
              You (start)
            </div>
            <div class="rv-legend-row">
              <div class="rv-legend-icon rv-licon-dest">
                <img :src="selectedTypeIconUrl" width="15" height="15" style="filter:invert(1)" />
              </div>
              Destination
            </div>
            <div class="rv-legend-row">
              <div class="rv-legend-icon rv-licon-bench">
                <img :src="benchIcon" width="15" height="15" style="filter:invert(1)" />
              </div>
              Bench
            </div>
            <div class="rv-legend-row">
              <div class="rv-legend-icon rv-licon-toilet">
                <img :src="toiletIcon" width="15" height="15" style="filter:invert(1)" />
              </div>
              Toilet
            </div>
            <div class="rv-legend-row">
              <div class="rv-legend-icon rv-licon-fountain">
                <img :src="fountainIcon" width="15" height="15" style="filter:invert(1)" />
              </div>
              Drinking Fountain
            </div>
            <div class="rv-legend-row">
              <span class="rv-ldot rv-ldot-route"></span>
              Walking route
            </div>
            <div class="rv-legend-row">
              <span class="rv-ldot rv-ldot-shade"></span>
              Tree canopy shade
            </div>
          </div>
        </div>

      </aside>

      <section class="planner-route-map-area">
        <div v-if="isLoadingPlan" class="planner-map-loading" role="status" aria-live="polite">
          <span class="planner-spinner" aria-hidden="true"></span>
          <p>Loading route map...</p>
        </div>
        <div ref="mapEl" class="planner-route-map"></div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import pharmacyPic from '../assets/pictures/pharmacy.png'
import groceryPic from '../assets/pictures/grocery.png'
import clinicPic from '../assets/pictures/clinic.png'
import parkPic from '../assets/pictures/park.png'
import cafePic from '../assets/pictures/cafe.png'
import pharmacyIcon from '../assets/svg/pharmacy.svg'
import groceryIcon from '../assets/svg/grocery.svg'
import clinicIcon from '../assets/svg/clinic.svg'
import parkIcon from '../assets/svg/park.svg'
import cafeIcon from '../assets/svg/break-cafe.svg'
import benchIcon from '../assets/svg/bench-icon.svg'
import toiletIcon from '../assets/svg/toilet-icon.svg'
import fountainIcon from '../assets/svg/drinking-fountain-icon.svg'
import slopeIcon from '../assets/svg/slope-icon.svg'
import treesIcon from '../assets/svg/trees-icon.svg'
import walkIcon from '../assets/svg/walk.svg'
import timeIcon from '../assets/svg/time-icon.svg'

const DEFAULT_LOCATION = { lat: -37.8136, lng: 144.9631 }
const SUPPORTED_AREA_BOUNDS = [
  [-37.848, 144.89],
  [-37.77, 145.02]
]
const DEFAULT_API_BASE_URL = 'https://g5m02vygkj.execute-api.ap-southeast-2.amazonaws.com'
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
const API_BASE_URL = configuredApiBaseUrl.replace(/\/+$/, '')

const destinationTypes = [
  { id: 'pharmacy', label: 'Pharmacy', icon: pharmacyIcon, image: pharmacyPic },
  { id: 'grocery', label: 'Grocery', icon: groceryIcon, image: groceryPic },
  { id: 'clinic', label: 'Clinic', icon: clinicIcon, image: clinicPic },
  { id: 'garden', label: 'Park', icon: parkIcon, image: parkPic },
  { id: 'cafe', label: 'Cafe', icon: cafeIcon, image: cafePic }
]

const selectedType = ref('')
const isLoadingPlan = ref(false)
const isLocating = ref(false)
const isRouteView = ref(false)
const hasSearched = ref(false)
const showPlannerIntro = ref(true)
const isPickingOnMap = ref(false)
const pendingMapLocation = ref(null)
const pickerMessage = ref('')

const userLocation = reactive({
  lat: null,
  lng: null,
  source: 'unset'
})

const result = reactive({
  destination: null,
  facilities: [],
  route: []
})

const errorMessage = ref('')
const infoMessage = ref('')
const resultAnchorEl = ref(null)
const typeSectionEl = ref(null)
const pickerCardEl = ref(null)

const mapEl = ref(null)
const pickerMapEl = ref(null)
let map = null
let userLayer = null
let destinationLayer = null
let facilitiesLayer = null
let routeLayer = null
let pickerMap = null
let pickerSelectionLayer = null
let pickerBoundsLayer = null
let activeRequestId = 0

const hasStartLocation = computed(() => Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lng) && userLocation.source !== 'unset')
const hasSelectedType = computed(() => !!selectedType.value)
const hasDestination = computed(() => !!result.destination)

const selectedTypeLabel = computed(() => {
  const item = destinationTypes.find((d) => d.id === selectedType.value)
  return item ? item.label : 'Destination'
})

const locationLabel = computed(() => {
  if (userLocation.source === 'live') return 'Current location selected'
  if (userLocation.source === 'map') return 'Map point selected'
  return 'Starting point not set'
})

const locationMeta = computed(() => {
  if (!hasStartLocation.value) return 'Choose your location to begin.'
  if (userLocation.source === 'live') return 'Detected from your device.'
  return `Pinned at ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
})

const resultImage = computed(() => {
  const match = destinationTypes.find((item) => item.id === selectedType.value)
  return match?.image || parkPic
})

const routeDistanceMeters = computed(() => {
  if (result.route.length > 1) {
    let total = 0
    for (let i = 1; i < result.route.length; i += 1) {
      const [lng1, lat1] = result.route[i - 1]
      const [lng2, lat2] = result.route[i]
      total += haversineMeters(lat1, lng1, lat2, lng2)
    }
    return Math.round(total)
  }
  return result.destination?.distanceMeters || 0
})

const distanceText = computed(() => {
  const meters = routeDistanceMeters.value
  if (!meters) return 'Distance unavailable'
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`
  return `${meters} m`
})

const distanceMetric = computed(() => {
  const meters = routeDistanceMeters.value
  if (!meters) return { value: '--', unit: 'm' }
  if (meters >= 1000) return { value: (meters / 1000).toFixed(2), unit: 'km' }
  return { value: `${meters}`, unit: 'm' }
})

const walkMinutes = computed(() => {
  const meters = routeDistanceMeters.value
  if (!meters) return '--'
  return Math.max(1, Math.round(meters / 78))
})

const walkMetric = computed(() => ({
  value: `${walkMinutes.value}`,
  unit: 'min'
}))

const facilityBreakdown = computed(() => {
  const output = { bench: 0, drinking_fountain: 0, toilet: 0 }
  result.facilities.forEach((item) => {
    if (output[item.type] !== undefined) output[item.type] += 1
  })
  return output
})

const slopeSummary = computed(() => {
  if (!routeDistanceMeters.value) return 'Slope profile unavailable'
  if (routeDistanceMeters.value <= 1000) return 'Mostly flat and easy'
  return 'Gentle slopes likely'
})

const shadeSummary = computed(() => {
  if (selectedType.value === 'garden') return 'Shaded for most of the way'
  if (routeDistanceMeters.value && routeDistanceMeters.value <= 900) return 'Good shade in key sections'
  return 'Some shaded stretches along the route'
})

const canSeeRoute = computed(() => !!result.destination && result.route.length > 1)

const selectedTypeIconUrl = computed(() => {
  const match = destinationTypes.find(d => d.id === selectedType.value)
  return match?.icon || parkIcon
})

const scrollTo = (el) => {
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const clearResult = () => {
  result.destination = null
  result.facilities = []
  result.route = []
}

const setStartLocation = (lat, lng, source) => {
  userLocation.lat = lat
  userLocation.lng = lng
  userLocation.source = source
  errorMessage.value = ''
  pickerMessage.value = ''
}

const ensureSupportedPoint = (latlng) => {
  const bounds = L.latLngBounds(SUPPORTED_AREA_BOUNDS)
  return bounds.contains(latlng)
}

const updatePickerMarker = (latlng) => {
  if (!pickerMap || !pickerSelectionLayer) return
  pickerSelectionLayer.clearLayers()
  L.circleMarker(latlng, {
    radius: 10,
    color: '#124f24',
    weight: 3,
    fillColor: '#7fc96a',
    fillOpacity: 0.95
  }).addTo(pickerSelectionLayer)
}

const handlePickerMapClick = (event) => {
  if (!ensureSupportedPoint(event.latlng)) {
    pickerMessage.value = 'Please choose a point inside the supported Central Melbourne area.'
    return
  }

  pendingMapLocation.value = {
    lat: event.latlng.lat,
    lng: event.latlng.lng
  }
  pickerMessage.value = 'Point selected. Confirm to continue.'
  updatePickerMarker(event.latlng)
}

const ensurePickerMap = () => {
  if (pickerMap || !pickerMapEl.value) return

  pickerMap = L.map(pickerMapEl.value, { zoomControl: true, scrollWheelZoom: true, attributionControl: true })
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(pickerMap)

  pickerBoundsLayer = L.layerGroup().addTo(pickerMap)
  pickerSelectionLayer = L.layerGroup().addTo(pickerMap)

  L.rectangle(SUPPORTED_AREA_BOUNDS, {
    color: '#2f7f4a',
    weight: 2,
    fillColor: '#8fcb9d',
    fillOpacity: 0.14,
    dashArray: '8 8'
  }).addTo(pickerBoundsLayer)

  pickerMap.on('click', handlePickerMapClick)
  pickerMap.fitBounds(SUPPORTED_AREA_BOUNDS, { padding: [24, 24] })
}

const destroyPickerMap = () => {
  if (!pickerMap) return
  pickerMap.off('click', handlePickerMapClick)
  pickerMap.remove()
  pickerMap = null
  pickerSelectionLayer = null
  pickerBoundsLayer = null
}

const openMapPicker = async () => {
  isPickingOnMap.value = true
  pickerMessage.value = ''

  if (userLocation.source === 'map' && hasStartLocation.value) {
    pendingMapLocation.value = { lat: userLocation.lat, lng: userLocation.lng }
  } else {
    pendingMapLocation.value = null
  }

  await nextTick()
  ensurePickerMap()
  pickerMap?.fitBounds(SUPPORTED_AREA_BOUNDS, { padding: [24, 24] })

  if (pendingMapLocation.value) {
    const latlng = L.latLng(pendingMapLocation.value.lat, pendingMapLocation.value.lng)
    updatePickerMarker(latlng)
    pickerMap?.panTo(latlng)
  }

  scrollTo(pickerCardEl.value)
}

const cancelMapPicker = () => {
  isPickingOnMap.value = false
  pendingMapLocation.value = null
  pickerMessage.value = ''
}

const confirmMapLocation = async () => {
  if (!pendingMapLocation.value) return
  setStartLocation(pendingMapLocation.value.lat, pendingMapLocation.value.lng, 'map')
  isPickingOnMap.value = false

  if (hasSelectedType.value) {
    await requestPlan()
  }

  await nextTick()
  scrollTo(typeSectionEl.value)
}

const toFiniteNumber = (value, fallback = null) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeRoutePoint = (point) => {
  if (!Array.isArray(point) || point.length < 2) return null
  const lng = toFiniteNumber(point[0])
  const lat = toFiniteNumber(point[1])
  return lng == null || lat == null ? null : [lng, lat]
}

const normalizeDestination = (destination) => {
  if (!destination || typeof destination !== 'object') return null
  return {
    ...destination,
    lat: toFiniteNumber(destination.lat),
    lng: toFiniteNumber(destination.lng),
    distanceMeters: toFiniteNumber(destination.distanceMeters, 0)
  }
}

const normalizeFacilities = (facilities) => {
  if (!Array.isArray(facilities)) return []
  return facilities
    .filter((facility) => facility && typeof facility === 'object')
    .map((facility) => ({
      ...facility,
      lat: toFiniteNumber(facility.lat),
      lng: toFiniteNumber(facility.lng),
      distanceMeters: toFiniteNumber(facility.distanceMeters, 0),
      conditionRating: toFiniteNumber(facility.conditionRating)
    }))
}

const normalizePlanResponse = (payload) => {
  const normalizedRoute = Array.isArray(payload?.route)
    ? payload.route.map(normalizeRoutePoint).filter(Boolean)
    : []

  return {
    destination: normalizeDestination(payload?.destination),
    route: normalizedRoute,
    facilities: normalizeFacilities(payload?.facilities),
    message: typeof payload?.message === 'string' ? payload.message : ''
  }
}

const fetchJson = async (url, options = {}, timeoutMs = 20000) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`)
    return payload
  } finally {
    clearTimeout(timer)
  }
}

const requestPlan = async () => {
  if (!selectedType.value || !hasStartLocation.value) return

  const requestId = ++activeRequestId
  const requestType = selectedType.value
  const requestLat = Number.isFinite(Number(userLocation.lat)) ? Number(userLocation.lat) : DEFAULT_LOCATION.lat
  const requestLng = Number.isFinite(Number(userLocation.lng)) ? Number(userLocation.lng) : DEFAULT_LOCATION.lng
  const maxAttempts = 1

  hasSearched.value = true
  isLoadingPlan.value = true
  errorMessage.value = ''
  infoMessage.value = ''
  clearResult()

  try {
    let payload = null
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      payload = await fetchJson(`${API_BASE_URL}/api/route/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: requestType,
          userLat: requestLat,
          userLng: requestLng
        })
      })
      // retry if destination found but route is empty (e.g. ORS cold-start failure)
      const normalizedPayload = normalizePlanResponse(payload)
      payload = normalizedPayload
      const routeReady = normalizedPayload.destination && normalizedPayload.route.length > 1
      if (routeReady || !payload?.destination || attempt === maxAttempts) break
      await new Promise((resolve) => setTimeout(resolve, 800))
    }

    if (requestId !== activeRequestId) return

    result.destination = payload?.destination || null
    result.facilities = payload?.facilities || []
    result.route = payload?.route || []
    infoMessage.value = payload?.message || 'Route recommendation is ready.'

    if (isRouteView.value) drawRouteMap()
  } catch (error) {
    if (requestId !== activeRequestId) return
    clearResult()
    errorMessage.value = 'The route planning service is currently busy. Please try again shortly.'
  } finally {
    if (requestId !== activeRequestId) return
    isLoadingPlan.value = false
  }
}

const useMyLocation = async () => {
  if (!navigator.geolocation) {
    errorMessage.value = 'Geolocation is unavailable on this device. Please choose a point on the map instead.'
    return
  }

  isLocating.value = true
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      })
    })
    const nextPoint = L.latLng(position.coords.latitude, position.coords.longitude)
    if (!ensureSupportedPoint(nextPoint)) {
      errorMessage.value = 'Your current location is outside the supported Central Melbourne area. Please choose a point on the map.'
      return
    }
    setStartLocation(nextPoint.lat, nextPoint.lng, 'live')
  } catch {
    errorMessage.value = 'Could not detect your location. Please choose a point on the map.'
  } finally {
    isLocating.value = false
  }

  if (hasSelectedType.value && hasStartLocation.value) requestPlan()
}

const clearDestinationChoice = () => {
  activeRequestId += 1
  selectedType.value = ''
  errorMessage.value = ''
  infoMessage.value = ''
  hasSearched.value = false
  isRouteView.value = false
  clearResult()
  nextTick(() => scrollTo(typeSectionEl.value))
}

const changeLocation = () => {
  activeRequestId += 1
  userLocation.lat = null
  userLocation.lng = null
  userLocation.source = 'unset'
  selectedType.value = ''
  errorMessage.value = ''
  infoMessage.value = ''
  hasSearched.value = false
  isRouteView.value = false
  clearResult()
}

const haversineMeters = (lat1, lng1, lat2, lng2) => {
  const toRad = (value) => (value * Math.PI) / 180
  const earth = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const calcBearing = ([lat1, lng1], [lat2, lng2]) => {
  const toRad = v => v * Math.PI / 180
  const dLng = toRad(lng2 - lng1)
  const y = Math.sin(dLng) * Math.cos(toRad(lat2))
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

const ensureMap = () => {
  if (map || !mapEl.value) return
  map = L.map(mapEl.value, { zoomControl: false }).setView([userLocation.lat, userLocation.lng], 15)

  // CartoDB Positron – clean minimal basemap
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map)

  L.control.zoom({ position: 'bottomright' }).addTo(map)

  userLayer = L.layerGroup().addTo(map)
  destinationLayer = L.layerGroup().addTo(map)
  facilitiesLayer = L.layerGroup().addTo(map)
  routeLayer = L.layerGroup().addTo(map)
}

const makePinIcon = (html, size, anchor) =>
  L.divIcon({ html, className: '', iconSize: size, iconAnchor: anchor })

const drawRouteMap = () => {
  if (!map) return

  userLayer.clearLayers()
  destinationLayer.clearLayers()
  facilitiesLayer.clearLayers()
  routeLayer.clearLayers()

  const bounds = []

  // ── Route: solid base + animated dashes + direction arrows ─────────
  if (result.route.length > 1) {
    const line = result.route.map(([lng, lat]) => [lat, lng])

    // Solid semi-transparent base
    L.polyline(line, {
      color: '#1b5e20', weight: 7, opacity: 0.22,
      lineCap: 'round', lineJoin: 'round'
    }).addTo(routeLayer)

    // Animated dashed overlay
    const animLine = L.polyline(line, {
      color: '#2e7d32', weight: 5, opacity: 0.95,
      dashArray: '18 13', lineCap: 'round', lineJoin: 'round'
    }).addTo(routeLayer)
    setTimeout(() => {
      const el = animLine.getElement()
      if (el) el.classList.add('rv-route-animated')
    }, 80)

    bounds.push(...line)
  }

  // ── Start marker ─────────────────────────────────────
  const startHtml =
    `<div class="rv-pin-start">` +
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="white">` +
    `<circle cx="12" cy="4" r="2.5"/>` +
    `<path d="M10 8.5c-1.1 0-2 .9-2 2v4h2v5h4v-5h2v-4c0-1.1-.9-2-2-2h-4z"/>` +
    `</svg></div>` +
    `<div class="rv-pin-label rv-pin-label-start">You</div>`
  L.marker([userLocation.lat, userLocation.lng], {
    icon: makePinIcon(startHtml, [44, 54], [22, 48])
  }).addTo(userLayer)
  bounds.push([userLocation.lat, userLocation.lng])

  // ── Destination marker ─────────────────────────────────
  if (result.destination?.lat != null && result.destination?.lng != null) {
    const destHtml =
      `<div class="rv-pin-dest">` +
      `<img src="${selectedTypeIconUrl.value}" width="22" height="22" style="filter:invert(1)"/>` +
      `</div>` +
      `<div class="rv-pin-label rv-pin-label-dest">${selectedTypeLabel.value}</div>`
    L.marker([result.destination.lat, result.destination.lng], {
      icon: makePinIcon(destHtml, [56, 62], [28, 56])
    }).addTo(destinationLayer)
    bounds.push([result.destination.lat, result.destination.lng])
  }

  // ── Facility markers ──────────────────────────────────
  result.facilities.forEach((item) => {
    if (item.lat == null || item.lng == null) return
    let html = ''
    if (item.type === 'bench') {
      html =
        `<div class="rv-pin-fac rv-pin-bench">` +
        `<img src="${benchIcon}" width="14" height="14" style="filter:invert(1)"/></div>`
    } else if (item.type === 'toilet') {
      html =
        `<div class="rv-pin-fac rv-pin-toilet">` +
        `<img src="${toiletIcon}" width="14" height="14" style="filter:invert(1)"/></div>`
    } else if (item.type === 'drinking_fountain') {
      html =
        `<div class="rv-pin-fac rv-pin-fountain">` +
        `<img src="${fountainIcon}" width="14" height="14" style="filter:invert(1)"/></div>`
    }
    if (html) {
      L.marker([item.lat, item.lng], {
        icon: makePinIcon(html, [28, 28], [14, 14])
      }).bindTooltip(item.name, { direction: 'top', offset: [0, -14] })
        .addTo(facilitiesLayer)
      bounds.push([item.lat, item.lng])
    }
  })

  if (bounds.length) map.fitBounds(bounds, { padding: [48, 48] })
  requestAnimationFrame(() => map?.invalidateSize())
}

const openRouteView = async () => {
  if (!canSeeRoute.value) return
  isRouteView.value = true
  await nextTick()
  ensureMap()
  drawRouteMap()
  // double-rAF: wait for browser layout to complete before fixing size
  requestAnimationFrame(() => requestAnimationFrame(() => map?.invalidateSize()))
}

watch(selectedType, async () => {
  if (!selectedType.value) {
    activeRequestId += 1
    clearResult()
    errorMessage.value = ''
    infoMessage.value = ''
    hasSearched.value = false
    return
  }
  if (!hasStartLocation.value) return
  requestPlan()
  await nextTick()
  scrollTo(resultAnchorEl.value)
})

watch(isPickingOnMap, (visible) => {
  if (visible) return
  destroyPickerMap()
})

watch(
  () => isRouteView.value,
  (visible) => {
    if (!visible) {
      // DOM element will be destroyed by v-else — must destroy map too
      map?.remove()
      map = null
      userLayer = null
      destinationLayer = null
      facilitiesLayer = null
      routeLayer = null
    }
  }
)

onBeforeUnmount(() => {
  map?.remove()
  map = null
  destroyPickerMap()
})
</script>
