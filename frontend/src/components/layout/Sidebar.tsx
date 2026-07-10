import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Wallet,
  Target,
  TrendingUp,
  Bot,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useFinanceStore } from '@/stores/financeStore';

interface NavItem {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  path: string;
  action?: () => void;
}

export const Sidebar: React.FC<{ mobileOpen?: boolean; onCloseMobile?: () => void }> = ({
  mobileOpen = false,
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const { transactions } = useFinanceStore();

  const currentMonthTxnCount = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }).length;
  }, [transactions]);

  const mainNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ArrowLeftRight, label: 'Transactions', path: '/transactions' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Wallet, label: 'Budgets', path: '/budgets' },
    { icon: Target, label: 'Goals', path: '/goals' },
    { icon: TrendingUp, label: 'Investments', path: '/investments' },
    { icon: Bot, label: 'AI Assistant', path: '/ai-assistant' },
    { icon: FileText, label: 'Reports', path: '/reports' },
  ];

  const handleNavClick = (item: NavItem) => {
    if (item.action) {
      item.action();
    } else {
      navigate(item.path);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Outer variants for expanded/collapsed width
  const sidebarVariants = {
    expanded: { width: 260 },
    collapsed: { width: 72 },
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={mobileOpen ? { x: 0, width: 260 } : { x: 0 }}
        variants={sidebarVariants}
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between border-r border-white/8 bg-bg-card text-white/70 transition-transform duration-300 ease-in-out',
          // Mobile state overrides
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0',
          sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'
        )}
      >
        {/* Top Section */}
        <div>
          <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-tr from-purple-primary to-blue-primary shadow-glow-purple">
                <span className="font-display font-extrabold text-sm text-white">FV</span>
              </div>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col"
                >
                  <span className="font-display text-sm font-bold tracking-wide text-white">FinVerse</span>
                  <span className="text-[10px] text-white/40 tracking-wider font-medium uppercase leading-tight">
                    AI-Powered Finance
                  </span>
                </motion.div>
              )}
            </div>

            {/* Collapse Toggle Button (Desktop only) */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <motion.div
                animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChevronLeft size={14} />
              </motion.div>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1 p-3">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item)}
                  className={cn(
                    'group relative flex h-10 w-full items-center rounded-lg px-3 transition-all duration-150 cursor-pointer overflow-hidden',
                    isActive
                      ? 'bg-purple-primary/15 text-white border-l-3 border-purple-primary shadow-[inset_4px_0_12px_rgba(124,58,237,0.1)]'
                      : 'hover:bg-purple-primary/8 hover:text-white/90 text-white/60'
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex items-center justify-center shrink-0 transition-all duration-150',
                      isActive ? 'text-purple-primary scale-110' : 'group-hover:brightness-130',
                      sidebarCollapsed ? 'w-full' : 'mr-3'
                    )}
                  >
                    <Icon size={18} />
                  </div>

                  {/* Label */}
                  {!sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      className="grow flex items-center justify-between min-w-0"
                    >
                      <span className="text-sm font-medium tracking-wide group-hover:translate-x-[2px] transition-transform duration-150 truncate">
                        {item.label}
                      </span>
                      {item.label === 'Transactions' && currentMonthTxnCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-purple-primary text-white rounded-full leading-none shrink-0 shadow-glow-purple/20">
                          {currentMonthTxnCount}
                        </span>
                      )}
                    </motion.div>
                  )}

                  {/* Tooltip on Collapsed */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-bg-overlay border border-white/10 text-xs font-medium text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-glow-purple/10 whitespace-nowrap">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div>
          <div className="border-t border-white/5 p-3 flex flex-col gap-1">
            {/* Settings Link */}
            <button
              onClick={() => handleNavClick({ icon: Settings, label: 'Settings', path: '/settings' })}
              className={cn(
                'group relative flex h-10 w-full items-center rounded-lg px-3 transition-all duration-150 cursor-pointer',
                location.pathname === '/settings'
                  ? 'bg-purple-primary/15 text-white border-l-3 border-purple-primary'
                  : 'hover:bg-purple-primary/8 hover:text-white/90 text-white/60'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center shrink-0 transition-all duration-150',
                  location.pathname === '/settings' ? 'text-purple-primary scale-110' : 'group-hover:brightness-130',
                  sidebarCollapsed ? 'w-full' : 'mr-3'
                )}
              >
                <Settings size={18} />
              </div>
              {!sidebarCollapsed && (
                <span className="text-sm font-medium tracking-wide group-hover:translate-x-[2px] transition-transform duration-150">
                  Settings
                </span>
              )}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-bg-overlay border border-white/10 text-xs font-medium text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-glow-purple/10 whitespace-nowrap">
                  Settings
                </div>
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="group relative flex h-10 w-full items-center rounded-lg px-3 hover:bg-red-negative/10 text-white/60 hover:text-red-negative transition-all duration-150 cursor-pointer"
            >
              <div
                className={cn(
                  'flex items-center justify-center shrink-0 transition-all duration-150 group-hover:brightness-130',
                  sidebarCollapsed ? 'w-full' : 'mr-3'
                )}
              >
                <LogOut size={18} />
              </div>
              {!sidebarCollapsed && (
                <span className="text-sm font-medium tracking-wide">Logout</span>
              )}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-bg-overlay border border-white/10 text-xs font-medium text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-glow-red/10 whitespace-nowrap">
                  Logout
                </div>
              )}
            </button>
          </div>

          {/* User Profile Section */}
          <div className="border-t border-white/5 p-4 flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full bg-purple-primary text-white text-xs font-bold shadow-[0_0_12px_rgba(124,58,237,0.3)]">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
              </div>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  className="flex flex-col min-w-0"
                >
                  <span className="text-sm font-semibold text-white truncate leading-none mb-1">
                    {user?.name || 'User Profile'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-linear-to-r from-gold-savings to-gold-light text-bg-base leading-none shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                      Premium
                    </span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-negative opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-negative"></span>
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
