import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import AnimatedNumber from '../common/AnimatedNumber';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number;
  change?: number; // percentage change (e.g. +5.4 or -2.1)
  changeLabel?: string; // e.g. "from last month"
  icon: LucideIcon;
  iconColor: string; // CSS variable name, e.g. "purple-primary", "green-positive"
  glowColor: 'purple' | 'cyan' | 'green' | 'red' | 'gold';
  prefix: string; // e.g. "$"
  suffix?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor, // e.g. "purple-primary"
  glowColor,
  prefix,
  suffix = '',
}) => {
  const isPositive = change !== undefined ? change >= 0 : true;

  const glowClasses = {
    purple: 'hover:shadow-glow-purple hover:border-purple-primary/40',
    cyan: 'hover:shadow-glow-cyan hover:border-cyan-data/40',
    green: 'hover:shadow-glow-green hover:border-green-positive/40',
    red: 'hover:shadow-glow-red hover:border-red-negative/40',
    gold: 'hover:shadow-glow-gold hover:border-gold-savings/40',
  };

  return (
    <div
      className={cn(
        'glassmorphism rounded-2xl p-5 border border-white/8 transition-all duration-300 ease-out hover:-translate-y-1 select-none flex flex-col justify-between h-[155px]',
        glowClasses[glowColor]
      )}
    >
      <div className="flex justify-between items-start">
        {/* Title */}
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
          {title}
        </span>
        {/* Icon wrapper */}
        <div
          className="h-10 w-10 flex items-center justify-center rounded-xl"
          style={{
            backgroundColor: `var(--${iconColor}-rgba, rgba(255,255,255,0.05))`,
            color: `var(--${iconColor})`,
            border: `1px solid var(--${iconColor}-border, rgba(255,255,255,0.08))`,
            boxShadow: `0 0 15px var(--${iconColor}-glow, rgba(255,255,255,0.02))`,
          }}
        >
          <Icon size={20} />
        </div>
      </div>

      {/* Value */}
      <div className="text-2xl font-bold font-mono tracking-tight text-white mt-1">
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={2} />
      </div>

      {/* Change badge */}
      {change !== undefined && (
        <div className="flex items-center gap-2 mt-2">
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold leading-none',
              isPositive
                ? 'bg-green-positive/10 text-green-positive border border-green-positive/20'
                : 'bg-red-negative/10 text-red-negative border border-red-negative/20'
            )}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>
              {isPositive ? '+' : ''}
              {change.toFixed(1)}%
            </span>
          </div>
          {changeLabel && (
            <span className="text-[10px] text-white/35 font-medium">
              {changeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default KPICard;
