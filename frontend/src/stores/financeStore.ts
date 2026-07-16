import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Transaction, Budget, Goal, Investment, PortfolioSummary, FinanceState } from '@/types/finance.types';
import { useAuthStore } from './authStore';

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
  return {
    transactions: [],
    budgets: [],
    goals: [],
    investments: [],
    portfolioSummary: {
      totalInvested: 0,
      currentValue: 0,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      assetAllocation: {},
    },
  };
};

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      ...getInitialMockData(),

      // Transaction actions

      fetchTransactions: async () => {
        try {
          const hasToken = useAuthStore.getState().isAuthenticated;
          if (hasToken) {
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
          }
        } catch (err) {}
      },

      addTransaction: async (t) => {
        try {
          const hasToken = useAuthStore.getState().isAuthenticated;
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
          const hasToken = useAuthStore.getState().isAuthenticated;
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
          const hasToken = useAuthStore.getState().isAuthenticated;
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
          const hasToken = useAuthStore.getState().isAuthenticated;
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
          const hasToken = useAuthStore.getState().isAuthenticated;
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
          const hasToken = useAuthStore.getState().isAuthenticated;
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
          const hasToken = useAuthStore.getState().isAuthenticated;
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
          const hasToken = useAuthStore.getState().isAuthenticated;
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
          const hasToken = useAuthStore.getState().isAuthenticated;
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
          const hasToken = useAuthStore.getState().isAuthenticated;
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
          const hasToken = useAuthStore.getState().isAuthenticated;
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
              totalInvested: inv.totalInvested !== undefined ? inv.totalInvested : (inv.units * inv.purchasePrice),
              currentValue: inv.currentValue !== undefined ? inv.currentValue : (inv.units * inv.currentPrice),
              gainLoss: inv.gainLoss !== undefined ? inv.gainLoss : ((inv.units * inv.currentPrice) - (inv.units * inv.purchasePrice)),
              gainLossPercent: inv.gainLossPercent !== undefined ? inv.gainLossPercent : (inv.units * inv.purchasePrice > 0 ? (((inv.units * inv.currentPrice) - (inv.units * inv.purchasePrice)) / (inv.units * inv.purchasePrice)) * 100 : 0),
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
          const hasToken = useAuthStore.getState().isAuthenticated;
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
          const hasToken = useAuthStore.getState().isAuthenticated;
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
          const hasToken = useAuthStore.getState().isAuthenticated;
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
