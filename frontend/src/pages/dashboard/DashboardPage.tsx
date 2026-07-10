import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ChevronRight,
  ShoppingBag,
  Bus,
  Coffee,
  Coins,
  UploadCloud,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

import { useFinanceStore } from '@/stores/financeStore';
import { useToast } from '@/hooks/useToast';
import { useCurrencyStore } from '@/stores/currencyStore';
import { formatINR, formatINRCompact, getCategoryColor, formatDate } from '@/lib/utils';

import KPICard from '@/components/dashboard/KPICard';
import KPICardSkeleton from '@/components/dashboard/KPICardSkeleton';
import QuickActions from '@/components/dashboard/QuickActions';
import FinanceGlobe from '@/components/three/FinanceGlobe';
import GlobeErrorBoundary from '@/components/three/GlobeErrorBoundary';
import PageTransition from '@/components/common/PageTransition';
import AnimatedNumber from '@/components/common/AnimatedNumber';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';    


// Add validation schema for Quick Action modal
const quickTxnSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z
    .number({ message: 'Amount is required' })
    .positive('Amount must be greater than 0')
    .max(10000000, 'Max ₹10,000,000'),
  category: z.string().min(1, 'Category is required'),
  merchant: z.string().min(2, 'Merchant must be at least 2 characters').max(50, 'Max 50 characters'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().max(200, 'Max 200 characters').optional(),
});

type QuickTxnValues = z.infer<typeof quickTxnSchema>;

const CATEGORY_OPTIONS = [
  { id: 'Housing', label: 'Housing', emoji: '🏠' },
  { id: 'Food', label: 'Food', emoji: '🍔' },
  { id: 'Transport', label: 'Transport', emoji: '🚗' },
  { id: 'Shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'Entertainment', label: 'Entertainment', emoji: '🎬' },
  { id: 'Groceries', label: 'Groceries', emoji: '🛒' },
  { id: 'Utilities', label: 'Utilities', emoji: '⚡' },
  { id: 'Healthcare', label: 'Healthcare', emoji: '🏥' },
  { id: 'Education', label: 'Education', emoji: '📚' },
  { id: 'Investment', label: 'Investment', emoji: '📈' },
  { id: 'Other', label: 'Other', emoji: '💰' },
];

const GlobeFallback = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="animate-spin-ring w-12 h-12 border-2 border-purple-primary border-t-transparent rounded-full" />
  </div>
);

