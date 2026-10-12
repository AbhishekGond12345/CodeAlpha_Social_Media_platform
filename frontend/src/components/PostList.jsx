import PostCard from './PostCard.jsx';

export default function PostList({ state, empty }) {
  const { posts, setPosts, loading, error, hasMore, loadMore } = state;
  return (
    <section aria-label="Posts">
      {error && <p className="error panel" role="alert">{error}</p>}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} onDelete={(id) => setPosts((list) => list.filter((x) => x.id !== id))} />
      ))}
      {!loading && !error && posts.length === 0 && <div className="empty">{empty}</div>}
      {loading && <p className="muted center pad">Loading…</p>}
      {hasMore && !loading && (
        <div className="center pad">
          <button type="button" className="btn btn-quiet" onClick={loadMore}>Show more</button>
        </div>
      )}
    </section>
  );
}
