import { create } from 'zustand';
import api from '../api/client';

export const useToast = create((set) => ({
  toasts: [],
  push: (message, type = 'success') => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const useAuth = create((set) => ({
  user: JSON.parse(localStorage.getItem('apanih_user') || 'null'),
  token: localStorage.getItem('apanih_token'),
  loading: false,
  setAuth: (user, token) => {
    localStorage.setItem('apanih_user', JSON.stringify(user));
    localStorage.setItem('apanih_token', token);
    set({ user, token });
    useWishlist.getState().fetch().catch(() => {});
  },
  logout: async () => {
    try { await api.post('/logout'); } catch {}
    localStorage.removeItem('apanih_user');
    localStorage.removeItem('apanih_token');
    set({ user: null, token: null });
    useWishlist.setState({ ids: new Set(), items: [] });
  },
  fetchUser: async () => {
    try {
      const { data } = await api.get('/user');
      const user = data.data;
      localStorage.setItem('apanih_user', JSON.stringify(user));
      set({ user });
      return user;
    } catch { return null; }
  },
  updateProfile: async (payload) => {
    const { data } = await api.put('/user', payload);
    const user = data.data;
    localStorage.setItem('apanih_user', JSON.stringify(user));
    set({ user });
    useToast.getState().push('Profil diperbarui');
    return user;
  },
}));

export const useCart = create((set, get) => ({
  cart: { items: [], count: 0, subtotal: 0 },
  loading: false,
  fetch: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/cart');
      set({ cart: data.data });
    } finally { set({ loading: false }); }
  },
  add: async (product_id, qty = 1, variant_id = null) => {
    const { data } = await api.post('/cart/items', { product_id, qty, variant_id });
    set({ cart: data.data });
    useToast.getState().push('Siap checkout');
  },
  updateQty: async (id, qty) => {
    const { data } = await api.put(`/cart/items/${id}`, { qty });
    set({ cart: data.data });
  },
  remove: async (id) => {
    const { data } = await api.delete(`/cart/items/${id}`);
    set({ cart: data.data });
  },
  clearLocal: () => set({ cart: { items: [], count: 0, subtotal: 0 } }),
}));

export const useQuickView = create((set) => ({
  key: null,
  fallback: null,
  open: (key, fallback = null) => set({ key, fallback }),
  close: () => set({ key: null, fallback: null }),
}));

export const useWishlist = create((set) => ({
  ids: new Set(),
  items: [],
  fetch: async () => {
    try {
      const { data } = await api.get('/wishlist');
      set({ items: data.data, ids: new Set(data.data.map((p) => p.id)) });
    } catch {}
  },
  toggle: async (product) => {
    const { ids } = useWishlist.getState();
    if (ids.has(product.id)) {
      await api.delete(`/wishlist/${product.id}`);
      useToast.getState().push('Dihapus dari wishlist', 'info');
    } else {
      await api.post('/wishlist', { product_id: product.id });
      useToast.getState().push('Ditambahkan ke wishlist');
    }
    useWishlist.getState().fetch();
  },
}));
