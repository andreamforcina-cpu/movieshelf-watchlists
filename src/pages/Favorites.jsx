import { Link } from 'react-router-dom';
import MovieGrid from '../components/MovieGrid';

function Favorites({ favorites, onToggleFavorite }) {
  return <main className="main-content">
    <div className="content-header"><h2>My Favorites</h2><p>Your saved movies collection</p></div>
    {favorites.length ? <MovieGrid movies={favorites} favorites={favorites} onToggleFavorite={onToggleFavorite} /> :
      <div className="empty-state"><p>No favorite movies yet. Start adding some from the home page!</p>
        <Link to="/" className="nav-link">Browse movies</Link></div>}
  </main>;
}
export default Favorites;
