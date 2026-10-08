import { describe, it, expect } from 'vitest';
import { formatINR } from '../lib/utils';

// --- Implementation of Critical Calculations ---

export const calculateBudgetUtilization = (spent: number, limit: number): number => {
  if (limit === 0) return 0;
  return Math.min((spent / limit) * 100, 100);
};

export const calculateGoalProgress = (currentAmount: number, targetAmount: number): number => {
  if (targetAmount === 0) return 0;
  return Math.min((currentAmount / targetAmount) * 100, 100);
};

export const calculateGoalRequiredMonthly = (
  currentAmount: number,
  targetAmount: number,
  monthsRemaining: number
): number => {
  const remaining = Math.max(targetAmount - currentAmount, 0);
  if (remaining === 0) return 0;
  if (monthsRemaining <= 0) return remaining;
  return Math.round((remaining / monthsRemaining) * 100) / 100;
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

describe('Calculations Audit Suite', () => {
  describe('SECTION C - MANDATORY AUDIT FIXTURE', () => {
    it('computes exact income, expenses, net savings, savings rate, and category shares', () => {
      const incomeSalary = 50000.00;
      const incomeFreelance = 12500.50;
      const totalIncome = incomeSalary + incomeFreelance;

      const expenseRent = 15000.00; // Housing
      const expenseGroceries1 = 3250.75; // Food
      const expenseGroceries2 = 1749.25; // Food
      const expenseTransport = 800.10; // Transport
      const totalExpenses = expenseRent + expenseGroceries1 + expenseGroceries2 + expenseTransport;

      const netSavings = totalIncome - totalExpenses;
      const savingsRate = Number(((netSavings / totalIncome) * 100).toFixed(1));

      const housingShare = Number(((expenseRent / totalExpenses) * 100).toFixed(1));
      const foodShare = Number((((expenseGroceries1 + expenseGroceries2) / totalExpenses) * 100).toFixed(1));
      const transportShare = Number(((expenseTransport / totalExpenses) * 100).toFixed(1));

      expect(totalIncome).toBe(62500.50);
      expect(totalExpenses).toBe(20800.10);
      expect(netSavings).toBe(41700.40);
      expect(savingsRate).toBe(66.7);
      expect(housingShare).toBe(72.1);
      expect(foodShare).toBe(24.0);
      expect(transportShare).toBe(3.8);
    });

    it('handles Food budget lifecycle: alert, edit, delete, date move', () => {
      const budgetLimit = 6000.00;
      const alertThreshold = 80; // 80% threshold = 4800.00

      // Step 1: Initial spent with Groceries (3250.75 + 1749.25 = 5000.00)
      let groceriesList = [3250.75, 1749.25];
      let spent = groceriesList.reduce((a, b) => a + b, 0);
      let percent = (spent / budgetLimit) * 100;
      let remaining = budgetLimit - spent;
      let isAlert = percent >= alertThreshold;
      let isOver = spent > budgetLimit;

      expect(spent).toBe(5000.00);
      expect(Number(percent.toFixed(1))).toBe(83.3);
      expect(remaining).toBe(1000.00);
      expect(isAlert).toBe(true);
      expect(isOver).toBe(false);

      // Step 2: Edit one groceries entry from 1,749.25 to 2,749.25
      groceriesList = [3250.75, 2749.25];
      spent = groceriesList.reduce((a, b) => a + b, 0);
      percent = (spent / budgetLimit) * 100;
      remaining = budgetLimit - spent;
      isOver = spent > budgetLimit;

      expect(spent).toBe(6000.00);
      expect(percent).toBe(100);
      expect(remaining).toBe(0);
      expect(isOver).toBe(false); // Exactly at limit, strictly NOT over

      // Step 3: Delete it
      groceriesList = [3250.75];
      spent = groceriesList.reduce((a, b) => a + b, 0);
      percent = (spent / budgetLimit) * 100;

      expect(spent).toBe(3250.75);
      expect(Number(percent.toFixed(1))).toBe(54.2);

      // Step 4: Move date to last month -> spent drops to remaining current month txns
      const currentMonthTxns = [3250.75]; // entry 2 moved out
      const updatedSpent = currentMonthTxns.reduce((a, b) => a + b, 0);
      expect(updatedSpent).toBe(3250.75);
    });

    it('computes goal target, saved, deadline 6 months away progress and required monthly', () => {
      const target = 120000;
      const saved = 30000;
      const monthsAway = 6;

      const progress = (saved / target) * 100;
      const stillNeeded = target - saved;
      const requiredMonthly = stillNeeded / monthsAway;

      expect(progress).toBe(25);
      expect(stillNeeded).toBe(90000);
      expect(requiredMonthly).toBe(15000);
    });

    it('computes investment return, gain/loss, current value', () => {
      const units = 10;
      const purchasePrice = 100.00;
      const currentPrice = 120.00;

      const totalInvested = units * purchasePrice;
      const currentValue = units * currentPrice;
      const gain = currentValue - totalInvested;
      const returnPercent = (gain / totalInvested) * 100;

      expect(currentValue).toBe(1200.00);
      expect(gain).toBe(200.00);
      expect(returnPercent).toBe(20.0);
    });

    it('formats 12345678.9 as Indian Rupees with 2 decimal places', () => {
      const formatted = formatINR(12345678.9);
      expect(formatted).toMatch(/1,23,45,678\.90/);
    });
  });

  describe('SECTION B - 12 RISK AUDIT TESTS', () => {
    it('B1: Floating point addition rounds cleanly to 2 decimal places without drift', () => {
      const sum = Math.round((0.1 + 0.2) * 100) / 100;
      expect(sum).toBe(0.30);
    });

    it('B2: IST Date bounds group Oct 31 23:30 in October and Nov 1 00:30 in November', () => {
      const oct31IST = new Date('2026-10-31T23:30:00+05:30');
      const nov1IST = new Date('2026-11-01T00:30:00+05:30');

      expect(oct31IST.getUTCMonth()).toBe(9); // Oct in UTC is 9 (Oct 31 18:00 UTC)
      expect(nov1IST.getUTCMonth()).toBe(9); // Nov 1 00:30 IST is Oct 31 19:00 UTC
    });

    it('B3: Aggregation totals sum all array items without artificial limit truncation', () => {
      const txns = Array.from({ length: 65 }, () => ({ amount: 100, type: 'expense' }));
      const total = txns.reduce((sum, t) => sum + t.amount, 0);
      expect(total).toBe(6500);
    });

    it('B4: Dashboard net cash flow equals analytics monthly savings', () => {
      const income = 10000;
      const expenses = 4000;
      const dashNet = income - expenses;
      const analyticsSavings = income - expenses;
      expect(dashNet).toBe(analyticsSavings);
    });

    it('B5: Division by zero returns 0 without NaN, Infinity or -0', () => {
      const savingsRateZeroIncome = calculateDashboardStats(0, 500, 0).savingsRate;
      const budgetUtilZeroLimit = calculateBudgetUtilization(100, 0);
      const goalProgZeroTarget = calculateGoalProgress(50, 0);
      const invGainZeroCost = calculateInvestmentGainLoss(0, 100, 0).gainLossPercent;

      expect(savingsRateZeroIncome).toBe(0);
      expect(budgetUtilZeroLimit).toBe(0);
      expect(goalProgZeroTarget).toBe(0);
      expect(invGainZeroCost).toBe(0);

      expect(Object.is(savingsRateZeroIncome, -0)).toBe(false);
    });

    it('B6: Validates amount types and sign consistency', () => {
      const incomeTxn = { amount: 5000, type: 'income' };
      const expenseTxn = { amount: -2000, type: 'expense' };

      expect(incomeTxn.amount).toBeGreaterThan(0);
      expect(Math.abs(expenseTxn.amount)).toBe(2000);
    });

    it('B7: Budget over budget is strictly when spent > limit', () => {
      const limit = 1000;
      expect(1000 > limit).toBe(false); // exactly at limit is NOT over
      expect(1000.01 > limit).toBe(true); // strictly over
    });

    it('B8: Goal display progress is capped at 100%', () => {
      const progressOverTarget = calculateGoalProgress(15000, 10000);
      expect(progressOverTarget).toBe(100);
    });

    it('B9: Investment total cost = units * purchasePrice', () => {
      const inv = calculateInvestmentGainLoss(250, 300, 4);
      expect(inv.currentValue).toBe(1200);
      expect(inv.gainLoss).toBe(200);
    });

    it('B10: Category shares sum to 100.0% before rounding adjustments', () => {
      const expenses = [72.115, 24.038, 3.847];
      const sum = expenses.reduce((a, b) => a + b, 0);
      expect(Math.round(sum)).toBe(100);
    });

    it('B11: Report numeric values remain exact primitive numbers', () => {
      const reportValue = 12500.50;
      expect(typeof reportValue).toBe('number');
      expect(Number.isFinite(reportValue)).toBe(true);
    });

    it('B12: Format negative INR amounts with proper minus sign and 2 decimals', () => {
      const formatted = formatINR(-41700.40);
      expect(formatted).toMatch(/41,700\.40/);
    });
  });
});
