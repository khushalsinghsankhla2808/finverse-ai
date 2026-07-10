import React from 'react';
import PageTransition from '@/components/common/PageTransition';

export const SettingsPage: React.FC = () => {
  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Settings</h1>
          <p className="text-xs text-white/50 font-medium">Configure your FinVerse experience</p>
        </div>
        
        <div className="glassmorphism bg-bg-surface/30 p-8 border border-white/8 rounded-2xl flex flex-col items-center justify-center text-center">
          <p className="text-white/70">Settings configuration coming soon.</p>
        </div>
      </div>
    </PageTransition>
  );
};

export default SettingsPage;
