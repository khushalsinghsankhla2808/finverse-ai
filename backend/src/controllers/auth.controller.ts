import { Request, Response, NextFunction } from 'express';
import UserModel from '../models/User.model';
import BudgetModel from '../models/Budget.model';
import GoalModel from '../models/Goal.model';
import TransactionModel from '../models/Transaction.model';
import InvestmentModel from '../models/Investment.model';
import AIHistoryModel from '../models/AIHistory.model';
import NotificationModel from '../models/Notification.model';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils';
import { sendSuccess, sendError } from '../utils/response.utils';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  const { name, email, password } = req.body;

  try {
    // Check if email already registered
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return sendError(res, 'Email already registered', 400);
    }

    // Create user
    const user = await UserModel.create({
      name,
      email,
      password,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          currency: user.currency,
          theme: user.theme,
        },
        accessToken,
        refreshToken,
      },
      'User registered successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials', 401);
    }

    // Update login timestamp
    user.lastLogin = new Date();

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          currency: user.currency,
          theme: user.theme,
        },
        accessToken,
        refreshToken,
      },
      'Logged in successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendError(res, 'Refresh token is required', 400);
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    // Find user by ID and matching refresh token
    const user = await UserModel.findOne({ _id: decoded.id, refreshToken });
    if (!user) {
      return sendError(res, 'Invalid refresh token', 401);
    }

    // Generate new access token
    const accessToken = generateAccessToken(user.id);

    return sendSuccess(res, { accessToken }, 'Access token refreshed successfully');
  } catch (error) {
    return sendError(res, 'Expired or invalid refresh token', 401);
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return sendError(res, 'User session not found', 404);
    }

    // Clear refresh token in DB
    await UserModel.findByIdAndUpdate(userId, { refreshToken: null });

    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const me = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const user = req.user;
    if (!user) {
      return sendError(res, 'User session not found', 404);
    }

    return sendSuccess(res, user, 'Current user profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Profile & Account Management ────────────────────────────────────────────

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 'User session not found', 404);

    const { name, currency } = req.body as { name?: string; currency?: string };

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { ...(name && { name }), ...(currency && { currency }) },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!updatedUser) return sendError(res, 'User not found', 404);

    return sendSuccess(
      res,
      {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        plan: updatedUser.plan,
        currency: updatedUser.currency,
        theme: updatedUser.theme,
      },
      'Profile updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 'User session not found', 404);

    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    // Re-fetch user WITH password field (auth middleware strips it)
    const user = await UserModel.findById(userId).select('+password');
    if (!user) return sendError(res, 'User not found', 404);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return sendError(res, 'Current password is incorrect', 400);

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    return sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 'User session not found', 404);

    // Cascade delete all user-owned data
    await Promise.all([
      BudgetModel.deleteMany({ userId }),
      GoalModel.deleteMany({ userId }),
      TransactionModel.deleteMany({ userId }),
      InvestmentModel.deleteMany({ userId }),
      AIHistoryModel.deleteMany({ userId }),
      NotificationModel.deleteMany({ userId }),
    ]);

    await UserModel.findByIdAndDelete(userId);

    return sendSuccess(res, null, 'Account and all associated data deleted successfully');
  } catch (error) {
    next(error);
  }
};
