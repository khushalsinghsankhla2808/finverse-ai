import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingDown,
  Wallet,
  Sliders,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useFinanceStore } from '@/stores/financeStore';
import { useToast } from '@/hooks/useToast';
import type { Budget } from '@/types/finance.types';
import { formatINR } from '@/lib/utils';
import PageTransition from '@/components/common/PageTransition';
import Modal from '@/components/common/Modal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Button from '@/components/common/Button';

// Zod validation schemas
const budgetCreateSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  limit: z
    .number({ message: 'Limit is required' })
    .positive('Limit must be greater than 0')
    .max(10000000, 'Limit cannot exceed ₹1,000,0000'),
  period: z.enum(['monthly', 'weekly']),
  alertThreshold: z.number().min(0).max(100),
});

type BudgetFormValues = z.infer<typeof budgetCreateSchema>;

const CATEGORIES_MAPPINGS = [
  { category: 'Housing', emoji: '🏠', color: '#7C3AED' },
  { category: 'Food', emoji: '🍔', color: '#06B6D4' },
  { category: 'Transport', emoji: '🚗', color: '#10B981' },
  { category: 'Shopping', emoji: '🛍️', color: '#F59E0B' },
  { category: 'Entertainment', emoji: '🎬', color: '#F43F5E' },
  { category: 'Groceries', emoji: '🛒', color: '#8B5CF6' },
  { category: 'Utilities', emoji: '⚡', color: '#EC4899' },
  { category: 'Healthcare', emoji: '🏥', color: '#14B8A6' },
  { category: 'Education', emoji: '📚', color: '#8B5CF6' },
  { category: 'Investment', emoji: '📈', color: '#F59E0B' },
  { category: 'Other', emoji: '💰', color: '#6B7280' },
];

