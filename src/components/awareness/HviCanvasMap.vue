<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue';
import InfoTip from './InfoTip.vue';
import { gsap, prefersReducedMotion } from '../../lib/gsap';

type HviProperties = {
  // SHVI 2021 schema (see docs/handoff/SHVI_DataScienceHandoff.md §5.1)
  shvi_score: number | null;
  shvi_band_label: string | null;
  shvi_raw: number | null;
  suburb_name: string;
  sal_code: string;
  postcode?: string;
  exposure_raw: number | null;
  senior_sensitivity_raw: number | null;
  adaptive_capacity_raw: number | null;
  total_population: number;
  older_population: number;
  sa1_count: number;
  no_seniors: boolean;
  low_confidence: boolean;
  quintile_stability_pct?: number | null;
};

type RawFeature = {
  type: 'Feature';
  geometry: unknown;
  properties: HviProperties;
};

type RawFeatureCollection = {
  type: 'FeatureCollection';
  features: RawFeature[];
};

type LeafletLayer = {
  feature?: RawFeature;
  setStyle?: (style: Record<string, unknown>) => void;
  bringToFront?: () => void;
  getBounds?: () => unknown;
  on: (handlers: Record<string, (event: { target: LeafletLayer }) => void>) => void;
};

type LeafletGeoJson = LeafletLayer & {
  addTo: (map: LeafletMap) => LeafletGeoJson;
  resetStyle: (layer?: LeafletLayer) => void;
  eachLayer: (handler: (layer: LeafletLayer) => void) => void;
  getBounds: () => unknown;
};

type LeafletMarker = {
  addTo: (map: LeafletMap) => LeafletMarker;
};

type LeafletMap = {
  fitBounds: (bounds: unknown, options?: Record<string, unknown>) => void;
  remove: () => void;
  invalidateSize: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  getZoom: () => number;
  setMinZoom: (zoom: number) => void;
  setMaxBounds: (bounds: unknown) => void;
  on: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
};

type LeafletApi = {
  map: (element: HTMLElement, options?: Record<string, unknown>) => LeafletMap;
  polygon: (latLngs: unknown) => {
    getBounds: () => {
      getCenter: () => unknown;
    };
  };
  divIcon: (options: Record<string, unknown>) => unknown;
  marker: (latLng: unknown, options?: Record<string, unknown>) => LeafletMarker;
  geoJSON: (
    data: RawFeatureCollection,
    options: {
      style: (feature: RawFeature) => Record<string, unknown>;
      onEachFeature: (feature: RawFeature, layer: LeafletLayer) => void;
    }
  ) => LeafletGeoJson;
};

declare global {
  interface Window {
    L?: LeafletApi;
  }
}

const emit = defineEmits<{
  learnMore: [score: number];
  dataLoaded: [features: RawFeature[]];
}>();

// Allow parent (AwarenessPage) to programmatically select a suburb by sal_code —
// triggered by the bottom-of-page rankings list.
const selectByCode = (salCode: string) => {
  const feature = features.value.find((f) => f.properties.sal_code === salCode);
  if (!feature) return;
  const layer = findLayerForFeature(feature);
  if (layer) {
    selectLayer(layer, true);
  } else {
    selectedFeature.value = feature;
    search.value = feature.properties.suburb_name;
    showSuggestions.value = false;
    fitMapToFeature(feature);
    status.value = `Selected ${feature.properties.suburb_name}.`;
    nextTick(() => map?.invalidateSize());
  }
};

defineExpose({ selectByCode });

// Index 0 = "no data" (no_seniors / low_confidence / unscored). 1–5 = SHVI quintile bands.
const concernLabels = [
  'No data',
  'Cooler area',
  'Generally manageable',
  'Watch on hot days',
  'Heat-sensitive area',
  'Most heat-sensitive area',
];
const concernColors: Record<number, string> = {
  0: '#e0dbd3',
  1: '#5a9b68',
  2: '#a9cc67',
  3: '#efb447',
  4: '#df8740',
  5: '#c95949',
};

const root = ref<HTMLElement | null>(null);
const mapEl = ref<HTMLElement | null>(null);
const loading = ref(true);
const loadError = ref('');
const features = ref<RawFeature[]>([]);
const selectedFeature = ref<RawFeature | undefined>();
const search = ref('');
const showSuggestions = ref(false);
const status = ref('Loading suburb map data.');
const labelBand = ref<'low' | 'medium' | 'high' | 'detail'>('low');

let map: LeafletMap | undefined;
let geoJsonLayer: LeafletGeoJson | undefined;
let selectedLayer: LeafletLayer | undefined;
let resizeObserver: ResizeObserver | undefined;
let baseZoom = 0;
let hviCtx: gsap.Context | undefined;

const localityName = computed(() => selectedFeature.value?.properties.suburb_name ?? 'Suburb');

// Sub-index values driving the layered "why this score" explanation.
// All three bars below display a 0-1 "vulnerability contribution" — higher bar
// = more push toward a high SHVI score. To keep the visual intuition consistent,
// we invert Adaptive Capacity to a "resource gap" (1 - AC). Now: longer bar in
// any factor = stronger reason this suburb scores higher.
const exposureValue = computed(() => selectedFeature.value?.properties.exposure_raw ?? null);
const seniorSensValue = computed(() => selectedFeature.value?.properties.senior_sensitivity_raw ?? null);
const adaptiveCapValue = computed(() => selectedFeature.value?.properties.adaptive_capacity_raw ?? null);
const resourceGapValue = computed(() => (adaptiveCapValue.value == null
  ? null
  : 1 - adaptiveCapValue.value));
const isLowConfidence = computed(() => selectedFeature.value?.properties.low_confidence === true);
const stabilityPct = computed(() => selectedFeature.value?.properties.quintile_stability_pct ?? null);
const shviRaw = computed(() => selectedFeature.value?.properties.shvi_raw ?? null);
const showDetailModal = ref(false);

// Single direction-consistent scale used for all three factor bars.
// Thresholds intentionally aligned with `factorColor` below so the textual
// label and bar colour always agree (e.g. value 0.72 → "Much higher" + red).
const factorBand = (v: number | null) => {
  if (v == null) return '—';
  if (v >= 0.70) return 'Much higher';
  if (v >= 0.55) return 'Higher';
  if (v <= 0.30) return 'Much lower';
  if (v <= 0.45) return 'Lower';
  return 'Around average';
};

// Solid bar colour selected discretely from the 5-band palette by value.
// Reuses the same colours as `concernColors` so a "much higher" bar reads
// red, matching a band-5 overall SHVI score.
const factorColor = (v: number | null) => {
  if (v == null) return '#cccccc';
  if (v >= 0.70) return '#c95949';  // red       — Much higher
  if (v >= 0.55) return '#df8740';  // orange    — Higher
  if (v >= 0.45) return '#efb447';  // yellow    — Around average
  if (v >= 0.30) return '#a9cc67';  // light grn — Lower
  return '#5a9b68';                 // green     — Much lower
};

