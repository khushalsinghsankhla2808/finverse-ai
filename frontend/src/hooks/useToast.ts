import { useUIStore } from '@/stores/uiStore';

export const useToast = () => {
  const showToast = useUIStore((state) => state.showToast);
  return { showToast };
};

export default useToast;
