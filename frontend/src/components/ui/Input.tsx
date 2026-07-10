import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1">
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-white/40 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-lg border border-white/10 bg-bg-surface/50 px-3 py-2 text-sm text-white placeholder-white/30 transition-all duration-200 outline-none",
              "focus:border-purple-primary focus:ring-2 focus:ring-purple-primary/20",
              error && "border-red-negative focus:border-red-negative focus:ring-red-negative/20",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-white/40 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span className="text-xs text-red-negative mt-0.5 ml-1">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export default Input;
