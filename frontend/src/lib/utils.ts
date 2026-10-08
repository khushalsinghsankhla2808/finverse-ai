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

// Get category color
export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    Housing: '#0466c8',
    Food: '#0353a4',
    Transport: '#023e7d',
    Shopping: '#002855',
    Entertainment: '#33415c',
    Groceries: '#0353a4',
    Utilities: '#5c677d',
    Income: '#22C55E',
    Transfer: '#0353a4',
    Healthcare: '#33415c',
    Education: '#0466c8',
    Investment: '#002855',
    Other: '#7d8597',
  };
  return colors[category] ?? '#7d8597';
};
