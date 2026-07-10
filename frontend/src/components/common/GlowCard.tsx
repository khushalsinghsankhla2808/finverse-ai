import React from 'react';
import { cn } from '@/lib/utils';

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: 'purple' | 'cyan' | 'green' | 'red' | 'gold';
  className?: string;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  glowColor,
  className,
  ...props
}) => {
  const glowClasses = {
    purple: 'hover:shadow-glow-purple border-purple-primary/20 hover:border-purple-primary/40',
    cyan: 'hover:shadow-glow-cyan border-cyan-data/20 hover:border-cyan-data/40',
    green: 'hover:shadow-glow-green border-green-positive/20 hover:border-green-positive/40',
    red: 'hover:shadow-glow-red border-red-negative/20 hover:border-red-negative/40',
    gold: 'hover:shadow-glow-gold border-gold-savings/20 hover:border-gold-savings/40',
  };

  return (
    <div
      className={cn(
        'glassmorphism rounded-2xl p-5 transition-all duration-300 ease-out border',
        glowColor ? glowClasses[glowColor] : 'border-white/8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlowCard;
