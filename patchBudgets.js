const fs = require('fs');
const path = 'd:/FinVerse/frontend/src/pages/budgets/BudgetsPage.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add import
if (!code.includes('useCurrencyStore')) {
  code = code.replace(
    "import { useFinanceStore } from '@/stores/financeStore';",
    "import { useFinanceStore } from '@/stores/financeStore';\nimport { useCurrencyStore } from '@/stores/currencyStore';"
  );
}

// Add hook
if (!code.includes('const { activeCurrency } = useCurrencyStore();')) {
  code = code.replace(
    "  const { budgets, addBudget, updateBudget, deleteBudget } = useFinanceStore();\n  const { showToast } = useToast();",
    "  const { budgets, addBudget, updateBudget, deleteBudget } = useFinanceStore();\n  const { showToast } = useToast();\n  const { activeCurrency } = useCurrencyStore();"
  );
}

// Zod schema replace
code = code.replace(/Limit cannot exceed ₹1,000,0000/g, 'Limit cannot exceed 10,000,000');

// Replace remaining ₹
code = code.replace(/₹/g, '{activeCurrency.symbol}');

fs.writeFileSync(path, code);
console.log("Updated BudgetsPage.tsx successfully.");
