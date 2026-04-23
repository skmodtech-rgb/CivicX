import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('civicx_user') || 'null'),
  token: localStorage.getItem('civicx_token') || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('civicx_token', data.token);
      localStorage.setItem('civicx_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('civicx_token', data.token);
      localStorage.setItem('civicx_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      set({ loading: false, error: msg });
      throw new Error(msg);
    }
  },

  fetchProfile: async () => {
    try {
      const { data } = await api.get('/auth/me');
      localStorage.setItem('civicx_user', JSON.stringify(data.user));
      set({ user: data.user });
    } catch { /* silent */ }
  },

  logout: () => {
    localStorage.removeItem('civicx_token');
    localStorage.removeItem('civicx_user');
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
  
  syncUser: (userData) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...userData };
    localStorage.setItem('civicx_user', JSON.stringify(updated));
    set({ user: updated });
  }
}));

export const useComplaintStore = create((set) => ({
  complaints: [],
  currentComplaint: null,
  loading: false,
  pagination: null,

  fetchComplaints: async (params = {}) => {
    set({ loading: true });
    try {
      const { data } = await api.get('/complaints', { params });
      set({ complaints: data.complaints, pagination: data.pagination, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchComplaint: async (id) => {
    set({ loading: true });
    try {
      const { data } = await api.get(`/complaints/${id}`);
      set({ currentComplaint: data.complaint, loading: false });
      return data.complaint;
    } catch {
      set({ loading: false });
    }
  },

  submitComplaint: async (complaintData) => {
    const isFormData = complaintData instanceof FormData;
    const { data } = await api.post('/complaints', complaintData, isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {});

    // Immediately sync updated points into auth store
    if (data.user) {
      useAuthStore.getState().syncUser(data.user);
    }

    return data;
  },

  voteComplaint: async (id, type) => {
    const { data } = await api.post(`/complaints/${id}/vote`, { type });
    return data;
  },

  setCurrentComplaint: (c) => set({ currentComplaint: c })
}));

export const useUIStore = create((set) => ({
  theme: localStorage.getItem('civicx_theme') || 'dark',
  sidebarOpen: true,
  modalOpen: null,

  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('civicx_theme', next);
    document.documentElement.setAttribute('data-theme', next);
    return { theme: next };
  }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: (name) => set({ modalOpen: name }),
  closeModal: () => set({ modalOpen: null })
}));
