const API_KEY = import.meta.env?.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env?.VITE_TMDB_BASE_URL;

async function requestMovies(path, query, signal) {
  if (!API_KEY || API_KEY === 'your_api_key_here' || !BASE_URL) {
    throw new Error('Add your TMDB API key and base URL to .env, then restart the app.');
  }
  try {
    const url = new URL(`${BASE_URL.replace(/\/$/, '')}${path}`);
    // URLSearchParams safely encodes search text and the API key.
    url.search = new URLSearchParams({ api_key: API_KEY, ...(query ? { query } : {}) });
    const response = await fetch(url, { signal });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('TMDB could not authorize this request. Check your API key in .env.');
      }
      throw new Error('The movie service is unavailable. Please try again shortly.');
    }
    const data = await response.json();
    if (!Array.isArray(data.results)) {
      throw new Error('The movie service returned an unexpected response. Please try again.');
    }
    return data.results;
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    if (error instanceof TypeError) {
      throw new Error('Unable to connect to TMDB. Check your connection and API configuration.');
    }
    throw error;
  }
}

export function getPopularMovies({ signal } = {}) {
  return requestMovies('/movie/popular', '', signal);
}

export function searchMovies(query, { signal } = {}) {
  const trimmed = query.trim();
  if (!trimmed) return Promise.resolve([]);
  return requestMovies('/search/movie', trimmed, signal);
}