export const BudgetsPage: React.FC = () => {
  const { budgets, addBudget, updateBudget, deleteBudget } = useFinanceStore();
  const { showToast } = useToast();

  // Dialog and edit state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);

  // Multi-step form setup for Create Budget
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetCreateSchema),
    defaultValues: {
      category: '',
      limit: undefined,
      period: 'monthly',
      alertThreshold: 80,
    },
  });

  const formCategory = watch('category');
  const formLimit = watch('limit') || 0;
  const formPeriod = watch('period');
  const formAlertThreshold = watch('alertThreshold');

  // Summary Metrics calculations
  const summary = useMemo(() => {
    const limit = budgets.reduce((sum, b) => sum + b.limit, 0);
    const spent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const remaining = limit - spent;
    return { limit, spent, remaining };
  }, [budgets]);

  // Already budgeted categories to prevent duplicate limits
  const activeBudgetedCategories = useMemo(() => {
    return budgets.map((b) => b.category);
  }, [budgets]);

  // Submit create budget
  const onCreateSubmit = async (values: BudgetFormValues) => {
    const matchingIcon = CATEGORIES_MAPPINGS.find((c) => c.category === values.category)?.emoji || '💰';
    const matchingColor = CATEGORIES_MAPPINGS.find((c) => c.category === values.category)?.color || '#6B7280';

    try {
      addBudget({
        category: values.category,
        limit: values.limit,
        spent: 0,
        period: values.period,
        color: matchingColor,
        icon: matchingIcon,
        alertThreshold: values.alertThreshold,
      });

      showToast('Budget created successfully', 'success');
      setIsCreateOpen(false);
      setCurrentStep(1);
      reset();
    } catch (err) {
      showToast('Failed to create budget', 'error');
    }
  };

  // Submit edit budget
  const onEditSubmit = async (values: BudgetFormValues) => {
    if (!editingBudget) return;

    try {
      updateBudget(editingBudget.id, {
        limit: values.limit,
        period: values.period,
        alertThreshold: values.alertThreshold,
      });

      showToast('Budget updated successfully', 'success');
      setEditingBudget(null);
    } catch (err) {
      showToast('Failed to update budget', 'error');
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingBudgetId) return;
    deleteBudget(deletingBudgetId);
    showToast('Budget deleted successfully', 'error');
    setDeletingBudgetId(null);
  };

  const triggerEdit = (budget: Budget) => {
    setEditingBudget(budget);
    reset({
      category: budget.category,
      limit: budget.limit,
      period: budget.period,
      alertThreshold: budget.alertThreshold,
    });
  };

  // Progress Bar color logic selector
  const getProgressColor = (percentage: number) => {
    if (percentage < 60) return '#10B981'; // Green
    if (percentage < 80) return '#F59E0B'; // Amber
    if (percentage < 100) return '#F97316'; // Orange
    return '#F43F5E'; // Red
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Budgets</h1>
            <p className="text-xs text-white/50 font-medium">Keep track of your category allocations</p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => {
              setCurrentStep(1);
              setIsCreateOpen(true);
            }}
          >
            Create Budget
          </Button>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="glassmorphism bg-bg-surface/40 p-5 rounded-2xl border border-white/8 shadow-glow-purple/2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Total Budgeted</span>
              <div className="w-8 h-8 rounded-lg bg-purple-primary/10 border border-purple-primary/20 flex items-center justify-center text-purple-light">
                <Sliders size={16} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white font-mono mt-3">{formatINR(summary.limit)}</h2>
          </div>

          <div className="glassmorphism bg-bg-surface/40 p-5 rounded-2xl border border-white/8 shadow-glow-red/2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Total Spent</span>
              <div className="w-8 h-8 rounded-lg bg-red-negative/10 border border-red-negative/20 flex items-center justify-center text-red-negative">
                <TrendingDown size={16} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white font-mono mt-3">{formatINR(summary.spent)}</h2>
          </div>

          <div className="glassmorphism bg-bg-surface/40 p-5 rounded-2xl border border-white/8 shadow-glow-green/2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Remaining Budget</span>
              <div className="w-8 h-8 rounded-lg bg-green-positive/10 border border-green-positive/20 flex items-center justify-center text-green-positive">
                <Wallet size={16} />
              </div>
            </div>
            <h2 className={`text-2xl font-bold font-mono mt-3 ${summary.remaining >= 0 ? 'text-green-positive' : 'text-red-negative'}`}>
              {formatINR(summary.remaining)}
            </h2>
          </div>
        </div>

        {/* Budgets Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((b) => {
            const percentage = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
            const isApproaching = percentage >= b.alertThreshold && percentage < 100;
            const isOverBudget = percentage >= 100;
            const remaining = b.limit - b.spent;

            // Border style maps based on alert threshold state
            const cardGlow = isOverBudget
              ? 'border-red-negative shadow-glow-red/5'
              : isApproaching
              ? 'border-gold-savings/35 border-l-gold-savings border-l-[3px]'
              : 'border-white/8 hover:shadow-glow-purple/2';

            return (
              <motion.div
                key={b.id}
                layout
                // Shakes card on mount if over budget
                animate={isOverBudget ? { x: [0, -6, 6, -6, 6, -3, 3, 0] } : {}}
                transition={{ duration: 0.5 }}
                className={`glassmorphism bg-bg-surface/40 rounded-2xl p-5 border flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 relative ${cardGlow}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl leading-none bg-white/5 w-8 h-8 rounded-lg flex items-center justify-center select-none">
                      {b.icon}
                    </span>
                    <div>
                      <h3 className="font-display font-bold text-sm text-white">{b.category}</h3>
                      <span className="text-[10px] text-white/35 font-bold uppercase tracking-wider">
                        {b.period}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOverBudget && (
                      <div className="w-5 h-5 rounded-full bg-red-negative/10 flex items-center justify-center text-red-negative" title="Over budget!">
                        <AlertTriangle size={12} />
                      </div>
                    )}
                    {isApproaching && (
                      <div className="w-5 h-5 rounded-full bg-gold-savings/10 flex items-center justify-center text-gold-savings" title="Approaching budget limit!">
                        <AlertTriangle size={12} />
                      </div>
                    )}
                    
                    <button
                      onClick={() => triggerEdit(b)}
                      className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setDeletingBudgetId(b.id)}
                      className="p-1 rounded-lg text-white/30 hover:text-red-negative hover:bg-red-negative/5 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Amount section */}
                <div className="my-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold font-mono text-white leading-none">
                      {formatINR(b.spent)}
                    </span>
                    <span className="text-xs text-white/40 font-medium">spent of {formatINR(b.limit)}</span>
                  </div>

                  {/* Remaining / Over Indicator */}
                  <div className="text-[11px] font-bold mt-2">
                    {isOverBudget ? (
                      <span className="text-red-negative font-display">
                        🔴 Over budget by {formatINR(Math.abs(remaining))}
                      </span>
                    ) : (
                      <span className="text-green-positive font-display">
                        {formatINR(remaining)} remaining
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-white/40 font-bold font-mono">
                    <span>Progress</span>
                    <span>{percentage.toFixed(0)}%</span>
                  </div>
                  
                  <div className="w-full h-2 bg-white/4 rounded-full overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, percentage)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: getProgressColor(percentage),
                        boxShadow: isOverBudget ? '0 0 10px rgba(244,63,94,0.6)' : 'none',
                      }}
                    />
                  </div>

                  {isApproaching && (
                    <span className="text-[10px] text-gold-savings font-semibold block pt-1 animate-pulse">
                      ⚠️ Approaching Limit ({b.alertThreshold}%)
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deletingBudgetId}
          onClose={() => setDeletingBudgetId(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Budget"
          message="Are you sure you want to delete this budget limit? This action cannot be undone."
        />

        {/* Create Budget Modal (Multi-Step Form) */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => {
            setIsCreateOpen(false);
            setCurrentStep(1);
            reset();
          }}
          title="Create Budget Limit"
          size="md"
        >
          <div className="space-y-6">
            {/* Step 1: Category Emoji Grid */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Step 1 of 3: Choose Category
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES_MAPPINGS.map((cat) => {
                    const isBudgeted = activeBudgetedCategories.includes(cat.category);
                    const isSelected = formCategory === cat.category;

                    return (
                      <button
                        key={cat.category}
                        type="button"
                        disabled={isBudgeted}
                        onClick={() => setValue('category', cat.category)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs gap-1 transition-all relative ${
                          isSelected
                            ? 'bg-purple-primary/10 border-purple-primary text-white shadow-glow-purple/5'
                            : 'bg-white/2 border-white/5 text-white/60 hover:border-white/15 hover:text-white disabled:opacity-30 disabled:pointer-events-none'
                        }`}
                      >
                        <span className="text-xl leading-none">{cat.emoji}</span>
                        <span className="font-semibold text-[10px] truncate max-w-full">
                          {cat.category}
                        </span>
                        {isBudgeted && (
                          <span className="absolute top-1 right-1 text-[8px] bg-purple-primary/10 border border-purple-primary/20 text-purple-light px-1 rounded-sm uppercase tracking-wider font-bold">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {errors.category && (
                  <span className="text-[11px] text-red-negative font-medium block">
                    {errors.category.message}
                  </span>
                )}
                
                <div className="flex justify-end pt-4 border-t border-white/5">
                  <Button
                    variant="primary"
                    disabled={!formCategory}
                    rightIcon={<ChevronRight size={14} />}
                    onClick={() => setCurrentStep(2)}
                  >
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Limit amount and period selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Step 2 of 3: Limit Details
                  </span>
                </div>

                {/* Giant Amount Input */}
                <div className="flex flex-col items-center py-4 border-b border-white/10 focus-within:border-purple-primary transition-colors">
                  <span className="text-xs text-white/40 uppercase font-bold tracking-wider mb-2">Limit Amount</span>
                  <div className="flex items-center justify-center w-full">
                    <span className="text-4xl font-display font-bold mr-2 text-purple-light">₹</span>
                    <input
                      type="number"
                      placeholder="0"
                      autoFocus
                      {...register('limit', { valueAsNumber: true })}
                      className="bg-transparent text-center font-mono font-bold text-4xl text-white placeholder:text-white/15 focus:outline-hidden min-w-0 max-w-[200px]"
                    />
                  </div>
                  {errors.limit && (
                    <span className="text-[11px] text-red-negative mt-2 font-medium">
                      {errors.limit.message}
                    </span>
                  )}
                </div>

                {/* Period toggle selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Frequency
                  </label>
                  <div className="flex bg-white/4 p-1 rounded-xl border border-white/5">
                    {['monthly', 'weekly'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setValue('period', p as any)}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                          formPeriod === p ? 'bg-purple-primary text-white shadow-glow-purple/10' : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-white/5">
                  <Button
                    variant="ghost"
                    leftIcon={<ChevronLeft size={14} />}
                    onClick={() => setCurrentStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    disabled={formLimit <= 0}
                    rightIcon={<ChevronRight size={14} />}
                    onClick={() => setCurrentStep(3)}
                  >
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Alert sliders */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Step 3 of 3: Threshold Alert
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>Alert me when spent reaches:</span>
                    <span className="font-mono text-purple-light">{formAlertThreshold}%</span>
                  </div>

                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    {...register('alertThreshold', { valueAsNumber: true })}
                    className="w-full accent-purple-primary h-1.5 bg-white/10 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Progress bar preview */}
                <div className="bg-white/3 border border-white/5 rounded-xl p-4 space-y-2">
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">
                    Alert Bar Preview
                  </span>
                  
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${formAlertThreshold}%`,
                        backgroundColor: getProgressColor(formAlertThreshold),
                      }}
                    />
                  </div>
                  
                  <p className="text-[10px] text-white/50 leading-relaxed pt-1">
                    At {formAlertThreshold}%, the card will display an alert border, and an approaching warnings header.
                  </p>
                </div>

                <div className="flex justify-between pt-4 border-t border-white/5">
                  <Button
                    variant="ghost"
                    leftIcon={<ChevronLeft size={14} />}
                    onClick={() => setCurrentStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    loading={isSubmitting}
                    onClick={handleSubmit(onCreateSubmit)}
                  >
                    Create Budget
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>

        {/* Edit Budget Modal (Single Step) */}
        <Modal
          isOpen={!!editingBudget}
          onClose={() => setEditingBudget(null)}
          title={`Edit ${editingBudget?.category} Budget`}
          size="md"
        >
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-6">
            {/* Giant Amount Input */}
            <div className="flex flex-col items-center py-4 border-b border-white/10 focus-within:border-purple-primary transition-colors">
              <span className="text-xs text-white/40 uppercase font-bold tracking-wider mb-2">Limit Amount</span>
              <div className="flex items-center justify-center w-full">
                <span className="text-4xl font-display font-bold mr-2 text-purple-light">₹</span>
                <input
                  type="number"
                  placeholder="0"
                  {...register('limit', { valueAsNumber: true })}
                  className="bg-transparent text-center font-mono font-bold text-4xl text-white placeholder:text-white/15 focus:outline-hidden min-w-0 max-w-[200px]"
                />
              </div>
              {errors.limit && (
                <span className="text-[11px] text-red-negative mt-2 font-medium">
                  {errors.limit.message}
                </span>
              )}
            </div>

            {/* Period selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                Frequency
              </label>
              <div className="flex bg-white/4 p-1 rounded-xl border border-white/5">
                {['monthly', 'weekly'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setValue('period', p as any)}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      formPeriod === p ? 'bg-purple-primary text-white shadow-glow-purple/10' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Alert slider */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Alert me when spent reaches:</span>
                <span className="font-mono text-purple-light">{formAlertThreshold}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                {...register('alertThreshold', { valueAsNumber: true })}
                className="w-full accent-purple-primary h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <Button variant="ghost" onClick={() => setEditingBudget(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default BudgetsPage;
