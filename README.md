# GreenPath Frontend

GreenPath is a Vue 3 + Vite frontend focused on helping older adults plan walking routes with more comfort and confidence. The interface highlights safer and more accessible walking decisions by surfacing route support information such as distance, facilities, and route context.

## Tech Stack

- Vue 3
- Vite 5
- Vue Router 4
- Leaflet
- Plain CSS

## Main Pages

- Home page: project introduction, key barriers to walking, and product highlights.
- Why Walk page: explains the health and wellbeing benefits of regular walking.
- Planner page: lets the user choose a destination type, view a recommended result, and inspect the route on a map.

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

The Vite dev server is configured to run on:

```text
http://localhost:5173
```

### Backend API base URL

The planner uses this backend API by default:

```text
https://g5m02vygkj.execute-api.ap-southeast-2.amazonaws.com
```

If you need to point the frontend to another backend, create a `.env.local` file in the `frontend` folder:

```bash
VITE_API_BASE_URL=https://your-backend-base-url
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Project Structure

```text
frontend/
	index.html
	package.json
	vercel.json
	vite.config.js
	public/
	src/
		App.vue
		main.js
		router/
			index.js
		styles.css
		assets/
			pictures/
			svg/
		components/
			AppFooter.vue
			AppHeader.vue
		pages/
			AccessGatePage.vue
			HomePage.vue
			PlannerPage.vue
			WhyWalkPage.vue
```

## Routing

This frontend uses `vue-router` with HTML5 history mode.

- `/` -> Home page
- `/why-walk` -> Why Walk page
- `/planner` -> Route planner
- `/unlock` -> Password gate page

The router also owns the site access guard. Protected routes redirect unauthenticated users to `/unlock`, then return them to the requested route after a successful password check.

Because the app uses history mode, direct visits and refreshes on nested routes require SPA rewrites in production.

## Vercel Deployment

This project is configured for Vercel with [vercel.json](f:\FIT5120\GreenPath\frontend\vercel.json), which rewrites all requests to `index.html` so history-mode routes work correctly.

Recommended Vercel setup:

1. Set the project root directory to `frontend`.
2. Use the default build command: `npm run build`.
3. Use the default output directory: `dist`.
4. If you want to change the site password without editing code, add `VITE_SITE_PASSWORD_HASH` in the Vercel environment variables.

## Planner Notes

- The planner page uses Leaflet for the map view.
- Some planner content is currently driven by frontend data and UI state.
- Tree canopy and some route-support data are presented as part of the interface design and may later be supplied by backend services.

## Development Notes

- Global styles live in `src/styles.css`.
- Shared layout is managed in `src/App.vue`.
- Application routing and route guards live in `src/router/index.js`.
- Reusable header and footer components are stored in `src/components`.
- Page-level logic is kept inside `src/pages`.

## Recommended Workflow

1. Run `npm install` once after cloning the project.
2. Use `npm run dev` during development.
3. Use `npm run build` before submission or deployment to verify the production bundle still compiles.

## Known Considerations

- If a page embeds third-party media using direct external URLs, the asset may fail because of hotlinking, CORS, or unsupported response headers from the source website.
- For production reliability, store important images and videos locally in `src/assets` or serve them from a controlled CDN.

## Team Handover Summary

If you are continuing this project, start with these files:

- `src/App.vue` for the shared application shell.
- `src/router/index.js` for route definitions and the password guard.
- `src/pages/AccessGatePage.vue` for the unlock flow.
- `src/pages/HomePage.vue` for landing page content.
- `src/pages/PlannerPage.vue` for route planner logic and map rendering.
- `src/styles.css` for the main visual system.