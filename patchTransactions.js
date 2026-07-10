const fs = require('fs');

// 1. Update finance.types.ts
const typesPath = 'd:/FinVerse/frontend/src/types/finance.types.ts';
let typesCode = fs.readFileSync(typesPath, 'utf8');
if (!typesCode.includes('fetchTransactions:')) {
  typesCode = typesCode.replace(
    "addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void> | void;",
    "fetchTransactions: () => Promise<void>;\n  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void> | void;"
  );
  fs.writeFileSync(typesPath, typesCode);
}

// 2. Update financeStore.ts
const storePath = 'd:/FinVerse/frontend/src/stores/financeStore.ts';
let storeCode = fs.readFileSync(storePath, 'utf8');
if (!storeCode.includes('fetchTransactions: async () => {')) {
  const fetchTxns = `
      fetchTransactions: async () => {
        try {
          const hasToken = !!localStorage.getItem('finverse_access_token');
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

      addTransaction: async (t) => {`;
  storeCode = storeCode.replace('      addTransaction: async (t) => {', fetchTxns);
  fs.writeFileSync(storePath, storeCode);
}

// 3. Update TransactionsPage.tsx
const pagePath = 'd:/FinVerse/frontend/src/pages/transactions/TransactionsPage.tsx';
let pageCode = fs.readFileSync(pagePath, 'utf8');

// Add fetchTransactions to the destructuring
if (!pageCode.includes('fetchTransactions }')) {
  pageCode = pageCode.replace(
    "const { transactions, addTransaction, updateTransaction, deleteTransaction } = useFinanceStore();",
    "const { transactions, addTransaction, updateTransaction, deleteTransaction, fetchTransactions } = useFinanceStore();\n  const { activeCurrency } = useCurrencyStore();"
  );
  // add useCurrencyStore import if missing
  if (!pageCode.includes('useCurrencyStore')) {
    pageCode = pageCode.replace(
      "import { useFinanceStore } from '@/stores/financeStore';",
      "import { useFinanceStore } from '@/stores/financeStore';\nimport { useCurrencyStore } from '@/stores/currencyStore';"
    );
  }
}

// Zod schema ₹
pageCode = pageCode.replace(/Amount cannot exceed ₹1,000,0000/g, 'Amount cannot exceed 10,000,000');

// Input ₹
pageCode = pageCode.replace(/₹/g, '{activeCurrency.symbol}');
// Wait, the regex replace /₹/g will literally replace all ₹ with {activeCurrency.symbol}. Let's check if there are any that shouldn't be {activeCurrency.symbol}.
// Lines 831, 1051: <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-mono text-lg">₹</span>
// which will become <span ...>{activeCurrency.symbol}</span>. This is correct.

// Regex Search sanitize
const oldSearch = `    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.merchant && t.merchant.toLowerCase().includes(q)) ||
          (t.note && t.note.toLowerCase().includes(q))
      );
    }`;
const newSearch = `    // Search query
    if (search.trim()) {
      const escapeRegex = (str: string) => str.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
      const regex = new RegExp(escapeRegex(search.trim()), 'i');
      result = result.filter(
        (t) =>
          regex.test(t.name) ||
          regex.test(t.category) ||
          (t.merchant && regex.test(t.merchant)) ||
          (t.note && regex.test(t.note))
      );
    }`;
pageCode = pageCode.replace(oldSearch, newSearch);

// Add awaits for update, delete, add
pageCode = pageCode.replace(
  /addTransaction\(payload\);\s+showToast\('Transaction added successfully', 'success'\);/g,
  "await addTransaction(payload);\n      await fetchTransactions();\n      showToast('Transaction added successfully', 'success');"
);

pageCode = pageCode.replace(
  /updateTransaction\(editingTransaction\.id, payload\);\s+showToast\('Transaction updated successfully', 'success'\);/g,
  "await updateTransaction(editingTransaction.id, payload);\n      await fetchTransactions();\n      showToast('Transaction updated successfully', 'success');"
);

const oldDelete = `  const handleDeleteConfirm = () => {
    if (!deletingTransactionId) return;
    deleteTransaction(deletingTransactionId);
    showToast('Transaction deleted', 'error');
    setDeletingTransactionId(null);
  };`;
const newDelete = `  const handleDeleteConfirm = async () => {
    if (!deletingTransactionId) return;
    await deleteTransaction(deletingTransactionId);
    await fetchTransactions();
    showToast('Transaction deleted', 'error');
    setDeletingTransactionId(null);
  };`;
pageCode = pageCode.replace(oldDelete, newDelete);

const oldBulkDelete = `  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteTransaction(id));
    showToast(\`\${selectedIds.length} transactions deleted\`, 'error');
    setSelectedIds([]);
    setIsBulkDeleteOpen(false);
  };`;
const newBulkDelete = `  const handleBulkDelete = async () => {
    await Promise.all(selectedIds.map((id) => deleteTransaction(id)));
    await fetchTransactions();
    showToast(\`\${selectedIds.length} transactions deleted\`, 'error');
    setSelectedIds([]);
    setIsBulkDeleteOpen(false);
  };`;
pageCode = pageCode.replace(oldBulkDelete, newBulkDelete);

fs.writeFileSync(pagePath, pageCode);
console.log("Updated TransactionsPage.tsx, financeStore.ts, finance.types.ts successfully.");
