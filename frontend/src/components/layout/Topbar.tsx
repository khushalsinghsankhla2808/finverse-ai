import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Check,
  X,
  Plus,
  Target,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export const Topbar: React.FC<{ onOpenMobile: () => void }> = ({ onOpenMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const { notificationsOpen, setNotificationsOpen, sidebarCollapsed } = useUIStore();
  const { currencies, activeCurrency, setActiveCurrency } = useCurrencyStore();

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('topbar-search') as HTMLInputElement;
        searchInput?.focus();
      }
      if (e.key === 'Escape') {
        setSearchFocused(false);
        setCurrencyOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchFocused(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(target)) {
        setCurrencyOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRouteInfo = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return { title: 'Dashboard', crumb: 'Home / Dashboard' };
    if (path.startsWith('/transactions')) return { title: 'Transactions', crumb: 'Home / Transactions' };
    if (path.startsWith('/analytics')) return { title: 'Analytics', crumb: 'Home / Analytics' };
    if (path.startsWith('/budgets')) return { title: 'Budgets', crumb: 'Home / Budgets' };
    if (path.startsWith('/goals')) return { title: 'Goals', crumb: 'Home / Goals' };
    if (path.startsWith('/investments')) return { title: 'Investments', crumb: 'Home / Investments' };
    if (path.startsWith('/ai-assistant')) return { title: 'AI Assistant', crumb: 'Home / AI Assistant' };
    if (path.startsWith('/reports')) return { title: 'Reports', crumb: 'Home / Reports' };
    if (path.startsWith('/settings')) return { title: 'Settings', crumb: 'Home / Settings' };
    return { title: 'FinVerse AI', crumb: 'Home' };
  };

  const routeInfo = getRouteInfo();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notifications = [
    { id: 1, title: 'Budget Limit Alert', desc: 'You have spent 85% of your food budget.', time: '2 hours ago', unread: true },
    { id: 2, title: 'AI Portfolio Insight', desc: 'Slight optimization suggested for tech stock allocations.', time: '5 hours ago', unread: true },
    { id: 3, title: 'Deposit Confirmed', desc: 'Your monthly salary was deposited successfully.', time: '1 day ago', unread: false },
  ];

  return (
    <>
      <header
        className={cn(
          'fixed top-0 right-0 z-40 flex h-16 items-center justify-between border-b border-line bg-surface px-6 backdrop-blur-md transition-all duration-200',
          sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-[260px]',
          'left-0'
        )}
      >
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobile}
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-line bg-surface-sunken text-ink lg:hidden cursor-pointer"
          >
            <Menu size={20} />
          </button>
          
          <div className="hidden sm:flex flex-col">
            <h2 className="text-lg font-bold font-sans text-ink leading-none mb-1">
              {routeInfo.title}
            </h2>
            <span className="text-[10px] font-medium text-ink-subtle tracking-wider">
              {routeInfo.crumb}
            </span>
          </div>
        </div>

        {/* Center Section: Search Bar */}
        <div ref={searchRef} className="relative hidden md:block max-w-md w-full mx-4">
          <div
            className={cn(
              'relative flex h-10 items-center rounded-[var(--radius-control)] border bg-surface-sunken transition-all duration-150 px-3',
              searchFocused
                ? 'border-primary ring-2 ring-primary/20 w-[105%]'
                : 'border-line w-full'
            )}
          >
            <Search size={16} className="text-ink-subtle mr-2 shrink-0" />
            <input
              id="topbar-search"
              type="text"
              placeholder="Search transactions, categories, goals..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-subtle outline-none"
            />
            <span className="text-[10px] font-mono font-bold bg-surface px-1.5 py-0.5 rounded-[var(--radius-control)] text-ink-subtle border border-line shrink-0 ml-2">
              ⌘K
            </span>
          </div>

          {/* Search Dropdown Panel */}
          <AnimatePresence>
            {searchFocused && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
                className="absolute top-12 left-0 right-0 bg-surface rounded-[var(--radius-card)] border border-line p-4 max-h-[320px] overflow-y-auto z-50 flex flex-col gap-4"
              >
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle mb-2">Recent Searches</h4>
                  <div className="flex flex-col gap-1.5">
                    {['Recent transactions', 'Rent budget', 'AI Assistant insights'].map((term, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSearchValue(term);
                          setSearchFocused(false);
                        }}
                        className="text-left text-sm text-ink-muted hover:text-ink hover:bg-surface-sunken py-1 px-2 rounded-[var(--radius-control)] transition-colors cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-line pt-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle mb-2">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSearchFocused(false);
                        navigate('/transactions');
                      }}
                      className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink hover:bg-surface-sunken border border-line p-2 rounded-[var(--radius-control)] transition-all cursor-pointer"
                    >
                      <Plus size={14} className="amount-gain" /> Add Transaction
                    </button>
                    <button
                      onClick={() => {
                        setSearchFocused(false);
                        navigate('/goals');
                      }}
                      className="flex items-center gap-2 text-xs text-ink-muted hover:text-ink hover:bg-surface-sunken border border-line p-2 rounded-[var(--radius-control)] transition-all cursor-pointer"
                    >
                      <Target size={14} className="text-primary" /> Create Goal
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Currency Selector */}
          <div ref={currencyRef} className="relative">
            <button
              onClick={() => setCurrencyOpen(!currencyOpen)}
              className="flex items-center gap-1.5 h-10 px-3 rounded-[var(--radius-control)] border border-line bg-surface-sunken hover:bg-surface text-sm text-ink font-medium cursor-pointer"
            >
              <span>{activeCurrency.flag}</span>
              <span>{activeCurrency.code}</span>
              <ChevronDown size={14} className="text-ink-subtle ml-0.5" />
            </button>

            <AnimatePresence>
              {currencyOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-12 right-0 w-44 bg-surface border border-line rounded-[var(--radius-card)] p-1.5 shadow-lg z-50 flex flex-col"
                >
                  {currencies.map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => {
                        setActiveCurrency(curr.code);
                        setCurrencyOpen(false);
                      }}
                      className="flex items-center justify-between px-3 py-2 text-sm text-ink-muted hover:text-ink hover:bg-surface-sunken rounded-[var(--radius-control)] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>{curr.flag}</span>
                        <span className="font-semibold">{curr.code}</span>
                      </div>
                      {activeCurrency.code === curr.code && (
                        <Check size={14} className="text-primary" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border border-line bg-surface-sunken hover:bg-surface text-ink-muted hover:text-ink cursor-pointer transition-all"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-[var(--radius-control)] bg-primary" />
          </button>

          {/* User Profile Avatar */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] bg-primary text-on-primary text-xs font-bold border border-primary transition-all cursor-pointer"
            >
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-12 right-0 w-52 bg-surface border border-line rounded-[var(--radius-card)] p-2 shadow-lg z-50 flex flex-col gap-1"
                >
                  <div className="px-3 py-2 border-b border-line flex flex-col mb-1 select-none">
                    <span className="text-sm font-semibold text-ink truncate">{user?.name || 'User Profile'}</span>
                    <span className="text-xs text-ink-subtle truncate">{user?.email || 'user@example.com'}</span>
                  </div>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-muted hover:text-ink hover:bg-surface-sunken rounded-[var(--radius-control)] transition-colors cursor-pointer"
                  >
                    <UserIcon size={16} className="text-ink-subtle" /> Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-muted hover:text-ink hover:bg-surface-sunken rounded-[var(--radius-control)] transition-colors cursor-pointer"
                  >
                    <SettingsIcon size={16} className="text-ink-subtle" /> App Settings
                  </button>

                  <div className="border-t border-line mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-3 py-2 w-full text-sm text-loss hover:bg-red-500/10 rounded-[var(--radius-control)] transition-colors cursor-pointer"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Notifications Drawer */}
      <AnimatePresence>
        {notificationsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotificationsOpen(false)}
              className="fixed inset-0 z-50 bg-black"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2 }}
              className="fixed top-0 bottom-0 right-0 z-50 w-full max-w-sm border-l border-line bg-surface p-6 text-ink shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-line pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Bell size={20} className="text-primary" />
                    <h3 className="text-lg font-bold font-sans">Notifications</h3>
                  </div>
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-[var(--radius-control)] hover:bg-surface-sunken border border-line text-ink-subtle hover:text-ink cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'p-4 rounded-[var(--radius-card)] border border-line relative bg-surface-sunken hover:bg-surface transition-all duration-150',
                        notif.unread && 'border-primary/30'
                      )}
                    >
                      {notif.unread && (
                        <span className="absolute top-4 right-4 h-2 w-2 rounded-[var(--radius-control)] bg-primary" />
                      )}
                      <h4 className="text-sm font-semibold text-ink mb-1">{notif.title}</h4>
                      <p className="text-xs text-ink-muted leading-relaxed mb-2">{notif.desc}</p>
                      <span className="text-[10px] text-ink-subtle font-medium">{notif.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setNotificationsOpen(false)}
                className="btn btn-secondary w-full mt-4"
              >
                Mark all as read
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Topbar;
