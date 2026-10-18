import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="app-title">MovieShelf</Link>
        <nav className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/favorites" className="nav-link">Favorites</Link>
        </nav>
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search movies..."
            className="search-input"
          />
          <button className="search-button">Search</button>
        </div>
      </div>
    </header>
  );
};

export default Header;