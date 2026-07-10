import { useUIStore } from '@/stores/uiStore';
import { useShallow } from 'zustand/react/shallow';

export const useTheme = () => {
  return useUIStore(
    useShallow((state) => ({
      theme: state.theme,
      setTheme: state.setTheme,
    }))
  );
};
