import { test, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import { act, createElement, StrictMode } from 'react';

// A simulated browser runs the real React effects and DOM events without live API calls.
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/' });
Object.assign(globalThis, {
  window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true,
});
const { createRoot } = await import('react-dom/client');
const server = await createServer({
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] },
  define: {
    'import.meta.env.VITE_TMDB_API_KEY': JSON.stringify('mock-key'),
    'import.meta.env.VITE_TMDB_BASE_URL': JSON.stringify('https://example.test/3'),
  },
});
const { default: App } = await server.ssrLoadModule('/src/App.jsx');
const popular = { id: 1, title: 'Popular Film', poster_path: '/popular.jpg', release_date: '2024-01-01', vote_average: 8 };
const batman = { ...popular, id: 2, title: 'Batman', poster_path: '/batman.jpg' };
const originalFetch = globalThis.fetch;
let root;
let calls;
function response(results) { return { ok: true, json: async () => ({ results }) }; }
async function mount() {
  root = createRoot(document.getElementById('root'));
  await act(async () => { root.render(createElement(StrictMode, null, createElement(App))); });
}
async function setup(fetcher) {
  window.history.replaceState({}, '', '/');
  localStorage.clear();
  calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, signal: options.signal });
    return fetcher ? fetcher(url, options) : response(url.pathname.endsWith('/popular') ? [popular] : [batman]);
  };
  await mount();
}
const text = () => document.body.textContent;
async function type(value) {
  const input = document.querySelector('input');
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}
async function click(selector) {
  const element = document.querySelector(selector);
  assert.ok(element, `Expected ${selector}`);
  await act(async () => element.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })));
}
async function debounce() { await act(async () => { await delay(450); }); }
afterEach(async () => { if (root) await act(async () => root.unmount()); root = null; });
after(async () => { await server.close(); dom.window.close(); globalThis.fetch = originalFetch; });

test('Home loads popular movies and real lazy poster URLs', async () => {
  await setup();
  assert.match(text(), /Popular Film/);
  const poster = document.querySelector('.movie-poster img');
  assert.equal(poster.src, 'https://image.tmdb.org/t/p/w500/popular.jpg');
  assert.equal(poster.getAttribute('loading'), 'lazy');
  await act(async () => poster.dispatchEvent(new window.Event('error')));
  assert.match(text(), /No poster available/);
});

test('typing is debounced, queries are trimmed, and clearing restores popular movies', async () => {
  await setup();
  await type('Bat');
  await type(' Batman  ');
  assert.equal(calls.filter(call => call.url.pathname.endsWith('/search/movie')).length, 0);
  assert.match(text(), /Loading movies/);
  await debounce();
  assert.match(text(), /Batman/);
  assert.equal(document.querySelector('.movie-title').textContent, 'Batman');
  const searches = calls.filter(call => call.url.pathname.endsWith('/search/movie'));
  assert.equal(searches.length, 1);
  assert.equal(searches[0].url.searchParams.get('query'), 'Batman');
  await type('   ');
  assert.match(text(), /Popular Movies/);
  assert.match(text(), /Popular Film/);
  assert.equal(calls.filter(call => call.url.pathname.endsWith('/search/movie')).length, 1);
});

test('late search responses cannot overwrite newer results', async () => {
  let resolveOld;
  await setup(url => url.searchParams.get('query') === 'Old'
    ? new Promise(resolve => { resolveOld = resolve; })
    : response(url.pathname.endsWith('/popular') ? [popular] : [batman]));
  await type('Old'); await debounce();
  const oldRequest = calls.at(-1);
  await type('Batman'); await debounce();
  assert.equal(oldRequest.signal.aborted, true);
  await act(async () => resolveOld(response([{ ...popular, title: 'Stale Result' }])));
  assert.equal(document.querySelector('.movie-title').textContent, 'Batman');
  assert.doesNotMatch(text(), /Stale Result/);
});

test('favorites update immediately, navigate, survive remount, and remove with an empty state', async () => {
  await setup();
  await click('.favorite-button');
  assert.equal(document.querySelector('.favorite-button').getAttribute('aria-pressed'), 'true');
  assert.equal(JSON.parse(localStorage.getItem('movieshelf_favorites')).length, 1);
  await click('a[href="/favorites"]');
  assert.equal(window.location.pathname, '/favorites');
  assert.match(text(), /Popular Film/);
  await act(async () => root.unmount());
  root = null;
  await mount();
  assert.match(text(), /Popular Film/);
  await click('.favorite-button');
  assert.match(text(), /No favorite movies yet/);
  assert.deepEqual(JSON.parse(localStorage.getItem('movieshelf_favorites')), []);
  await click('a.nav-link[href="/"]');
  assert.match(text(), /Popular Film/);
  assert.equal(document.querySelector('.favorite-button').getAttribute('aria-pressed'), 'false');
});

test('search from Favorites opens Home and empty results show helpful feedback', async () => {
  await setup(url => response(url.pathname.endsWith('/popular') ? [popular] : []));
  await click('a[href="/favorites"]');
  await type('no-match'); await debounce();
  assert.equal(window.location.pathname, '/');
  assert.match(text(), /No movies matched your search/);
});

test('HTTP authorization errors render with a working retry button', async () => {
  let invalid = true;
  await setup(() => invalid ? { ok: false, status: 401 } : response([popular]));
  assert.match(document.querySelector('[role="alert"]').textContent, /Check your API key/);
  invalid = false;
  await click('.error-state button');
  assert.match(text(), /Popular Film/);
  assert.equal(document.querySelector('[role="alert"]'), null);
});

test('search network errors render and retry successfully', async () => {
  let fail = true;
  await setup(url => {
    if (url.pathname.endsWith('/popular')) return response([popular]);
    if (fail) throw new TypeError('Network failure');
    return response([batman]);
  });
  await type('Batman'); await debounce();
  assert.match(document.querySelector('[role="alert"]').textContent, /Check your connection/);
  fail = false;
  await click('.error-state button'); await debounce();
  assert.equal(document.querySelector('.movie-title').textContent, 'Batman');
});

test('corrupt storage does not prevent application startup', async () => {
  await setup();
  await act(async () => root.unmount()); root = null;
  localStorage.setItem('movieshelf_favorites', '{bad json');
  await mount();
  assert.match(text(), /Popular Film/);
  await click('a[href="/favorites"]');
  assert.match(text(), /No favorite movies yet/);
});