const exposureBandLabel = computed(() => factorBand(exposureValue.value));
const seniorSensBandLabel = computed(() => factorBand(seniorSensValue.value));
const resourceGapBandLabel = computed(() => factorBand(resourceGapValue.value));

const suggestions = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (query.length < 2) return [];

  return features.value
    .filter((feature) => feature.properties.suburb_name.toLowerCase().includes(query))
    .slice(0, 8);
});

// shvi_score is 1–5 for scored suburbs, null for no_seniors / low_confidence.
// Map null → 0 so existing color/label fallback to "No data" works unchanged.
const metricValue = (feature?: RawFeature) => feature?.properties.shvi_score ?? 0;

const selectedLevel = computed(() => concernLabels[metricValue(selectedFeature.value)] ?? concernLabels[0]);

const selectedScore = computed(() => metricValue(selectedFeature.value));

const hasSelection = computed(() => Boolean(selectedFeature.value));

const loadLeaflet = async () => {
  if (window.L) return window.L;

  const cssId = 'leaflet-css';
  if (!document.getElementById(cssId)) {
    const link = document.createElement('link');
    link.id = cssId;
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(link);
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('leaflet-js') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Leaflet failed to load')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Leaflet failed to load'));
    document.head.appendChild(script);
  });

  if (!window.L) throw new Error('Leaflet is unavailable');
  return window.L;
};

const baseStyle = (feature: RawFeature) => {
  const level = metricValue(feature);
  const lowConf = feature.properties.low_confidence === true && level > 0;
  return {
    // Dashed border + reduced fill opacity makes low-confidence (1-2 SA1) suburbs
    // visibly softer, signalling "this score has wider uncertainty".
    color: lowConf ? 'rgba(120, 120, 120, 0.85)' : 'rgba(255, 255, 255, 0.88)',
    weight: lowConf ? 1.4 : 1.2,
    dashArray: lowConf ? '4,3' : undefined,
    opacity: 1,
    fillColor: concernColors[level] ?? concernColors[0],
    fillOpacity: lowConf ? 0.5 : (level ? 0.76 : 0.36),
  };
};

const activeStyle = {
  color: '#10130f',
  weight: 2.4,
  opacity: 1,
  fillOpacity: 0.9,
};

const updateSelectedLayer = (layer: LeafletLayer) => {
  if (selectedLayer && selectedLayer !== layer) {
    geoJsonLayer?.resetStyle(selectedLayer);
  }

  selectedLayer = layer;
  selectedLayer.setStyle?.(activeStyle);
  selectedLayer.bringToFront?.();
};

const selectLayer = (layer: LeafletLayer, shouldZoom = false) => {
  if (!layer.feature) return;

  selectedFeature.value = layer.feature;
  search.value = layer.feature.properties.suburb_name;
  showSuggestions.value = false;
  updateSelectedLayer(layer);
  status.value = `Selected ${layer.feature.properties.suburb_name}.`;

  if (shouldZoom && layer.getBounds) {
    map?.fitBounds(layer.getBounds(), {
      padding: [40, 40],
      maxZoom: 14,
      animate: true,
      duration: 0.8,
    });
  }

  nextTick(() => map?.invalidateSize());
};

const findLayerForFeature = (feature: RawFeature) => {
  const target = toRaw(feature);
  let matched: LeafletLayer | undefined;
  geoJsonLayer?.eachLayer((layer) => {
    if (
      layer.feature === target ||
      layer.feature?.properties.sal_code === feature.properties.sal_code
    ) {
      matched = layer;
    }
  });
  return matched;
};

const titleCase = (value: string) => (
  value
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
);

const escapeHtml = (value: string) => (
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
);

