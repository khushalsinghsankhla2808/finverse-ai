import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import UserModel, { IUserDocument } from '../models/User.model';
import { logger } from './logger.middleware';
import '../config/firebase'; // Ensure Firebase is initialized

export interface AuthenticatedRequest extends Request {
  user?: IUserDocument;
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    // Verify Firebase ID Token
    const decodedToken = await getAuth().verifyIdToken(token);

    // Find user by firebaseUid.
    const user: IUserDocument | null = await UserModel.findOne({ firebaseUid: decodedToken.uid }).select('-password -refreshToken');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not synced with local database. Please complete registration.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    const err = error as Error;
    logger.warn({
      context: 'auth.middleware',
      event: 'firebase_token_verification_failed',
      errorName: err.name,
      errorMessage: err.message,
    });
    return res.status(401).json({ success: false, message: `Not authorized, invalid token: ${err.message}` });
  }
};

export default protect;
