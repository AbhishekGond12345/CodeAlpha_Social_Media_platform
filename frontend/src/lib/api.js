import { mockApi } from './mockApi.js';
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'cobble_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function request(path, { method = 'GET', body } = {}) {
  const isForm = body instanceof FormData;
  const headers = isForm ? {} : { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: isForm ? body : body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the server. Check that the backend is running.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Something went wrong.');
    err.status = res.status;
    throw err;
  }
  return data;
}

const realApi = {
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  me: () => request('/auth/me'),

  feed: (scope, before) => request(`/posts?scope=${scope}${before ? `&before=${encodeURIComponent(before)}` : ''}`),
  createPost: (content, file) => {
    const form = new FormData();
    form.append('content', content);
    if (file) form.append('media', file);
    return request('/posts', { method: 'POST', body: form });
  },
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
  likePost: (id) => request(`/posts/${id}/like`, { method: 'POST' }),
  comments: (id) => request(`/posts/${id}/comments`),
  addComment: (id, content) => request(`/posts/${id}/comments`, { method: 'POST', body: { content } }),
  deleteComment: (id, cid) => request(`/posts/${id}/comments/${cid}`, { method: 'DELETE' }),

  profile: (username) => request(`/users/${username}`),
  userPosts: (username, before) => request(`/users/${username}/posts${before ? `?before=${encodeURIComponent(before)}` : ''}`),
  follow: (username) => request(`/users/${username}/follow`, { method: 'POST' }),
  suggestions: () => request('/users/suggestions'),
  updateProfile: (b) => request('/users/me', { method: 'PUT', body: b }),
};

export const api = import.meta.env.VITE_DEMO_MODE === 'true' ? mockApi : realApi;
