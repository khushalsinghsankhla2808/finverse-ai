export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  ANALYTICS: '/analytics',
  BUDGETS: '/budgets',
  GOALS: '/goals',
  INVESTMENTS: '/investments',
  AI_ASSISTANT: '/ai-assistant',
  REPORTS: '/reports',
  SETTINGS: '/settings',
};

export const MOCK_DASHBOARD_DATA = {
  totalBalance: 2045250.00,
  income: 125000.00,
  expenses: 48750.00,
  savings: 76250.00,
  netWorth: 5842000.00,
  budgetProgress: 68,
  budgetLimit: 80000,
  recentTransactions: [
    { id: 1, name: "Salary", category: "Income", amount: 125000.00, date: "Jul 22", type: "income" as const },
    { id: 2, name: "Amazon India", category: "Shopping", amount: -3499.00, date: "Jul 21", type: "expense" as const },
    { id: 3, name: "Ola", category: "Transport", amount: -350.00, date: "Jul 21", type: "expense" as const },
    { id: 4, name: "Zomato", category: "Food", amount: -680.00, date: "Jul 20", type: "expense" as const },
    { id: 5, name: "Netflix", category: "Entertainment", amount: -649.00, date: "Jul 19", type: "expense" as const },
  ],
  expenseBreakdown: [
    { category: "Housing", percentage: 30, color: "#7C3AED" },
    { category: "Food", percentage: 22, color: "#06B6D4" },
    { category: "Transport", percentage: 12, color: "#10B981" },
    { category: "Shopping", percentage: 15, color: "#F59E0B" },
    { category: "Entertainment", percentage: 8, color: "#F43F5E" },
    { category: "Other", percentage: 13, color: "#6B7280" },
  ]
};