const featureLabelInfo = (leaflet: LeafletApi, feature: RawFeature) => {
  const geometry = feature.geometry as {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  const rings = geometry.type === 'Polygon'
    ? geometry.coordinates as number[][][]
    : (geometry.coordinates as number[][][][]).flat();
  let minLng = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  const latLngs = rings.map((ring) => ring.map((point) => [point[1], point[0]]));

  rings.forEach((ring) => {
    ring.forEach((point) => {
      minLng = Math.min(minLng, point[0]);
      maxLng = Math.max(maxLng, point[0]);
      minLat = Math.min(minLat, point[1]);
      maxLat = Math.max(maxLat, point[1]);
    });
  });

  if (!latLngs.length) return undefined;

  return {
    center: leaflet.polygon(latLngs).getBounds().getCenter(),
    score: (maxLng - minLng) * (maxLat - minLat),
  };
};

const addSuburbLabels = (leaflet: LeafletApi, data: RawFeatureCollection) => {
  const candidates = data.features
    .map((feature) => ({
      feature,
      info: featureLabelInfo(leaflet, feature),
    }))
    .filter((item): item is { feature: RawFeature; info: { center: unknown; score: number } } => (
      Boolean(item.info)
    ))
    .sort((a, b) => b.info.score - a.info.score);

  candidates.forEach(({ feature, info }, index) => {
    const name = titleCase(feature.properties.suburb_name);
    const tier = index < 10 ? 1 : index < 30 ? 2 : index < 95 ? 3 : 4;

    leaflet.marker(info.center, {
      interactive: false,
      keyboard: false,
      icon: leaflet.divIcon({
        className: `shadeo-suburb-label shadeo-suburb-label--tier-${tier}`,
        html: `<span>${escapeHtml(name)}</span>`,
        iconSize: [120, 28],
        iconAnchor: [60, 14],
      }),
    }).addTo(map as LeafletMap);
  });
};

const updateLabelBand = () => {
  if (!map) return;

  const diff = map.getZoom() - baseZoom;
  if (diff < 0.9) labelBand.value = 'low';
  else if (diff < 1.8) labelBand.value = 'medium';
  else if (diff < 3) labelBand.value = 'high';
  else labelBand.value = 'detail';
};

const fitMapToFeature = (feature: RawFeature) => {
  const leaflet = window.L;
  if (!map || !leaflet) return;

  const geometry = feature.geometry as {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  const rings = geometry.type === 'Polygon'
    ? (geometry.coordinates as number[][][])
    : (geometry.coordinates as number[][][][]).flat();

  const latLngs: [number, number][] = [];
  rings.forEach((ring) => {
    ring.forEach((point) => latLngs.push([point[1], point[0]]));
  });
  if (!latLngs.length) return;

  const bounds = leaflet.polygon(latLngs).getBounds();
  map.fitBounds(bounds, {
    padding: [40, 40],
    maxZoom: 14,
    animate: true,
    duration: 0.8,
  });
};

const chooseSuggestion = (feature: RawFeature) => {
  const layer = findLayerForFeature(feature);
  if (layer) {
    selectLayer(layer, false);
  } else {
    selectedFeature.value = feature;
    search.value = feature.properties.suburb_name;
    showSuggestions.value = false;
    status.value = `Selected ${feature.properties.suburb_name}.`;
    nextTick(() => map?.invalidateSize());
  }
  fitMapToFeature(feature);
};

const onSearchEnter = () => {
  const first = suggestions.value[0];
  if (first) chooseSuggestion(first);
};

const onLearnMore = () => {
  if (!selectedFeature.value) return;
  emit('learnMore', selectedScore.value);
};

const resetView = () => {
  if (!geoJsonLayer) return;
  if (selectedLayer) {
    geoJsonLayer.resetStyle(selectedLayer);
    selectedLayer = undefined;
  }
  selectedFeature.value = undefined;
  search.value = '';
  showSuggestions.value = false;
  map?.fitBounds(geoJsonLayer.getBounds(), {
    padding: [20, 20],
    animate: true,
  });
  status.value = 'Map view reset.';
  nextTick(() => map?.invalidateSize());
};

const animateSelectedPanel = async () => {
  await nextTick();
  const panel = root.value?.querySelector<HTMLElement>('.hvi-map__panel');
  if (!panel) return;

  const bars = panel.querySelectorAll<HTMLElement>('.hvi-map__bar i');
  gsap.killTweensOf([panel, ...bars]);

  if (prefersReducedMotion()) {
    gsap.set(panel, { autoAlpha: 1, x: 0 });
    gsap.set(bars, { scaleX: 1 });
    return;
  }

  gsap.fromTo(panel, { autoAlpha: 0, x: 18 }, { autoAlpha: 1, x: 0, duration: 0.36, ease: 'power3.out' });
  gsap.fromTo(
    bars,
    { scaleX: 0, transformOrigin: 'left center' },
    { scaleX: 1, duration: 0.62, stagger: 0.08, ease: 'power3.out', delay: 0.08 }
  );
};

watch(selectedFeature, () => {
  animateSelectedPanel();
});

const setupMap = async () => {
  const target = mapEl.value;
  if (!target) return;

  loading.value = true;

  try {
    const [leaflet, response] = await Promise.all([
      loadLeaflet(),
      fetch('/data/shvi_suburb_2021.json'),
    ]);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = (await response.json()) as RawFeatureCollection;
    features.value = data.features;

    map = leaflet.map(target, {
      attributionControl: false,
      boxZoom: true,
      doubleClickZoom: true,
      dragging: true,
      inertia: true,
      keyboard: true,
      preferCanvas: true,
      scrollWheelZoom: true,
      tap: true,
      touchZoom: true,
      zoomControl: false,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
    });

    geoJsonLayer = leaflet.geoJSON(data, {
      style: baseStyle,
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: ({ target: hovered }) => {
            hovered.setStyle?.(activeStyle);
            hovered.bringToFront?.();
            const bandLabel = feature.properties.shvi_band_label
              ?? concernLabels[metricValue(feature)];
            const suffix = feature.properties.low_confidence
              ? ' (small suburb — score less certain)'
              : '';
            status.value = `${feature.properties.suburb_name}: ${bandLabel}${suffix}.`;
          },
          mouseout: ({ target: hovered }) => {
            if (hovered !== selectedLayer) geoJsonLayer?.resetStyle(hovered);
          },
          click: ({ target: clicked }) => {
            selectLayer(clicked, true);
          },
        });
      },
    });

    geoJsonLayer.addTo?.(map);
    addSuburbLabels(leaflet, data);
    map.fitBounds(geoJsonLayer.getBounds(), { padding: [20, 20], animate: false });
    baseZoom = map.getZoom();
    map.setMinZoom(baseZoom);
    map.setMaxBounds(geoJsonLayer.getBounds());
    updateLabelBand();
    map.on('zoomend', updateLabelBand);

    const scored = data.features.filter((f) => f.properties.shvi_score !== null).length;
    status.value = `${scored.toLocaleString()} of ${data.features.length.toLocaleString()} Greater Melbourne suburbs scored for senior heat sensitivity (2021).`;
    emit('dataLoaded', data.features);
    await nextTick();
    map.invalidateSize();
  } catch (error) {
    loadError.value = 'We could not load the suburb map. Check your connection and refresh the page.';
  } finally {
    loading.value = false;
  }
};

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && showDetailModal.value) {
    showDetailModal.value = false;
  }
};

onMounted(() => {
  hviCtx = gsap.context(() => {}, root.value ?? undefined);
  setupMap();

  if (mapEl.value) {
    resizeObserver = new ResizeObserver(() => {
      map?.invalidateSize();
    });
    resizeObserver.observe(mapEl.value);
  }

  window.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  hviCtx?.revert();
  resizeObserver?.disconnect();
  map?.off('zoomend', updateLabelBand);
  map?.remove();
  window.removeEventListener('keydown', handleEscape);
});
</script>

