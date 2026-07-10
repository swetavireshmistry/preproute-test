import { create } from 'zustand';
import type { User } from '../types';
import { api } from '../services/api';
import { getApiErrorMessage } from '../utils/api';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (userId: string, password: string) => Promise<boolean>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (userId, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.login(userId, password);
      if ((response.success || response.status === 'success') && response.data) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        set({ isLoading: false, error: response.message || 'Login failed' });
        return false;
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = getApiErrorMessage(err, 'Invalid User ID or Password');
      set({ isLoading: false, error: errMsg });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  initialize: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({
          token,
          user,
          isAuthenticated: true,
        });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },
}));
