import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { readFavorites, toggleFavorite, FAVORITES_KEY } from '../src/utils/favorites.js';

const originalFetch = globalThis.fetch;
const source = await readFile(new URL('../src/services/movieService.js', import.meta.url), 'utf8');
async function service(env = { VITE_TMDB_API_KEY: 'mock-key', VITE_TMDB_BASE_URL: 'https://example.test/3' }) {
  const code = source.replaceAll('import.meta.env', `(${JSON.stringify(env)})`);
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
const api = await service();
const movie = { id: 1, title: 'Batman', poster_path: '/batman.jpg', release_date: '1989-06-23', vote_average: 7.5 };
after(() => { globalThis.fetch = originalFetch; delete globalThis.localStorage; });

test('popular endpoint returns TMDB results and forwards cancellation signal', async () => {
  const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    assert.equal(url.pathname, '/3/movie/popular');
    assert.equal(url.searchParams.get('api_key'), 'mock-key');
    assert.equal(options.signal, controller.signal);
    return { ok: true, json: async () => ({ results: [movie] }) };
  };
  assert.deepEqual(await api.getPopularMovies({ signal: controller.signal }), [movie]);
});
test('Batman searches trim and encode special characters', async () => {
  globalThis.fetch = async url => {
    assert.equal(url.pathname, '/3/search/movie');
    assert.equal(url.searchParams.get('query'), 'Batman & Robin?');
    return { ok: true, json: async () => ({ results: [movie] }) };
  };
  assert.deepEqual(await api.searchMovies('  Batman & Robin?  '), [movie]);
});
test('empty search makes no request', async () => {
  globalThis.fetch = () => assert.fail('Unexpected request');
  assert.deepEqual(await api.searchMovies('   '), []);
});
test('empty API results are returned', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ results: [] }) });
  assert.deepEqual(await api.searchMovies('no-match'), []);
});
test('invalid credentials produce a safe error', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 401 });
  await assert.rejects(api.getPopularMovies(), /Check your API key/);
});
test('service failure produces a retryable error', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 503 });
  await assert.rejects(api.getPopularMovies(), /unavailable/);
});
test('network failures produce a friendly error', async () => {
  globalThis.fetch = async () => { throw new TypeError('private network details'); };
  await assert.rejects(api.getPopularMovies(), /Check your connection/);
});
test('malformed responses are rejected', async () => {
  globalThis.fetch = async () => ({ ok: true, json: async () => ({}) });
  await assert.rejects(api.getPopularMovies(), /unexpected response/);
});
test('request cancellation remains distinguishable', async () => {
  globalThis.fetch = async () => { throw new DOMException('Cancelled', 'AbortError'); };
  await assert.rejects(api.getPopularMovies(), { name: 'AbortError' });
});
test('missing configuration makes no request', async () => {
  globalThis.fetch = () => assert.fail('Unexpected request');
  await assert.rejects((await service({})).getPopularMovies(), /restart the app/);
});
test('favorites add and remove by ID without duplicates', () => {
  const added = toggleFavorite([], movie);
  assert.deepEqual(added, [movie]);
  assert.deepEqual(toggleFavorite(added, { ...movie }), []);
});
test('favorites reload from browser storage and deduplicate IDs', () => {
  globalThis.localStorage = { getItem: key => {
    assert.equal(key, FAVORITES_KEY);
    return JSON.stringify([movie, movie, null, { title: 'Invalid' }]);
  } };
  assert.deepEqual(readFavorites(), [movie]);
});
test('corrupt, wrong-shape, and inaccessible storage are safe', () => {
  for (const raw of ['invalid JSON', '{}', 'null']) {
    globalThis.localStorage = { getItem: () => raw };
    assert.deepEqual(readFavorites(), []);
  }
  globalThis.localStorage = { getItem: () => { throw new Error('blocked'); } };
  assert.deepEqual(readFavorites(), []);
});
test('components render posters, favorite feedback, accessible loading and error states', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    const { default: MovieCard } = await server.ssrLoadModule('/src/components/MovieCard.jsx');
    const card = renderToStaticMarkup(createElement(MovieCard, { movie, isFavorite: true, onToggleFavorite() {} }));
    assert.match(card, /https:\/\/image.tmdb.org\/t\/p\/w500\/batman.jpg/);
    assert.match(card, /loading="lazy"/);
    assert.match(card, /1989/);
    assert.match(card, /aria-pressed="true"/);
    const fallback = renderToStaticMarkup(createElement(MovieCard, { movie: { id: 2, title: 'Unknown' } }));
    assert.match(fallback, /No poster available/);
    assert.match(fallback, /Year unknown/);
    const { default: LoadingSpinner } = await server.ssrLoadModule('/src/components/LoadingSpinner.jsx');
    assert.match(renderToStaticMarkup(createElement(LoadingSpinner)), /role="status"/);
    const { default: ErrorMessage } = await server.ssrLoadModule('/src/components/ErrorMessage.jsx');
    assert.match(renderToStaticMarkup(createElement(ErrorMessage, { message: 'Try later', onRetry() {} })), /Try again/);
  } finally { await server.close(); }
});