<template>
  <div ref="root" class="hvi-map">
    <div class="hvi-map__toolbar">
      <div>
        <strong>Explore suburbs</strong>
        <span>
          Search a suburb, tap an area, or zoom in to reveal suburb names.
        </span>
      </div>

      <div class="hvi-map__search">
        <label class="sr-only" for="hvi-search">Search a suburb</label>
        <input
          id="hvi-search"
          v-model="search"
          type="search"
          placeholder="Search suburb"
          autocomplete="off"
          @focus="showSuggestions = true"
          @input="showSuggestions = true"
          @keydown.enter.prevent="onSearchEnter"
        />
        <div v-if="showSuggestions && suggestions.length" class="hvi-map__suggestions">
          <button
            v-for="feature in suggestions"
            :key="feature.properties.sal_code"
            type="button"
            @pointerdown.prevent="chooseSuggestion(feature)"
          >
            {{ feature.properties.suburb_name }}
            <span>{{ feature.properties.shvi_band_label ?? concernLabels[metricValue(feature)] }}</span>
          </button>
        </div>
      </div>
    </div>

    <div :class="['hvi-map__body', { 'hvi-map__body--with-panel': hasSelection }]">
      <div
        :class="['hvi-map__map-shell', `hvi-map__map-shell--labels-${labelBand}`]"
        data-native-scroll
      >
        <div
          ref="mapEl"
          class="hvi-map__leaflet"
          aria-label="Interactive suburb map of heat vulnerability across Greater Melbourne"
        />

        <div v-if="loading" class="hvi-map__state">Loading map data...</div>
        <div v-else-if="loadError" class="hvi-map__state">{{ loadError }}</div>

        <div class="hvi-map__controls" aria-label="Map controls">
          <button type="button" aria-label="Zoom in" @click="map?.zoomIn()">+</button>
          <button type="button" aria-label="Zoom out" @click="map?.zoomOut()">-</button>
          <button type="button" @click="resetView">Reset</button>
        </div>

        <!-- Floating band legend — always visible so users have context
             before selecting a suburb. Bottom-left avoids the zoom controls
             on the bottom-right. -->
        <div class="hvi-map__legend-overlay" aria-label="Score legend">
          <div class="hvi-map__legend-overlay__title">Score</div>
          <div v-for="level in [1, 2, 3, 4, 5]" :key="level" class="hvi-map__legend-overlay__row">
            <i :style="{ background: concernColors[level] }" aria-hidden="true" />
            <span><b>{{ level }}</b> {{ concernLabels[level] }}</span>
          </div>
          <div class="hvi-map__legend-overlay__row hvi-map__legend-overlay__row--uncertain">
            <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
              <rect x="2" y="2" width="14" height="14" rx="5" />
            </svg>
            <span>Dashed = less certain</span>
          </div>
        </div>
      </div>

      <aside v-if="selectedFeature" class="hvi-map__panel" aria-live="polite">
        <h3>{{ localityName }}</h3>

        <div class="hvi-map__headline">
          <span class="hvi-map__score-number" :style="{ color: concernColors[selectedScore] }">
            <span class="hvi-map__score-num">{{ selectedScore || '—' }}</span>
            <span class="hvi-map__score-den">/&nbsp;5</span>
          </span>
          <div class="hvi-map__headline-text">
            <strong>{{ selectedLevel }}</strong>
            <span class="hvi-map__shvi-label">
              For older residents
              <InfoTip label="What this score means">
                This score compares Greater Melbourne suburbs by how hard hot days may be for residents aged 65+. A higher score means more support may help. It is not an absolute danger rating.
              </InfoTip>
            </span>
          </div>
        </div>

        <div class="hvi-map__score-dots" aria-label="Heat-sensitivity score out of five">
          <i
            v-for="level in [1, 2, 3, 4, 5]"
            :key="level"
            :class="{ 'is-filled': level <= selectedScore }"
            :style="{ background: level <= selectedScore ? concernColors[selectedScore] : undefined }"
          />
        </div>

        <div
          v-if="isLowConfidence"
          class="hvi-map__notice"
          role="note"
          tabindex="0"
          title="This is a small suburb with limited data, so its score is less certain than for larger suburbs."
          data-tooltip="This is a small suburb with limited data, so its score is less certain than for larger suburbs."
        >
          <i aria-hidden="true">!</i>
          <span>This is a small suburb with limited data, so its score is less certain than for larger suburbs.</span>
        </div>

        <!-- Layer 1: simple breakdown — "Why this score?" -->
        <section class="hvi-map__breakdown" aria-label="What drove this score">
          <h4>
            Why this score?
            <InfoTip label="How to read this breakdown">
              Each bar shows one thing that affects this suburb's score. A longer bar means that factor pushes the score higher.
            </InfoTip>
          </h4>

          <div class="hvi-map__factor">
            <div class="hvi-map__factor-head">
              <span>
                Heat in the area
                <InfoTip label="What is heat in the area?">
                  How hot the area tends to get — based on surface temperature, how little greenery there is, and how built-up it is, compared with the rest of Greater Melbourne.
                </InfoTip>
              </span>
              <strong>{{ exposureBandLabel }}</strong>
            </div>
            <div class="hvi-map__bar">
              <i :style="{
                width: ((exposureValue ?? 0) * 100) + '%',
                background: factorColor(exposureValue),
              }" />
            </div>
          </div>

          <div class="hvi-map__factor">
            <div class="hvi-map__factor-head">
              <span>
                Older residents at risk
                <InfoTip label="What does older residents at risk mean?">
                  How many residents are aged 65+, live alone, or need help with daily activities — the people most affected by heat.
                </InfoTip>
              </span>
              <strong>{{ seniorSensBandLabel }}</strong>
            </div>
            <div class="hvi-map__bar">
              <i :style="{
                width: ((seniorSensValue ?? 0) * 100) + '%',
                background: factorColor(seniorSensValue),
              }" />
            </div>
          </div>

          <div class="hvi-map__factor">
            <div class="hvi-map__factor-head">
              <span>
                Lack of local support
                <InfoTip label="What is lack of local support?">
                  How limited local resources and services are. Suburbs with fewer local resources show a larger support gap.
                </InfoTip>
              </span>
              <strong>{{ resourceGapBandLabel }}</strong>
            </div>
            <div class="hvi-map__bar">
              <i :style="{
                width: ((resourceGapValue ?? 0) * 100) + '%',
                background: factorColor(resourceGapValue),
              }" />
            </div>
          </div>
        </section>

        <!-- Single headline number: older residents count -->
        <div v-if="selectedFeature?.properties.older_population" class="hvi-map__stat-single">
          <span>
            People aged 65+ in this suburb
          </span>
          <strong>{{ selectedFeature.properties.older_population.toLocaleString() }}</strong>
          <small>Source: ABS 2021 Census</small>
        </div>

        <div class="hvi-map__actions">
        <button type="button" class="hvi-map__details-btn" @click="showDetailModal = true">
          Full details
          <i aria-hidden="true">→</i>
        </button>

        <div class="hvi-map__source">
          <button type="button" class="hvi-map__source-button" @click="onLearnMore">
            <span>Learn More</span>
            <i aria-hidden="true">→</i>
          </button>
        </div>
        </div>
      </aside>
    </div>

    <p class="hvi-map__status">{{ status }}</p>

    <Teleport to="body">
      <Transition name="hvi-modal-fade">
        <div
          v-if="showDetailModal && selectedFeature"
          class="hvi-modal-backdrop"
          @click="showDetailModal = false"
          role="presentation"
        >
          <div
            class="hvi-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hvi-modal-title"
            @click.stop
          >
            <header class="hvi-modal__header">
              <div>
                <span class="hvi-modal__eyebrow">Full details</span>
                <h2 id="hvi-modal-title">{{ localityName }}</h2>
              </div>
              <button
                type="button"
                class="hvi-modal__close"
                aria-label="Close details"
                @click="showDetailModal = false"
              >
                ×
              </button>
            </header>

            <section class="hvi-modal__body">
              <div class="hvi-modal__row">
                <span>SHVI band</span>
                <strong>{{ selectedScore }} of 5 — {{ selectedLevel }}</strong>
              </div>
              <div class="hvi-modal__row">
                <span>Raw SHVI value</span>
                <strong>{{ shviRaw != null ? shviRaw.toFixed(3) : '—' }}</strong>
                <small>The continuous SHVI value before suburb bands are assigned. It can be negative because adaptive capacity is subtracted; use it for fine comparison between suburbs.</small>
              </div>
              <div v-if="stabilityPct != null" class="hvi-modal__row">
                <span>Score robustness</span>
                <strong>{{ stabilityPct }}%</strong>
                <small>The share of +/-20% weight-change scenarios where this suburb stays in the same 1-to-5 band. Higher means the band is less sensitive to exact weight choices.</small>
              </div>
              <div v-if="isLowConfidence" class="hvi-modal__row hvi-modal__row--warn">
                <span>Sample-size note</span>
                <strong>1–2 statistical areas only</strong>
                <small>Smaller suburbs have wider uncertainty. Reading the score directionally (rather than to the decimal) is safer here.</small>
              </div>

              <hr />

              <h4>How the score is built</h4>
              <p>
                SHVI stands for Senior Heat Vulnerability Index. It estimates relative heat vulnerability for older residents in Greater Melbourne; it is not a forecast or an official government rating.
              </p>
              <p>
                We compute SHVI first for SA1 statistical areas, then aggregate to suburbs using the number of residents aged 65+ in each SA1 and the SA1-to-suburb overlap.
              </p>
              <p>Three sub-indexes are combined into the raw value:</p>
              <code class="hvi-modal__formula">Exposure = 0.50 surface heat + 0.25 vegetation deficit + 0.25 built density
