import React from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const pillVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen w-full flex bg-[#262A31] text-white relative">
      {/* Left Panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden flex-col justify-between p-12 bg-linear-to-br from-[#262A31] to-[#1B1E23]">
        {/* Two blurred circles behind left panel content */}
        <div className="absolute top-12 left-12 w-80 h-80 rounded-full bg-[#FF9A6B]/25 blur-3xl pointer-events-none" />
        <div className="absolute bottom-12 right-12 w-80 h-80 rounded-full bg-[#2DD4BF]/25 blur-3xl pointer-events-none" />

        {/* Logo Section */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo.png" alt="FinVerse AI Logo" className="h-20 object-contain" />
        </div>

        {/* Center Tagline & Showcase */}
        <div className="relative z-10 max-w-xl my-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-5xl font-display font-bold leading-tight tracking-tight text-white mb-6"
          >
            Navigate Your Wealth in <span className="text-[#2DD4BF] font-bold">3D</span> and Powered by <span className="bg-linear-to-r from-[#FF9A6B] to-[#FF6B9D] bg-clip-text text-transparent font-bold">AI</span>.
          </motion.h2>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap gap-3"
          >
            {['AI-Powered Insights', '3D Visualization', 'Smart Budgeting'].map((pill, i) => (
              <motion.div
                key={i}
                variants={pillVariants}
                className="px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 shadow-sm"
              >
                {pill}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-[#A3ABB8]">
          &copy; {new Date().getFullYear()} FinVerse AI. All rights reserved.
        </div>
      </div>

      {/* Right Panel (Form) */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center items-center p-6 sm:p-12 relative bg-[#262A31]">
        {/* Blurred circles for backdrop */}
        <div className="absolute top-1/4 left-1/4 w-60 h-60 rounded-full bg-[#FF9A6B]/25 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 rounded-full bg-[#2DD4BF]/25 blur-3xl pointer-events-none" />

        {/* Mobile Header */}
        <div className="lg:hidden flex flex-col items-center gap-2 mb-8 relative z-10">
          <img src="/logo.png" alt="FinVerse AI Logo" className="h-16 object-contain" />
          <p className="text-xs text-[#FF9A6B] font-medium tracking-wide uppercase">AI-Powered 3D Finance Tracker</p>
        </div>

        {/* Glassmorphism Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md bg-[rgba(47,52,60,0.65)] backdrop-blur-xl border border-white/8 rounded-2xl p-6 sm:p-8 flex flex-col relative z-10 shadow-[0_0_40px_rgba(255,154,107,0.15)]"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
