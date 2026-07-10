import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Transaction, Budget, Goal, Investment, PortfolioSummary, FinanceState } from '@/types/finance.types';

import transactionService from '@/services/transactionService';
import budgetService from '@/services/budgetService';
import goalService from '@/services/goalService';
import investmentService from '@/services/investmentService';

// Helper to recalculate budget spent from transactions
const recalculateSpent = (transactions: Transaction[], budgets: Budget[]): Budget[] => {
  return budgets.map((b) => {
    const spent = transactions
      .filter((t) => t.category === b.category && t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { ...b, spent };
  });
};

// Helper to calculate portfolio summary from investments array
const calculatePortfolioSummary = (investments: Investment[]): PortfolioSummary => {
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
    const invInvested = inv.units * inv.purchasePrice;
    const invCurrent = inv.units * inv.currentPrice;
    totalInvested += invInvested;
    currentValue += invCurrent;
    allocations[inv.assetType] += invCurrent;
  });

  const totalGainLoss = currentValue - totalInvested;
  const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  const assetAllocation = Object.entries(allocations).reduce((acc, [type, value]) => {
    acc[type] = {
      value,
      percentage: currentValue > 0 ? (value / currentValue) * 100 : 0,
    };
    return acc;
  }, {} as Record<string, { value: number; percentage: number }>);

  return {
    totalInvested,
    currentValue,
    totalGainLoss,
    totalGainLossPercent,
    assetAllocation,
  };
};

