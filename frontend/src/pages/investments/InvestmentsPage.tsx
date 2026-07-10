import React, { useState, useMemo, useEffect } from 'react';
import { motion as motionBase } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

import { useFinanceStore } from '@/stores/financeStore';
import { useToast } from '@/hooks/useToast';
import { formatINR, formatDate } from '@/lib/utils';
import PageTransition from '@/components/common/PageTransition';
import Modal from '@/components/common/Modal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Button from '@/components/common/Button';

// Asset colors
const ASSET_COLORS: Record<string, string> = {
  stocks: '#7C3AED',         // Purple
  mutual_funds: '#06B6D4',   // Cyan
  gold: '#F59E0B',           // Gold
  crypto: '#F43F5E',         // Red
  fixed_deposit: '#10B981',  // Green
  other: '#6B7280',          // Muted
};

const ASSET_LABELS: Record<string, string> = {
  stocks: 'Stocks',
  mutual_funds: 'Mutual Funds',
  gold: 'Gold',
  crypto: 'Crypto',
  fixed_deposit: 'Fixed Deposit',
  other: 'Other Assets',
};

const ASSET_EMOJIS: Record<string, string> = {
  stocks: '📈',
  mutual_funds: '🏦',
  gold: '🥇',
  crypto: '₿',
  fixed_deposit: '🏛️',
  other: '💼',
};

// Validation Schema
const investmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Max 50 characters'),
  assetType: z.enum(['stocks', 'mutual_funds', 'gold', 'crypto', 'fixed_deposit', 'other']),
  symbol: z.string().default(''),
  units: z
    .number({ message: 'Quantity is required' })
    .positive('Quantity must be greater than 0'),
  purchasePrice: z
    .number({ message: 'Purchase price is required' })
    .positive('Price must be greater than 0'),
  currentPrice: z
    .number({ message: 'Current price is required' })
    .positive('Price must be greater than 0'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  platform: z.string().default(''),
  notes: z.string().max(200, 'Notes cannot exceed 200 characters').default(''),
});

interface InvestmentFormValues {
  name: string;
  assetType: 'stocks' | 'mutual_funds' | 'gold' | 'crypto' | 'fixed_deposit' | 'other';
  symbol: string;
  units: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  platform: string;
  notes: string;
}

