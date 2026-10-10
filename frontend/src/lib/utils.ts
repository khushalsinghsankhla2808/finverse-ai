import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currencyCode = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format currency in Indian number system
export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format currency compact (₹1.2L, ₹5.8Cr)
export const formatINRCompact = (amount: number): string => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 10000000) return '₹' + (amount / 10000000).toFixed(1) + 'Cr';
  if (absAmount >= 100000) return '₹' + (amount / 100000).toFixed(1) + 'L';
  if (absAmount >= 1000) return '₹' + (amount / 1000).toFixed(1) + 'K';
  return '₹' + amount.toString();
};

// Format date for display
export const formatDate = (dateStr: string): string => {
  return format(new Date(dateStr), 'MMM dd, yyyy');
};

// Get category color using theme tokens
export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    Housing: 'var(--cat-1)',
    Food: 'var(--cat-2)',
    Transport: 'var(--cat-3)',
    Shopping: 'var(--cat-4)',
    Entertainment: 'var(--cat-5)',
    Groceries: 'var(--cat-2)',
    Utilities: 'var(--cat-6)',
    Income: 'var(--gain)',
    Transfer: 'var(--cat-2)',
    Healthcare: 'var(--cat-5)',
    Education: 'var(--cat-1)',
    Investment: 'var(--cat-4)',
    Other: 'var(--cat-7)',
  };
  return colors[category] ?? 'var(--cat-7)';
};
