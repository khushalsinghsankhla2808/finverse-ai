import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { getAuth } from 'firebase-admin/auth';
import UserModel, { IUserDocument } from '../models/User.model';
import BudgetModel from '../models/Budget.model';
import GoalModel from '../models/Goal.model';
import TransactionModel from '../models/Transaction.model';
import InvestmentModel from '../models/Investment.model';
import AIHistoryModel from '../models/AIHistory.model';
import NotificationModel from '../models/Notification.model';
import { sendSuccess, sendError } from '../utils/response.utils';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { logger } from '../middleware/logger.middleware';

/**
 * Synchronizes a Firebase Authentication user with the MongoDB user document.
 * If the user does not exist in MongoDB, it creates a new document.
 * If the user exists (matched by email for legacy users), it links their firebaseUid.
 */
export const syncUser = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 'Not authorized, no token provided', 401);
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return sendError(res, 'Email address is required from Firebase account', 400);
    }

    let user: IUserDocument | null = await UserModel.findOne({ firebaseUid: uid });

    if (!user) {
      // Auto-migration (Option B): Find by email to link legacy accounts
      user = await UserModel.findOne({ email: email.toLowerCase() });
      if (user) {
        const isGoogleUser = decodedToken.firebase?.sign_in_provider === 'google.com';
        const isVerifiedEmail = decodedToken.email_verified === true;
        
        if (isGoogleUser || isVerifiedEmail) {
          user.firebaseUid = uid;
          user.password = undefined; // Remove bcrypt hash
          user.refreshToken = null;
          if (name && !user.name) user.name = name;
          if (picture && !user.avatar) user.avatar = picture;
          await user.save();
          logger.info({
            context: 'auth.controller.syncUser',
            event: 'user_auto_migrated',
            message: `User ${user.email} successfully linked to Firebase UID ${uid} during sync`,
          });
        } else {
          return sendError(res, 'Email verification required to complete account migration.', 401);
        }
      } else {
        // Create new user document
        user = await UserModel.create({
          firebaseUid: uid,
          email: email.toLowerCase(),
          name: name || email.split('@')[0],
          avatar: picture || null,
          plan: 'free',
          currency: 'INR',
        });
        logger.info({
          context: 'auth.controller.syncUser',
          event: 'user_created',
          message: `Created new synced MongoDB user for email ${email}`,
        });
      }
    } else {
      // Update last login
      user.lastLogin = new Date();
      if (picture && !user.avatar) {
        user.avatar = picture;
      }
      await user.save();
    }

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
          avatar: user.avatar,
        },
      },
      'User synced successfully'
    );
  } catch (error) {
    const err = error as Error;
    logger.error({
      context: 'auth.controller.syncUser',
      event: 'user_sync_failed',
      errorMessage: err.message,
      stack: err.stack,
    });

    // If it's a Firebase token verification/expiry error, respond with 401.
    // Otherwise (e.g. Firebase SDK initialization error or database connection issue), respond with 500.
    const isAuthError = err.message.includes('auth/') || 
                        err.message.includes('token') || 
                        err.message.includes('argument-error') || 
                        (err as any).code?.startsWith('auth/');

    const statusCode = isAuthError ? 401 : 500;
    return sendError(res, `Failed to sync user: ${err.message}`, statusCode);
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  // Firebase sign-out is handled primarily on the client, this endpoint is a simple success response
  return sendSuccess(res, null, 'Logged out successfully');
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

export const deleteAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user?.id;
    if (!userId) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 'User session not found', 404);
    }

    // Get user and firebaseUid
    const user = await UserModel.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return sendError(res, 'User not found', 404);
    }

    // Delete user from Firebase Auth
    if (user.firebaseUid) {
      try {
        await getAuth().deleteUser(user.firebaseUid);
      } catch (fbErr) {
        logger.warn({
          context: 'auth.controller.deleteAccount',
          event: 'firebase_user_delete_failed',
          message: `Could not delete Firebase UID ${user.firebaseUid}: ${(fbErr as Error).message}`,
        });
      }
    }

    // Cascade delete all user-owned data using transaction session
    await BudgetModel.deleteMany({ userId }).session(session);
    await GoalModel.deleteMany({ userId }).session(session);
    await TransactionModel.deleteMany({ userId }).session(session);
    await InvestmentModel.deleteMany({ userId }).session(session);
    await AIHistoryModel.deleteMany({ userId }).session(session);
    await NotificationModel.deleteMany({ userId }).session(session);

    await UserModel.findByIdAndDelete(userId).session(session);

    await session.commitTransaction();
    session.endSession();

    return sendSuccess(res, null, 'Account and all associated data deleted successfully');
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
