# MovieShelf

MovieShelf is a React movie library built from the Application Development II starter. Browse popular TMDB movies, search titles, and save favorites across visits. The starter's components, Home and Favorites routes, and dark red visual design are preserved.

## Technologies and features

- React 19 functional components and hooks, React Router 7, Vite 7, and plain CSS.
- Fetch-based TMDB service with encoded queries, configuration checks, friendly errors, and cancellation.
- Search as you type with a 400ms debounce, loading feedback, retries, and empty results.
- TMDB posters with lazy loading and a fallback for missing or broken images; title, release year, and rating.
- Shared favorites, immediate button feedback, duplicate prevention, and persistent browser storage.
- Responsive grids, labeled search and navigation, accessible status messages, and reduced-motion support.
- Node's built-in test runner and jsdom for DOM interaction tests; no additional runtime dependencies.

## Installation and TMDB setup

Use Node.js 22.12+ (Node 24 is suitable) and npm.

```sh
npm install
cp .env.example .env
```

Create a TMDB account and obtain an API key from your account's API settings. Enter the API key (rather than the bearer read-access token) in `.env`:

```dotenv
VITE_TMDB_API_KEY=your_api_key_here
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
```

Replace `your_api_key_here` with your key. Restart Vite after changing environment variables. Missing configuration displays setup guidance while Favorites remains usable.

`.env` and environment variants are ignored by Git; `.env.example` contains placeholders only. Vite exposes `VITE_` variables in browser code: these are not secret server credentials. Do not commit real credentials.

```sh
npm run dev
npm run lint
npm test
npm run build
npm run preview
```

Open the local URL printed by Vite. Home is `/`, and saved movies are at `/favorites`. Production hosting must serve `index.html` for browser routes such as `/favorites`.

## How it works

TMDB responds to `/movie/popular` and `/search/movie` with JSON containing a `results` array. The service reads configuration through `import.meta.env`, sends the API key as a query parameter, and returns that array. Poster URLs use TMDB's separate image host.

Home uses `useEffect` to fetch popular movies after rendering and stores results in `useState`. Effect cleanup aborts the request and ignores late responses when Home unmounts or search becomes active.

App owns the shared search query and results. A search effect trims the query and waits 400ms before requesting results. Typing again cancels the timer and request; an active flag prevents stale responses from replacing the latest state. Header updates the query and navigates Home. Clearing the query restores popular movies without sending an empty search.

App also owns favorites. A lazy state initializer safely reads JSON from `movieshelf_favorites` in `localStorage`. An effect saves each change. Movies are identified by `id`, and toggling an existing favorite removes it. Invalid saved records and duplicates are filtered, malformed JSON is ignored, and unavailable storage shows a warning while favorites continue to work for the session. Favorites are saved in this browser, not in a TMDB account.

## Validation

`npm test` runs 22 deterministic tests. Service tests mock fetch and storage; jsdom tests mount the real app with React Strict Mode and exercise typing, the 400ms debounce, trimmed queries, cancellation, stale response protection, clearing search, navigation, adding/removing favorites, persistence across an app remount, corrupt storage, failed posters, empty results, authorization errors, network errors, and retries. Server-rendered checks also cover accessible loading/error markup.

Live TMDB verification with the locally configured key returned HTTP 200 for popular movies (20 results), Batman search (20 results), an unlikely title (zero results), and a real JPEG poster. The key was not printed or committed.

Lint, all 22 tests, production build, and Vite startup were verified. DOM tests simulate a browser and an app remount checks storage reload; they do not prove visual layout or a real browser refresh. Browser control was blocked because Computer Use permissions were not granted, so desktop/mobile appearance still needs a visual check. Existing mobile breakpoints and reduced-motion CSS are preserved.

For the final visual/browser check, use your configured key:

1. Open Home and confirm popular movies, posters, years, and ratings.
2. Type Batman and confirm relevant results after the debounce.
3. Clear search and confirm popular movies return; type rapidly to check stale results never replace the latest query.
4. Add a favorite, open Favorites, refresh, and confirm it remains saved.
5. Remove it and confirm it disappears and the empty state appears; return Home and confirm the button is synchronized.
6. Use an invalid key, restart Vite, and confirm a friendly error and retry button.
7. Search for an unlikely title and confirm the empty results message.
8. Check Home/Favorites navigation and a narrow mobile viewport for overflow and usable controls.

## GitHub

The implementation commit is `Complete MovieShelf TMDB API integration`. No push is performed automatically. After checking your branch and remote:

```sh
git status
git branch --show-current
git remote -v
git push -u origin HEAD
```
