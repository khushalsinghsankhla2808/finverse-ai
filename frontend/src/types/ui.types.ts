export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

export interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  toasts: Toast[];
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
  dismissToast: (id: string) => void;
}
