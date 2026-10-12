import { useCallback, useEffect, useRef, useState } from 'react';

/** Cursor-paginated post list. `fetcher(cursor)` must return { posts, nextCursor }. Reloads when `key` changes. */
export function usePosts(fetcher, key) {
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setPosts([]);
    fetcherRef
      .current(null)
      .then((d) => {
        if (cancelled) return;
        setPosts(d.posts);
        setCursor(d.nextCursor);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [key]);

  const loadMore = useCallback(async () => {
    if (!cursor) return;
    setLoading(true);
    try {
      const d = await fetcherRef.current(cursor);
      setPosts((p) => [...p, ...d.posts]);
      setCursor(d.nextCursor);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  return { posts, setPosts, loading, error, hasMore: Boolean(cursor), loadMore };
}
