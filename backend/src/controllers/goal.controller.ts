import { Response, NextFunction } from 'express';
import GoalModel from '../models/Goal.model';
import TransactionModel from '../models/Transaction.model';
import NotificationModel from '../models/Notification.model';
import { sendSuccess, sendError } from '../utils/response.utils';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { invalidateCache } from './transaction.controller';

export const getGoals = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  try {
    const goals = await GoalModel.find({ userId });
    return sendSuccess(res, goals, 'Goals retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const createGoal = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { name, targetAmount, currentAmount = 0, deadline, category, color, icon } = req.body;

  try {
    const isCompleted = currentAmount >= targetAmount;

    const goal = await GoalModel.create({
      userId,
      name,
      targetAmount,
      currentAmount,
      deadline: new Date(deadline),
      category,
      color,
      icon,
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    });

    // Invalidate Redis caches
    await invalidateCache(userId);

    return sendSuccess(res, goal, 'Savings goal created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { id } = req.params;
  const { name, targetAmount, currentAmount, deadline, category, color, icon } = req.body;

  try {
    const goal = await GoalModel.findOne({ _id: id, userId });
    if (!goal) {
      return sendError(res, 'Savings goal not found', 404);
    }

    if (name !== undefined) goal.name = name;
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (currentAmount !== undefined) {
      goal.currentAmount = currentAmount;
      const reached = currentAmount >= goal.targetAmount;
      goal.isCompleted = reached;
      goal.completedAt = reached ? (goal.completedAt || new Date()) : null;
    }
    if (deadline !== undefined) goal.deadline = new Date(deadline);
    if (category !== undefined) goal.category = category;
    if (color !== undefined) goal.color = color;
    if (icon !== undefined) goal.icon = icon;

    await goal.save();

    // Invalidate Redis caches
    await invalidateCache(userId);

    return sendSuccess(res, goal, 'Savings goal updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { id } = req.params;

  try {
    const goal = await GoalModel.findOneAndDelete({ _id: id, userId });
    if (!goal) {
      return sendError(res, 'Savings goal not found', 404);
    }

    // Invalidate Redis caches
    await invalidateCache(userId);

    return sendSuccess(res, null, 'Savings goal deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const addMoneyToGoal = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { id } = req.params;
  const { amount } = req.body;

  try {
    const goal = await GoalModel.findOne({ _id: id, userId });
    if (!goal) {
      return sendError(res, 'Savings goal not found', 404);
    }

    const remaining = goal.targetAmount - goal.currentAmount;
    if (amount > remaining) {
      return sendError(res, `Contribution amount (₹${amount}) exceeds remaining target of ₹${remaining}`, 400);
    }

    // Update goal amounts
    goal.currentAmount += amount;
    const reached = goal.currentAmount >= goal.targetAmount;
    if (reached) {
      goal.isCompleted = true;
      goal.completedAt = new Date();

      // Create milestone achievements notification
      await NotificationModel.create({
        userId,
        type: 'goal_milestone',
        title: `Goal completed: ${goal.name}`,
        message: `Congratulations! You have successfully reached your savings target of ₹${goal.targetAmount} for ${goal.name}!`,
        metadata: { goalId: goal.id, name: goal.name, targetAmount: goal.targetAmount },
      });
    }

    await goal.save();

    // Create a matching Transaction logged under 'Investment'
    await TransactionModel.create({
      userId,
      name: `Savings Contribution: ${goal.name}`,
      merchant: `Savings - ${goal.name}`,
      category: 'Investment',
      amount: -Math.abs(amount), // treated as expense/outflow from general funds to savings goal
      type: 'expense',
      date: new Date(),
      note: `Autogenerated contribution to savings target: ${goal.name}`,
    });

    // Invalidate Redis caches
    await invalidateCache(userId);

    return sendSuccess(res, goal, `₹${amount} successfully added to your ${goal.name} savings goal!`);
  } catch (error) {
    next(error);
  }
};
