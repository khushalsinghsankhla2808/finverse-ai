import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Target,
  MoreHorizontal,
  Wallet,
  TrendingUp,
  Bot,
  FileText,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export const MobileNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const mainTabs = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ArrowLeftRight, label: 'Txns', path: '/transactions' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Target, label: 'Goals', path: '/goals' },
  ];

  const moreItems = [
    { icon: Wallet, label: 'Budgets', path: '/budgets' },
    { icon: TrendingUp, label: 'Investments', path: '/investments' },
    { icon: Bot, label: 'AI Assistant', path: '/ai-assistant' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleTabClick = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    setMoreOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Bottom Nav Bar (Mobile Viewports Only) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-white/8 bg-bg-card/90 backdrop-blur-md flex items-center justify-around px-2 pb-safe lg:hidden">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;

          return (
            <button
              key={tab.path}
              onClick={() => handleTabClick(tab.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 h-full w-14 transition-colors cursor-pointer',
                isActive ? 'text-purple-light' : 'text-white/40 hover:text-white/70'
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
            </button>
          );
        })}

        {/* More Tab */}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center gap-1 h-full w-14 transition-colors cursor-pointer',
            moreOpen ? 'text-purple-light' : 'text-white/40 hover:text-white/70'
          )}
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-medium tracking-wide">More</span>
        </button>
      </div>

      {/* Slide-Up Sheet for "More" Navigation Items */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs lg:hidden"
            />

            {/* Slide-up Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-white/10 bg-bg-card p-6 pb-8 text-white flex flex-col gap-6 lg:hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-white">More Modules</h3>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="h-8 w-8 rounded-lg bg-white/5 border border-transparent hover:border-white/10 flex items-center justify-center text-white/50 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Grid of options */}
              <div className="grid grid-cols-3 gap-4">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        setMoreOpen(false);
                        navigate(item.path);
                      }}
                      className={cn(
                        'flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 cursor-pointer gap-2',
                        isActive
                          ? 'border-purple-primary bg-purple-primary/10 text-white'
                          : 'border-white/5 bg-white/2 text-white/60 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <Icon size={20} className={isActive ? 'text-purple-light' : ''} />
                      <span className="text-xs font-semibold text-center leading-tight truncate w-full">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Logout button */}
              <div className="border-t border-white/5 pt-4 mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-lg border border-red-negative/20 bg-red-negative/5 hover:bg-red-negative/10 text-red-negative font-semibold text-sm transition-all duration-150 cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNav;
