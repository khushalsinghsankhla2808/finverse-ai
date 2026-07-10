import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import ToastContainer from '../common/ToastContainer';

export const AppLayout: React.FC = () => {
  const { sidebarCollapsed } = useUIStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-base text-white">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={() => setMobileSidebarOpen(false)} />

      {/* Top Header Bar */}
      <Topbar onOpenMobile={() => setMobileSidebarOpen(true)} />

      {/* Main Content Area */}
      <div
        className={cn(
          'transition-all duration-300 min-h-screen pt-16 pb-20 lg:pb-6',
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
        )}
      >
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Bottom Nav Bar (Mobile only) */}
      <MobileNav />

      {/* Global stacked toast notifications */}
      <ToastContainer />
    </div>
  );
};

export default AppLayout;
