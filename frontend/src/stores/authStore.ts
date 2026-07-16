import { create } from 'zustand';
import type { AuthState, User } from '@/types/auth.types';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';
import authService from '@/services/authService';

// Helper to map backend user object to local frontend User model
const mapDBUser = (dbUser: any): User => ({
  id: dbUser.id || dbUser._id,
  name: dbUser.name,
  email: dbUser.email,
  avatarUrl: dbUser.avatar,
  plan: dbUser.plan === 'premium' ? 'Premium' : 'Free',
});

interface ExtendedAuthState extends AuthState {
  initializeAuth: () => () => void;
}

const getStoredUser = () => {
  const userStr = localStorage.getItem('finverse_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

export const useAuthStore = create<ExtendedAuthState>((set) => ({
  user: getStoredUser(),
  token: null,
  isAuthenticated: !!getStoredUser(),
  isLoading: true, // Start in loading state until initialized

  initializeAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const response = await authService.syncUser(token);
          const user = mapDBUser(response.data.user);

          localStorage.setItem('finverse_user', JSON.stringify(user));
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error syncing user during auth state change:', error);
          await signOut(auth);
          localStorage.removeItem('finverse_user');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        localStorage.removeItem('finverse_user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    return unsubscribe;
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      const response = await authService.syncUser(token);
      const user = mapDBUser(response.data.user);

      localStorage.setItem('finverse_user', JSON.stringify(user));
      set({
        user,
        token,
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await firebaseUpdateProfile(userCredential.user, { displayName: name });
      const token = await userCredential.user.getIdToken();
      const response = await authService.syncUser(token);
      const user = mapDBUser(response.data.user);

      localStorage.setItem('finverse_user', JSON.stringify(user));
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true });
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const token = await userCredential.user.getIdToken();
      const response = await authService.syncUser(token);
      const user = mapDBUser(response.data.user);

      localStorage.setItem('finverse_user', JSON.stringify(user));
      set({
        user,
        token,
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
      await signOut(auth);
      try {
        await authService.logout();
      } catch {
        // Ignore backend logout failures
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    }
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
