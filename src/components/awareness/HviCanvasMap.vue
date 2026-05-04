<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

type HviProperties = {
  HVI_2018: number | null;
  LOCALITY: string;
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

const concernLabels = ['No data', 'Lower', 'Low', 'Moderate', 'High', 'Higher'];
const concernColors: Record<number, string> = {
  0: '#e0dbd3',
  1: '#5a9b68',
  2: '#a9cc67',
  3: '#efb447',
  4: '#df8740',
  5: '#c95949',
};

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

const localityName = computed(() => selectedFeature.value?.properties.LOCALITY ?? 'Suburb');

const suggestions = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (query.length < 2) return [];

  return features.value
    .filter((feature) => feature.properties.LOCALITY.toLowerCase().includes(query))
    .slice(0, 8);
});

const metricValue = (feature?: RawFeature) => feature?.properties.HVI_2018 ?? 0;

const selectedLevel = computed(() => concernLabels[metricValue(selectedFeature.value)] ?? concernLabels[0]);

const selectedScore = computed(() => metricValue(selectedFeature.value));

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
  return {
    color: 'rgba(255, 255, 255, 0.88)',
    weight: 1.2,
    opacity: 1,
    fillColor: concernColors[level] ?? concernColors[0],
    fillOpacity: level ? 0.76 : 0.36,
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
  search.value = layer.feature.properties.LOCALITY;
  showSuggestions.value = false;
  updateSelectedLayer(layer);
  status.value = `Selected ${layer.feature.properties.LOCALITY}.`;

  if (shouldZoom && layer.getBounds) {
    map?.fitBounds(layer.getBounds(), {
      padding: [30, 30],
      maxZoom: 13,
      animate: true,
    });
  }
};

