import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { joined } from '../lib/format.js';
import { usePosts } from '../lib/usePosts.js';
import { useAuth } from '../AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import FollowButton from '../components/FollowButton.jsx';
import PostList from '../components/PostList.jsx';

function EditProfile({ user, onSaved, onCancel }) {
  const [form, setForm] = useState({ displayName: user.displayName, bio: user.bio, avatarUrl: user.avatarUrl });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { user: updated } = await api.updateProfile(form);
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="edit-form" onSubmit={submit}>
      <label>Name<input value={form.displayName} onChange={set('displayName')} maxLength={40} required /></label>
      <label>Bio<textarea value={form.bio} onChange={set('bio')} maxLength={160} rows={3} /></label>
      <label>Avatar image URL<input value={form.avatarUrl} onChange={set('avatarUrl')} placeholder="https://…" /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <button className="btn btn-solid" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        <button type="button" className="btn btn-quiet" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function Profile() {
  const { username } = useParams();
  const { setUser } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('posts');
  const state = usePosts((before) => api.userPosts(username, before), username);

  useEffect(() => {
    setData(null);
    setError('');
    setEditing(false);
    setTab('posts');
    api.profile(username).then(setData).catch((e) => setError(e.message));
  }, [username]);

  if (error) return <div className="empty"><p className="empty-title">{error}</p></div>;
  if (!data) return <p className="muted center pad">Loading…</p>;

  const { user, stats, isFollowing, isMe } = data;

  return (
    <>
      <header className="profile">
        <div className="profile-top">
          <Avatar user={user} size={88} />
          <div className="profile-actions">
            {isMe ? (
              !editing && <button type="button" className="btn btn-quiet" onClick={() => setEditing(true)}>Edit profile</button>
            ) : (
              <FollowButton
                username={user.username}
                following={isFollowing}
                onChange={(r) => setData((d) => ({ ...d, isFollowing: r.following, stats: { ...d.stats, followers: r.followers } }))}
              />
            )}
          </div>
        </div>

        {editing ? (
          <EditProfile
            user={user}
            onCancel={() => setEditing(false)}
            onSaved={(u) => {
              setData((d) => ({ ...d, user: u }));
              setUser(u);
              setEditing(false);
            }}
          />
        ) : (
          <>
            <h1>{user.displayName}</h1>
            <p className="muted">@{user.username}</p>
            {user.bio && <p className="bio">{user.bio}</p>}
            <p className="muted small">Joined {joined(user.createdAt)}</p>
            <dl className="stats">
              <div><dt>Posts</dt><dd>{stats.posts}</dd></div>
              <div><dt>Followers</dt><dd>{stats.followers}</dd></div>
              <div><dt>Following</dt><dd>{stats.following}</dd></div>
            </dl>
          </>
        )}
      </header>

      <div className="tabs profile-tabs" role="tablist" aria-label="Profile sections">
        {[['posts', 'Posts'], ['media', 'Photos & videos']].map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={`tab ${tab === key ? 'is-on' : ''}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'media' ? (
        <section aria-label="Photos and videos">
          {state.posts.some((p) => p.media) ? (
            <ul className="media-grid">
              {state.posts.filter((p) => p.media).map((p) => (
                <li key={p.id}>
                  {p.media.type === 'video' ? (
                    <video src={p.media.url} controls playsInline preload="metadata" />
                  ) : (
                    <img src={p.media.url} alt={p.content || `Photo by ${p.author?.displayName}`} loading="lazy" />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            !state.loading && <div className="empty"><p className="empty-title">No photos or videos yet</p></div>
          )}
          {state.hasMore && !state.loading && (
            <div className="center pad"><button type="button" className="btn btn-quiet" onClick={state.loadMore}>Show more</button></div>
          )}
        </section>
      ) : (
      <PostList
        state={state}
        empty={<p className="empty-title">{isMe ? "You haven't posted yet" : `${user.displayName} hasn't posted yet`}</p>}
      />
      )}
    </>
  );
}
