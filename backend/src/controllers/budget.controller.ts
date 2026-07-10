import { Response, NextFunction } from 'express';
import BudgetModel, { IBudgetDocument } from '../models/Budget.model';
import TransactionModel from '../models/Transaction.model';
import { sendSuccess, sendError } from '../utils/response.utils';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import redis from '../config/redis';
import { invalidateCache } from './transaction.controller';

// Helper to determine status based on spent, limit, and alertThreshold
const getBudgetStatus = (
  spent: number,
  limit: number,
  threshold: number
): 'safe' | 'warning' | 'danger' | 'over' => {
  const percentage = limit > 0 ? (spent / limit) * 100 : 0;
  if (percentage >= 100) return 'over';
  if (percentage >= 90) return 'danger';
  if (percentage >= threshold) return 'warning';
  return 'safe';
};

export const getBudgets = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const cacheKey = `budgets:${userId}`;

  try {
    // Attempt cache read
    const cached = await redis.get(cacheKey);
    if (cached) {
      return sendSuccess(res, JSON.parse(cached), 'Budgets retrieved from cache');
    }

    const budgets = await BudgetModel.find({ userId });

    // Format list with computed statuses and percentage
    const formattedBudgets = budgets.map((b) => {
      const doc = b.toJSON() as Record<string, any>;
      const percentage = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
      return {
        ...doc,
        percentage,
        status: getBudgetStatus(b.spent, b.limit, b.alertThreshold),
      };
    });

    // Save cache with 10 minutes TTL
    await redis.set(cacheKey, JSON.stringify(formattedBudgets), 'EX', 600);

    return sendSuccess(res, formattedBudgets, 'Budgets retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createBudget = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { category, limit, period = 'monthly', alertThreshold = 80, color, icon } = req.body;

  try {
    // Validate category not already budgeted
    const existing = await BudgetModel.findOne({ userId, category });
    if (existing) {
      return sendError(res, `Budget already exists for category: ${category}`, 400);
    }

    // Determine initial spent from existing transactions of current period
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (period === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      // Weekly period (starts Sunday)
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    }

    const txns = await TransactionModel.find({
      userId,
      category,
      type: 'expense',
      date: { $gte: start, $lte: end },
    });

    const spent = txns.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const budget = await BudgetModel.create({
      userId,
      category,
      limit,
      spent,
      period,
      alertThreshold,
      color,
      icon,
    });

    // Invalidate Redis caches
    await invalidateCache(userId);

    return sendSuccess(res, budget, 'Budget created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateBudget = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { id } = req.params;
  const { limit, alertThreshold, period, color, icon } = req.body;

  try {
    const budget = await BudgetModel.findOne({ _id: id, userId });
    if (!budget) {
      return sendError(res, 'Budget not found', 404);
    }

    // Update fields
    if (limit !== undefined) budget.limit = limit;
    if (alertThreshold !== undefined) budget.alertThreshold = alertThreshold;
    if (period !== undefined) budget.period = period;
    if (color !== undefined) budget.color = color;
    if (icon !== undefined) budget.icon = icon;

    // Recalculate spent if period changed
    if (period !== undefined) {
      const now = new Date();
      let start = new Date();
      let end = new Date();

      if (budget.period === 'monthly') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      } else {
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      }

      const txns = await TransactionModel.find({
        userId,
        category: budget.category,
        type: 'expense',
        date: { $gte: start, $lte: end },
      });

      budget.spent = txns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    }

    await budget.save();

    // Invalidate Redis caches
    await invalidateCache(userId);

    const result = budget.toJSON() as Record<string, any>;
    const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;

    return sendSuccess(
      res,
      {
        ...result,
        percentage,
        status: getBudgetStatus(budget.spent, budget.limit, budget.alertThreshold),
      },
      'Budget updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { id } = req.params;

  try {
    const budget = await BudgetModel.findOneAndDelete({ _id: id, userId });
    if (!budget) {
      return sendError(res, 'Budget not found or unauthorized', 404);
    }

    // Invalidate Redis caches
    await invalidateCache(userId);

    return sendSuccess(res, null, 'Budget limit deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const resetBudgetSpent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { id } = req.params;

  try {
    const budget = await BudgetModel.findOneAndUpdate(
      { _id: id, userId },
      { spent: 0 },
      { new: true }
    );
    if (!budget) {
      return sendError(res, 'Budget not found', 404);
    }

    // Invalidate Redis caches
    await invalidateCache(userId);

    return sendSuccess(res, budget, 'Budget spent amount reset successfully');
  } catch (error) {
    next(error);
  }
};
