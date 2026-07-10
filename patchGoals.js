const fs = require('fs');
const path = 'd:/FinVerse/frontend/src/pages/goals/GoalsPage.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add import
if (!code.includes('useCurrencyStore')) {
  code = code.replace(
    'import { useFinanceStore } from "@/stores/financeStore";',
    'import { useFinanceStore } from "@/stores/financeStore";\nimport { useCurrencyStore } from "@/stores/currencyStore";'
  );
}

// Add hook
if (!code.includes('const { activeCurrency } = useCurrencyStore();')) {
  code = code.replace(
    '  const { goals, addGoal, updateGoal, deleteGoal, addToGoal } =\n    useFinanceStore();\n  const { showToast } = useToast();',
    '  const { goals, addGoal, updateGoal, deleteGoal, addToGoal } =\n    useFinanceStore();\n  const { showToast } = useToast();\n  const { activeCurrency } = useCurrencyStore();'
  );
}

// Replace percentage calculation
const oldPercentage = `const percentage =
                  g.targetAmount > 0
                    ? (g.currentAmount / g.targetAmount) * 100
                    : 0;`;
const newPercentage = `const percentage = Math.min(100,
                  g.targetAmount > 0
                    ? (g.currentAmount / g.targetAmount) * 100
                    : 0);`;
code = code.replace(oldPercentage, newPercentage);

// Fix ₹ in zod schema
code = code.replace(/Target cannot exceed ₹100,000,000/g, 'Target cannot exceed 100,000,000');

// Fix ₹ in template literals
code = code.replace(/`Amount cannot exceed the remaining needed \(₹\$\{remaining\}\)`/g, '`Amount cannot exceed the remaining needed (${activeCurrency.symbol}${remaining})`');
code = code.replace(/`₹\$\{values\.amount\} added to \$\{addingMoneyGoal\.name\}!`/g, '`${activeCurrency.symbol}${values.amount} added to ${addingMoneyGoal.name}!`');

// Fix ₹ in JSX text
// <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-mono text-lg">
//                     ₹
//                   </span>
code = code.replace(
  /<span className="absolute left-4 top-1\/2 -translate-y-1\/2 text-white\/40 font-mono text-lg">\s*₹\s*<\/span>/g,
  '<span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-mono text-lg">{activeCurrency.symbol}</span>'
);

fs.writeFileSync(path, code);
console.log("Updated GoalsPage.tsx successfully.");
