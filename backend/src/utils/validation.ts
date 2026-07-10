import * as z from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  merchant: z.string().min(1, 'Merchant is required'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().optional().default(''),
});

export const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limit: z.number().positive('Limit must be positive'),
  period: z.enum(['monthly', 'weekly']).default('monthly'),
  alertThreshold: z.number().min(0).max(100).default(80),
});

export const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  targetAmount: z.number().positive('Target amount must be positive'),
  currentAmount: z.number().nonnegative().optional().default(0),
  deadline: z.string().min(1, 'Deadline is required'),
  category: z.string().min(1, 'Category is required'),
  color: z.string().default('#7C3AED'),
  icon: z.string().default('🎯'),
});

export const addMoneySchema = z.object({
  amount: z.number().positive('Amount to add must be positive'),
});

export const investmentSchema = z.object({
  name: z.string().min(1, 'Investment name is required'),
  assetType: z.enum(['stocks', 'mutual_funds', 'gold', 'crypto', 'fixed_deposit', 'other']),
  symbol: z.string().optional(),
  units: z.number().positive('Units must be positive'),
  purchasePrice: z.number().positive('Purchase price must be positive'),
  currentPrice: z.number().positive('Current price must be positive'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  platform: z.string().optional(),
  notes: z.string().optional(),
});

export const reportSchema = z.object({
  type: z.enum(['monthly', 'yearly', 'custom']),
  format: z.enum(['pdf', 'excel', 'csv']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  includeCharts: z.boolean().default(true),
  categories: z.array(z.string()).optional(),
});