const findLayerForFeature = (feature: RawFeature) => {
  let matched: LeafletLayer | undefined;
  geoJsonLayer?.eachLayer((layer) => {
    if (layer.feature === feature) matched = layer;
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
    const name = titleCase(feature.properties.LOCALITY);
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

const chooseSuggestion = (feature: RawFeature) => {
  const layer = findLayerForFeature(feature);
  if (layer) {
    selectLayer(layer, true);
    return;
  }

  selectedFeature.value = feature;
  search.value = feature.properties.LOCALITY;
  showSuggestions.value = false;
  status.value = `Selected ${feature.properties.LOCALITY}.`;
};

const resetView = () => {
  if (!geoJsonLayer) return;
  map?.fitBounds(geoJsonLayer.getBounds(), {
    padding: [20, 20],
    animate: true,
  });
  status.value = 'Map view reset.';
};

const setupMap = async () => {
  const target = mapEl.value;
  if (!target) return;

  loading.value = true;

  try {
    const [leaflet, response] = await Promise.all([
      loadLeaflet(),
      fetch('/data/hvi_suburb_2018.json'),
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
            status.value = `${feature.properties.LOCALITY}, heat vulnerability: ${
              concernLabels[metricValue(feature)]
            }.`;
          },
          mouseout: ({ target: hovered }) => {
            if (hovered !== selectedLayer) geoJsonLayer?.resetStyle(hovered);
          },
          click: ({ target: clicked }) => {
            selectLayer(clicked);
          },
        });
      },
    });

    geoJsonLayer.addTo?.(map);
    addSuburbLabels(leaflet, data);
    map.fitBounds(geoJsonLayer.getBounds(), { padding: [20, 20], animate: false });
    baseZoom = map.getZoom();
    updateLabelBand();
    map.on('zoomend', updateLabelBand);

    const firstLayer = findLayerForFeature(data.features[0]);
    if (firstLayer) selectLayer(firstLayer);

    status.value = `${data.features.length.toLocaleString()} suburbs loaded from the original HVI map.`;
    await nextTick();
    map.invalidateSize();
  } catch (error) {
    loadError.value = 'We could not load the suburb map. Check your connection and refresh the page.';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  setupMap();

  if (mapEl.value) {
    resizeObserver = new ResizeObserver(() => {
      map?.invalidateSize();
    });
    resizeObserver.observe(mapEl.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  map?.off('zoomend', updateLabelBand);
  map?.remove();
});
</script>

<template>
  <div class="hvi-map">
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
        />
        <div v-if="showSuggestions && suggestions.length" class="hvi-map__suggestions">
          <button
            v-for="feature in suggestions"
            :key="feature.properties.LOCALITY"
            type="button"
            @pointerdown.prevent="chooseSuggestion(feature)"
          >
            {{ feature.properties.LOCALITY }}
            <span>{{ concernLabels[metricValue(feature)] }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="hvi-map__body">
      <div :class="['hvi-map__map-shell', `hvi-map__map-shell--labels-${labelBand}`]">
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
      </div>

      <aside class="hvi-map__panel" aria-live="polite">
        <span class="hvi-map__eyebrow">Selected suburb</span>
        <h3>{{ localityName }}</h3>
        <p>
          HVI 2018: {{ selectedScore }} / 5 —
          <strong>{{ selectedLevel }}</strong>
        </p>

        <div class="hvi-map__score-dots" aria-label="HVI score out of five">
          <i
            v-for="level in [1, 2, 3, 4, 5]"
            :key="level"
            :class="{ 'is-filled': level <= selectedScore }"
            :style="{ background: level <= selectedScore ? concernColors[selectedScore] : undefined }"
          />
        </div>

        <div class="hvi-map__score-grid">
          <div>
            <span>What it means</span>
            <strong>{{ selectedLevel }} concern</strong>
          </div>
          <div>
            <span>Map unit</span>
            <strong>Suburb</strong>
          </div>
        </div>

        <div class="hvi-map__legend" aria-label="Concern level legend">
          <div v-for="level in [1, 2, 3, 4, 5]" :key="level">
            <i :style="{ background: concernColors[level] }" />
            <span>{{ level }} {{ concernLabels[level] }}</span>
          </div>
        </div>

        <p class="hvi-map__note">
          Data source: DELWP Urban Heat Islands and Heat Vulnerability Assessment in Melbourne, 2018.
        </p>
      </aside>
    </div>

    <p class="hvi-map__status">{{ status }}</p>
  </div>
</template>

<style scoped>
.hvi-map {
  display: flex;
  flex-direction: column;
  gap: 18px;
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
  font-size: clamp(1.35rem, 2vw, 1.8rem);
  font-weight: 950;
  line-height: 1.12;
}

.hvi-map__toolbar span {
  display: block;
  margin-top: 6px;
  color: var(--brand-ink-muted);
  font-size: 1rem;
  font-weight: 650;
  line-height: 1.45;
}

.hvi-map__search {
  position: relative;
  z-index: 1200;
}

.hvi-map__search input {
  width: 100%;
  min-height: var(--brand-touch);
  padding: 0 16px;
  border: 1.5px solid var(--brand-line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--brand-ink);
  font: inherit;
  font-size: 1rem;
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
  grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
  gap: 18px;
  align-items: stretch;
}

.hvi-map__map-shell {
  min-height: 620px;
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
  min-height: 620px;
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

.hvi-map__panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: clamp(20px, 2.8vw, 30px);
  border: 1px solid var(--brand-line);
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.72);
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
  font-size: clamp(1.75rem, 2.4vw, 2.35rem);
  font-weight: 950;
  letter-spacing: 0;
}

.hvi-map__panel p {
  color: var(--brand-ink-muted);
  font-size: 1.12rem;
  font-weight: 650;
  line-height: 1.48;
}

.hvi-map__score-dots {
  display: flex;
  gap: 10px;
}

.hvi-map__score-dots i {
  width: 38px;
  height: 38px;
  border: 2px solid rgba(16, 19, 15, 0.1);
  border-radius: 10px;
  background: rgba(35, 45, 39, 0.08);
}

.hvi-map__score-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.hvi-map__score-grid div {
  min-height: 82px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--brand-line-soft);
  border-radius: 18px;
  background: rgba(251, 250, 247, 0.72);
}

.hvi-map__score-grid span {
  color: var(--brand-ink-muted);
  font-size: 0.92rem;
  font-weight: 750;
  line-height: 1.25;
}

.hvi-map__score-grid strong {
  color: var(--brand-ink);
  font-size: 1.08rem;
  font-weight: 950;
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

.hvi-map__note,
.hvi-map__status {
  color: var(--brand-ink-muted);
  font-size: 0.95rem;
  font-weight: 650;
}

.hvi-map__status {
  min-height: 24px;
}

@media (max-width: 980px) {
  .hvi-map__toolbar,
  .hvi-map__body {
    grid-template-columns: 1fr;
  }

  .hvi-map__map-shell,
  .hvi-map__leaflet {
    min-height: 540px;
  }
}

@media (max-width: 640px) {
  .hvi-map__map-shell,
  .hvi-map__leaflet {
    min-height: 440px;
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
