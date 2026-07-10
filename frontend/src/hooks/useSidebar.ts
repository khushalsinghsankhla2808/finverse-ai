import { useUIStore } from '@/stores/uiStore';
import { useShallow } from 'zustand/react/shallow';

export const useSidebar = () => {
  return useUIStore(
    useShallow((state) => ({
      sidebarCollapsed: state.sidebarCollapsed,
      toggleSidebar: state.toggleSidebar,
    }))
  );
};
