export const FAVORITES_KEY = 'movieshelf_favorites';

export function readFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((movie, index, movies) =>
      movie && Number.isInteger(movie.id) && typeof movie.title === 'string' &&
      movies.findIndex(item => item?.id === movie.id) === index
    );
  } catch {
    // Invalid JSON or unavailable browser storage should not prevent startup.
    return [];
  }
}

export function toggleFavorite(movies, movie) {
  return movies.some(item => item.id === movie.id)
    ? movies.filter(item => item.id !== movie.id)
    : [...movies, movie];
}