Senior sensitivity = 0.40 age 65+ + 0.30 need for assistance + 0.20 lone-living 65+ + 0.10 population density
Adaptive capacity = (SEIFA IRSD + SEIFA IEO) / 2
SHVI raw = (Exposure + Senior sensitivity - Adaptive capacity) / 3</code>
              <p>
                Inputs are normalized within Greater Melbourne before combining. After suburb aggregation, scored suburbs are split into five relative bands, so band 5 means the highest SHVI quintile among scored Greater Melbourne suburbs, not an absolute danger threshold.
              </p>

              <h4>Why this approach</h4>
              <ul>
                <li>Method based on the Heat Vulnerability Index by Loughnan et al. (RMIT, 2013/2014).</li>
                <li>We adapted the framework for residents aged 65+ by removing the early-childhood input, adding lone-living older residents, and weighting suburb aggregation toward where older residents live.</li>
              </ul>

              <p class="hvi-modal__attribution">
                Data: ABS Census 2021 · ABS SEIFA 2021 · AURIN HVI 2021 · ABS ASGS Edition 3 boundaries. SHVI is an HVI-inspired index for Greater Melbourne; not an official government rating.
              </p>
            </section>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.hvi-map {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: clamp(28px, 4vw, 52px);
}

.hvi-map__toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(230px, 320px);
  gap: 18px;
  align-items: end;
}

.hvi-map__toolbar strong {
  display: block;
  color: var(--brand-ink);
  font-size: clamp(1.3rem, 1.7vw, 1.7rem);
  font-weight: 950;
  line-height: 1.12;
}

.hvi-map__toolbar span {
  display: block;
  margin-top: 4px;
  color: var(--brand-ink-muted);
  font-size: 0.92rem;
  font-weight: 650;
  line-height: 1.4;
}

.hvi-map__search {
  position: relative;
  z-index: 1200;
}

.hvi-map__search input {
  width: 100%;
  min-height: 58px;
  padding: 0 20px;
  border: 1.5px solid var(--brand-line);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--brand-ink);
  font: inherit;
  font-size: 1.08rem;
  font-weight: 750;
}

.hvi-map__suggestions {
  position: absolute;
  inset: calc(100% + 8px) 0 auto;
  z-index: 2000;
  overflow: hidden;
  border: 1px solid var(--brand-line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: var(--brand-shadow-nav);
}

.hvi-map__suggestions button {
  width: 100%;
  min-height: 48px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  color: var(--brand-ink-soft);
  font-size: 1rem;
  font-weight: 800;
  text-align: left;
}

.hvi-map__suggestions button:hover {
  background: rgba(155, 224, 111, 0.18);
}

.hvi-map__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
  align-items: stretch;
}

.hvi-map__body--with-panel {
  grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
}

.hvi-map__map-shell {
  /* Viewport-aware: fits one screen on common laptop heights (~720p–1080p)
     while staying readable at min size on shorter screens. */
  height: clamp(460px, 72vh, 720px);
  position: relative;
  overflow: hidden;
  border: 1px solid var(--brand-line);
  border-radius: 30px;
  background:
    radial-gradient(circle at 20% 20%, rgba(155, 224, 111, 0.08), transparent 36%),
    #f6f0e4;
}

.hvi-map__leaflet {
  width: 100%;
  height: 100%;
  background: #f6f0e4;
}

.hvi-map__leaflet :deep(.leaflet-container) {
  width: 100%;
  height: 100%;
  background: transparent;
  font-family: var(--font-body);
}

.hvi-map__leaflet :deep(.leaflet-interactive) {
  transition:
    fill-opacity var(--d-fast) ease,
    stroke-width var(--d-fast) ease;
}

.hvi-map__leaflet :deep(.leaflet-pane),
.hvi-map__leaflet :deep(.leaflet-map-pane),
.hvi-map__leaflet :deep(.leaflet-overlay-pane),
.hvi-map__leaflet :deep(.leaflet-marker-pane) {
  z-index: auto;
}

.hvi-map__leaflet :deep(.shadeo-suburb-label) {
  width: auto !important;
  height: auto !important;
  display: none;
  pointer-events: none;
}

.hvi-map__map-shell--labels-medium .hvi-map__leaflet :deep(.shadeo-suburb-label--tier-1),
.hvi-map__map-shell--labels-medium .hvi-map__leaflet :deep(.shadeo-suburb-label--tier-2),
.hvi-map__map-shell--labels-high .hvi-map__leaflet :deep(.shadeo-suburb-label--tier-1),
.hvi-map__map-shell--labels-high .hvi-map__leaflet :deep(.shadeo-suburb-label--tier-2),
.hvi-map__map-shell--labels-high .hvi-map__leaflet :deep(.shadeo-suburb-label--tier-3),
.hvi-map__map-shell--labels-detail .hvi-map__leaflet :deep(.shadeo-suburb-label) {
  display: block;
}

.hvi-map__leaflet :deep(.shadeo-suburb-label span) {
  display: inline-block;
  color: rgba(16, 19, 15, 0.5);
  font-family: var(--font-body);
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.58),
    0 0 10px rgba(255, 255, 255, 0.78);
  white-space: nowrap;
}

.hvi-map__leaflet :deep(.shadeo-suburb-label--tier-1 span) {
  color: rgba(16, 19, 15, 0.56);
  font-size: 1.42rem;
  font-weight: 850;
}

.hvi-map__leaflet :deep(.shadeo-suburb-label--tier-2 span) {
  color: rgba(16, 19, 15, 0.5);
  font-size: 1.08rem;
}

.hvi-map__leaflet :deep(.shadeo-suburb-label--tier-4 span) {
  color: rgba(16, 19, 15, 0.42);
  font-size: 0.78rem;
  font-weight: 760;
}

.hvi-map__state {
  position: absolute;
  inset: 0;
  z-index: 1001;
  display: grid;
  place-items: center;
  padding: 24px;
  color: var(--brand-ink-muted);
  background: rgba(251, 246, 235, 0.78);
  font-size: 1.125rem;
  font-weight: 800;
  text-align: center;
}

.hvi-map__controls {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 1000;
  display: flex;
  gap: 8px;
}

.hvi-map__controls button {
  min-width: 48px;
  min-height: 48px;
  padding-inline: 14px;
  border: 1px solid var(--brand-line);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--brand-ink);
  box-shadow: var(--brand-shadow-nav);
  font-size: 1rem;
  font-weight: 950;
}

/* ─── Floating band legend (always visible on the map) ───────────────── */

