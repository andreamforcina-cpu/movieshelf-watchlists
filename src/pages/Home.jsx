import { useEffect, useState } from 'react';
import MovieGrid from '../components/MovieGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { getPopularMovies } from '../services/movieService';

function Home({ query, search, onRetrySearch, favorites, onToggleFavorite }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const searching = Boolean(query);

  useEffect(() => {
    if (searching) return;
    const controller = new AbortController();
    let active = true;
    // Effects fetch data after rendering and cancel work when dependencies change.
    async function loadMovies() {
      setLoading(true);
      setError('');
      try {
        const results = await getPopularMovies({ signal: controller.signal });
        if (active) setMovies(results);
      } catch (error) {
        if (active && error.name !== 'AbortError') setError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadMovies();
    return () => { active = false; controller.abort(); };
  }, [searching, retryCount]);

  const visibleMovies = searching ? search.movies : movies;
  const pending = searching ? search.query !== query || search.loading : loading;
  const message = searching ? search.error : error;
  return (
    <main className="main-content">
      <div className="content-header">
        <h2>{searching ? `Search results for “${query}”` : 'Popular Movies'}</h2>
        <p>Discover and save your favorite films</p>
      </div>
      {pending ? <LoadingSpinner /> : message ? (
        <ErrorMessage message={message} onRetry={searching ? onRetrySearch :
          () => setRetryCount(count => count + 1)} />
      ) : visibleMovies.length ? (
        <MovieGrid movies={visibleMovies} favorites={favorites} onToggleFavorite={onToggleFavorite} />
      ) : <div className="empty-state" role="status"><p>{searching
        ? 'No movies matched your search. Try another title.' : 'No popular movies are available right now.'}</p></div>}
    </main>
  );
}
export default Home;
