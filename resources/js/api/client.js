import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('apanih_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  let sid = localStorage.getItem('apanih_sid');
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('apanih_sid', sid);
  }
  config.headers['X-Session-Id'] = sid;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && location.pathname !== '/profile') {
      localStorage.removeItem('apanih_token');
    }
    return Promise.reject(err);
  }
);

export const fmtIDR = (n) =>
  'Rp ' + Number(n || 0).toLocaleString('id-ID');

export default api;
