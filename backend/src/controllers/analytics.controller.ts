import { Response, NextFunction } from 'express';
import TransactionModel from '../models/Transaction.model';
import BudgetModel from '../models/Budget.model';
import { sendSuccess, sendError } from '../utils/response.utils';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import redis from '../config/redis';

const SERVER_CATEGORY_COLORS: Record<string, string> = {
  Housing: '#7C3AED',
  Food: '#06B6D4',
  Transport: '#10B981',
  Shopping: '#F59E0B',
  Entertainment: '#F43F5E',
  Groceries: '#8B5CF6',
  Utilities: '#EC4899',
  Healthcare: '#14B8A6',
  Education: '#8B5CF6',
  Investment: '#F59E0B',
  Other: '#6B7280',
};

const getCategoryColor = (category: string): string => {
  return SERVER_CATEGORY_COLORS[category] || '#6B7280';
};

export const getDashboardMetrics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const cacheKey = `analytics:dashboard:${userId}`;

  try {
    // Attempt cache read
    const cached = await redis.get(cacheKey);
    if (cached) {
      return sendSuccess(res, JSON.parse(cached), 'Dashboard metrics retrieved from cache');
    }

    // 1. Calculate overall balance and net worth
    const allTxns = await TransactionModel.find({ userId });
    
    // total balance = sum of all transaction amounts (incomes are positive, expenses are negative)
    const totalBalance = allTxns.reduce((sum, t) => sum + t.amount, 0);

    // 2. Calculate current month income/expenses
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthTxns = allTxns.filter((t) => t.date >= startOfMonth && t.date <= endOfMonth);

    const monthlyIncome = monthTxns.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpenses = monthTxns.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    // 3. Calculate budget progress
    const budgets = await BudgetModel.find({ userId });
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const percentUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    const metrics = {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      netWorth: totalBalance,
      savingsRate,
      budgetProgress: {
        totalBudgeted,
        totalSpent,
        percentUsed,
      },
    };

    // Save cache with 5 minutes TTL
    await redis.set(cacheKey, JSON.stringify(metrics), 'EX', 300);

    return sendSuccess(res, metrics, 'Dashboard metrics compiled successfully');
  } catch (error) {
    next(error);
  }
};

export const getSpendingBreakdown = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { period = 'month' } = req.query;

  try {
    const limitDate = new Date();
    if (period === 'month') {
      limitDate.setDate(limitDate.getDate() - 30);
    } else if (period === '3months') {
      limitDate.setDate(limitDate.getDate() - 90);
    } else {
      limitDate.setDate(limitDate.getDate() - 365);
    }

    const txns = await TransactionModel.find({
      userId,
      type: 'expense',
      date: { $gte: limitDate },
    });

    const totals: Record<string, number> = {};
    txns.forEach((t) => {
      totals[t.category] = (totals[t.category] || 0) + Math.abs(t.amount);
    });

    const totalExpense = Object.values(totals).reduce((sum, val) => sum + val, 0);

    const breakdown = Object.entries(totals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        color: getCategoryColor(category),
      }))
      .sort((a, b) => b.amount - a.amount);

    return sendSuccess(res, breakdown, 'Spending distribution breakdown calculated');
  } catch (error) {
    next(error);
  }
};

export const getTrends = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { period = 'month' } = req.query;

  try {
    const limitDate = new Date();
    if (period === 'month') {
      limitDate.setDate(limitDate.getDate() - 30);
    } else if (period === '3months') {
      limitDate.setDate(limitDate.getDate() - 90);
    } else {
      limitDate.setDate(limitDate.getDate() - 365);
    }

    const txns = await TransactionModel.find({
      userId,
      date: { $gte: limitDate },
    });

    // Group by Date key depending on range
    const groups: Record<string, { date: string; income: number; expenses: number; net: number }> = {};

    txns.forEach((t) => {
      let key = '';
      if (period === 'month') {
        key = t.date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (period === '3months') {
        // Group by weekly start date
        const d = new Date(t.date);
        d.setDate(d.getDate() - d.getDay());
        key = d.toISOString().split('T')[0];
      } else {
        key = t.date.toISOString().substring(0, 7); // YYYY-MM
      }

      if (!groups[key]) {
        groups[key] = { date: key, income: 0, expenses: 0, net: 0 };
      }

      const amt = Math.abs(t.amount);
      if (t.type === 'income') {
        groups[key].income += amt;
        groups[key].net += amt;
      } else if (t.type === 'expense') {
        groups[key].expenses += amt;
        groups[key].net -= amt;
      }
    });

    const trends = Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));

    return sendSuccess(res, trends, 'Income vs expense trends compiled');
  } catch (error) {
    next(error);
  }
};

export const getMonthlyComparison = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const txns = await TransactionModel.find({
      userId,
      date: { $gte: sixMonthsAgo },
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const groups: Record<string, { month: string; year: number; income: number; expenses: number; savings: number; savingsRate: number; sortKey: string }> = {};

    // Seed last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const year = d.getFullYear();
      const sortKey = `${year}-${String(mIdx + 1).padStart(2, '0')}`;
      groups[sortKey] = {
        month: `${months[mIdx]} ${year}`,
        year,
        income: 0,
        expenses: 0,
        savings: 0,
        savingsRate: 0,
        sortKey,
      };
    }

    txns.forEach((t) => {
      const d = new Date(t.date);
      const mIdx = d.getMonth();
      const year = d.getFullYear();
      const sortKey = `${year}-${String(mIdx + 1).padStart(2, '0')}`;

      if (groups[sortKey]) {
        const amt = Math.abs(t.amount);
        if (t.type === 'income') {
          groups[sortKey].income += amt;
        } else if (t.type === 'expense') {
          groups[sortKey].expenses += amt;
        }
      }
    });

    const monthly = Object.values(groups)
      .map((item) => {
        const savings = item.income - item.expenses;
        const savingsRate = item.income > 0 ? (savings / item.income) * 100 : 0;
        return {
          month: item.month,
          income: item.income,
          expenses: item.expenses,
          savings,
          savingsRate,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month)); // sorted cron order

    return sendSuccess(res, monthly, 'Monthly comparison list completed');
  } catch (error) {
    next(error);
  }
};

export const getCashFlow = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  try {
    // Generate daily cash flow for the last 7 calendar days
    const data = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const dayTxns = await TransactionModel.find({
        userId,
        date: { $gte: startOfDay, $lte: endOfDay },
      });

      const income = dayTxns.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = dayTxns.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);

      data.push({
        name: weekdays[d.getDay()],
        income,
        expense: expenses,
        date: d.toISOString().split('T')[0],
      });
    }

    return sendSuccess(res, data, 'Daily cash flow for last 7 days retrieved');
  } catch (error) {
    next(error);
  }
};
