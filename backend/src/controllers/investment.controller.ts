import { Response, NextFunction } from 'express';
import InvestmentModel from '../models/Investment.model';
import { sendSuccess, sendError } from '../utils/response.utils';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { invalidateCache } from './transaction.controller';

export const getInvestments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  try {
    const investments = await InvestmentModel.find({ userId });

    // Calculate metrics
    let totalInvested = 0;
    let currentValue = 0;

    const allocations: Record<string, number> = {
      stocks: 0,
      mutual_funds: 0,
      gold: 0,
      crypto: 0,
      fixed_deposit: 0,
      other: 0,
    };

    investments.forEach((inv) => {
      totalInvested += inv.totalInvested;
      currentValue += inv.currentValue;
      allocations[inv.assetType] += inv.currentValue;
    });

    const totalGainLoss = currentValue - totalInvested;
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    // Calculate allocations percentages
    const assetAllocation = Object.entries(allocations).reduce((acc, [type, value]) => {
      acc[type] = {
        value,
        percentage: currentValue > 0 ? (value / currentValue) * 100 : 0,
      };
      return acc;
    }, {} as Record<string, { value: number; percentage: number }>);

    const summary = {
      totalInvested,
      currentValue,
      totalGainLoss,
      totalGainLossPercent,
      assetAllocation,
    };

    return sendSuccess(res, { investments, summary }, 'Investment portfolio summary compiled');
  } catch (error) {
    next(error);
  }
};

export const createInvestment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { name, assetType, symbol, units, purchasePrice, currentPrice, purchaseDate, platform, notes } = req.body;

  try {
    const investment = await InvestmentModel.create({
      userId,
      name,
      assetType,
      symbol,
      units,
      purchasePrice,
      currentPrice,
      purchaseDate: new Date(purchaseDate),
      platform,
      notes,
    });

    // Invalidate Redis caches
    await invalidateCache(userId);

    return sendSuccess(res, investment, 'Investment asset recorded successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateInvestment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { id } = req.params;
  const { name, units, purchasePrice, currentPrice, purchaseDate, platform, notes } = req.body;

  try {
    const investment = await InvestmentModel.findOne({ _id: id, userId });
    if (!investment) {
      return sendError(res, 'Investment asset not found', 404);
    }

    if (name !== undefined) investment.name = name;
    if (units !== undefined) investment.units = units;
    if (purchasePrice !== undefined) investment.purchasePrice = purchasePrice;
    if (currentPrice !== undefined) investment.currentPrice = currentPrice;
    if (purchaseDate !== undefined) investment.purchaseDate = new Date(purchaseDate);
    if (platform !== undefined) investment.platform = platform;
    if (notes !== undefined) investment.notes = notes;

    await investment.save();

    // Invalidate Redis caches
    await invalidateCache(userId);

    return sendSuccess(res, investment, 'Investment asset updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteInvestment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 'User session not found', 404);

  const { id } = req.params;

  try {
    const investment = await InvestmentModel.findOneAndDelete({ _id: id, userId });
    if (!investment) {
      return sendError(res, 'Investment asset not found', 404);
    }

    // Invalidate Redis caches
    await invalidateCache(userId);

    return sendSuccess(res, null, 'Investment asset deleted successfully');
  } catch (error) {
    next(error);
  }
};
