import { useState } from 'react';

function MovieCard({ movie, isFavorite, onToggleFavorite }) {
  const [failedPoster, setFailedPoster] = useState(null);
  const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
  return (
    <article className="movie-card">
      <div className="movie-poster">
        {poster && failedPoster !== poster ? <img src={poster} alt={`${movie.title} movie poster`}
          loading="lazy" onError={() => setFailedPoster(poster)} /> :
          <div className="poster-placeholder" role="img" aria-label={`No poster available for ${movie.title}`}>
            No poster available
          </div>}
      </div>
      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        <div className="movie-details">
          <span className="movie-rating">⭐ {Number.isFinite(movie.vote_average) ? movie.vote_average.toFixed(1) : 'N/A'}</span>
          <span className="movie-year">{movie.release_date?.slice(0, 4) || 'Year unknown'}</span>
        </div>
        <button type="button" className={`favorite-button${isFavorite ? ' favorited' : ''}`}
          aria-pressed={isFavorite} aria-label={`${isFavorite ? 'Remove' : 'Add'} ${movie.title} ${isFavorite ? 'from' : 'to'} favorites`}
          onClick={() => onToggleFavorite(movie)}>
          {isFavorite ? '♥ Remove from Favorites' : '♡ Add to Favorites'}
        </button>
      </div>
    </article>
  );
}
export default MovieCard;
