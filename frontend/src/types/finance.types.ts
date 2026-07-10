export interface Transaction {
  id: string;
  name: string;
  category: string;
  amount: number; // positive = income, negative = expense
  date: string; // ISO date string (YYYY-MM-DD)
  type: 'income' | 'expense' | 'transfer';
  note?: string;
  receiptUrl?: string;
  merchant?: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'monthly' | 'weekly';
  color: string;
  icon: string;
  alertThreshold: number; // percentage (0-100)
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO date string (YYYY-MM-DD)
  category: string;
  color: string;
  icon: string;
  illustration?: string;
}

export interface Investment {
  id: string;
  name: string;
  assetType: 'stocks' | 'mutual_funds' | 'gold' | 'crypto' | 'fixed_deposit' | 'other';
  symbol?: string;
  units: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  platform?: string;
  notes?: string;
  totalInvested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  assetAllocation: Record<string, { value: number; percentage: number }>;
}

export interface FinanceState {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  investments: Investment[];
  portfolioSummary: PortfolioSummary | null;

  // Transaction actions
  fetchTransactions: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void> | void;
  updateTransaction: (id: string, t: Partial<Transaction>) => Promise<void> | void;
  deleteTransaction: (id: string) => Promise<void> | void;

  // Budget actions
  addBudget: (b: Omit<Budget, 'id'>) => Promise<void> | void;
  updateBudget: (id: string, b: Partial<Budget>) => Promise<void> | void;
  deleteBudget: (id: string) => Promise<void> | void;

  // Goal actions
  addGoal: (g: Omit<Goal, 'id'>) => Promise<void> | void;
  updateGoal: (id: string, g: Partial<Goal>) => Promise<void> | void;
  deleteGoal: (id: string) => Promise<void> | void;
  addToGoal: (id: string, amount: number) => Promise<void> | void;

  // Investment actions
  fetchInvestments: () => Promise<void>;
  addInvestment: (inv: Omit<Investment, 'id' | 'totalInvested' | 'currentValue' | 'gainLoss' | 'gainLossPercent'>) => Promise<void>;
  updateInvestment: (id: string, inv: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
}

