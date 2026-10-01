import React from 'react';
import { cn } from '@/lib/utils';

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: 'purple' | 'peach' | 'cyan' | 'teal' | 'green' | 'red' | 'gold';
  className?: string;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  glowColor,
  className,
  ...props
}) => {
  const glowClasses = {
    purple: 'hover:shadow-[0_0_40px_rgba(255,154,107,0.30)] border-[#FF9A6B]/20 hover:border-[#FF9A6B]/40',
    peach: 'hover:shadow-[0_0_40px_rgba(255,154,107,0.30)] border-[#FF9A6B]/20 hover:border-[#FF9A6B]/40',
    cyan: 'hover:shadow-[0_0_30px_rgba(45,212,191,0.25)] border-[#2DD4BF]/20 hover:border-[#2DD4BF]/40',
    teal: 'hover:shadow-[0_0_30px_rgba(45,212,191,0.25)] border-[#2DD4BF]/20 hover:border-[#2DD4BF]/40',
    green: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] border-emerald-500/20 hover:border-emerald-500/40',
    red: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] border-red-500/20 hover:border-red-500/40',
    gold: 'hover:shadow-[0_0_20px_rgba(250,204,21,0.3)] border-amber-400/20 hover:border-amber-400/40',
  };

  return (
    <div
      className={cn(
        'bg-[rgba(47,52,60,0.65)] backdrop-blur-xl border border-white/8 rounded-2xl p-5 transition-all duration-300 ease-out hover:-translate-y-1',
        glowColor ? glowClasses[glowColor] : 'hover:shadow-[0_0_40px_rgba(255,154,107,0.30)] hover:border-[#FF9A6B]/30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlowCard;
