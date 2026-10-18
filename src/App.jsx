import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Favorites from './pages/Favorites';
import { searchMovies } from './services/movieService';
import { FAVORITES_KEY, readFavorites, toggleFavorite } from './utils/favorites';
import './App.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [search, setSearch] = useState({ query: '', movies: [], loading: false, error: '' });
  const [retryCount, setRetryCount] = useState(0);
  const [favorites, setFavorites] = useState(readFavorites);
  const [storageError, setStorageError] = useState('');
  const query = searchQuery.trim();

  useEffect(() => {
    // Persist state after every change; storage can be blocked or full.
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      setStorageError('');
    } catch {
      setStorageError('Favorites work for this session, but browser storage is unavailable.');
    }
  }, [favorites]);

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    let active = true;
    // Wait 400ms so typing does not send a request for every keystroke.
    const timer = setTimeout(async () => {
      setSearch({ query, movies: [], loading: true, error: '' });
      try {
        const movies = await searchMovies(query, { signal: controller.signal });
        if (active) setSearch({ query, movies, loading: true, error: '' });
      } catch (error) {
        if (active && error.name !== 'AbortError') {
          setSearch({ query, movies: [], loading: true, error: error.message });
        }
      } finally {
        if (active) setSearch(current => ({ ...current, loading: false }));
      }
    }, 400);
    // Cleanup also prevents a stale response from replacing a newer search.
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [query, retryCount]);

  function onToggleFavorite(movie) {
    setFavorites(current => toggleFavorite(current, movie));
  }

  return (
    <Router>
      <div className="app">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        {storageError && <p className="storage-warning" role="status">{storageError}</p>}
        <Routes>
          <Route path="/" element={<Home query={query} search={search}
            onRetrySearch={() => setRetryCount(count => count + 1)}
            favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
          <Route path="/favorites" element={<Favorites favorites={favorites}
            onToggleFavorite={onToggleFavorite} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
