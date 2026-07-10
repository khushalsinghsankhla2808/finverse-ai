import jwt from 'jsonwebtoken';
import env from '../config/env';

export interface IJWTDecoded {
  id: string;
  iat: number;
  exp: number;
}

export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
};

export const verifyAccessToken = (token: string): IJWTDecoded => {
  return jwt.verify(token, env.JWT_SECRET) as IJWTDecoded;
};

export const verifyRefreshToken = (token: string): IJWTDecoded => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as IJWTDecoded;
};
