import { Request, Response, NextFunction } from 'express';
import UserModel, { IUserDocument } from '../models/User.model';
import { verifyAccessToken } from '../utils/jwt.utils';

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
    const decoded = verifyAccessToken(token);

    // Find the user and attach to request
    const user = await UserModel.findById(decoded.id).select('-password -refreshToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User matching token session not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    const err = error as Error;
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

export default protect;
