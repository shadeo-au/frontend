# Shadeo Tile Build

Custom Planetiler schema and build instructions for Shadeo's pedestrian-focused basemap.

## What's here

- [`shadeo.yml`](./shadeo.yml) — Planetiler custommap YAML schema. Defines 8 layers tailored for City of Melbourne walking maps with proper footway/pedestrian rendering at z16.

## How to build

### Prerequisites

- Java 21+ on PATH
- `planetiler.jar` (download: https://github.com/onthegomap/planetiler/releases/latest)
- A working directory outside the repo (e.g. `F:/FIT5120/shadeo-tile-build/`) with:
  - `extract/melbourne.osm.pbf` (already produced by frontend plan §4.3)
  - `output/` folder

### Build command

From the working directory:

```powershell
java -Xmx2g -jar planetiler.jar generate-custom `
  --schema=F:\FIT5120\Shadeo\tile-build\shadeo.yml `
  --osm-path=extract\melbourne.osm.pbf `
  --output=output\melbourne.pmtiles `
  --maxzoom=16 `
  --bounds=144.89,-37.85,144.99,-37.77 `
  --force
```

Expected output: `melbourne.pmtiles` of about 30–80 MB, contains 8 layers (`water`, `landuse`, `road_major`, `road_minor`, `pedestrian`, `pedestrian_area`, `building`, `place`).

Build time: 2–5 minutes for City of Melbourne range.

### Verify

#### Method 1: PMTiles online viewer

1. Open https://protomaps.github.io/PMTiles/
2. Drag `output/melbourne.pmtiles` onto the page
3. Check at z16 you see footways as visible polylines

#### Method 2: PMTiles CLI

```powershell
pmtiles show output\melbourne.pmtiles
```

Should show `max zoom: 16` and a `vector_layers` list with 8 entries.

#### Method 3: Local maplibre dev server

Run the project's `npm run dev` after updating [`public/styles/positron/style.json`](../public/styles/positron/style.json) to point at the new pmtiles (see frontend plan task B).

## Schema design notes

### Why a custom schema instead of OpenMapTiles?

The default OpenMapTiles schema bundles all roads into one `transportation` layer with road centerlines as the focus. Footways are present but mixed in and lose attributes like `surface`, `covered`, `lit`. For Shadeo's pedestrian-focused product:

- **`pedestrian` is its own layer** — easy to style independently with dashed lines, color by surface, etc.
- **`min_size: 0` and `simplify_tolerance: 0`** on `pedestrian` — keeps original OSM way vertices so backend route geometry aligns pixel-perfectly with the rendered line.
- **Pedestrian tags preserved** (`surface`, `covered`, `width`, `lit`) — needed for future "wheelchair-friendly" / "well-lit night route" filters.
- **No OpenMapTiles dependencies** (water-polygons, natural-earth) — schema works with just an OSM PBF, no 1GB of ancillary downloads.

### Zoom strategy

| Layer | min_zoom | Why |
|---|---|---|
| `water` | 6 | Visible from regional zoom |
| `landuse` | 8 | Parks visible from suburb-level |
| `road_major` | 6 | Highway network at regional zoom |
| `road_minor` | 12 | Residential roads only when zoomed in |
| `pedestrian` | 13 | Footways only at neighborhood-level |
| `pedestrian_area` | 14 | Plazas at street-level |
| `building` | 14 | Building footprints at street-level |
| `place` | 8 | Place labels |

### Source schema vs CHANGED from old OpenMapTiles

If you're updating an existing maplibre style.json from OpenMapTiles to this schema, rename source-layers:

| OpenMapTiles | Shadeo |
|---|---|
| `water` | `water` (same) |
| `landcover` / `park` | `landuse` |
| `transportation` (class=motorway/primary/etc) | `road_major` |
| `transportation` (class=residential/service) | `road_minor` |
| `transportation` (class=path) | `pedestrian` |
| `building` | `building` (same) |
| `place` | `place` (same) |

## Monthly update SOP

OSM data updates daily. Re-run the pipeline monthly to stay fresh:

1. Re-run the frontend plan §4.3 to get a new `melbourne.osm.pbf` (BBBike or osmium)
2. Run the build command above (about 5 minutes)
3. Upload to R2 with versioned name (e.g. `melbourne-2026-06.pmtiles`) so old versions stay available for rollback
4. Update `style.json` to point at new URL
5. Copy the same `melbourne.osm.pbf` to backend (`backend/backend/data/`) and re-run `prepare_osm_graph.py`

Front-end pmtiles and back-end walk graph **must be from the same PBF snapshot** to keep alignment.

## References

- Planetiler custommap docs: https://github.com/onthegomap/planetiler/blob/main/planetiler-custommap/README.md
- Planetiler YAML schema reference: https://github.com/onthegomap/planetiler/blob/main/planetiler-custommap/SCHEMA.md
- Frontend plan: [../docs/MapAlignment_FrontendPlan.md](../docs/MapAlignment_FrontendPlan.md)
