const fs = require('fs');
const path = 'd:/FinVerse/frontend/src/pages/analytics/AnalyticsPage.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Imports
if (!code.includes('useCurrencyStore')) {
  code = code.replace(
    "import { useFinanceStore } from '@/stores/financeStore';",
    "import { useFinanceStore } from '@/stores/financeStore';\nimport { useCurrencyStore } from '@/stores/currencyStore';\nimport analyticsService from '@/services/analyticsService';"
  );
}
if (!code.includes('useEffect')) {
  code = code.replace("useState, useMemo", "useState, useMemo, useEffect");
}

// 2. Component inside logic replacement
const startLogic = code.indexOf('  // Period Config Helper');
const endLogic = code.indexOf('  // Recharts styling constants');

if (startLogic !== -1 && endLogic !== -1) {
  const newLogic = `
  const { activeCurrency } = useCurrencyStore();
  const [metrics, setMetrics] = useState({ totalSpent: 0, avgDailySpend: 0, topCategory: 'None', savingsRate: 0 });
  const [spendingTrendData, setSpendingTrendData] = useState<any[]>([]);
  const [expenseBreakdownData, setExpenseBreakdownData] = useState({ data: [] as any[], total: 0 });
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [categoryComparisonData, setCategoryComparisonData] = useState<any[]>([]);
  const [monthlyTableData, setMonthlyTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const [dashRes, spendRes, trendRes, monthlyRes, cashRes] = await Promise.all([
          analyticsService.getDashboardMetrics(),
          analyticsService.getSpendingBreakdown(period === 'quarter' ? '3months' : period),
          analyticsService.getTrends(period === 'quarter' ? '3months' : period),
          analyticsService.getMonthlyComparison(),
          analyticsService.getCashFlow()
        ]);
        if (!isMounted) return;

        const totalSpent = dashRes?.monthlyExpenses || 0;
        const days = period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
        const avgDailySpend = totalSpent / days;
        const topCategory = spendRes?.length > 0 ? spendRes[0].category : 'None';
        const savingsRate = dashRes?.savingsRate || 0;
        setMetrics({ totalSpent, avgDailySpend, topCategory, savingsRate });

        const totalExp = spendRes?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0;
        const pieData = spendRes?.map((item: any) => ({
          name: item.category,
          value: item.amount,
          percentage: item.percentage,
          color: item.color
        })) || [];
        setExpenseBreakdownData({ data: pieData, total: totalExp });
        setCategoryComparisonData(pieData);

        setSpendingTrendData(trendRes?.map((item: any) => ({
          label: item.date,
          income: item.income,
          expense: item.expenses
        })) || []);

        setMonthlyTableData(monthlyRes?.map((item: any) => {
          const parts = item.month.split(' ');
          return {
            monthName: parts[0],
            monthIdx: new Date(\`\${item.month} 1\`).getMonth(),
            year: parseInt(parts[1], 10) || new Date().getFullYear(),
            income: item.income,
            expense: item.expenses,
            savings: item.savings,
            savingsRate: item.savingsRate
          };
        }) || []);

        setCashFlowData(cashRes?.map((item: any) => ({
          name: item.name || item.date,
          income: item.income,
          expenses: item.expenses
        })) || []);

      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchAnalytics();
    return () => { isMounted = false; };
  }, [period]);

`;
  code = code.substring(0, startLogic) + newLogic + code.substring(endLogic);
}

// 3. Fix Currencies and heights
code = code.replace(/Rupees \(₹\)/g, 'Currency ({activeCurrency.symbol})');

// 4. BarChart Responsive Container fix + Empty State
code = code.replace(
  /<div className="h-72 w-full">\s*<ResponsiveContainer width="100%" height="100%">/g,
  '<div className="h-72 w-full relative">\n            <ResponsiveContainer width="100%" height={288}>\n              {spendingTrendData.length === 0 ? (\n                <div className="flex items-center justify-center h-full w-full absolute inset-0 z-10">\n                  <p className="text-sm text-white/30">No data yet — add transactions to see your analytics</p>\n                </div>\n              ) : null}'
);

// 5. PieChart Responsive Container fix + Empty State
code = code.replace(
  /<div className="relative w-full h-\[220px\]">\s*<ResponsiveContainer width="100%" height="100%">/g,
  '<div className="relative w-full h-[220px]">\n                <ResponsiveContainer width="100%" height={220}>\n                  {expenseBreakdownData.data.length === 0 ? (\n                    <div className="flex items-center justify-center h-full w-full absolute inset-0 z-10">\n                      <p className="text-sm text-white/30">No data yet — add transactions to see your analytics</p>\n                    </div>\n                  ) : null}'
);

// 6. AreaChart Responsive Container fix + Empty State
code = code.replace(
  /<div className="flex-1 w-full mt-4 min-h-0">\s*<ResponsiveContainer width="100%" height="100%">/g,
  '<div className="flex-1 w-full mt-4 min-h-0 relative">\n              <ResponsiveContainer width="100%" height={300}>\n                {cashFlowData.length === 0 ? (\n                  <div className="flex items-center justify-center h-full w-full absolute inset-0 z-10">\n                    <p className="text-sm text-white/30">No data yet — add transactions to see your analytics</p>\n                  </div>\n                ) : null}'
);

fs.writeFileSync(path, code);
console.log("Updated AnalyticsPage.tsx successfully.");
