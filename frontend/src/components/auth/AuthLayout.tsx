import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex bg-ground text-ink relative">
      {/* Left Panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-3/5 relative flex-col justify-between p-12 band-brand on-dark border-r border-line">
        {/* Logo Section */}
        <div className="relative z-10 flex items-center gap-3">
          <Logo />
        </div>

        {/* Center Headline & Features */}
        <div className="relative z-10 max-w-xl my-auto">
          <h2 className="text-4xl font-sans font-bold leading-tight tracking-tight text-white mb-6">
            Track your money, budgets and investments in one place.
          </h2>
          
          <div className="flex flex-wrap gap-3">
            {['Expense Tracking', 'Budget Management', 'Investment Monitoring', 'AI Assistant'].map((feature, i) => (
              <div
                key={i}
                className="px-3 py-1 rounded border border-white/20 bg-white/10 text-xs font-semibold text-white"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-white/70 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} [OWNER NAME]. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-white transition-colors underline">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors underline">Terms & Conditions</Link>
          </div>
        </div>
      </div>

      {/* Right Panel (Form) */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center items-center p-6 sm:p-12 relative bg-ground">
        {/* Mobile Header */}
        <div className="lg:hidden flex flex-col items-center gap-2 mb-8 relative z-10">
          <Logo />
          <p className="text-xs text-ink-muted font-medium tracking-wide">Personal finance tracker for Indian investors</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-md card flex flex-col relative z-10">
          {children}
        </div>

        {/* Mobile Footer */}
        <div className="lg:hidden mt-8 text-xs text-ink-subtle flex items-center gap-4">
          <Link to="/privacy" className="hover:text-ink transition-colors underline">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-ink transition-colors underline">Terms & Conditions</Link>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
