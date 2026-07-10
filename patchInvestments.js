const fs = require('fs');
const storePath = 'd:/FinVerse/frontend/src/stores/financeStore.ts';
let storeCode = fs.readFileSync(storePath, 'utf8');

const oldFetchMap = `              totalInvested: inv.totalInvested,
              currentValue: inv.currentValue,
              gainLoss: inv.gainLoss,
              gainLossPercent: inv.gainLossPercent,`;

const newFetchMap = `              totalInvested: inv.totalInvested !== undefined ? inv.totalInvested : (inv.units * inv.purchasePrice),
              currentValue: inv.currentValue !== undefined ? inv.currentValue : (inv.units * inv.currentPrice),
              gainLoss: inv.gainLoss !== undefined ? inv.gainLoss : ((inv.units * inv.currentPrice) - (inv.units * inv.purchasePrice)),
              gainLossPercent: inv.gainLossPercent !== undefined ? inv.gainLossPercent : (inv.units * inv.purchasePrice > 0 ? (((inv.units * inv.currentPrice) - (inv.units * inv.purchasePrice)) / (inv.units * inv.purchasePrice)) * 100 : 0),`;

if (storeCode.includes(oldFetchMap)) {
  storeCode = storeCode.replace(oldFetchMap, newFetchMap);
  fs.writeFileSync(storePath, storeCode);
  console.log("Updated financeStore.ts");
}

const pagePath = 'd:/FinVerse/frontend/src/pages/investments/InvestmentsPage.tsx';
let pageCode = fs.readFileSync(pagePath, 'utf8');

// Add import
if (!pageCode.includes('useCurrencyStore')) {
  pageCode = pageCode.replace(
    'import { useFinanceStore } from "@/stores/financeStore";',
    'import { useFinanceStore } from "@/stores/financeStore";\nimport { useCurrencyStore } from "@/stores/currencyStore";'
  );
}

// Add hook
if (!pageCode.includes('const { activeCurrency } = useCurrencyStore();')) {
  pageCode = pageCode.replace(
    '  const {\n    investments,\n    portfolioSummary,\n    addInvestment,\n    updateInvestment,\n    deleteInvestment,\n    fetchInvestments,\n  } = useFinanceStore();',
    '  const {\n    investments,\n    portfolioSummary,\n    addInvestment,\n    updateInvestment,\n    deleteInvestment,\n    fetchInvestments,\n  } = useFinanceStore();\n  const { activeCurrency } = useCurrencyStore();'
  );
}

// Fix ₹ in JSX
pageCode = pageCode.replace(/Purchase Price \(₹\)/g, 'Purchase Price ({activeCurrency.symbol})');
pageCode = pageCode.replace(/Current Price \(₹\)/g, 'Current Price ({activeCurrency.symbol})');

fs.writeFileSync(pagePath, pageCode);
console.log("Updated InvestmentsPage.tsx successfully.");
