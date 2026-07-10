import React from 'react';
import type { LucideIcon } from 'lucide-react';
import Button from '../common/Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="w-full flex items-center justify-center py-12 px-4">
      <div className="border border-dashed border-white/10 bg-white/2 rounded-2xl flex flex-col items-center justify-center text-center p-8 max-w-sm w-full shadow-lg relative overflow-hidden group hover:border-purple-primary/30 transition-colors duration-300">
        {/* Subtle decorative glow */}
        <div className="absolute inset-0 bg-radial from-purple-primary/5 via-transparent to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center text-white/30 mb-5 group-hover:text-purple-light group-hover:border-purple-primary/20 transition-all duration-300 shadow-inner">
          <Icon size={32} className="stroke-[1.5]" />
        </div>

        <h3 className="font-display font-bold text-lg text-white mb-2">{title}</h3>
        <p className="text-xs text-white/50 leading-relaxed mb-6 max-w-xs">{description}</p>

        {actionLabel && onAction && (
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
