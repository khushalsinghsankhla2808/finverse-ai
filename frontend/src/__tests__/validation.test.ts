import { describe, it, expect } from 'vitest';

// --- Implementation of Validation Logic ---

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateEmail = (email: string): boolean => {
  return email.includes('@');
};

export const validatePassword = (password: string): boolean => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
};

export const validateTicker = (ticker: string): boolean => {
  return /^[A-Z]+$/.test(ticker);
};

export const validatePositiveNumber = (num: number): boolean => {
  return num >= 0;
};

export const validateMaxDecimals = (num: number, maxDecimals: number = 2): boolean => {
  const str = num.toString();
  if (str.includes('.')) {
    return str.split('.')[1].length <= maxDecimals;
  }
  return true;
};

// --- Unit Tests ---

describe('Validation', () => {
  describe('TEST GROUP 6 — Input Validation edge cases', () => {
    it('Empty string fails required field validation', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired('   ')).toBe(false);
      expect(validateRequired('hello')).toBe(true);
    });
    
    it('Email without @ fails email validation', () => {
      expect(validateEmail('testemail.com')).toBe(false);
      expect(validateEmail('test@email.com')).toBe(true);
    });
    
    it('Password under 8 chars fails', () => {
      expect(validatePassword('A1bcdef')).toBe(false);
    });
    
    it('Password without uppercase fails', () => {
      expect(validatePassword('a1bcdefgh')).toBe(false);
    });
    
    it('Password without number fails', () => {
      expect(validatePassword('Abcdefghi')).toBe(false);
    });
    
    it('Password meets all criteria', () => {
      expect(validatePassword('A1bcdefg')).toBe(true);
    });
    
    it('Ticker with lowercase letters fails', () => {
      expect(validateTicker('aapl')).toBe(false);
      expect(validateTicker('AaPL')).toBe(false);
      expect(validateTicker('AAPL')).toBe(true);
    });
    
    it('Negative amount fails positive number validation', () => {
      expect(validatePositiveNumber(-5)).toBe(false);
      expect(validatePositiveNumber(0)).toBe(true);
      expect(validatePositiveNumber(10)).toBe(true);
    });
    
    it('Amount with more than 2 decimal places fails', () => {
      expect(validateMaxDecimals(10.555)).toBe(false);
      expect(validateMaxDecimals(10.55)).toBe(true);
      expect(validateMaxDecimals(10.5)).toBe(true);
      expect(validateMaxDecimals(10)).toBe(true);
    });
  });
});