export const DashboardPage: React.FC = () => {
  const { activeCurrency } = useCurrencyStore();
  const { transactions, addTransaction } = useFinanceStore();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState<string | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuickTxnValues>({
    resolver: zodResolver(quickTxnSchema),
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      amount: undefined,
      category: '',
      merchant: '',
      note: '',
    },
  });

  const formType = watch('type');
  const formCategory = watch('category');

  // Simulate skeleton load
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Compute stats dynamically, preserving checklist base values on load
  const stats = useMemo(() => {
    const balance = transactions.reduce((sum, t) => sum + t.amount, 0);

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const investment = transactions
      .filter((t) => t.category === 'Investment')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      totalBalance: balance,
      income,
      expenses: expense,
      savings: investment,
      netWorth: balance,
    };
  }, [transactions]);

  // Sort and fetch recent 5 transactions
  const recentTransactions = useMemo(() => {
    const sorted = [...transactions];
    sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted.slice(0, 5);
  }, [transactions]);

  // Dynamic date range for Net Worth footer
  const dateRange = useMemo(() => {
    if (transactions.length === 0) {
      return { start: 'Start', end: 'Today' };
    }
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    return {
      start: formatDate(sorted[0].date),
      end: formatDate(new Date().toISOString().split('T')[0]),
    };
  }, [transactions]);

  // Donut Breakdown: Top 5 Categories Spent
  const pieChartData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
      });

    const data = Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value,
        color: getCategoryColor(name),
      }))
      .sort((a, b) => b.value - a.value);

    return data.slice(0, 5);
  }, [transactions]);

  // Cash Flow last 7 days (income vs expense)
  const barChartData = useMemo(() => {
    const data = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = weekdays[d.getDay()];

      const dayTxns = transactions.filter((t) => t.date === key);
      const income = dayTxns.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTxns.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);

      data.push({
        name: label,
        income,
        expense,
      });
    }
    return data;
  }, [transactions]);

  const onQuickSubmit = async (values: QuickTxnValues) => {
    try {
      const finalAmount = values.type === 'income' ? values.amount : -values.amount;

      addTransaction({
        name: values.merchant,
        category: values.category,
        amount: finalAmount,
        date: values.date,
        type: values.type,
        merchant: values.merchant,
        note: values.note || '',
        receiptUrl: receiptFile || undefined,
      });

      showToast('Transaction added successfully', 'success');
      setIsAddModalOpen(false);
      reset();
      setReceiptFile(null);
    } catch (err) {
      showToast('Failed to add transaction', 'error');
    }
  };

  // Framer Motion staggered entrance animations
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const getTxnIcon = (category: string) => {
    switch (category) {
      case 'Shopping':
        return <ShoppingBag size={15} />;
      case 'Transport':
        return <Bus size={15} />;
      case 'Food':
        return <Coffee size={15} />;
      default:
        return <Coins size={15} />;
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6 md:gap-8">
        {/* Header greeting */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-white md:text-3xl">
              Financial Overview
            </h1>
            <p className="text-xs md:text-sm text-white/50">
              Real-time monitoring of your financial universe.
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-purple-light tracking-wider bg-purple-primary/10 px-3 py-1.5 rounded-full border border-purple-primary/20">
              Active currency: {activeCurrency.name}
            </span>
          </div>
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="Welcome to FinVerse"
            description="Welcome to FinVerse. Start by adding your first transaction."
            actionLabel="Add Transaction"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <>
            {/* Row 1: KPI Cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={loading ? 'hidden' : 'visible'}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {loading ? (
                <>
                  <KPICardSkeleton />
                  <KPICardSkeleton />
                  <KPICardSkeleton />
                  <KPICardSkeleton />
                </>
              ) : (
                <>
                  <motion.div variants={itemVariants}>
                    <KPICard
                      title="Total Balance"
                      value={stats.totalBalance}
                      icon={Wallet}
                      iconColor="purple-primary"
                      glowColor="purple"
                      prefix={activeCurrency.symbol}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <KPICard
                      title="Total Income"
                      value={stats.income}
                      icon={ArrowUpRight}
                      iconColor="green-positive"
                      glowColor="green"
                      prefix={activeCurrency.symbol}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <KPICard
                      title="Total Expenses"
                      value={stats.expenses}
                      icon={ArrowDownRight}
                      iconColor="red-negative"
                      glowColor="red"
                      prefix={activeCurrency.symbol}
                    />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <KPICard
                      title="Target Savings"
                      value={stats.savings}
                      icon={Target}
                      iconColor="gold-savings"
                      glowColor="gold"
                      prefix={activeCurrency.symbol}
                    />
                  </motion.div>
                </>
              )}
            </motion.div>

            {/* Row 2: Net Worth, 3D Globe, Quick Actions */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Net Worth (33%) */}
              <div className="glassmorphism rounded-2xl p-5 border border-white/8 flex flex-col justify-between lg:col-span-4 sm:h-auto lg:h-[380px] hover:shadow-glow-purple/2 transition-all duration-300">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 leading-none">
                    Equity Valuations
                  </span>
                  <h3 className="text-sm font-bold font-display text-white mt-0.5">Net Worth Projection</h3>
                </div>

                <div className="my-auto py-3">
                  <span className="text-[10px] text-white/35 font-bold uppercase tracking-wider">Estimated Valuation</span>
                  <div className="flex items-baseline mt-1 gap-1">
                    <span className="text-3xl font-display font-extrabold text-white tracking-tight">
                      <AnimatedNumber value={stats.netWorth} prefix={activeCurrency.symbol} decimals={0} />
                    </span>
                  </div>
                </div>

                {/* Dynamic Income vs Expenses Stats */}
                <div className="border border-white/5 bg-white/2 p-3 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="text-white/40 block text-[9px] uppercase font-bold">This Month Income</span>
                    <span className="text-green-positive font-mono font-semibold">{formatINR(stats.income)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white/40 block text-[9px] uppercase font-bold">This Month Expenses</span>
                    <span className="text-red-negative font-mono font-semibold">{formatINR(stats.expenses)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-white/40 font-medium">
                  <span>{dateRange.start}</span>
                  <span>{dateRange.end}</span>
                </div>
              </div>

              {/* 3D Finance Globe (33%) */}
              <div className="glassmorphism rounded-2xl p-5 border border-white/8 flex flex-col justify-between lg:col-span-4 sm:h-auto lg:h-[380px] hover:shadow-glow-purple/5 transition-all duration-300">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 leading-none">
                      Asset Coordinates
                    </span>
                    <h3 className="text-sm font-bold font-display text-white mt-0.5">3D Financial Globe</h3>
                  </div>
                  <span className="text-[10px] text-cyan-data font-semibold flex items-center gap-1 bg-cyan-data/10 border border-cyan-data/20 px-2 py-0.5 rounded-full">
                    Interactive
                  </span>
                </div>

                <div className="flex-1 min-h-0 relative h-[300px]">
                  <GlobeErrorBoundary>
                    <Suspense fallback={<GlobeFallback />}>
                      <FinanceGlobe />
                    </Suspense>
                  </GlobeErrorBoundary>
                </div>
              </div>

              {/* Quick Actions (33%) */}
              <QuickActions
                onAddTransaction={() => setIsAddModalOpen(true)}
                className="lg:col-span-4 sm:h-auto lg:h-[380px]"
              />
            </div>

            {/* Row 3: Recharts Charts & Recent Transactions */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Recharts Pie (33%) */}
              <div className="glassmorphism rounded-2xl p-5 border border-white/8 flex flex-col justify-between lg:col-span-4 sm:h-auto lg:h-[360px]">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                    Expense Breakdown
                  </span>
                  <h3 className="text-sm font-bold font-display text-white mt-0.5">Category Allocations</h3>
                </div>

                <div className="w-full h-[200px] relative flex items-center justify-center my-3">
                  {pieChartData.length === 0 ? (
                    <span className="text-xs text-white/30">No expenses recorded</span>
                  ) : (
                    <div className="w-full h-[200px] relative">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none leading-none">
                        <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Top 5</span>
                        <span className="text-sm font-bold text-white mt-1">Split</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 justify-center max-h-[60px] overflow-y-auto">
                  {pieChartData.map((p) => (
                    <div key={p.name} className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-[9px] text-white/70 font-semibold truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cash Flow Analysis (33%) */}
              <div className="glassmorphism rounded-2xl p-5 border border-white/8 flex flex-col justify-between lg:col-span-4 sm:h-auto lg:h-[360px]">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                    Rolling Cash Flow
                  </span>
                  <h3 className="text-sm font-bold font-display text-white mt-0.5">Last 7 Days</h3>
                </div>

                <div className="w-full h-[200px] mt-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 9 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={formatINRCompact} />
                      <Bar dataKey="income" fill="#10B981" radius={[2, 2, 0, 0]} opacity={0.7} />
                      <Bar dataKey="expense" fill="#F43F5E" radius={[2, 2, 0, 0]} opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="border-t border-white/5 pt-2.5 text-center">
                  <span className="text-[10px] text-white/35 font-medium uppercase tracking-wider">
                    Active live transactions chart
                  </span>
                </div>
              </div>

              {/* Recent Transactions List (33%) */}
              <div className="glassmorphism rounded-2xl p-5 border border-white/8 flex flex-col justify-between lg:col-span-4 sm:h-auto lg:h-[360px]">
                <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                      Transactions
                    </span>
                    <h3 className="text-sm font-bold font-display text-white mt-0.5">Recent Activity</h3>
                  </div>
                  <Link
                    to="/transactions"
                    className="text-xs font-semibold text-purple-light hover:text-purple-primary flex items-center transition-colors"
                  >
                    View All <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="flex-1 flex flex-col justify-center divide-y divide-white/5 max-h-[260px] overflow-y-auto pr-1">
                  {recentTransactions.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-white/30">
                      No activity found
                    </div>
                  ) : (
                    recentTransactions.map((txn) => {
                      const isExpense = txn.type === 'expense';
                      const isTransfer = txn.type === 'transfer';
                      const categoryColor = getCategoryColor(txn.category);

                      return (
                        <div
                          key={txn.id}
                          className="flex items-center justify-between py-2.5 hover:bg-white/2 px-2 rounded-xl transition-all duration-200 group"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="h-8.5 w-8.5 flex items-center justify-center rounded-xl text-white font-bold text-xs"
                              style={{
                                backgroundColor: `${categoryColor}15`,
                                color: categoryColor,
                                border: `1px solid ${categoryColor}30`,
                              }}
                            >
                              {getTxnIcon(txn.category)}
                            </div>

                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-semibold text-white/80 group-hover:translate-x-[2px] transition-transform duration-200 truncate max-w-[150px]">
                                {txn.merchant || txn.name}
                              </span>
                              <span className="text-[10px] text-white/40 font-medium truncate max-w-[150px]">
                                {txn.category} &bull; {formatDate(txn.date)}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-sm font-bold font-mono ${
                              isExpense ? 'text-red-negative' : isTransfer ? 'text-blue-primary' : 'text-green-positive'
                            }`}
                          >
                            {isExpense ? '-' : isTransfer ? '' : '+'}{formatINR(Math.abs(txn.amount))}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Add Transaction Quick Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            reset();
          }}
          title="Quick Transaction Add"
          size="lg"
        >
          <form onSubmit={handleSubmit(onQuickSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column */}
              <div className="space-y-6">
                <div className="flex bg-white/4 p-1 rounded-xl border border-white/5">
                  {(['income', 'expense', 'transfer'] as const).map((type) => {
                    const typeColor =
                      type === 'income'
                        ? 'bg-green-positive'
                        : type === 'expense'
                        ? 'bg-red-negative'
                        : 'bg-blue-600';

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setValue('type', type)}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                          formType === type ? `${typeColor} text-white` : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col items-center py-4 border-b border-white/10 focus-within:border-purple-primary transition-colors">
                  <div className="flex items-center justify-center w-full">
                    <span
                      className={`text-4xl font-display font-bold mr-2 ${
                        formType === 'income'
                          ? 'text-green-positive'
                          : formType === 'transfer'
                          ? 'text-blue-primary'
                          : 'text-red-negative'
                      }`}
                    >
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      autoFocus
                      {...register('amount', { valueAsNumber: true })}
                      className="bg-transparent text-center font-mono font-bold text-4xl text-white placeholder:text-white/15 focus:outline-hidden min-w-0 max-w-[200px]"
                    />
                  </div>
                  {errors.amount && (
                    <span className="text-[11px] text-red-negative mt-2 font-medium">
                      {errors.amount.message}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Select Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORY_OPTIONS.map((cat) => {
                      const isSelected = formCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setValue('category', cat.id)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] gap-0.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-purple-primary/10 border-purple-primary text-white shadow-glow-purple/5'
                              : 'bg-white/2 border-white/5 text-white/60 hover:border-white/15 hover:text-white'
                          }`}
                        >
                          <span className="text-base">{cat.emoji}</span>
                          <span className="font-semibold truncate max-w-full">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.category && (
                    <span className="text-[11px] text-red-negative font-medium block">
                      {errors.category.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Merchant / Description <span className="text-red-negative">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Swiggy, Zomato"
                    {...register('merchant')}
                    className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2 text-sm text-white focus:outline-hidden transition-all placeholder:text-white/20"
                  />
                  {errors.merchant && (
                    <span className="text-[11px] text-red-negative font-medium">
                      {errors.merchant.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Date <span className="text-red-negative">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2 text-sm text-white focus:outline-hidden transition-all"
                  />
                  {errors.date && (
                    <span className="text-[11px] text-red-negative font-medium">
                      {errors.date.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    maxLength={200}
                    placeholder="Optional details (max 200 chars)..."
                    {...register('note')}
                    className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2 text-sm text-white focus:outline-hidden transition-all resize-none placeholder:text-white/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Receipt Upload
                  </label>
                  <label className="border border-dashed border-white/10 bg-white/2 hover:border-purple-primary/45 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative group">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setReceiptFile(e.target.files[0].name);
                        }
                      }}
                      className="hidden"
                    />
                    {receiptFile ? (
                      <span className="text-xs text-purple-light font-semibold max-w-[180px] truncate">{receiptFile}</span>
                    ) : (
                      <>
                        <UploadCloud size={18} className="text-white/30 mb-1" />
                        <span className="text-[10px] text-white/50 font-bold">Choose receipt</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAddModalOpen(false);
                  reset();
                  setReceiptFile(null);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Save Transaction
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default DashboardPage;
