# Shadeo

> **Tailoring aged care — addressing heat vulnerability and social isolation for seniors.**

Shadeo is a web application that helps older adults and their carers understand
how heat affects them personally — based on where they live, how their body
responds, what their home is like, and who supports them on hot days.

It turns generic heat advice into **location-aware, personal next steps** for
each user, without requiring an account or storing personal data.

---

## What's inside

Five pages, each addressing one part of the heat-vulnerability story:

| Route | Page | Purpose |
|---|---|---|
| `/` | **Home** | Editorial landing page that introduces Shadeo and links to the four feature pages. |
| `/why` | **Why Shadeo** | Explains the problem space — why heat is harder on older adults, and why generic advice falls short. |
| `/awareness` | **Awareness Map** | Interactive map visualising heat vulnerability across Greater Melbourne (HVI choropleth + supporting layers). |
| `/walk-planner` | **Walk Planner** | Cool-routes planner — pick a daily destination type, compare nearby places, and choose the safer walk. |
| `/self-check` | **Self-Check** | Daily heat cockpit: live local heat snapshot, area profile, cool places nearby, a 3-minute personal questionnaire, and a personalised "today × you" action plan. |

---

## Tech stack

- **Vue 3** (`<script setup>`, `<script setup lang="ts" generic>`)
- **Vue Router 4** (history mode)
- **TypeScript 5.8** (strict mode)
- **Vite 5** (dev + build)
- **MapLibre GL JS** + **Supercluster** (Awareness Map / Walk Planner)
- **Open-Meteo Forecast API** (live weather for the Self-Check, no key required)

No state management library, no UI framework — components are hand-built and
follow the in-house **"Soft Daylight Clay"** design system (warm paper colours,
claymorphic surfaces, editorial sans-serif headlines, 18 px text floor for
older readers, 48 px+ touch targets).

---

## Getting started

```bash
# install dependencies
npm install

# start the dev server (http://127.0.0.1:5173)
npm run dev

# type-check + production build
npm run build

# preview the production build locally
npm run preview
```

Node 18+ recommended.

---

## Project structure

```
shadeo/
├── src/
│   ├── app/                   # router + root App component
│   ├── pages/                 # one .vue file per route
│   │   ├── HomePage.vue
│   │   ├── WhyPage.vue
│   │   ├── AwarenessPage.vue
│   │   ├── WalkPlannerPage.vue
│   │   └── SelfCheckPage.vue
│   ├── components/            # reusable building blocks
│   │   ├── AppNav.vue, AppButton.vue, ClayCard.vue, …
│   │   └── selfcheck/         # Self-Check-specific components
│   ├── lib/
│   │   └── selfcheck/         # business logic for the Self-Check page
│   │       ├── types.ts            # shared TS contracts
│   │       ├── area-profiles.ts    # mock-data adapter (swap to API later)
│   │       ├── open-meteo.ts       # weather fetch + heat-alert derivation
│   │       ├── scoring.ts          # 4-dimension awareness score
│   │       └── today-actions.ts    # today × profile → top-3 action rules
│   ├── styles/                # design tokens + base reset
│   └── main.ts
├── mockdata/                  # placeholder data, replaced by real DS output
│   ├── area-profiles.json     # area heat profile per suburb
│   ├── cool-places-by-suburb.json
│   └── suburb-index.json
├── public/                    # static assets (videos, hero images)
├── vite.config.ts
└── tsconfig.json
```

Path aliases: `@/*` → `src/*`, `@mock/*` → `mockdata/*`.

---

## Self-Check page — data model

The Self-Check page is built around three layers, each adding more value:

1. **Layer 1 — Live snapshot** *(no answers needed)*: Today's max temperature,
   UV index, heat alert level for the user's suburb, plus a cool-places strip.
   Useful on its own, every visit.
2. **Layer 2 — Personal profile**: A 3-minute, 4-step questionnaire covering
   personal sensitivity, home cooling, and social support.
