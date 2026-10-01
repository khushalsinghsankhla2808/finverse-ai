import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-linear-to-r from-[#FF9A6B] to-[#FF6B9D] text-[#1A1A1A] font-bold shadow-[0_0_40px_rgba(255,154,107,0.30)] hover:brightness-110 border border-transparent',
    secondary: 'bg-[#373D46] hover:bg-[#454C57] text-white border border-white/10',
    danger: 'bg-linear-to-r from-red-500 to-rose-600 text-white shadow-lg hover:brightness-110 border border-transparent',
    ghost: 'bg-transparent hover:bg-white/5 text-white border border-transparent',
    outline: 'bg-transparent border border-[#FF9A6B] text-[#FF9A6B] hover:bg-[#FF9A6B]/10',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      type={type}
      disabled={isDisabled}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin shrink-0" size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      
      <span>{children}</span>
      
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </motion.button>
  );
};

export default Button;
