import { describe, it, expect } from 'vitest';

// --- Implementation of Critical Calculations ---

export const calculateBudgetUtilization = (spent: number, limit: number): number => {
  if (limit === 0) return 0;
  return Math.min((spent / limit) * 100, 100);
};

export const calculateGoalProgress = (currentAmount: number, targetAmount: number): number => {
  if (targetAmount === 0) return 0;
  return Math.min((currentAmount / targetAmount) * 100, 100);
};

export const calculateRemainingAmount = (currentAmount: number, targetAmount: number): number => {
  return Math.max(targetAmount - currentAmount, 0);
};

export const calculateInvestmentGainLoss = (purchasePrice: number, currentPrice: number, quantity: number) => {
  const currentValue = currentPrice * quantity;
  const totalInvested = purchasePrice * quantity;
  const gainLoss = currentValue - totalInvested;
  const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;
  return { gainLoss, gainLossPercent, currentValue };
};

export const calculateDashboardStats = (income: number, expenses: number, lastMonthIncome: number) => {
  const totalBalance = income - expenses;
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
  const momChange = lastMonthIncome !== 0 ? ((income - lastMonthIncome) / Math.abs(lastMonthIncome)) * 100 : null;
  
  return { totalBalance, savingsRate, momChange };
};

export const isThisMonth = (date: Date | string): boolean => {
  const d = new Date(date);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

export const isLastMonth = (date: Date | string): boolean => {
  const d = new Date(date);
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
};

export const getDaysRemaining = (deadline: Date | string): number => {
  const d = new Date(deadline);
  const now = new Date();
  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffTime = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// --- Unit Tests ---

describe('Calculations', () => {
  describe('TEST GROUP 1 — Budget Utilization', () => {
    it('utilization of 500 spent against 1000 limit = 50%', () => {
      expect(calculateBudgetUtilization(500, 1000)).toBe(50);
    });
    it('utilization of 1100 spent against 1000 limit = 110% capped to 100%', () => {
      // The prompt says "utilization of 1100 spent against 1000 limit = 110% (overspent)"
      // AND "utilization is always capped at 100% for display". Let's handle the cap.
      expect(calculateBudgetUtilization(1100, 1000)).toBe(100);
    });
    it('zero limit budget returns 0% not NaN or Infinity', () => {
      expect(calculateBudgetUtilization(500, 0)).toBe(0);
    });
  });

  describe('TEST GROUP 2 — Goal Progress', () => {
    it('currentAmount 750 / targetAmount 1000 = 75% progress', () => {
      expect(calculateGoalProgress(750, 1000)).toBe(75);
    });
    it('currentAmount 1000 / targetAmount 1000 = 100% (achieved)', () => {
      expect(calculateGoalProgress(1000, 1000)).toBe(100);
    });
    it('currentAmount 1200 / targetAmount 1000 = 100% (capped, not 120%)', () => {
      expect(calculateGoalProgress(1200, 1000)).toBe(100);
    });
    it('remaining amount = max(targetAmount - currentAmount, 0)', () => {
      expect(calculateRemainingAmount(750, 1000)).toBe(250);
    });
    it('remaining never goes negative', () => {
      expect(calculateRemainingAmount(1200, 1000)).toBe(0);
    });
  });

  describe('TEST GROUP 3 — Investment Gain/Loss', () => {
    it('purchasePrice 100, currentPrice 150, quantity 10', () => {
      const result = calculateInvestmentGainLoss(100, 150, 10);
      expect(result.gainLoss).toBe(500);
      expect(result.gainLossPercent).toBe(50);
    });
    it('purchasePrice 100, currentPrice 80, quantity 5', () => {
      const result = calculateInvestmentGainLoss(100, 80, 5);
      expect(result.gainLoss).toBe(-100);
      expect(result.gainLossPercent).toBe(-20);
    });
    it('currentValue = currentPrice * quantity', () => {
      const result = calculateInvestmentGainLoss(100, 150, 10);
      expect(result.currentValue).toBe(1500);
    });
  });

  describe('TEST GROUP 4 — Dashboard Stats', () => {
    it('totalBalance = totalIncome - totalExpenses', () => {
      const result = calculateDashboardStats(5000, 2000, 4000);
      expect(result.totalBalance).toBe(3000);
    });
    it('savingsRate = ((income - expenses) / income) * 100', () => {
      const result = calculateDashboardStats(5000, 2000, 4000);
      expect(result.savingsRate).toBe(60);
    });
    it('savingsRate returns 0 when income is 0', () => {
      const result = calculateDashboardStats(0, 2000, 4000);
      expect(result.savingsRate).toBe(0);
    });
    it('MoM change formula: ((thisMonth - lastMonth) / |lastMonth|) * 100', () => {
      const result = calculateDashboardStats(5000, 2000, 4000);
      expect(result.momChange).toBe(25); // (5000 - 4000) / 4000 * 100
    });
    it('MoM change returns null when lastMonth is 0', () => {
      const result = calculateDashboardStats(5000, 2000, 0);
      expect(result.momChange).toBeNull();
    });
  });

  describe('TEST GROUP 5 — Date Helpers', () => {
    it('isThisMonth correctly identifies current month transactions', () => {
      expect(isThisMonth(new Date())).toBe(true);
      
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      expect(isThisMonth(lastMonth)).toBe(false);
    });
    it('isLastMonth correctly identifies previous month transactions', () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      expect(isLastMonth(lastMonth)).toBe(true);
      
      expect(isLastMonth(new Date())).toBe(false);
    });
    it('daysRemaining returns negative number for past deadlines', () => {
      const past = new Date();
      past.setDate(past.getDate() - 5);
      expect(getDaysRemaining(past)).toBe(-5);
    });
    it('daysRemaining returns 0 for todays deadline', () => {
      expect(getDaysRemaining(new Date())).toBe(0);
    });
  });
});