3. **Layer 3 — Today × You**: A rule-based engine combines today's weather
   with the user's profile to surface the top three personalised actions for
   the day (with category de-duplication and emergency-pinned cards for
   extreme heat).

All answers stay in memory only — they are cleared when the tab closes.

### Mock data → real data

Mock data lives in `mockdata/` and is consumed via `@/lib/selfcheck/area-profiles.ts`.
When the Data Science team delivers the real datasets (see internal
`DataScienceHandoff.md`), only that adapter file needs to change — components
and business logic stay untouched. The contract is:

- `getAreaProfile(suburbKey)` → area heat profile object
- `getCoolPlaces(suburbKey)` → ordered list of cool places
- `searchSuburbs(query)` / `findSuburbByKey(key)` → location lookup

Swapping the mock JSON imports for `fetch('/api/...')` calls is a single-file
change.

---

## Walk Planner weather suitability API

The Walk Planner readiness check calls the Shadeo AI weather suitability API.
Users can choose whether the walk is for today or tomorrow before opening the
route map.

Configure the endpoint in `.env.local`:

```bash
VITE_WEATHER_SUITABILITY_ENDPOINT=https://example.com/api/weather-suitability
VITE_DEFAULT_TRIP_DATE=today
```

Request body:

```json
{
  "tripDate": "today",
  "startingPoint": {
    "lat": -37.8136,
    "lng": 144.9631,
    "label": "Melbourne CBD"
  }
}
```

The UI renders only the user-facing response fields: `date`, `label`,
`uiLabel`, `summary`, and `mainFactors`. If the API is unavailable, route
planning still works and the readiness check shows a gentle unavailable state.
The selected `tripDate` is passed through to the API unchanged: `today` uses the
same-day rule path, while `tomorrow` uses the Exp3 next-day model path. The
current deployed model API uses Melbourne weather data as its weather source;
the `startingPoint` keeps the frontend/API contract stable for trip context.

The `summary` text comes from the API label mapping. The more specific weather
drivers are shown through `mainFactors`, which the UI presents as user-facing
weather factor cards.

---

## Data sources (planned production)

| Layer | Source | License |
|---|---|---|
| Live forecast (temp, UV, alert) | [Open-Meteo Forecast API](https://open-meteo.com/) | CC BY 4.0 |
| Heat Vulnerability Index by SA1 | AURIN ADP (RMIT / Loughnan team) | dataset-specific |
| SA1 boundaries | ABS ASGS 2021 | CC BY 4.0 |
| Older population by SA1 | ABS Census 2021 GCP (G01) | CC BY 4.0 |
| Cool places (libraries, parks, etc.) | OpenStreetMap (Overpass API) | © OSM contributors, ODbL |

Full data attribution will appear in the page footer once real data is wired in.

---

## Design principles

- **Non-medical, supportive**. The Self-Check is framed as awareness and
  preparation, never as diagnosis. Required disclaimer text is built into the
  result and footer.
- **Elder-friendly**. 18 px+ body text, 48 px+ touch targets, plain language,
  "Not sure" / "Prefer not to say" options on most questions, supportive tone
  throughout.
- **Privacy-conscious**. No login, no server-side persistence of answers,
  location used only to estimate local heat exposure.

---

## Development notes

- **State**: local component state + `provide/inject` where needed; no Pinia.
- **Type-checking**: `npm run build` runs `vue-tsc --noEmit` first; both must
  pass before shipping.
- **Browser support**: latest Chrome / Safari / Firefox / Edge. CSS uses
  modern features (`clamp()`, `:focus-within`, container-aware layout) but no
  experimental APIs.
- **Accessibility**: focus rings respect `prefers-reduced-motion`; colour
  is never the sole carrier of meaning (each level has both a colour and a
  text label); radio groups use semantic `<fieldset><legend>`.

---

## Status

Course project for **FIT5120 — Industry Experience Studio Project (Monash University)**.
First version targets Greater Melbourne. Later versions may expand coverage,
add multilingual support, carer mode, and SMS check-in reminders.
