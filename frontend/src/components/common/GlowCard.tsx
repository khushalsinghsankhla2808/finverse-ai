import React from 'react';
import { cn } from '@/lib/utils';

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: 'blue' | 'navy' | 'cyan' | 'slate' | 'green' | 'red' | 'gold';
  className?: string;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  glowColor,
  className,
  ...props
}) => {
  const glowClasses: Record<string, string> = {
    blue: 'hover:shadow-[0_0_40px_rgba(4,102,200,0.30)] border-primary/20 hover:border-primary/40',
    navy: 'hover:shadow-[0_0_40px_rgba(4,102,200,0.30)] border-primary/20 hover:border-primary/40',
    cyan: 'hover:shadow-[0_0_30px_rgba(4,102,200,0.25)] border-primary/20 hover:border-primary/40',
    slate: 'hover:shadow-[0_0_30px_rgba(4,102,200,0.25)] border-primary/20 hover:border-primary/40',
    green: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] border-emerald-500/20 hover:border-emerald-500/40',
    red: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] border-red-500/20 hover:border-red-500/40',
    gold: 'hover:shadow-[0_0_20px_rgba(250,204,21,0.3)] border-amber-400/20 hover:border-amber-400/40',
  };

  return (
    <div
      className={cn(
        'bg-[rgba(47,52,60,0.65)] backdrop-blur-xl border border-line rounded-2xl p-5 transition-all duration-300 ease-out hover:-translate-y-1',
        glowColor && glowClasses[glowColor] ? glowClasses[glowColor] : 'hover:shadow-[0_0_40px_rgba(4,102,200,0.30)] hover:border-primary/30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlowCard;
