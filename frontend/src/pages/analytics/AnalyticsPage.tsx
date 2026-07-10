import React, { useState,  useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingDown,
  Percent,
  Wallet,
  Activity,
} from 'lucide-react';
import { useCurrencyStore } from '@/stores/currencyStore';
import analyticsService from '@/services/analyticsService';
import { formatINR, formatINRCompact } from '@/lib/utils';
import PageTransition from '@/components/common/PageTransition';

// Period Type
type PeriodType = 'month' | 'quarter' | 'year';

export const AnalyticsPage: React.FC = () => {
  // const { transactions } = useFinanceStore();
  const [period, setPeriod] = useState<PeriodType>('month');
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null);


  const { activeCurrency } = useCurrencyStore();
  const [metrics, setMetrics] = useState({ totalSpent: 0, avgDailySpend: 0, topCategory: 'None', savingsRate: 0 });
  const [spendingTrendData, setSpendingTrendData] = useState<any[]>([]);
  const [expenseBreakdownData, setExpenseBreakdownData] = useState({ data: [] as any[], total: 0 });
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [categoryComparisonData, setCategoryComparisonData] = useState<any[]>([]);
  const [monthlyTableData, setMonthlyTableData] = useState<any[]>([]);
  const [, setIsLoading] = useState(true); // @ts-ignore

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
            monthIdx: new Date(`${item.month} 1`).getMonth(),
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

  // Recharts styling constants
  const chartStyles = {
    cartesianGrid: { strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.06)' },
    xAxis: { tick: { fill: '#6B7280', fontSize: 10 }, axisLine: { stroke: 'rgba(255,255,255,0.1)' }, tickLine: false },
    yAxis: { tick: { fill: '#6B7280', fontSize: 10 }, axisLine: false, tickLine: false, tickFormatter: formatINRCompact },
  };

  // Custom Chart Tooltips
  const CustomSpendingTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const expense = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
      const net = income - expense;

      return (
        <div className="glassmorphism bg-bg-surface/90 border border-white/10 p-3 rounded-xl shadow-xl space-y-1">
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{label}</p>
          <div className="flex items-center gap-2 text-xs font-semibold text-green-positive">
            <span className="w-1.5 h-1.5 rounded-full bg-green-positive" />
            <span>Income: {formatINR(income)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-negative">
            <span className="w-1.5 h-1.5 rounded-full bg-red-negative" />
            <span>Expense: {formatINR(expense)}</span>
          </div>
          <div className={`text-xs font-bold pt-1 border-t border-white/5 ${net >= 0 ? 'text-green-positive' : 'text-red-negative'}`}>
            Net: {net >= 0 ? '+' : ''}{formatINR(net)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Analytics</h1>
            <p className="text-xs text-white/50 font-medium">Deep insights into your finances</p>
          </div>

          <div className="flex bg-white/4 p-1 rounded-xl border border-white/5 relative self-start">
            {([
              { id: 'month', label: 'This Month' },
              { id: 'quarter', label: '3 Months' },
              { id: 'year', label: 'This Year' },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPeriod(opt.id)}
                className={`relative px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                  period === opt.id ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {period === opt.id && (
                  <motion.div
                    layoutId="activePeriodTab"
                    transition={{ type: 'spring', damping: 22, stiffness: 220 }}
                    className="absolute inset-0 bg-purple-primary rounded-lg shadow-glow-purple/30 z-0"
                  />
                )}
                <span className="relative z-10">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Summary KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="glassmorphism bg-bg-surface/40 p-4 rounded-2xl border border-white/8 shadow-glow-red/2">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Total Spent</span>
            <div className="flex items-center gap-2 mt-2">
              <TrendingDown size={14} className="text-red-negative" />
              <span className="text-xl font-bold font-mono text-white">{formatINR(metrics.totalSpent)}</span>
            </div>
          </div>

          <div className="glassmorphism bg-bg-surface/40 p-4 rounded-2xl border border-white/8 shadow-glow-purple/2">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Avg Daily Spend</span>
            <div className="flex items-center gap-2 mt-2">
              <Activity size={14} className="text-purple-light" />
              <span className="text-xl font-bold font-mono text-white">{formatINR(metrics.avgDailySpend)}</span>
            </div>
          </div>

          <div className="glassmorphism bg-bg-surface/40 p-4 rounded-2xl border border-white/8 shadow-glow-blue/2">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Top Category</span>
            <div className="flex items-center gap-2 mt-2">
              <Wallet size={14} className="text-blue-primary" />
              <span className="text-sm font-bold text-white truncate">{metrics.topCategory}</span>
            </div>
          </div>

          <div className="glassmorphism bg-bg-surface/40 p-4 rounded-2xl border border-white/8 shadow-glow-green/2">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Savings Rate</span>
            <div className="flex items-center gap-2 mt-2">
              <Percent size={14} className="text-green-positive" />
              <span className="text-xl font-bold font-mono text-white">{metrics.savingsRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Row 1: Spending Trend Bar Chart (Full Width) */}
        <div className="glassmorphism bg-bg-surface/30 p-5 border border-white/8 rounded-2xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <h3 className="text-sm font-bold text-white">Spending & Income Trend</h3>
            <span className="text-[10px] text-white/35 font-semibold">Currency ({activeCurrency.symbol})</span>
          </div>
          <div className="h-72 w-full relative">
            <ResponsiveContainer width="100%" height={288}>
              {spendingTrendData.length === 0 ? (
                <div className="flex items-center justify-center h-full w-full absolute inset-0 z-10">
                  <p className="text-sm text-white/30">No data yet — add transactions to see your analytics</p>
                </div>
              ) : null}
              <BarChart data={spendingTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...chartStyles.cartesianGrid} vertical={false} />
                <XAxis dataKey="label" {...chartStyles.xAxis} />
                <YAxis {...chartStyles.yAxis} />
                <Tooltip content={<CustomSpendingTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} opacity={0.65} />
                <Bar dataKey="expense" fill="#F43F5E" radius={[4, 4, 0, 0]} opacity={0.65} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Expense Breakdown Pie + Cash Flow Area */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Pie Chart */}
          <div className="glassmorphism bg-bg-surface/30 p-5 border border-white/8 rounded-2xl flex flex-col justify-between h-[400px]">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white">Expense Distribution</h3>
              <span className="text-[10px] text-white/35 font-semibold">By Category</span>
            </div>
            
            <div className="flex-1 relative flex items-center justify-center min-h-0">
              <div className="relative w-full h-[220px]">
                <ResponsiveContainer width="100%" height={220}>
                  {expenseBreakdownData.data.length === 0 ? (
                    <div className="flex items-center justify-center h-full w-full absolute inset-0 z-10">
                      <p className="text-sm text-white/30">No data yet — add transactions to see your analytics</p>
                    </div>
                  ) : null}
                  <PieChart>
                    <Pie
                      data={expenseBreakdownData.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      onMouseEnter={(_, index) => setHoveredPieIndex(index)}
                      onMouseLeave={() => setHoveredPieIndex(null)}
                    >
                      {expenseBreakdownData.data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="rgba(0,0,0,0.3)"
                          strokeWidth={hoveredPieIndex === index ? 3 : 1}
                          style={{
                            outline: 'none',
                            filter: hoveredPieIndex === index ? `drop-shadow(0 0 8px ${entry.color}50)` : 'none',
                            transform: hoveredPieIndex === index ? 'scale(1.05)' : 'scale(1)',
                            transformOrigin: 'center',
                            transition: 'all 0.2s ease-out',
                          }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Inner center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider leading-none">Total Expense</span>
                  <span className="text-base font-bold font-mono text-white mt-1.5">{formatINR(expenseBreakdownData.total)}</span>
                </div>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 max-h-[100px] overflow-y-auto">
              {expenseBreakdownData.data.map((item, index) => (
                <div
                  key={item.name}
                  onMouseEnter={() => setHoveredPieIndex(index)}
                  onMouseLeave={() => setHoveredPieIndex(null)}
                  className={`flex flex-col p-1.5 rounded-lg border transition-all select-none ${
                    hoveredPieIndex === index ? 'bg-white/5 border-white/10' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] text-white/70 font-semibold truncate">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-white/40 font-mono mt-1">
                    {item.percentage.toFixed(0)}% ({formatINRCompact(item.value)})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cash Flow Area Chart */}
          <div className="glassmorphism bg-bg-surface/30 p-5 border border-white/8 rounded-2xl flex flex-col justify-between h-[400px]">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white">Cash Flow Dynamics</h3>
              <span className="text-[10px] text-white/35 font-semibold">Last 6 Months</span>
            </div>

            <div className="flex-1 w-full mt-4 min-h-0 relative">
              <ResponsiveContainer width="100%" height={300}>
                {cashFlowData.length === 0 ? (
                  <div className="flex items-center justify-center h-full w-full absolute inset-0 z-10">
                    <p className="text-sm text-white/30">No data yet — add transactions to see your analytics</p>
                  </div>
                ) : null}
                <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="area-income" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="area-expense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...chartStyles.cartesianGrid} />
                  <XAxis dataKey="name" {...chartStyles.xAxis} />
                  <YAxis {...chartStyles.yAxis} />
                  <Tooltip content={<CustomSpendingTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#area-income)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#F43F5E"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#area-expense)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 3: Horizontal Comparison bars */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="glassmorphism bg-bg-surface/30 p-5 border border-white/8 rounded-2xl lg:col-span-1 flex flex-col justify-between min-h-[300px]">
            <div className="border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white">Spent Comparison</h3>
              <p className="text-[10px] text-white/40 mt-0.5">By category ranking</p>
            </div>
            
            <div className="flex-1 py-4 space-y-3.5 overflow-y-auto max-h-[220px] pr-1">
              {categoryComparisonData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-white/30">No expenses recorded</div>
              ) : (
                categoryComparisonData.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-white/70">
                      <span>{item.name}</span>
                      <span className="font-mono">{formatINR(item.value)} ({item.percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 w-full bg-white/4 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Monthly Historical Comparison Table */}
          <div className="glassmorphism bg-bg-surface/30 p-5 border border-white/8 rounded-2xl lg:col-span-2 flex flex-col justify-between min-h-[300px]">
            <div className="border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white">Monthly Comparison</h3>
              <p className="text-[10px] text-white/40 mt-0.5">Summary of last 6 months</p>
            </div>

            <div className="flex-1 mt-4 overflow-x-auto min-h-0">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] uppercase font-bold text-white/40 tracking-wider">
                    <th className="py-2.5 px-3">Month</th>
                    <th className="py-2.5 px-3">Income</th>
                    <th className="py-2.5 px-3">Expenses</th>
                    <th className="py-2.5 px-3">Savings</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyTableData.map((row) => {
                    const isCurrent = new Date().getMonth() === row.monthIdx;
                    
                    const rateColor =
                      row.savingsRate >= 20
                        ? 'text-green-positive'
                        : row.savingsRate >= 10
                        ? 'text-gold-savings'
                        : 'text-red-negative';

                    return (
                      <tr
                        key={row.monthName}
                        className={`border-b border-white/3 font-medium ${
                          isCurrent ? 'bg-purple-primary/10 text-white border-b-purple-primary/20' : 'text-white/70'
                        }`}
                      >
                        <td className="py-3 px-3 font-semibold text-white">
                          {row.monthName} {row.year} {isCurrent && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-primary text-white font-bold ml-1.5 uppercase">Current</span>}
                        </td>
                        <td className="py-3 px-3 text-green-positive font-mono">
                          {formatINR(row.income)}
                        </td>
                        <td className="py-3 px-3 text-red-negative font-mono">
                          {formatINR(row.expense)}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {row.savings >= 0 ? '+' : ''}{formatINR(row.savings)}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-bold ${rateColor}`}>
                          {row.savingsRate.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AnalyticsPage;