.hvi-map__legend-overlay {
  position: absolute;
  right: 14px;
  top: 14px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 12px 14px 13px;
  border: 1px solid var(--brand-line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 8px 22px rgba(35, 45, 39, 0.08);
  pointer-events: none;   /* don't intercept map drags / hovers */
}

.hvi-map__legend-overlay__title {
  color: var(--brand-ink-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.hvi-map__legend-overlay__row {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--brand-ink);
  font-size: 0.94rem;
  font-weight: 700;
  line-height: 1;
}

.hvi-map__legend-overlay__row i {
  width: 16px;
  height: 16px;
  flex: none;
  display: inline-block;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.65);
}

.hvi-map__legend-overlay__row b {
  display: inline-block;
  width: 1em;
  margin-right: 2px;
  color: var(--brand-ink-muted);
  font-weight: 900;
  text-align: right;
}

.hvi-map__legend-overlay__row--uncertain {
  margin-top: 3px;
  padding-top: 7px;
  border-top: 1px solid rgba(35, 45, 39, 0.08);
  color: var(--brand-ink-muted);
  font-size: 0.78rem;
  font-weight: 750;
}

.hvi-map__legend-overlay__row--uncertain svg {
  width: 16px;
  height: 16px;
  flex: none;
}

.hvi-map__legend-overlay__row--uncertain rect {
  fill: rgba(251, 250, 247, 0.88);
  stroke: rgba(112, 112, 112, 0.9);
  stroke-width: 2;
  stroke-dasharray: 3 2;
  vector-effect: non-scaling-stroke;
}

@media (max-width: 640px) {
  .hvi-map__legend-overlay {
    right: 10px;
    top: 10px;
    gap: 5px;
    padding: 9px 11px 10px;
  }
  .hvi-map__legend-overlay__row {
    font-size: 0.82rem;
  }
  .hvi-map__legend-overlay__row i {
    width: 14px;
    height: 14px;
  }
}

.hvi-map__panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: clamp(460px, 72vh, 720px);
  overflow-y: auto;
  overflow-x: clip;          /* explicit: no horizontal scrollbar */
  scrollbar-gutter: stable;
  padding: clamp(18px, 2vw, 22px);
  border: 1px solid var(--brand-line);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
  will-change: transform, opacity;
}

.hvi-map__eyebrow {
  color: var(--brand-ink-soft);
  font-size: 0.9rem;
  font-weight: 950;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hvi-map__panel h3 {
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(1.55rem, 1.95vw, 2.05rem);
  font-weight: 950;
  line-height: 1.04;
  letter-spacing: 0;
  text-wrap: balance;
}

.hvi-map__panel p {
  color: var(--brand-ink-muted);
  font-size: 1.12rem;
  font-weight: 650;
  line-height: 1.48;
}

.hvi-map__score-dots {
  display: flex;
  gap: 8px;
}

.hvi-map__score-dots i {
  width: 34px;
  height: 34px;
  border: 2px solid rgba(16, 19, 15, 0.1);
  border-radius: 9px;
  background: rgba(35, 45, 39, 0.08);
}

.hvi-map__headline {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: nowrap;
}

.hvi-map__score-number {
  flex: none;             /* never let it shrink so "/ 5" can't wrap below */
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  white-space: nowrap;
  font-family: var(--font-body);
  line-height: 1;
  letter-spacing: -0.02em;
}

.hvi-map__score-num {
  font-size: clamp(3rem, 4.25vw, 3.8rem);
  font-weight: 950;
  line-height: 1;
}

.hvi-map__score-den {
  color: var(--brand-ink-muted);
  font-size: clamp(1.05rem, 1.25vw, 1.34rem);
  font-weight: 750;
  white-space: nowrap;
}

.hvi-map__headline-text {
  min-width: 0;           /* allow inner wrapping rather than overflow */
  flex: 1 1 auto;
}

.hvi-map__headline strong {
  display: block;
  color: var(--brand-ink);
  font-size: 1.08rem;
  font-weight: 900;
  line-height: 1.2;
}

.hvi-map__shvi-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  color: var(--brand-ink-muted);
  font-size: 0.78rem;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ─── Reusable inline ⓘ tip ─────────────────────────────────────────── */

.hvi-map__tip {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  vertical-align: middle;
}

.hvi-map__tip button {
  width: 18px;
  height: 18px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(98, 133, 107, 0.28);
  border-radius: 50%;
  background: rgba(98, 133, 107, 0.12);
  color: var(--shade-deep);
  font-family: var(--font-editorial);
  font-size: 0.76rem;
  font-style: italic;
  font-weight: 700;
  line-height: 1;
  cursor: help;
  transition: background 180ms ease, border-color 180ms ease;
}

.hvi-map__tip button:hover,
.hvi-map__tip button:focus-visible {
  border-color: rgba(98, 133, 107, 0.5);
  background: rgba(228, 248, 213, 0.55);
}

.hvi-map__tip-bubble {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  z-index: 5;
  width: min(260px, calc(100vw - 64px));
  padding: 12px 14px;
  border: 1px solid rgba(35, 45, 39, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: var(--brand-shadow-nav);
  color: var(--brand-ink-muted);
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.45;
  text-align: left;
  text-transform: none;
  letter-spacing: 0;
  opacity: 0;
  transform: translate(-50%, 4px);
  pointer-events: none;
  transition: opacity 160ms ease, transform 160ms ease;
}

.hvi-map__tip-bubble::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -7px;
  width: 12px;
  height: 12px;
  border-right: 1px solid rgba(35, 45, 39, 0.12);
  border-bottom: 1px solid rgba(35, 45, 39, 0.12);
  background: rgba(255, 255, 255, 0.98);
  transform: translateX(-50%) rotate(45deg);
}

.hvi-map__tip:hover .hvi-map__tip-bubble,
.hvi-map__tip:focus-within .hvi-map__tip-bubble {
  opacity: 1;
  transform: translate(-50%, 0);
  pointer-events: auto;
}

/* ─── Low-confidence notice ─────────────────────────────────────────── */

.hvi-map__notice {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid rgba(223, 167, 64, 0.32);
  border-radius: 12px;
  background: rgba(255, 244, 223, 0.72);
  color: var(--brand-ink-muted);
  font-size: 0.78rem;
  font-weight: 650;
  line-height: 1.28;
  cursor: help;
  outline: none;
}

.hvi-map__notice span {
  display: -webkit-box;
  min-width: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.hvi-map__notice i {
  flex: none;
  width: 20px;
  height: 20px;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(223, 167, 64, 0.78);
  color: var(--brand-paper-white);
  font-family: var(--font-editorial);
  font-size: 0.86rem;
  font-style: normal;
  font-weight: 900;
  line-height: 1;
}

.hvi-map__notice::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  z-index: 8;
  width: min(320px, calc(100vw - 48px));
  padding: 12px 14px;
  border: 1px solid rgba(223, 167, 64, 0.34);
  border-radius: 14px;
  background: rgba(255, 253, 248, 0.98);
  box-shadow: 0 14px 32px rgba(35, 45, 39, 0.16);
  color: var(--brand-ink-muted);
  font-size: 0.86rem;
  font-weight: 650;
  line-height: 1.42;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 4px);
  transition: opacity 160ms ease, transform 160ms ease;
}

.hvi-map__notice::before {
  content: "";
  position: absolute;
  left: 50%;
  bottom: calc(100% + 4px);
  z-index: 9;
  width: 12px;
  height: 12px;
  border-right: 1px solid rgba(223, 167, 64, 0.34);
  border-bottom: 1px solid rgba(223, 167, 64, 0.34);
  background: rgba(255, 253, 248, 0.98);
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 4px) rotate(45deg);
  transition: opacity 160ms ease, transform 160ms ease;
}

