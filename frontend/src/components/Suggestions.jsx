import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import Avatar from './Avatar.jsx';
import FollowButton from './FollowButton.jsx';

export default function Suggestions() {
  const [users, setUsers] = useState(null);
  const [followed, setFollowed] = useState({});

  useEffect(() => {
    api.suggestions().then((d) => setUsers(d.users)).catch(() => setUsers([]));
  }, []);

  if (!users || users.length === 0) return null;

  return (
    <section className="panel" aria-label="People to follow">
      <h2 className="panel-title">People to follow</h2>
      <ul className="people">
        {users.map((u) => (
          <li key={u.id}>
            <Avatar user={u} size={36} />
            <Link to={`/u/${u.username}`} className="people-name">
              <span className="name">{u.displayName}</span>
              <span className="muted small">@{u.username}</span>
            </Link>
            <FollowButton small username={u.username} following={Boolean(followed[u.id])} onChange={(r) => setFollowed((f) => ({ ...f, [u.id]: r.following }))} />
          </li>
        ))}
      </ul>
    </section>
  );
}
