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
    <div className="min-h-screen w-full flex bg-bg-base text-white relative">
      {/* Left Panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden flex-col justify-between p-12 bg-linear-to-br from-[#0c051a] via-[#050810] to-[#031525] animate-gradient-shift">
        {/* Shifting radial overlays to create gradient mesh */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-purple-primary/30 blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-[-10%] right-[-15%] w-[70%] h-[70%] rounded-full bg-cyan-data/20 blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
        </div>

        {/* Logo Section */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo.png" alt="FinVerse AI Logo" className="h-10 object-contain" />
        </div>

        {/* Center Tagline & Showcase */}
        <div className="relative z-10 max-w-xl my-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-5xl font-display font-bold leading-tight tracking-tight bg-linear-to-r from-white via-white to-purple-light bg-clip-text text-transparent mb-6"
          >
            Navigate Your Wealth in <span className="text-cyan-data">3D</span> and Powered by <span className="text-purple-light">AI</span>.
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
                className="px-4 py-2 rounded-full border border-white/8 bg-white/3 backdrop-blur-md text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 transition-all duration-300 shadow-sm"
              >
                {pill}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-white/30">
          &copy; {new Date().getFullYear()} FinVerse AI. All rights reserved.
        </div>
      </div>

      {/* Right Panel (Form) */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        {/* Background blobs for mobile backdrop */}
        <div className="absolute top-1/4 left-1/4 w-60 h-60 rounded-full bg-purple-primary/10 blur-[80px] lg:hidden" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 rounded-full bg-blue-primary/10 blur-[80px] lg:hidden" />

        {/* Mobile Header */}
        <div className="lg:hidden flex flex-col items-center gap-2 mb-8 relative z-10">
          <img src="/logo.png" alt="FinVerse AI Logo" className="h-12 object-contain" />
          <p className="text-xs text-purple-light/80 font-medium tracking-wide uppercase">AI-Powered 3D Finance Tracker</p>
        </div>

        {/* Glassmorphism Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md glassmorphism rounded-2xl p-6 sm:p-8 flex flex-col relative z-10 shadow-glow-purple/5"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthLayout;