.hvi-map__notice:hover::before,
.hvi-map__notice:hover::after,
.hvi-map__notice:focus-visible::before,
.hvi-map__notice:focus-visible::after {
  opacity: 1;
}

.hvi-map__notice:hover::after,
.hvi-map__notice:focus-visible::after {
  transform: translate(-50%, 0);
}

.hvi-map__notice:hover::before,
.hvi-map__notice:focus-visible::before {
  transform: translate(-50%, 0) rotate(45deg);
}

/* ─── Layer 1: factor breakdown bars ────────────────────────────────── */

.hvi-map__breakdown {
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding: 14px;
  border: 1px solid var(--brand-line-soft);
  border-radius: 18px;
  background: rgba(251, 250, 247, 0.86);
}

.hvi-map__breakdown h4 {
  margin: 0;
  color: var(--brand-ink);
  font-size: 1rem;
  font-weight: 900;
}

.hvi-map__factor {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.hvi-map__factor-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 2px 8px;
  color: var(--brand-ink-muted);
  font-size: 0.88rem;
  font-weight: 750;
}

.hvi-map__factor-head > span {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  white-space: nowrap;
}

.hvi-map__factor-head strong {
  flex: 0 0 auto;
  margin-left: auto;
  color: var(--brand-ink);
  font-size: 0.88rem;
  font-weight: 900;
  text-align: right;
  white-space: nowrap;
}

.hvi-map__bar {
  position: relative;
  height: 9px;
  border-radius: 999px;
  background: rgba(35, 45, 39, 0.08);
  overflow: hidden;
}

/*
 * Bar fill is solid colour, picked discretely from the 5-band SHVI palette
 * based on the factor's value. Reuses the same colours as the map polygons,
 * so a "much higher" factor reads red (same red as a band-5 suburb), a
 * "much lower" factor reads green, etc. Both colour and width are set
 * inline via :style binding.
 */
.hvi-map__bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  transform-origin: left center;
  will-change: transform;
  transition: background 240ms ease;
}

/* ─── Stats row (older residents + confidence) ──────────────────────── */

.hvi-map__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.hvi-map__stats div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border: 1px solid var(--brand-line-soft);
  border-radius: 16px;
  background: rgba(251, 250, 247, 0.72);
}

.hvi-map__stats span {
  display: inline-flex;
  align-items: center;
  color: var(--brand-ink-muted);
  font-size: 0.86rem;
  font-weight: 750;
}

.hvi-map__stats strong {
  color: var(--brand-ink);
  font-size: 1.16rem;
  font-weight: 950;
}

/* ─── Single stat row (replaces 2-cell grid; cleaner) ────────────────── */

.hvi-map__stat-single {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 10px;
  align-items: baseline;
  padding: 12px 14px;
  border: 1px solid var(--brand-line-soft);
  border-radius: 14px;
  background: rgba(251, 250, 247, 0.72);
}

.hvi-map__stat-single > span:first-child {
  min-width: 0;
  color: var(--brand-ink-muted);
  font-size: 0.86rem;
  font-weight: 750;
  line-height: 1.25;
}

.hvi-map__stat-single strong {
  color: var(--brand-ink);
  font-size: 1.34rem;
  font-weight: 950;
  letter-spacing: -0.01em;
}

.hvi-map__stat-single small {
  grid-column: 1 / -1;
  color: var(--brand-ink-muted);
  font-size: 0.76rem;
  font-style: italic;
  font-weight: 600;
  letter-spacing: 0.02em;
}

/* ─── "See full details" CTA button (opens modal) ────────────────────── */

.hvi-map__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  align-items: stretch;
  margin-top: 2px;
}

.hvi-map__details-btn {
  width: 100%;
  min-width: 0;
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 0 8px 0 12px;
  border: 1px solid rgba(98, 133, 107, 0.3);
  border-radius: 12px;
  background: rgba(228, 248, 213, 0.42);
  color: var(--brand-ink-soft);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  transition: background 180ms ease, transform 180ms ease;
}

.hvi-map__details-btn:hover {
  background: rgba(228, 248, 213, 0.72);
  transform: translateX(2px);
}

.hvi-map__details-btn i {
  font-style: normal;
  font-weight: 600;
}

/* ─── Detail modal ───────────────────────────────────────────────────── */

.hvi-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: grid;
  place-items: center;
  padding: clamp(16px, 4vw, 48px);
  background: rgba(20, 26, 22, 0.42);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.hvi-modal {
  width: min(640px, 100%);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--brand-line);
  border-radius: 24px;
  background: rgba(255, 253, 248, 0.98);
  box-shadow: 0 24px 60px rgba(20, 26, 22, 0.22);
  overflow: hidden;
}

.hvi-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 22px 26px 14px;
  border-bottom: 1px solid var(--brand-line-soft);
}

.hvi-modal__eyebrow {
  display: inline-block;
  margin-bottom: 6px;
  color: var(--brand-ink-muted);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.hvi-modal__header h2 {
  margin: 0;
  color: var(--brand-ink);
  font-family: var(--font-body);
  font-size: clamp(1.6rem, 3vw, 2rem);
  font-weight: 950;
  line-height: 1.1;
}

.hvi-modal__close {
  width: 36px;
  height: 36px;
  flex: none;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--brand-line);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.86);
  color: var(--brand-ink-soft);
  font-size: 1.4rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease;
}

.hvi-modal__close:hover {
  background: rgba(228, 248, 213, 0.62);
  color: var(--brand-ink);
}

.hvi-modal__body {
  flex: 1;
  overflow-y: auto;
  padding: 22px 26px 26px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hvi-modal__row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px 18px;
  padding: 12px 14px;
  border: 1px solid var(--brand-line-soft);
  border-radius: 14px;
  background: rgba(251, 250, 247, 0.6);
}

.hvi-modal__row--warn {
  border-color: rgba(223, 167, 64, 0.36);
  background: rgba(255, 244, 223, 0.72);
}

.hvi-modal__row > span {
  color: var(--brand-ink-muted);
  font-size: 0.94rem;
  font-weight: 750;
}

.hvi-modal__row > strong {
  color: var(--brand-ink);
  font-size: 1.04rem;
  font-weight: 900;
}

.hvi-modal__row > small {
  width: 100%;
  color: var(--brand-ink-muted);
  font-size: 0.84rem;
  font-weight: 600;
  line-height: 1.45;
}

.hvi-modal__body hr {
  margin: 4px 0 2px;
  border: 0;
  border-top: 1px solid var(--brand-line-soft);
}

.hvi-modal__body h4 {
  margin: 6px 0 0;
  color: var(--brand-ink);
  font-size: 1.04rem;
  font-weight: 900;
}

.hvi-modal__body p,
.hvi-modal__body ul {
  margin: 0;
  color: var(--brand-ink-muted);
  font-size: 0.94rem;
  font-weight: 600;
  line-height: 1.55;
}

.hvi-modal__body ul {
  padding-left: 1.2em;
}

.hvi-modal__body li {
  margin: 4px 0;
}