export const InvestmentsPage: React.FC = () => {
  const { investments, portfolioSummary, addInvestment, updateInvestment, deleteInvestment, fetchInvestments } = useFinanceStore();
  const { showToast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvestmentFormValues>({
    resolver: zodResolver(investmentSchema) as any,
    defaultValues: {
      name: '',
      assetType: 'stocks',
      symbol: '',
      units: undefined,
      purchasePrice: undefined,
      currentPrice: undefined,
      purchaseDate: new Date().toISOString().split('T')[0],
      platform: '',
      notes: '',
    },
  });

  const formAssetType = watch('assetType');
  const formUnits = watch('units') || 0;
  const formPurchasePrice = watch('purchasePrice') || 0;
  const formCurrentPrice = watch('currentPrice') || 0;

  // Live calculations for preview
  const liveInvested = formUnits * formPurchasePrice;
  const liveValue = formUnits * formCurrentPrice;
  const liveGain = liveValue - liveInvested;
  const liveGainPercent = liveInvested > 0 ? (liveGain / liveInvested) * 100 : 0;

  // Pre-fill form when editing
  useEffect(() => {
    if (editingInvestment) {
      reset({
        name: editingInvestment.name,
        assetType: editingInvestment.assetType,
        symbol: editingInvestment.symbol || '',
        units: editingInvestment.units,
        purchasePrice: editingInvestment.purchasePrice,
        currentPrice: editingInvestment.currentPrice,
        purchaseDate: new Date(editingInvestment.purchaseDate).toISOString().split('T')[0],
        platform: editingInvestment.platform || '',
        notes: editingInvestment.notes || '',
      });
    } else {
      reset({
        name: '',
        assetType: 'stocks',
        symbol: '',
        units: undefined,
        purchasePrice: undefined,
        currentPrice: undefined,
        purchaseDate: new Date().toISOString().split('T')[0],
        platform: '',
        notes: '',
      });
    }
  }, [editingInvestment, reset]);

  // Fetch investments on mount
  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  // Generate pie chart data
  const pieData = useMemo(() => {
    if (!portfolioSummary?.assetAllocation) return [];
    return Object.entries(portfolioSummary.assetAllocation).map(([type, item]: [string, any]) => ({
      name: ASSET_LABELS[type] || type,
      value: item.value,
      percentage: item.percentage,
      color: ASSET_COLORS[type] || '#6B7280',
    })).filter(item => item.value > 0);
  }, [portfolioSummary]);

  // CRUD operations
  const onAddSubmit = async (values: InvestmentFormValues) => {
    try {
      await addInvestment(values);
      showToast('Asset added to portfolio successfully', 'success');
      setIsAddOpen(false);
      reset();
    } catch (err) {
      showToast('Failed to add investment asset', 'error');
    }
  };

  const onEditSubmit = async (values: InvestmentFormValues) => {
    if (!editingInvestment) return;
    try {
      await updateInvestment(editingInvestment.id, values);
      showToast('Investment asset details updated', 'success');
      setEditingInvestment(null);
      reset();
    } catch (err) {
      showToast('Failed to update investment details', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await deleteInvestment(deletingId);
      showToast('Asset deleted from portfolio', 'error');
      setDeletingId(null);
    } catch (err) {
      showToast('Failed to delete investment', 'error');
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Investments</h1>
            <p className="text-xs text-white/50 font-medium">Monitor your asset valuations and returns</p>
          </div>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setIsAddOpen(true)}>
            Add Investment
          </Button>
        </div>

        {/* Portfolio Summary Widgets */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Invested */}
          <div className="glassmorphism bg-bg-surface/40 p-5 rounded-2xl border border-white/8 shadow-glow-purple/2">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Total Invested</span>
            <h2 className="text-2xl font-bold text-white font-mono mt-2">
              {formatINR(portfolioSummary?.totalInvested || 0)}
            </h2>
          </div>

          {/* Current Value */}
          <div className="glassmorphism bg-bg-surface/40 p-5 rounded-2xl border border-white/8 shadow-glow-blue/2">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Current Value</span>
            <h2 className="text-2xl font-bold text-white font-mono mt-2">
              {formatINR(portfolioSummary?.currentValue || 0)}
            </h2>
          </div>

          {/* Gain/Loss */}
          <div className={`glassmorphism bg-bg-surface/40 p-5 rounded-2xl border border-white/8 ${
            (portfolioSummary?.totalGainLoss || 0) >= 0 ? 'shadow-glow-green/2 border-green-positive/20' : 'shadow-glow-red/2 border-red-negative/20'
          }`}>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Total Gain / Loss</span>
            <h2 className={`text-2xl font-bold font-mono mt-2 ${
              (portfolioSummary?.totalGainLoss || 0) >= 0 ? 'text-green-positive' : 'text-red-negative'
            }`}>
              {(portfolioSummary?.totalGainLoss || 0) >= 0 ? '+' : ''}
              {formatINR(portfolioSummary?.totalGainLoss || 0)}
            </h2>
          </div>

          {/* Returns Rate */}
          <div className={`glassmorphism bg-bg-surface/40 p-5 rounded-2xl border border-white/8 ${
            (portfolioSummary?.totalGainLossPercent || 0) >= 0 ? 'shadow-glow-green/2 border-green-positive/20' : 'shadow-glow-red/2 border-red-negative/20'
          }`}>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Returns %</span>
            <div className="flex items-center gap-1.5 mt-2">
              {(portfolioSummary?.totalGainLossPercent || 0) >= 0 ? (
                <TrendingUp className="text-green-positive" size={20} />
              ) : (
                <TrendingDown className="text-red-negative" size={20} />
              )}
              <h2 className={`text-2xl font-bold font-mono ${
                (portfolioSummary?.totalGainLossPercent || 0) >= 0 ? 'text-green-positive' : 'text-red-negative'
              }`}>
                {(portfolioSummary?.totalGainLossPercent || 0).toFixed(2)}%
              </h2>
            </div>
          </div>
        </div>

        {/* Charts & Table Segment */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Allocation Donut */}
          <div className="glassmorphism bg-bg-surface/30 p-5 border border-white/8 rounded-2xl lg:col-span-4 h-[340px] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Portfolio Split</span>
              <h3 className="text-sm font-bold text-white mt-0.5">Asset Allocation</h3>
            </div>

            <div className="flex-1 relative flex items-center justify-center min-h-0 my-3">
              {pieData.length === 0 ? (
                <span className="text-xs text-white/30">No investments added</span>
              ) : (
                <div className="w-full h-[180px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none leading-none">
                    <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">Asset</span>
                    <span className="text-sm font-bold text-white mt-1">Split</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 justify-center max-h-[60px] overflow-y-auto">
              {pieData.map((p) => (
                <div key={p.name} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-[9px] text-white/70 font-semibold truncate">{p.name} ({p.percentage.toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Table */}
          <div className="glassmorphism bg-bg-surface/30 p-5 border border-white/8 rounded-2xl lg:col-span-6 h-[340px] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Performance</span>
              <h3 className="text-sm font-bold text-white mt-0.5">Asset Performance Ranking</h3>
            </div>

            <div className="flex-1 mt-4 overflow-y-auto pr-1 text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] uppercase font-bold text-white/40 tracking-wider">
                    <th className="py-2.5 px-3">Asset Type</th>
                    <th className="py-2.5 px-3 text-right">Invested</th>
                    <th className="py-2.5 px-3 text-right">Current</th>
                    <th className="py-2.5 px-3 text-right">Gain/Loss</th>
                    <th className="py-2.5 px-3 text-right">Return %</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(portfolioSummary?.assetAllocation || {}).map(([type, item]: [string, any]) => {
                    const gain = item.value - (investments.filter(i=>i.assetType===type).reduce((s,i)=>s+i.totalInvested, 0));
                    const invested = investments.filter(i=>i.assetType===type).reduce((s,i)=>s+i.totalInvested, 0);
                    const gainPercent = invested > 0 ? (gain / invested) * 100 : 0;

                    return (
                      <tr key={type} className="border-b border-white/3 font-medium text-white/80">
                        <td className="py-3 px-3 flex items-center gap-2">
                          <span>{ASSET_EMOJIS[type]}</span>
                          <span className="font-semibold text-white">{ASSET_LABELS[type]}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono">{formatINR(invested)}</td>
                        <td className="py-3 px-3 text-right font-mono">{formatINR(item.value)}</td>
                        <td className={`py-3 px-3 text-right font-mono font-bold ${gain >= 0 ? 'text-green-positive' : 'text-red-negative'}`}>
                          {gain >= 0 ? '+' : ''}{formatINR(gain)}
                        </td>
                        <td className={`py-3 px-3 text-right font-mono font-bold ${gainPercent >= 0 ? 'text-green-positive' : 'text-red-negative'}`}>
                          {gainPercent.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Investment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {investments.map((inv) => {
            const initialInvested = inv.units * inv.purchasePrice;
            const currentTotalValue = inv.units * inv.currentPrice;
            const gain = currentTotalValue - initialInvested;
            const gainPercent = initialInvested > 0 ? (gain / initialInvested) * 100 : 0;


            return (
              <motionBase.div
                key={inv.id}
                layout
                className={`glassmorphism bg-bg-surface/40 rounded-2xl p-5 border border-white/8 flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 relative`}
              >
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl leading-none w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center select-none">
                      {ASSET_EMOJIS[inv.assetType]}
                    </span>
                    <div className="min-w-0 flex flex-col">
                      <h3 className="font-display font-bold text-sm text-white truncate max-w-[120px]">{inv.name}</h3>
                      <span className="text-[10px] text-white/40 font-mono truncate">{inv.symbol || ASSET_LABELS[inv.assetType]}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {inv.platform && (
                      <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-white/5 border border-white/10 text-white/60">
                        {inv.platform}
                      </span>
                    )}
                    <button
                      onClick={() => setEditingInvestment(inv)}
                      className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => setDeletingId(inv.id)}
                      className="p-1 rounded-lg text-white/30 hover:text-red-negative hover:bg-red-negative/5 transition-all cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Performance details */}
                <div className="my-5 grid grid-cols-2 gap-4 border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider leading-none">Invested</span>
                    <span className="text-sm font-bold font-mono text-white block mt-1">{formatINR(initialInvested)}</span>
                    <span className="text-[10px] text-white/30 font-medium block mt-0.5">{inv.units} units @ {formatINR(inv.purchasePrice)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider leading-none">Current Value</span>
                    <span className="text-sm font-bold font-mono text-white block mt-1">{formatINR(currentTotalValue)}</span>
                    <span className="text-[10px] text-white/30 font-medium block mt-0.5">Price: {formatINR(inv.currentPrice)}</span>
                  </div>
                </div>

                {/* Returns summary footer */}
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Total Returns</span>
                    <span className={`text-sm font-bold font-mono mt-0.5 ${gain >= 0 ? 'text-green-positive' : 'text-red-negative'}`}>
                      {gain >= 0 ? '+' : ''}{formatINR(gain)} ({gainPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <span className="text-[9px] text-white/30 font-medium block">
                    {formatDate(inv.purchaseDate)}
                  </span>
                </div>
              </motionBase.div>
            );
          })}
        </div>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deletingId}
          onClose={() => setDeletingId(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Asset"
          message="Are you sure you want to remove this asset from your portfolio? This cannot be undone."
        />

        {/* Add / Edit Investment Modal */}
        <Modal
          isOpen={isAddOpen || !!editingInvestment}
          onClose={() => {
            setIsAddOpen(false);
            setEditingInvestment(null);
            reset();
          }}
          title={editingInvestment ? 'Edit Investment Asset' : 'Add Investment Asset'}
          size="lg"
        >
          <form onSubmit={handleSubmit(editingInvestment ? onEditSubmit : onAddSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Asset Type Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider block">Asset Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(ASSET_LABELS).map(([type, label]) => {
                      const isSelected = formAssetType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setValue('assetType', type as any)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] gap-0.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-purple-primary/10 border-purple-primary text-white shadow-glow-purple/5'
                              : 'bg-white/2 border-white/5 text-white/60 hover:border-white/15'
                          }`}
                        >
                          <span className="text-lg">{ASSET_EMOJIS[type]}</span>
                          <span className="font-semibold truncate max-w-full">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Asset Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Reliance Industries, HDFC Nifty Index"
                    {...register('name')}
                    className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2 text-sm text-white focus:outline-hidden transition-all placeholder:text-white/20"
                  />
                  {errors.name && <span className="text-[11px] text-red-negative font-medium">{errors.name.message}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Ticker / Symbol (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. RELIANCE, INFYNSE"
                    {...register('symbol')}
                    className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2 text-sm text-white focus:outline-hidden transition-all placeholder:text-white/20"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Platform / broker</label>
                  <input
                    type="text"
                    placeholder="e.g. Zerodha, Groww, SBI"
                    {...register('platform')}
                    className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2 text-sm text-white focus:outline-hidden transition-all placeholder:text-white/20"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Units / Qty</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      {...register('units', { valueAsNumber: true })}
                      className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2 text-sm text-white focus:outline-hidden transition-all placeholder:text-white/20 font-mono"
                    />
                    {errors.units && <span className="text-[11px] text-red-negative font-medium">{errors.units.message}</span>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Purchase Date</label>
                    <input
                      type="date"
                      {...register('purchaseDate')}
                      className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2 text-sm text-white focus:outline-hidden transition-all"
                    />
                    {errors.purchaseDate && <span className="text-[11px] text-red-negative font-medium">{errors.purchaseDate.message}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Purchase Price (₹)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      {...register('purchasePrice', { valueAsNumber: true })}
                      className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2 text-sm text-white focus:outline-hidden transition-all placeholder:text-white/20 font-mono"
                    />
                    {errors.purchasePrice && <span className="text-[11px] text-red-negative font-medium">{errors.purchasePrice.message}</span>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Current Price (₹)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      {...register('currentPrice', { valueAsNumber: true })}
                      className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2 text-sm text-white focus:outline-hidden transition-all placeholder:text-white/20 font-mono"
                    />
                    {errors.currentPrice && <span className="text-[11px] text-red-negative font-medium">{errors.currentPrice.message}</span>}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Notes (optional)..."
                    {...register('notes')}
                    className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2 text-sm text-white focus:outline-hidden transition-all resize-none placeholder:text-white/20"
                  />
                </div>

                {/* Live Preview Block */}
                <div className="bg-white/3 border border-white/5 rounded-xl p-4 space-y-1.5 text-xs">
                  <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider block">Live Calculation Preview</span>
                  <div className="flex justify-between items-center text-white/60">
                    <span>Total Invested:</span>
                    <span className="font-mono text-white font-semibold">{formatINR(liveInvested)}</span>
                  </div>
                  <div className="flex justify-between items-center text-white/60">
                    <span>Current Value:</span>
                    <span className="font-mono text-white font-semibold">{formatINR(liveValue)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-white/5">
                    <span className="font-bold">Gain / Loss:</span>
                    <span className={`font-mono font-bold ${liveGain >= 0 ? 'text-green-positive' : 'text-red-negative'}`}>
                      {liveGain >= 0 ? '+' : ''}{formatINR(liveGain)} ({liveGainPercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingInvestment(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Save Asset
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default InvestmentsPage;
