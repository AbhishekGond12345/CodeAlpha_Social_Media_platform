import { useState } from 'react';
import { api } from '../lib/api.js';
import { usePosts } from '../lib/usePosts.js';
import Composer from '../components/Composer.jsx';
import PostList from '../components/PostList.jsx';

export default function Home() {
  const [scope, setScope] = useState('following');
  const state = usePosts((before) => api.feed(scope, before), scope);

  return (
    <>
      <header className="page-head">
        <h1>Home</h1>
        <div className="tabs" role="tablist" aria-label="Feed">
          {[['following', 'Following'], ['all', 'Everyone']].map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={scope === key} className={`tab ${scope === key ? 'is-on' : ''}`} onClick={() => setScope(key)}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <Composer onCreated={(p) => state.setPosts((l) => [p, ...l])} />

      <PostList
        state={state}
        empty={
          scope === 'following' ? (
            <>
              <p className="empty-title">Your feed is quiet</p>
              <p className="muted">Follow a few people, or post something yourself. Meanwhile, see what everyone is saying.</p>
              <button type="button" className="btn btn-quiet" onClick={() => setScope('all')}>Show everyone</button>
            </>
          ) : (
            <>
              <p className="empty-title">No posts yet</p>
              <p className="muted">Be the first. Write something above.</p>
            </>
          )
        }
      />
    </>
  );
}
