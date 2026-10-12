import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import Avatar from './Avatar.jsx';
import Suggestions from './Suggestions.jsx';

export default function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="shell">
      <nav className="rail" aria-label="Main">
        <NavLink to="/" className="brand"><span className="brand-mark" aria-hidden="true" />Cobble</NavLink>
        <NavLink to="/" end className="rail-link">Home</NavLink>
        <NavLink to={`/u/${user.username}`} className="rail-link">Profile</NavLink>
        <button type="button" className="rail-link rail-out" onClick={() => { logout(); navigate('/login'); }}>Log out</button>
        <div className="rail-user">
          <Avatar user={user} size={36} />
          <div>
            <p className="name">{user.displayName}</p>
            <p className="muted small">@{user.username}</p>
          </div>
        </div>
      </nav>
      <main className="column"><Outlet /></main>
      <aside className="side"><Suggestions /></aside>
    </div>
  );
}
