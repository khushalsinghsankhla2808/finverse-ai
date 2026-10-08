import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
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
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden flex-col justify-between p-12 bg-[#262A31] border-r border-white/8">
        {/* Logo Section */}
        <div className="relative z-10 flex items-center gap-3">
          <Logo />
        </div>

        {/* Center Headline & Features */}
        <div className="relative z-10 max-w-xl my-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-4xl font-display font-bold leading-tight tracking-tight text-white mb-6"
          >
            Track expenses, manage budgets, monitor investments, and consult an AI advisor. Built for Indian investors in INR.
          </motion.h2>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap gap-3"
          >
            {['Expense Tracking', 'Budget Management', 'Investment Monitoring', 'AI Financial Advice'].map((feature, i) => (
              <motion.div
                key={i}
                variants={pillVariants}
                className="px-3.5 py-1.5 rounded-md border border-white/10 bg-white/5 text-xs font-semibold text-white/90 hover:text-white transition-all duration-200"
              >
                {feature}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-[#A3ABB8] flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} FinVerse AI. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors underline">Terms & Conditions</Link>
          </div>
        </div>
      </div>

      {/* Right Panel (Form) */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center items-center p-6 sm:p-12 relative bg-[#262A31]">
        {/* Mobile Header */}
        <div className="lg:hidden flex flex-col items-center gap-2 mb-8 relative z-10">
          <Logo />
          <p className="text-xs text-[#FF9A6B] font-medium tracking-wide uppercase">Personal Finance for Indian Investors</p>
        </div>

        {/* Glassmorphism Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md bg-[rgba(47,52,60,0.65)] backdrop-blur-xl border border-white/8 rounded-lg p-6 sm:p-8 flex flex-col relative z-10 shadow-lg"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
