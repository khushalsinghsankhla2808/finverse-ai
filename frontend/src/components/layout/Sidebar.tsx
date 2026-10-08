import React, { useMemo } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
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
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col justify-between border-r border-line bg-surface text-ink transition-transform duration-200 ease-in-out',
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0',
          sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-[260px]'
        )}
      >
        {/* Top Section */}
        <div>
          <div className="relative flex h-16 items-center px-4 border-b border-line">
            <div className={cn(
              "flex items-center overflow-hidden transition-all duration-200",
              sidebarCollapsed ? "justify-center w-full" : "justify-start"
            )}>
              <Logo />
            </div>

            {/* Collapse Toggle Button (Desktop only) */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex absolute -right-3 top-5 z-50 h-6 w-6 items-center justify-center rounded-[var(--radius-control)] border border-line bg-surface text-ink hover:bg-surface-sunken transition-colors cursor-pointer shadow-md"
            >
              <ChevronLeft size={14} className={cn("transition-transform duration-200", sidebarCollapsed && "rotate-180")} />
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
                    'group relative flex h-10 w-full items-center rounded-[var(--radius-control)] px-3 transition-all duration-150 cursor-pointer overflow-hidden',
                    isActive
                      ? 'bg-primary text-on-primary font-semibold'
                      : 'hover:bg-surface-sunken text-ink-muted hover:text-ink'
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex items-center justify-center shrink-0 transition-all duration-150',
                      sidebarCollapsed ? 'w-full' : 'mr-3'
                    )}
                  >
                    <Icon size={18} />
                  </div>

                  {/* Label */}
                  {!sidebarCollapsed && (
                    <div className="grow flex items-center justify-between min-w-0">
                      <span className="text-sm font-medium tracking-wide truncate">
                        {item.label}
                      </span>
                      {item.label === 'Transactions' && currentMonthTxnCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-surface-sunken text-ink border border-line rounded-[var(--radius-control)] leading-none shrink-0">
                          {currentMonthTxnCount}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tooltip on Collapsed */}
                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-surface border border-line text-xs font-medium text-ink rounded-[var(--radius-control)] opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 whitespace-nowrap">
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
          <div className="border-t border-line p-3 flex flex-col gap-1">
            {/* Settings Link */}
            <button
              onClick={() => handleNavClick({ icon: Settings, label: 'Settings', path: '/settings' })}
              className={cn(
                'group relative flex h-10 w-full items-center rounded-[var(--radius-control)] px-3 transition-all duration-150 cursor-pointer',
                location.pathname === '/settings'
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'hover:bg-surface-sunken text-ink-muted hover:text-ink'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center shrink-0 transition-all duration-150',
                  sidebarCollapsed ? 'w-full' : 'mr-3'
                )}
              >
                <Settings size={18} />
              </div>
              {!sidebarCollapsed && (
                <span className="text-sm font-medium tracking-wide">
                  Settings
                </span>
              )}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-surface border border-line text-xs font-medium text-ink rounded-[var(--radius-control)] opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 whitespace-nowrap">
                  Settings
                </div>
              )}
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="group relative flex h-10 w-full items-center rounded-[var(--radius-control)] px-3 hover:bg-red-500/10 text-ink-muted hover:text-loss transition-all duration-150 cursor-pointer"
            >
              <div
                className={cn(
                  'flex items-center justify-center shrink-0 transition-all duration-150',
                  sidebarCollapsed ? 'w-full' : 'mr-3'
                )}
              >
                <LogOut size={18} />
              </div>
              {!sidebarCollapsed && (
                <span className="text-sm font-medium tracking-wide">Logout</span>
              )}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-surface border border-line text-xs font-medium text-ink rounded-[var(--radius-control)] opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 whitespace-nowrap">
                  Logout
                </div>
              )}
            </button>
          </div>

          {/* User Profile Section */}
          <div className="border-t border-line p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-[var(--radius-control)] bg-primary text-on-primary text-xs font-bold">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-ink truncate leading-none mb-1">
                    {user?.name || 'User Profile'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[var(--radius-control)] font-bold bg-surface-sunken text-primary border border-line leading-none">
                      Active
                    </span>
                  </div>
                </div>
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3 text-[10px] text-ink-subtle pt-1 border-t border-line">
                <NavLink to="/privacy" className="hover:text-ink transition-colors">Privacy Policy</NavLink>
                <span>•</span>
                <NavLink to="/terms" className="hover:text-ink transition-colors">Terms</NavLink>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
