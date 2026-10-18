import MovieCard from './MovieCard';

function MovieGrid({ movies, favorites, onToggleFavorite }) {
  return <div className="movie-grid">
    {movies.map(movie => <MovieCard key={movie.id} movie={movie}
      isFavorite={favorites.some(item => item.id === movie.id)}
      onToggleFavorite={onToggleFavorite} />)}
  </div>;
}
export default MovieGrid;
