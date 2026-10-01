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
    Housing: '#FF9A6B',
    Food: '#2DD4BF',
    Transport: '#FF6B9D',
    Shopping: '#FFB896',
    Entertainment: '#5EEAD4',
    Groceries: '#2DD4BF',
    Utilities: '#FACC15',
    Income: '#22C55E',
    Transfer: '#2DD4BF',
    Healthcare: '#5EEAD4',
    Education: '#FF9A6B',
    Investment: '#FFB896',
    Other: '#7B8494',
  };
  return colors[category] ?? '#7B8494';
};
