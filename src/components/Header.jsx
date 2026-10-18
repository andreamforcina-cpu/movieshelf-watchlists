import { Link, NavLink, useNavigate } from 'react-router-dom';

function Header({ searchQuery, setSearchQuery }) {
  const navigate = useNavigate();
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="app-title">MovieShelf</Link>
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/" end className="nav-link">Home</NavLink>
          <NavLink to="/favorites" className="nav-link">Favorites</NavLink>
        </nav>
        <form className="search-container" role="search" onSubmit={event => {
          event.preventDefault(); navigate('/');
        }}>
          <input type="search" aria-label="Search movies" placeholder="Search movies..."
            className="search-input" value={searchQuery} onChange={event => {
              setSearchQuery(event.target.value); navigate('/');
            }} />
          <button className="search-button" type="submit">Search</button>
        </form>
      </div>
    </header>
  );
}
export default Header;
