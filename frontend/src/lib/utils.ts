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
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
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
    Housing: '#7C3AED',
    Food: '#06B6D4',
    Transport: '#10B981',
    Shopping: '#F59E0B',
    Entertainment: '#F43F5E',
    Groceries: '#8B5CF6',
    Utilities: '#EC4899',
    Income: '#10B981',
    Transfer: '#2563EB',
    Healthcare: '#14B8A6',
    Education: '#8B5CF6',
    Investment: '#F59E0B',
    Other: '#6B7280',
  };
  return colors[category] ?? '#6B7280';
};
