import { Link, NavLink, useNavigate } from 'react-router-dom';

export default function Navbar({ currentUser, onLogout }) {
  const navigate = useNavigate();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to={currentUser ? '/skill-swap' : '/login'}>
          Skill Swap Marketplace
        </Link>
        <div className="d-flex align-items-center gap-3 ms-auto">
          {currentUser ? (
            <>
              <NavLink
                className={({ isActive }) =>
                  `text-white text-decoration-none ${isActive ? 'fw-bold' : ''}`
                }
                to="/skill-swap"
              >
                Skill Swap
              </NavLink>
              <NavLink
                className={({ isActive }) =>
                  `text-white text-decoration-none ${isActive ? 'fw-bold' : ''}`
                }
                to="/dashboard"
              >
                Dashboard
              </NavLink>
              <span className="text-white-50 small">{currentUser.display_name}</span>
              <button
                type="button"
                className="btn btn-sm btn-light"
                onClick={() => {
                  onLogout();
                  navigate('/login');
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink className="text-white text-decoration-none" to="/login">
                Login
              </NavLink>
              <NavLink className="text-white text-decoration-none" to="/signup">
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
