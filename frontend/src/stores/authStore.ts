import { create } from 'zustand';
import type { AuthState, User } from '@/types/auth.types';
import authService from '@/services/authService';

const getStoredToken = () => localStorage.getItem('finverse_access_token');
const getStoredUser = () => {
  const userStr = localStorage.getItem('finverse_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authService.login({ email, password });
      const { user, accessToken, refreshToken } = res.data;

      localStorage.setItem('finverse_access_token', accessToken);
      localStorage.setItem('finverse_refresh_token', refreshToken);
      localStorage.setItem('finverse_user', JSON.stringify(user));

      set({
        user,
        token: accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const res = await authService.register({ name, email, password, confirmPassword: password });
      const { user, accessToken, refreshToken } = res.data;

      localStorage.setItem('finverse_access_token', accessToken);
      localStorage.setItem('finverse_refresh_token', refreshToken);
      localStorage.setItem('finverse_user', JSON.stringify(user));

      set({
        user,
        token: accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } catch {
      // Complete client logout anyway
    }
    localStorage.removeItem('finverse_access_token');
    localStorage.removeItem('finverse_refresh_token');
    localStorage.removeItem('finverse_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setUser: (user) => {
    localStorage.setItem('finverse_user', JSON.stringify(user));
    set({ user });
  },
}));