const getInitialMockData = () => {
  const MOCK_TRANSACTIONS: Transaction[] = [
    // JULY 2026
    { id: uuidv4(), name: 'Salary', category: 'Income', amount: 125000, date: '2026-07-01', type: 'income', merchant: 'Employer' },
    { id: uuidv4(), name: 'Rent', category: 'Housing', amount: -22000, date: '2026-07-02', type: 'expense', merchant: 'Landlord' },
    { id: uuidv4(), name: 'Amazon India', category: 'Shopping', amount: -3499, date: '2026-07-05', type: 'expense', merchant: 'Amazon' },
    { id: uuidv4(), name: 'Zomato', category: 'Food', amount: -680, date: '2026-07-06', type: 'expense', merchant: 'Zomato' },
    { id: uuidv4(), name: 'Ola', category: 'Transport', amount: -350, date: '2026-07-08', type: 'expense', merchant: 'Ola' },
    { id: uuidv4(), name: 'Netflix', category: 'Entertainment', amount: -649, date: '2026-07-09', type: 'expense', merchant: 'Netflix' },
    { id: uuidv4(), name: 'Swiggy', category: 'Food', amount: -420, date: '2026-07-10', type: 'expense', merchant: 'Swiggy' },
    { id: uuidv4(), name: 'BSNL Broadband', category: 'Utilities', amount: -999, date: '2026-07-11', type: 'expense', merchant: 'BSNL' },
    { id: uuidv4(), name: 'Freelance Work', category: 'Income', amount: 35000, date: '2026-07-12', type: 'income', merchant: 'Client' },
    { id: uuidv4(), name: 'BigBasket', category: 'Groceries', amount: -2840, date: '2026-07-13', type: 'expense', merchant: 'BigBasket' },

    // JUNE 2026
    { id: uuidv4(), name: 'Salary', category: 'Income', amount: 125000, date: '2026-06-01', type: 'income', merchant: 'Employer' },
    { id: uuidv4(), name: 'Rent', category: 'Housing', amount: -22000, date: '2026-06-02', type: 'expense', merchant: 'Landlord' },
    { id: uuidv4(), name: 'Myntra', category: 'Shopping', amount: -4299, date: '2026-06-08', type: 'expense', merchant: 'Myntra' },
    { id: uuidv4(), name: 'PVR Cinemas', category: 'Entertainment', amount: -1200, date: '2026-06-12', type: 'expense', merchant: 'PVR' },
    { id: uuidv4(), name: 'Zepto', category: 'Groceries', amount: -1650, date: '2026-06-15', type: 'expense', merchant: 'Zepto' },
    { id: uuidv4(), name: 'Rapido', category: 'Transport', amount: -220, date: '2026-06-18', type: 'expense', merchant: 'Rapido' },
  ];

  const MOCK_BUDGETS: Budget[] = [
    { id: uuidv4(), category: 'Housing', limit: 25000, spent: 0, period: 'monthly', color: '#7C3AED', icon: '🏠', alertThreshold: 80 },
    { id: uuidv4(), category: 'Food', limit: 8000, spent: 0, period: 'monthly', color: '#06B6D4', icon: '🍔', alertThreshold: 80 },
    { id: uuidv4(), category: 'Transport', limit: 3000, spent: 0, period: 'monthly', color: '#10B981', icon: '🚗', alertThreshold: 80 },
    { id: uuidv4(), category: 'Shopping', limit: 10000, spent: 0, period: 'monthly', color: '#F59E0B', icon: '🛍️', alertThreshold: 80 },
    { id: uuidv4(), category: 'Entertainment', limit: 2000, spent: 0, period: 'monthly', color: '#F43F5E', icon: '🎬', alertThreshold: 80 },
    { id: uuidv4(), category: 'Groceries', limit: 5000, spent: 0, period: 'monthly', color: '#8B5CF6', icon: '🛒', alertThreshold: 80 },
    { id: uuidv4(), category: 'Utilities', limit: 2000, spent: 0, period: 'monthly', color: '#EC4899', icon: '⚡', alertThreshold: 80 },
  ];

  const MOCK_GOALS: Goal[] = [
    { id: uuidv4(), name: 'Emergency Fund', targetAmount: 300000, currentAmount: 185000, deadline: '2026-12-31', category: 'Safety', color: '#10B981', icon: '🛡️' },
    { id: uuidv4(), name: 'Europe Trip', targetAmount: 250000, currentAmount: 87500, deadline: '2027-06-30', category: 'Travel', color: '#7C3AED', icon: '✈️' },
    { id: uuidv4(), name: 'New MacBook', targetAmount: 180000, currentAmount: 72000, deadline: '2026-10-01', category: 'Tech', color: '#06B6D4', icon: '💻' },
    { id: uuidv4(), name: 'Dream Bike', targetAmount: 120000, currentAmount: 45000, deadline: '2027-03-31', category: 'Vehicle', color: '#F59E0B', icon: '🏍️' },
  ];

  const MOCK_INVESTMENTS: Investment[] = [
    {
      id: uuidv4(),
      name: 'Reliance Industries',
      assetType: 'stocks',
      symbol: 'RELIANCE',
      units: 10,
      purchasePrice: 2400,
      currentPrice: 2900,
      purchaseDate: '2026-01-10',
      platform: 'Zerodha',
      notes: 'Bluechip core portfolio stock',
      totalInvested: 24000,
      currentValue: 29000,
      gainLoss: 5000,
      gainLossPercent: 20.83,
    },
    {
      id: uuidv4(),
      name: 'HDFC Nifty 50 Fund',
      assetType: 'mutual_funds',
      symbol: 'HDFCN50',
      units: 100,
      purchasePrice: 120,
      currentPrice: 145,
      purchaseDate: '2026-02-15',
      platform: 'Groww',
      notes: 'Monthly SIP passive index mutual fund',
      totalInvested: 12000,
      currentValue: 14500,
      gainLoss: 2500,
      gainLossPercent: 20.83,
    },
    {
      id: uuidv4(),
      name: 'Digital Gold',
      assetType: 'gold',
      symbol: 'GOLD',
      units: 5,
      purchasePrice: 6000,
      currentPrice: 7200,
      purchaseDate: '2026-03-01',
      platform: 'Paytm Gold',
      notes: 'Hedge asset class inflation guard',
      totalInvested: 30000,
      currentValue: 36000,
      gainLoss: 6000,
      gainLossPercent: 20.00,
    },
    {
      id: uuidv4(),
      name: 'Bitcoin',
      assetType: 'crypto',
      symbol: 'BTC',
      units: 0.05,
      purchasePrice: 5500000,
      currentPrice: 6200000,
      purchaseDate: '2026-04-10',
      platform: 'CoinDCX',
      notes: 'High volatility speculative allocation',
      totalInvested: 275000,
      currentValue: 310000,
      gainLoss: 35000,
      gainLossPercent: 12.73,
    },
    {
      id: uuidv4(),
      name: 'SBI Fixed Deposit',
      assetType: 'fixed_deposit',
      symbol: 'SBI-FD',
      units: 1,
      purchasePrice: 100000,
      currentPrice: 107000,
      purchaseDate: '2026-05-01',
      platform: 'SBI NetBanking',
      notes: 'Safe low-risk fixed return instrument',
      totalInvested: 100000,
      currentValue: 107000,
      gainLoss: 7000,
      gainLossPercent: 7.00,
    },
  ];

  const computedBudgets = recalculateSpent(MOCK_TRANSACTIONS, MOCK_BUDGETS);
  const computedSummary = calculatePortfolioSummary(MOCK_INVESTMENTS);

  return {
    transactions: MOCK_TRANSACTIONS,
    budgets: computedBudgets,
    goals: MOCK_GOALS,
    investments: MOCK_INVESTMENTS,
    portfolioSummary: computedSummary,
  };
};

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      ...getInitialMockData(),

      // Transaction actions
      addTransaction: async (t) => {
        try {
          const hasToken = !!localStorage.getItem('finverse_access_token');
          if (hasToken) {
            await transactionService.create(t);
            // Reload list from api after additions
            const res = await transactionService.getAll();
            const txns = res.data.transactions.map((txn: any) => ({
              id: txn._id,
              name: txn.name,
              category: txn.category,
              amount: txn.amount,
              date: txn.date.split('T')[0],
              type: txn.type,
              merchant: txn.merchant,
              note: txn.note,
            }));
            const updatedBudgets = recalculateSpent(txns, get().budgets);
            set({ transactions: txns, budgets: updatedBudgets });
            return;
          }
        } catch (err) {
          // Fall back gracefully
        }

        // Local fallback
        set((state) => {
          const newTxn: Transaction = { ...t, id: uuidv4() };
          const updatedTransactions = [newTxn, ...state.transactions];
          const updatedBudgets = recalculateSpent(updatedTransactions, state.budgets);
          return {
            transactions: updatedTransactions,
            budgets: updatedBudgets,
          };
        });
      },

      updateTransaction: async (id, updatedFields) => {
        try {
          const hasToken = !!localStorage.getItem('finverse_access_token');
          if (hasToken) {
            await transactionService.update(id, updatedFields);
            const res = await transactionService.getAll();
            const txns = res.data.transactions.map((txn: any) => ({
              id: txn._id,
              name: txn.name,
              category: txn.category,
              amount: txn.amount,
              date: txn.date.split('T')[0],
              type: txn.type,
              merchant: txn.merchant,
              note: txn.note,
            }));
            const updatedBudgets = recalculateSpent(txns, get().budgets);
            set({ transactions: txns, budgets: updatedBudgets });
            return;
          }
        } catch (err) {
          // Fall back gracefully
        }

        // Local fallback
        set((state) => {
          const updatedTransactions = state.transactions.map((t) =>
            t.id === id ? { ...t, ...updatedFields } : t
          );
          const updatedBudgets = recalculateSpent(updatedTransactions, state.budgets);
          return {
            transactions: updatedTransactions,
            budgets: updatedBudgets,
          };
        });
      },

      deleteTransaction: async (id) => {
        try {
          const hasToken = !!localStorage.getItem('finverse_access_token');
          if (hasToken) {
            await transactionService.delete(id);
            const res = await transactionService.getAll();
            const txns = res.data.transactions.map((txn: any) => ({
              id: txn._id,
              name: txn.name,
              category: txn.category,
              amount: txn.amount,
              date: txn.date.split('T')[0],
              type: txn.type,
              merchant: txn.merchant,
              note: txn.note,
            }));
            const updatedBudgets = recalculateSpent(txns, get().budgets);
            set({ transactions: txns, budgets: updatedBudgets });
            return;
          }
        } catch (err) {
          // Fall back gracefully
        }

        // Local fallback
        set((state) => {
          const updatedTransactions = state.transactions.filter((t) => t.id !== id);
          const updatedBudgets = recalculateSpent(updatedTransactions, state.budgets);
          return {
            transactions: updatedTransactions,
            budgets: updatedBudgets,
          };
        });
      },

      // Budget actions
      addBudget: async (b) => {
        try {
          const hasToken = !!localStorage.getItem('finverse_access_token');
          if (hasToken) {
            await budgetService.create(b);
            const res = await budgetService.getAll();
            const budgets = res.data.map((bdg: any) => ({
              id: bdg._id,
              category: bdg.category,
              limit: bdg.limit,
              spent: bdg.spent,
              period: bdg.period,
              color: bdg.color,
              icon: bdg.icon,
              alertThreshold: bdg.alertThreshold,
            }));
            set({ budgets });
            return;
          }
        } catch (err) {
          // Fall back gracefully
        }

        // Local fallback
        set((state) => {
          const newBudget: Budget = { ...b, id: uuidv4(), spent: 0 };
          const updatedBudgets = recalculateSpent(state.transactions, [...state.budgets, newBudget]);
          return { budgets: updatedBudgets };
        });
      },

      updateBudget: async (id, updatedFields) => {
        try {
          const hasToken = !!localStorage.getItem('finverse_access_token');
          if (hasToken) {
            await budgetService.update(id, updatedFields);
            const res = await budgetService.getAll();
            const budgets = res.data.map((bdg: any) => ({
              id: bdg._id,
              category: bdg.category,
              limit: bdg.limit,
              spent: bdg.spent,
              period: bdg.period,
              color: bdg.color,
              icon: bdg.icon,
              alertThreshold: bdg.alertThreshold,
            }));
            set({ budgets });
            return;
          }
        } catch (err) {
          // Fall back gracefully
        }

        // Local fallback
        set((state) => {
          const updatedBudgets = state.budgets.map((b) =>
            b.id === id ? { ...b, ...updatedFields } : b
          );
          return { budgets: updatedBudgets };
        });
      },

      deleteBudget: async (id) => {
        try {
          const hasToken = !!localStorage.getItem('finverse_access_token');
          if (hasToken) {
            await budgetService.delete(id);
            const res = await budgetService.getAll();
            const budgets = res.data.map((bdg: any) => ({
              id: bdg._id,
              category: bdg.category,
              limit: bdg.limit,
              spent: bdg.spent,
              period: bdg.period,
              color: bdg.color,
              icon: bdg.icon,
              alertThreshold: bdg.alertThreshold,
            }));
            set({ budgets });
            return;
          }
        } catch (err) {
          // Fall back gracefully
        }

        // Local fallback
        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== id),
        }));
      },

      // Goal actions
      addGoal: async (g) => {
        try {
          const hasToken = !!localStorage.getItem('finverse_access_token');
          if (hasToken) {
            await goalService.create(g);
            const res = await goalService.getAll();
            const goals = res.data.map((gl: any) => ({
              id: gl._id,
              name: gl.name,
              targetAmount: gl.targetAmount,
              currentAmount: gl.currentAmount,
              deadline: gl.deadline.split('T')[0],
              category: gl.category,
              color: gl.color,
              icon: gl.icon,
            }));
            set({ goals });
            return;
          }
        } catch (err) {
          // Fall back gracefully
        }

        // Local fallback
        set((state) => {
          const newGoal: Goal = { ...g, id: uuidv4() };
          return { goals: [...state.goals, newGoal] };
        });
      },

      updateGoal: async (id, updatedFields) => {
        try {
          const hasToken = !!localStorage.getItem('finverse_access_token');
          if (hasToken) {
            await goalService.update(id, updatedFields);
            const res = await goalService.getAll();
            const goals = res.data.map((gl: any) => ({
              id: gl._id,
              name: gl.name,
              targetAmount: gl.targetAmount,
              currentAmount: gl.currentAmount,
              deadline: gl.deadline.split('T')[0],
              category: gl.category,
              color: gl.color,
              icon: gl.icon,
            }));
            set({ goals });
            return;
          }
        } catch (err) {
          // Fall back gracefully
        }

        // Local fallback
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updatedFields } : g)),
        }));
      },

      deleteGoal: async (id) => {
        try {
          const hasToken = !!localStorage.getItem('finverse_access_token');
          if (hasToken) {
            await goalService.delete(id);
            const res = await goalService.getAll();
            const goals = res.data.map((gl: any) => ({
              id: gl._id,
              name: gl.name,
              targetAmount: gl.targetAmount,
              currentAmount: gl.currentAmount,
              deadline: gl.deadline.split('T')[0],
              category: gl.category,
              color: gl.color,
              icon: gl.icon,
            }));
            set({ goals });
            return;
          }
        } catch (err) {
          // Fall back gracefully
        }

        // Local fallback
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));
      },

      addToGoal: async (id, amount) => {
        try {
          const hasToken = !!localStorage.getItem('finverse_access_token');
          if (hasToken) {
            await goalService.addMoney(id, amount);
            // Fetch everything updated since goal add-money logs a transaction and updates budgets
            const [goalsRes, txnsRes, budgetsRes] = await Promise.all([
              goalService.getAll(),
              transactionService.getAll(),
              budgetService.getAll(),
            ]);

            const goals = goalsRes.data.map((gl: any) => ({
              id: gl._id,
              name: gl.name,
              targetAmount: gl.targetAmount,
              currentAmount: gl.currentAmount,
              deadline: gl.deadline.split('T')[0],
              category: gl.category,
              color: gl.color,
              icon: gl.icon,
            }));

            const txns = txnsRes.data.transactions.map((txn: any) => ({
              id: txn._id,
              name: txn.name,
              category: txn.category,
              amount: txn.amount,
              date: txn.date.split('T')[0],
              type: txn.type,
              merchant: txn.merchant,
              note: txn.note,
            }));

            const budgets = budgetsRes.data.map((bdg: any) => ({
              id: bdg._id,
              category: bdg.category,
              limit: bdg.limit,
              spent: bdg.spent,
              period: bdg.period,
              color: bdg.color,
              icon: bdg.icon,
              alertThreshold: bdg.alertThreshold,
            }));

            set({ goals, transactions: txns, budgets });
            return;
          }
        } catch (err) {
          // Fall back gracefully
        }

        // Local fallback
        set((state) => {
          const goal = state.goals.find((g) => g.id === id);
          if (!goal) return {};

          const updatedGoals = state.goals.map((g) =>
            g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g
          );

          const newTxn: Transaction = {
            id: uuidv4(),
            name: `Savings - ${goal.name}`,
            category: 'Investment',
            amount: -amount,
            type: 'expense',
            date: new Date().toISOString().split('T')[0],
            merchant: 'Goal Savings',
          };

          const updatedTransactions = [newTxn, ...state.transactions];
          const updatedBudgets = recalculateSpent(updatedTransactions, state.budgets);

          return {
            goals: updatedGoals,
            transactions: updatedTransactions,
            budgets: updatedBudgets,
          };
        });
      },

      // Investment actions
      fetchInvestments: async () => {
        try {
          const hasToken = !!localStorage.getItem('finverse_access_token');
          if (hasToken) {
            const res = await investmentService.getAll();
            const investments = res.data.investments.map((inv: any) => ({
              id: inv._id,
              name: inv.name,
              assetType: inv.assetType,
              symbol: inv.symbol,
              units: inv.units,
              purchasePrice: inv.purchasePrice,
              currentPrice: inv.currentPrice,
              purchaseDate: inv.purchaseDate.split('T')[0],
              platform: inv.platform,
              notes: inv.notes,
              totalInvested: inv.totalInvested,
              currentValue: inv.currentValue,
              gainLoss: inv.gainLoss,
              gainLossPercent: inv.gainLossPercent,
            }));
            const portfolioSummary = res.data.summary;
            set({ investments, portfolioSummary });
            return;
          }
        } catch (err) {
          // Fall back gracefully
        }

        // Local fallback (calculate summary locally)
        set((state) => ({
          portfolioSummary: calculatePortfolioSummary(state.investments),
        }));
      },

      addInvestment: async (inv) => {
        try {
          const hasToken = !!localStorage.getItem('finverse_access_token');
          if (hasToken) {
            await investmentService.create(inv);
            const res = await investmentService.getAll();
            const investments = res.data.investments.map((i: any) => ({
              id: i._id,
              name: i.name,
              assetType: i.assetType,
              symbol: i.symbol,
              units: i.units,
              purchasePrice: i.purchasePrice,
              currentPrice: i.currentPrice,
              purchaseDate: i.purchaseDate.split('T')[0],
              platform: i.platform,
              notes: i.notes,
              totalInvested: i.totalInvested,
              currentValue: i.currentValue,
              gainLoss: i.gainLoss,
              gainLossPercent: i.gainLossPercent,
            }));
            const portfolioSummary = res.data.summary;
            set({ investments, portfolioSummary });
            return;
          }
        } catch (err) {
          // Fall back gracefully
        }

        // Local fallback
        set((state) => {
          const totalInvested = inv.units * inv.purchasePrice;
          const currentValue = inv.units * inv.currentPrice;
          const gainLoss = currentValue - totalInvested;
          const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

          const newInv: Investment = {
            ...inv,
            id: uuidv4(),
            totalInvested,
            currentValue,
            gainLoss,
            gainLossPercent,
          };
          
          const updatedInvestments = [...state.investments, newInv];
          const summary = calculatePortfolioSummary(updatedInvestments);

          return {
            investments: updatedInvestments,
            portfolioSummary: summary,
          };
        });
      },

      updateInvestment: async (id, updatedFields) => {
        try {
          const hasToken = !!localStorage.getItem('finverse_access_token');
          if (hasToken) {
            await investmentService.update(id, updatedFields);
            const res = await investmentService.getAll();
            const investments = res.data.investments.map((i: any) => ({
              id: i._id,
              name: i.name,
              assetType: i.assetType,
              symbol: i.symbol,
              units: i.units,
              purchasePrice: i.purchasePrice,
              currentPrice: i.currentPrice,
              purchaseDate: i.purchaseDate.split('T')[0],
              platform: i.platform,
              notes: i.notes,
              totalInvested: i.totalInvested,
              currentValue: i.currentValue,
              gainLoss: i.gainLoss,
              gainLossPercent: i.gainLossPercent,
            }));
            const portfolioSummary = res.data.summary;
            set({ investments, portfolioSummary });
            return;
          }
        } catch (err) {
          // Fall back gracefully
        }

        // Local fallback
        set((state) => {
          const updatedInvestments = state.investments.map((inv) => {
            if (inv.id !== id) return inv;
            const merged = { ...inv, ...updatedFields };
            const totalInvested = merged.units * merged.purchasePrice;
            const currentValue = merged.units * merged.currentPrice;
            const gainLoss = currentValue - totalInvested;
            const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;
            return {
              ...merged,
              totalInvested,
              currentValue,
              gainLoss,
              gainLossPercent,
            };
          });
          const summary = calculatePortfolioSummary(updatedInvestments);
          return {
            investments: updatedInvestments,
            portfolioSummary: summary,
          };
        });
      },

      deleteInvestment: async (id) => {
        try {
          const hasToken = !!localStorage.getItem('finverse_access_token');
          if (hasToken) {
            await investmentService.delete(id);
            const res = await investmentService.getAll();
            const investments = res.data.investments.map((i: any) => ({
              id: i._id,
              name: i.name,
              assetType: i.assetType,
              symbol: i.symbol,
              units: i.units,
              purchasePrice: i.purchasePrice,
              currentPrice: i.currentPrice,
              purchaseDate: i.purchaseDate.split('T')[0],
              platform: i.platform,
              notes: i.notes,
              totalInvested: i.totalInvested,
              currentValue: i.currentValue,
              gainLoss: i.gainLoss,
              gainLossPercent: i.gainLossPercent,
            }));
            const portfolioSummary = res.data.summary;
            set({ investments, portfolioSummary });
            return;
          }
        } catch (err) {
          // Fall back gracefully
        }

        // Local fallback
        set((state) => {
          const updatedInvestments = state.investments.filter((inv) => inv.id !== id);
          const summary = calculatePortfolioSummary(updatedInvestments);
          return {
            investments: updatedInvestments,
            portfolioSummary: summary,
          };
        });
      },
    }),
    {
      name: 'finverse-finance-data',
    }
  )
);