.hvi-modal__formula {
  display: block;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(35, 45, 39, 0.06);
  color: var(--brand-ink);
  font-family: var(--font-mono, ui-monospace, SF Mono, Menlo, Consolas, monospace);
  font-size: 0.9rem;
  font-weight: 700;
  white-space: pre-wrap;
  word-break: break-word;
}

.hvi-modal__attribution {
  margin-top: 4px !important;
  padding-top: 12px;
  border-top: 1px solid var(--brand-line-soft);
  font-size: 0.82rem !important;
  font-style: italic;
}

/* Modal transition */
.hvi-modal-fade-enter-active,
.hvi-modal-fade-leave-active {
  transition: opacity 200ms ease;
}
.hvi-modal-fade-enter-active .hvi-modal,
.hvi-modal-fade-leave-active .hvi-modal {
  transition: transform 220ms var(--ease-out-expo), opacity 200ms ease;
}
.hvi-modal-fade-enter-from,
.hvi-modal-fade-leave-to {
  opacity: 0;
}
.hvi-modal-fade-enter-from .hvi-modal,
.hvi-modal-fade-leave-to .hvi-modal {
  transform: translateY(12px) scale(0.98);
  opacity: 0;
}

/* ─── (legacy) collapsed details — kept for fallback though not in template ─ */

.hvi-map__details {
  border: 1px solid var(--brand-line-soft);
  border-radius: 16px;
  background: rgba(251, 250, 247, 0.6);
  padding: 0;
}

.hvi-map__details summary {
  list-style: none;
  cursor: pointer;
  padding: 12px 16px;
  color: var(--brand-ink-soft);
  font-size: 0.96rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.hvi-map__details summary::-webkit-details-marker { display: none; }

.hvi-map__details summary::after {
  content: "+";
  width: 22px;
  height: 22px;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(98, 133, 107, 0.14);
  color: var(--shade-deep);
  font-family: var(--font-editorial);
  font-size: 1.05rem;
  font-weight: 900;
  transition: transform 220ms ease, background 220ms ease;
}

.hvi-map__details[open] summary::after {
  content: "−";
  background: rgba(228, 248, 213, 0.7);
}

.hvi-map__details-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 16px 14px;
  color: var(--brand-ink-muted);
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.5;
}

.hvi-map__details-body code {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(35, 45, 39, 0.08);
  font-family: var(--font-mono, ui-monospace, SF Mono, Menlo, Consolas, monospace);
  font-size: 0.86rem;
  font-weight: 700;
}

.hvi-map__details-attribution {
  margin-top: 4px;
  padding-top: 10px;
  border-top: 1px solid var(--brand-line-soft);
  color: var(--brand-ink-muted);
  font-size: 0.8rem;
  font-style: italic;
}

.hvi-map__legend {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.hvi-map__legend div {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--brand-ink-muted);
  font-size: 0.96rem;
  font-weight: 750;
}

.hvi-map__legend i {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1px solid rgba(16, 19, 15, 0.08);
}

.hvi-map__status {
  color: var(--brand-ink-muted);
  font-size: 0.95rem;
  font-weight: 650;
}

.hvi-map__source {
  width: 100%;
  margin-top: 0;
}

.hvi-map__source-button {
  width: 100%;
  min-width: 0;
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 0 6px 0 12px;
  border: 1px solid transparent;
  border-radius: 22px;
  background: var(--brand-lime);
  color: var(--brand-ink);
  box-shadow: var(--brand-shadow-nav);
  font-size: 0.9rem;
  font-weight: 900;
  letter-spacing: 0.01em;
  white-space: nowrap;
  transition:
    border-color var(--d-fast) ease,
    background var(--d-fast) ease,
    color var(--d-fast) ease,
    transform var(--d-fast) ease;
}

.hvi-map__source-button i {
  width: 30px;
  height: 30px;
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.86);
  color: var(--brand-ink);
  font-size: 1.06rem;
  font-style: normal;
  font-weight: 950;
  line-height: 1;
  transition:
    background var(--d-fast) ease,
    transform var(--d-fast) ease;
}

.hvi-map__source-button:hover,
.hvi-map__source-button:focus-visible {
  border-color: rgba(35, 45, 39, 0.12);
  background: var(--brand-lime-hover);
  color: var(--brand-ink);
  transform: translateY(-1px);
}

.hvi-map__source-button:hover i,
.hvi-map__source-button:focus-visible i {
  background: #ffffff;
  transform: translateX(2px);
}

.hvi-map__source-info {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
  vertical-align: middle;
}

.hvi-map__source-info button {
  width: 22px;
  height: 22px;
  display: inline-grid;
  place-items: center;
  padding: 0;
  border: 1px solid rgba(98, 133, 107, 0.22);
  border-radius: 50%;
  background: rgba(98, 133, 107, 0.14);
  color: var(--shade-deep);
  font-family: var(--font-editorial);
  font-size: 0.95rem;
  font-style: normal;
  font-weight: 700;
  line-height: 1;
}

.hvi-map__source-info button:hover,
.hvi-map__source-info button:focus-visible {
  border-color: rgba(98, 133, 107, 0.44);
  background: rgba(228, 248, 213, 0.48);
  color: var(--brand-ink-soft);
}

.hvi-map__source-bubble {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 12px);
  z-index: 4;
  width: min(280px, calc(100vw - 64px));
  padding: 14px 16px;
  border: 1px solid rgba(35, 45, 39, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: var(--brand-shadow-nav);
  color: var(--brand-ink-muted);
  font-size: 0.92rem;
  font-weight: 650;
  line-height: 1.45;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 8px);
  transition:
    opacity var(--d-fast) ease,
    transform var(--d-fast) ease;
}

.hvi-map__source-bubble::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -7px;
  width: 12px;
  height: 12px;
  border-right: 1px solid rgba(35, 45, 39, 0.12);
  border-bottom: 1px solid rgba(35, 45, 39, 0.12);
  background: rgba(255, 255, 255, 0.96);
  transform: translateX(-50%) rotate(45deg);
}

.hvi-map__source-info:hover .hvi-map__source-bubble,
.hvi-map__source-info:focus-within .hvi-map__source-bubble {
  opacity: 1;
  transform: translate(-50%, 0);
}

.hvi-map__status {
  min-height: 24px;
}

@media (max-width: 980px) {
  .hvi-map__toolbar,
  .hvi-map__body,
  .hvi-map__body--with-panel {
    grid-template-columns: 1fr;
  }

  .hvi-map__map-shell {
    height: clamp(420px, 64vh, 560px);
  }
  .hvi-map__panel {
    height: auto;
    max-height: none;  /* mobile stacks below map — let panel grow naturally */
    overflow-y: visible;
  }
}

@media (max-width: 640px) {
  .hvi-map__map-shell {
    height: clamp(380px, 58vh, 460px);
    border-radius: 24px;
  }

  .hvi-map__controls {
    right: 10px;
    bottom: 10px;
  }

  .hvi-map__score-grid {
    grid-template-columns: 1fr;
  }

  .hvi-map__score-dots i {
    width: 34px;
    height: 34px;
  }
}
</style>
