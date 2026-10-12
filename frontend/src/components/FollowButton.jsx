import { useState } from 'react';
import { api } from '../lib/api.js';

export default function FollowButton({ username, following, onChange, small }) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await api.follow(username);
      onChange?.(res);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`btn ${following ? 'btn-quiet' : 'btn-solid'} ${small ? 'btn-sm' : ''}`}
      onClick={toggle}
      disabled={busy}
      aria-pressed={following}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
