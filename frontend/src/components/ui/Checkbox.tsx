import React from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          className={cn(
            "h-4 w-4 rounded border border-white/10 bg-bg-surface/50 text-purple-primary focus:ring-purple-primary focus:ring-offset-bg-base outline-none accent-purple-primary transition-all duration-200 cursor-pointer",
            className
          )}
          ref={ref}
          {...props}
        />
        {label && <span className="text-sm text-white/70 hover:text-white/90">{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export default Checkbox;
