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
  const [shakeBell, setShakeBell] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Trigger bell shake animation on mount (or when notifications arrive)
  useEffect(() => {
    setShakeBell(true);
    const timer = setTimeout(() => setShakeBell(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcut for Search (⌘K / Ctrl+K)
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

  // Close dropdowns on click outside
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

  // Dynamic Route Title & Breadcrumb mapping
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

  // Mock Notifications list
  const mockNotifications = [
    { id: 1, title: 'Budget Limit Alert', desc: 'You have spent 85% of your food budget.', time: '2 hours ago', unread: true },
    { id: 2, title: 'AI Portfolio Insight', desc: 'Slight optimization suggested for tech stock allocations.', time: '5 hours ago', unread: true },
    { id: 3, title: 'Deposit Confirmed', desc: 'Your monthly salary was deposited successfully.', time: '1 day ago', unread: false },
  ];

  return (
    <>
      <header
        className={cn(
          'fixed top-0 right-0 z-40 flex h-16 items-center justify-between border-b border-white/8 bg-bg-base/80 px-6 backdrop-blur-md transition-all duration-300',
          sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-[260px]',
          'left-0'
        )}
      >
        {/* Left Section: Title & Breadcrumbs */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger */}
          <button
            onClick={onOpenMobile}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/3 text-white lg:hidden cursor-pointer"
          >
            <Menu size={20} />
          </button>
          
          <div className="hidden sm:flex flex-col">
            <h2 className="text-lg font-bold font-display text-white leading-none mb-1">
              {routeInfo.title}
            </h2>
            <span className="text-[10px] font-medium text-white/40 tracking-wider">
              {routeInfo.crumb}
            </span>
          </div>
        </div>

        {/* Center Section: Search Bar */}
        <div ref={searchRef} className="relative hidden md:block max-w-md w-full mx-4">
          <div
            className={cn(
              'relative flex h-10 items-center rounded-lg border bg-white/3 transition-all duration-200 px-3',
              searchFocused
                ? 'border-purple-primary ring-2 ring-purple-primary/20 w-[105%]'
                : 'border-white/10 w-full'
            )}
          >
            <Search size={16} className="text-white/40 mr-2 shrink-0" />
            <input
              id="topbar-search"
              type="text"
              placeholder="Search transactions, categories, goals..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
            />
            <span className="text-[10px] font-mono font-bold bg-white/8 px-1.5 py-0.5 rounded text-white/40 border border-white/5 shrink-0 ml-2">
              ⌘K
            </span>
          </div>

          {/* Search Dropdown Panel */}
          <AnimatePresence>
            {searchFocused && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-12 left-0 right-0 glassmorphism rounded-xl border border-white/10 p-4 max-h-[320px] overflow-y-auto z-50 shadow-glow-purple/10 flex flex-col gap-4"
              >
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/35 mb-2">Recent Searches</h4>
                  <div className="flex flex-col gap-1.5">
                    {['Amazon purchase', 'Rent May 2026', 'AI Assistant suggestions'].map((term, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSearchValue(term);
                          setSearchFocused(false);
                        }}
                        className="text-left text-sm text-white/70 hover:text-white hover:bg-white/5 py-1 px-2 rounded-md transition-colors cursor-pointer"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/35 mb-2">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSearchFocused(false);
                        navigate('/transactions');
                      }}
                      className="flex items-center gap-2 text-xs text-white/70 hover:text-white hover:bg-purple-primary/10 hover:border-purple-primary/30 border border-white/5 p-2 rounded-lg transition-all cursor-pointer"
                    >
                      <Plus size={14} className="text-green-positive" /> Add Transaction
                    </button>
                    <button
                      onClick={() => {
                        setSearchFocused(false);
                        navigate('/goals');
                      }}
                      className="flex items-center gap-2 text-xs text-white/70 hover:text-white hover:bg-purple-primary/10 hover:border-purple-primary/30 border border-white/5 p-2 rounded-lg transition-all cursor-pointer"
                    >
                      <Target size={14} className="text-gold-savings" /> Create Goal
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Section: Actions & Avatar */}
        <div className="flex items-center gap-4">
          {/* Currency Selector */}
          <div ref={currencyRef} className="relative">
            <button
              onClick={() => setCurrencyOpen(!currencyOpen)}
              className="flex items-center gap-1.5 h-10 px-3 rounded-lg border border-white/10 bg-white/3 hover:bg-white/5 hover:border-white/15 text-sm text-white font-medium cursor-pointer"
            >
              <span>{activeCurrency.flag}</span>
              <span>{activeCurrency.code}</span>
              <ChevronDown size={14} className="text-white/40 ml-0.5" />
            </button>

            <AnimatePresence>
              {currencyOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-12 right-0 w-44 glassmorphism border border-white/10 rounded-xl p-1.5 shadow-lg shadow-black/40 z-50 flex flex-col"
                >
                  {currencies.map((curr) => (
                    <button
                      key={curr.code}
                      onClick={() => {
                        setActiveCurrency(curr.code);
                        setCurrencyOpen(false);
                      }}
                      className="flex items-center justify-between px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-purple-primary/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>{curr.flag}</span>
                        <span className="font-semibold">{curr.code}</span>
                      </div>
                      {activeCurrency.code === curr.code && (
                        <Check size={14} className="text-purple-primary" />
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
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/3 hover:bg-white/5 text-white/70 hover:text-white cursor-pointer transition-all',
              shakeBell && 'animate-bell-shake'
            )}
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-negative shadow-glow-red" />
          </button>

          {/* User Profile Avatar */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-primary text-white text-xs font-bold border border-purple-light/20 hover:border-purple-light/50 transition-all cursor-pointer shadow-glow-purple/10"
            >
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-12 right-0 w-52 glassmorphism border border-white/10 rounded-xl p-2 shadow-lg shadow-black/40 z-50 flex flex-col gap-1"
                >
                  <div className="px-3 py-2 border-b border-white/5 flex flex-col mb-1 select-none">
                    <span className="text-sm font-semibold text-white truncate">{user?.name || 'User Profile'}</span>
                    <span className="text-xs text-white/40 truncate">{user?.email || 'user@example.com'}</span>
                  </div>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  >
                    <UserIcon size={16} className="text-white/40" /> Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                  >
                    <SettingsIcon size={16} className="text-white/40" /> App Settings
                  </button>

                  <div className="border-t border-white/5 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 px-3 py-2 w-full text-sm text-red-negative/80 hover:text-red-negative hover:bg-red-negative/10 rounded-lg transition-colors cursor-pointer"
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

      {/* Notifications Drawer (Slide-in from Right) */}
      <AnimatePresence>
        {notificationsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setNotificationsOpen(false)}
              className="fixed inset-0 z-50 bg-black backdrop-blur-xs"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 right-0 z-50 w-full max-w-sm glassmorphism border-l border-white/10 bg-bg-card p-6 text-white shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Bell size={20} className="text-purple-light" />
                    <h3 className="text-lg font-bold font-display">Notifications</h3>
                  </div>
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 text-white/50 hover:text-white cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {mockNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'p-4 rounded-xl border border-white/5 relative bg-white/2 hover:bg-white/5 transition-all duration-200',
                        notif.unread && 'border-purple-primary/20 bg-purple-primary/5'
                      )}
                    >
                      {notif.unread && (
                        <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-purple-light" />
                      )}
                      <h4 className="text-sm font-semibold text-white mb-1">{notif.title}</h4>
                      <p className="text-xs text-white/60 leading-relaxed mb-2">{notif.desc}</p>
                      <span className="text-[10px] text-white/35 font-medium">{notif.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setNotificationsOpen(false)}
                className="w-full h-11 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 text-sm font-medium transition-colors cursor-pointer"
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
