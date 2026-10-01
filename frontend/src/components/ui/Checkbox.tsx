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
            "h-4 w-4 rounded border border-white/10 bg-[#373D46] text-[#FF9A6B] focus:ring-[#FF9A6B] focus:ring-offset-[#262A31] outline-none accent-[#FF9A6B] transition-all duration-200 cursor-pointer",
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
