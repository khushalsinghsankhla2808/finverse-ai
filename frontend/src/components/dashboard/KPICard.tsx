import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import AnimatedNumber from '../common/AnimatedNumber';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number;
  change?: number; // percentage change (e.g. +5.4 or -2.1)
  changeLabel?: string; // e.g. "vs last month"
  icon: LucideIcon;
  prefix: string; // e.g. "₹"
  suffix?: string;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  prefix,
  suffix = '',
  className = '',
}) => {
  const isPositive = change !== undefined ? change >= 0 : true;

  return (
    <div
      className={cn(
        'card flex flex-col justify-between h-[155px] select-none transition-all duration-200',
        className
      )}
    >
      <div className="flex justify-between items-start">
        {/* Title */}
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          {title}
        </span>
        {/* Icon wrapper */}
        <div className="h-10 w-10 flex items-center justify-center rounded-[var(--radius-control)] bg-surface-sunken border border-line text-primary">
          <Icon size={20} />
        </div>
      </div>

      {/* Value */}
      <div className="text-2xl font-bold font-sans tracking-tight text-ink mt-1">
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={2} />
      </div>

      {/* Change badge */}
      {change !== undefined && (
        <div className="flex items-center gap-2 mt-2">
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-control)] text-xs font-semibold leading-none border',
              isPositive
                ? 'bg-emerald-500/10 amount-gain border-emerald-500/20'
                : 'bg-red-500/10 amount-loss border-red-500/20'
            )}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>
              {isPositive ? '+' : ''}
              {change.toFixed(1)}%
            </span>
          </div>
          {changeLabel && (
            <span className="text-[10px] text-ink-subtle font-medium">
              {changeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default KPICard;
