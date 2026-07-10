import { Response, NextFunction } from 'express';
import TransactionModel from '../models/Transaction.model';
import BudgetModel from '../models/Budget.model';
import NotificationModel from '../models/Notification.model';
import { sendSuccess, sendError } from '../utils/response.utils';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import redis from '../config/redis';

// Helper to invalidate all cache keys related to a user
export const invalidateCache = async (userId: string): Promise<void> => {
  try {
    const keys = await redis.keys(`*:${userId}*`);
    for (const key of keys) {
      await redis.del(key);
    }
  } catch (err) {
    // Fail silently to avoid interrupting requests
  }
};

export const getTransactions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const {
    type,
    category,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 15,
    sortBy = 'date',
    sortOrder = 'desc',
  } = req.query;

  const parsedPage = Math.max(1, Number(page));
  const parsedLimit = Math.max(1, Number(limit));

  try {
    const query: Record<string, any> = { userId };

    if (type) query.type = type;
    if (category) query.category = category;

    // Date filters
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    // Search query matching name, merchant or note
    if (search) {
      const regex = new RegExp(search as string, 'i');
      query.$or = [
        { name: regex },
        { merchant: regex },
        { note: regex },
      ];
    }

    const sortOptions: Record<string, any> = {};
    sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const total = await TransactionModel.countDocuments(query);
    const transactions = await TransactionModel.find(query)
      .sort(sortOptions)
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit);

    return sendSuccess(
      res,
      {
        transactions,
        total,
        page: parsedPage,
        totalPages: Math.ceil(total / parsedLimit),
      },
      'Transactions retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { type, amount, category, merchant, date, note } = req.body;

  try {
    const transaction = await TransactionModel.create({
      userId,
      name: merchant, // default name to merchant
      merchant,
      category,
      amount: type === 'income' ? Math.abs(amount) : -Math.abs(amount),
      type,
      date: new Date(date),
      note,
    });

    // If type is expense, automatically update matching Budget spent amount
    if (type === 'expense') {
      const budget = await BudgetModel.findOne({ userId, category });
      if (budget) {
        const previousSpent = budget.spent;
        budget.spent += Math.abs(amount);
        await budget.save();

        const limit = budget.limit;
        const currentPercentage = (budget.spent / limit) * 100;
        const previousPercentage = (previousSpent / limit) * 100;
        const threshold = budget.alertThreshold;

        // Trigger notification if crossing threshold
        if (currentPercentage >= threshold && previousPercentage < threshold) {
          await NotificationModel.create({
            userId,
            type: 'budget_alert',
            title: `Budget warning: ${category}`,
            message: `Your spent amount has crossed ${threshold}% of your limit of ₹${limit} in ${category}`,
            metadata: { budgetId: budget.id, category, spent: budget.spent, limit },
          });
        }
      }
    }

    // Invalidate Redis caches
    await invalidateCache(userId);

    return sendSuccess(res, transaction, 'Transaction created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  const { id } = req.params;

  try {
    const transaction = await TransactionModel.findOne({ _id: id, userId });
    if (!transaction) {
      return sendError(res, 'Transaction not found', 404);
    }
    return sendSuccess(res, transaction, 'Transaction retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { id } = req.params;
  const { type, amount, category, merchant, date, note } = req.body;

  try {
    const transaction = await TransactionModel.findOne({ _id: id, userId });
    if (!transaction) {
      return sendError(res, 'Transaction not found', 404);
    }

    // Calculate dynamic budget difference adjustments
    const oldAmount = transaction.amount;
    const oldCategory = transaction.category;
    const oldType = transaction.type;

    // Apply updates
    transaction.type = type;
    transaction.amount = type === 'income' ? Math.abs(amount) : -Math.abs(amount);
    transaction.category = category;
    transaction.merchant = merchant;
    transaction.name = merchant;
    transaction.date = new Date(date);
    transaction.note = note;
    await transaction.save();

    // Adjust old budgets
    if (oldType === 'expense') {
      await BudgetModel.findOneAndUpdate(
        { userId, category: oldCategory },
        { $inc: { spent: -Math.abs(oldAmount) } }
      );
    }

    // Adjust new budgets
    if (type === 'expense') {
      await BudgetModel.findOneAndUpdate(
        { userId, category },
        { $inc: { spent: Math.abs(amount) } }
      );
    }

    // Invalidate Redis caches
    await invalidateCache(userId);

    return sendSuccess(res, transaction, 'Transaction updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { id } = req.params;

  try {
    const transaction = await TransactionModel.findOneAndDelete({ _id: id, userId });
    if (!transaction) {
      return sendError(res, 'Transaction not found', 404);
    }

    // Reduce spent amounts in budgets
    if (transaction.type === 'expense') {
      await BudgetModel.findOneAndUpdate(
        { userId, category: transaction.category },
        { $inc: { spent: -Math.abs(transaction.amount) } }
      );
    }

    // Invalidate Redis caches
    await invalidateCache(userId);

    return sendSuccess(res, null, 'Transaction deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteBulkTransactions = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return sendError(res, 'Transaction ids array is required', 400);
  }

  try {
    // Find all matching transactions belonging to user
    const txns = await TransactionModel.find({ _id: { $in: ids }, userId });
    if (txns.length === 0) {
      return sendError(res, 'No transactions found to delete', 404);
    }

    // Adjust affected budgets in a loop
    for (const txn of txns) {
      if (txn.type === 'expense') {
        await BudgetModel.findOneAndUpdate(
          { userId, category: txn.category },
          { $inc: { spent: -Math.abs(txn.amount) } }
        );
      }
    }

    // Delete matches
    await TransactionModel.deleteMany({ _id: { $in: ids }, userId });

    // Invalidate Redis caches
    await invalidateCache(userId);

    return sendSuccess(res, null, `${txns.length} transactions deleted successfully`);
  } catch (error) {
    next(error);
  }
};

export const getMonthSummary = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const cacheKey = `summary:${userId}:${year}:${month}`;

  try {
    // Attempt cache read
    const cached = await redis.get(cacheKey);
    if (cached) {
      return sendSuccess(res, JSON.parse(cached), 'Month summary retrieved from cache');
    }

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const txns = await TransactionModel.find({
      userId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const income = txns.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = txns.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const count = txns.length;

    // Identify top category
    const categoryTotals: Record<string, number> = {};
    txns
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
      });

    let topCategory = 'None';
    let maxExpense = 0;
    Object.entries(categoryTotals).forEach(([cat, val]) => {
      if (val > maxExpense) {
        maxExpense = val;
        topCategory = cat;
      }
    });

    const summary = {
      totalIncome: income,
      totalExpenses: expenses,
      netCashFlow: income - expenses,
      transactionCount: count,
      topCategory,
    };

    // Save cache with 5 minutes TTL
    await redis.set(cacheKey, JSON.stringify(summary), 'EX', 300);

    return sendSuccess(res, summary, 'Month summary calculated successfully');
  } catch (error) {
    next(error);
  }
};
