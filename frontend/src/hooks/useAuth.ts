import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/react/shallow';

export const useAuth = () => {
  return useAuthStore(
    useShallow((state) => ({
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      login: state.login,
      register: state.register,
      logout: state.logout,
      setUser: state.setUser,
    }))
  );
};
