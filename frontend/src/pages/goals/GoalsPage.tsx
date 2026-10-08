import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  TrendingUp,
  Target,
  Trophy,
} from "lucide-react";
import { useFinanceStore } from "@/stores/financeStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import { useToast } from "@/hooks/useToast";
import type { Goal } from "@/types/finance.types";
import { formatINR, formatDate } from "@/lib/utils";
import { renderCategoryIcon } from "@/lib/categoryIcons";
import PageTransition from "@/components/common/PageTransition";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";

const goalCreateSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Max 50 characters"),
  category: z.string().min(1, "Category is required"),
  targetAmount: z
    .number({ message: "Target amount is required" })
    .positive("Target must be greater than 0")
    .max(100000000, "Target cannot exceed 100,000,000"),
  currentAmount: z
    .number({ message: "Saved amount is required" })
    .min(0, "Saved amount cannot be negative"),
  deadline: z.string().min(1, "Deadline date is required"),
  color: z.string().min(1, "Color is required"),
  icon: z.string().min(1, "Icon tag is required"),
});

const addMoneySchema = z.object({
  amount: z
    .number({ message: "Amount is required" })
    .positive("Amount must be greater than 0"),
});

type GoalFormValues = z.infer<typeof goalCreateSchema>;

const PRESET_COLORS = [
  "#0466c8",
  "#0353a4",
  "#023e7d",
  "#002855",
  "#33415c",
  "#5c677d",
];

const PRESET_TAGS = [
  "SAFE",
  "TRVL",
  "TECH",
  "AUTO",
  "HOME",
  "EDUC",
  "EVNT",
  "SAVE",
  "EMRG",
  "GIFT",
  "INVST",
  "OTHR",
];

const CATEGORY_OPTIONS = [
  "Safety",
  "Travel",
  "Tech",
  "Vehicle",
  "Home",
  "Education",
  "Other",
];

const GoalConfetti: React.FC = () => {
  const confettiParticles = useMemo(() => {
    const colors = [
      "var(--smart-blue)",
      "var(--sapphire)",
      "var(--regal-navy)",
      "var(--twilight-indigo)",
      "var(--blue-slate)",
    ];
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2,
      size: `${Math.random() * 6 + 4}px`,
      duration: Math.random() * 2.5 + 1.5,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {confettiParticles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -10, opacity: 1, rotate: 0 }}
          animate={{ y: 320, opacity: 0, rotate: 360 }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute rounded-full"
          style={{
            left: p.left,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  );
};

export const GoalsPage: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, addToGoal } =
    useFinanceStore();
  const { showToast } = useToast();
  const { activeCurrency } = useCurrencyStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [addingMoneyGoal, setAddingMoneyGoal] = useState<Goal | null>(null);

  const {
    register: registerGoal,
    handleSubmit: handleGoalSubmit,
    setValue: setGoalValue,
    watch: watchGoal,
    reset: resetGoal,
    formState: { errors: goalErrors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalCreateSchema),
    defaultValues: {
      name: "",
      category: "Safety",
      targetAmount: undefined,
      currentAmount: 0,
      deadline: "",
      color: PRESET_COLORS[0],
      icon: PRESET_TAGS[0],
    },
  });

  const formColor = watchGoal("color");
  const formIcon = watchGoal("icon");

  const {
    register: registerMoney,
    handleSubmit: handleMoneySubmit,
    reset: resetMoney,
    formState: { errors: moneyErrors, isSubmitting: isMoneySubmitting },
  } = useForm<{ amount: number }>({
    resolver: zodResolver(addMoneySchema),
  });

  const summary = useMemo(() => {
    const active = goals.length;
    const target = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const saved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    return { active, target, saved };
  }, [goals]);

  const getDaysRemaining = (deadlineStr: string) => {
    const diffTime = new Date(deadlineStr).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysBadge = (days: number) => {
    if (days < 0)
      return {
        text: "Overdue",
        style: "bg-red-500/10 border-red-500/20 amount-loss",
      };
    if (days < 30)
      return {
        text: `${days} days left`,
        style: "bg-red-500/10 border-red-500/20 amount-loss",
      };
    if (days <= 90)
      return {
        text: `${days} days left`,
        style: "bg-amber-500/10 border-amber-500/20 text-warning",
      };
    return {
      text: `${days} days left`,
      style: "bg-emerald-500/10 border-emerald-500/20 amount-gain",
    };
  };

  const onCreateSubmit = async (values: GoalFormValues) => {
    try {
      addGoal({
        name: values.name,
        category: values.category,
        targetAmount: values.targetAmount,
        currentAmount: values.currentAmount,
        deadline: values.deadline,
        color: values.color,
        icon: values.icon,
      });

      showToast("Saving goal created successfully", "success");
      setIsCreateOpen(false);
      resetGoal();
    } catch (err) {
      showToast("Failed to create goal", "error");
    }
  };

  const onEditSubmit = async (values: GoalFormValues) => {
    if (!editingGoal) return;

    try {
      updateGoal(editingGoal.id, {
        name: values.name,
        category: values.category,
        targetAmount: values.targetAmount,
        currentAmount: values.currentAmount,
        deadline: values.deadline,
        color: values.color,
        icon: values.icon,
      });

      showToast("Goal updated successfully", "success");
      setEditingGoal(null);
    } catch (err) {
      showToast("Failed to update goal", "error");
    }
  };

  const onAddMoneySubmit = async (values: { amount: number }) => {
    if (!addingMoneyGoal) return;

    const remaining =
      addingMoneyGoal.targetAmount - addingMoneyGoal.currentAmount;
    if (values.amount > remaining) {
      showToast(
        `Amount cannot exceed the remaining needed (${activeCurrency.symbol}${remaining})`,
        "warning",
      );
      return;
    }

    try {
      addToGoal(addingMoneyGoal.id, values.amount);
      showToast(
        `${activeCurrency.symbol}${values.amount} added to ${addingMoneyGoal.name}!`,
        "success",
      );
      setAddingMoneyGoal(null);
      resetMoney();
    } catch (err) {
      showToast("Failed to save money to goal", "error");
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingGoalId) return;
    deleteGoal(deletingGoalId);
    showToast("Goal deleted successfully", "error");
    setDeletingGoalId(null);
  };

  const triggerEdit = (goal: Goal) => {
    setEditingGoal(goal);
    resetGoal({
      name: goal.name,
      category: goal.category,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline,
      color: goal.color,
      icon: goal.icon,
    });
  };

  return (
    <PageTransition>
      <div className="space-y-6 text-ink">
        {/* Header Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-sans font-bold tracking-tight">
              Savings Goals
            </h1>
            <p className="text-xs text-ink-muted font-medium">
              Set, target, and monitor wealth objectives
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsCreateOpen(true)}
          >
            Create Goal
          </Button>
        </div>

        {goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="No goals yet. Set a financial goal to start saving."
            actionLabel="Create Goal"
            onAction={() => setIsCreateOpen(true)}
          />
        ) : (
          <>
            {/* Summary Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-subtle uppercase tracking-wider">
                    Active Goals
                  </span>
                  <div className="w-8 h-8 rounded-[var(--radius-control)] bg-surface-sunken border border-line flex items-center justify-center text-primary">
                    <Target size={16} />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-ink font-mono mt-3">
                  {summary.active}
                </h2>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-subtle uppercase tracking-wider">
                    Total Saved
                  </span>
                  <div className="w-8 h-8 rounded-[var(--radius-control)] bg-surface-sunken border border-line flex items-center justify-center text-primary">
                    <TrendingUp size={16} />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-ink font-mono mt-3">
                  {summary.saved}
                </h2>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-subtle uppercase tracking-wider">
                    Total Target
                  </span>
                  <div className="w-8 h-8 rounded-[var(--radius-control)] bg-surface-sunken border border-line flex items-center justify-center amount-gain">
                    <Trophy size={16} />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-ink font-mono mt-3">
                  {summary.target}
                </h2>
              </div>
            </div>

            {/* Goals cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map((g) => {
                const percentage = Math.min(
                  100,
                  g.targetAmount > 0
                    ? (g.currentAmount / g.targetAmount) * 100
                    : 0
                );
                const isCompleted = percentage >= 100;
                const remaining = g.targetAmount - g.currentAmount;

                const daysLeft = getDaysRemaining(g.deadline);
                const daysBadge = getDaysBadge(daysLeft);

                const radius = 45;
                const circumference = 2 * Math.PI * radius;
                const strokeOffset =
                  circumference * (1 - Math.min(100, percentage) / 100);

                return (
                  <motion.div
                    key={g.id}
                    layout
                    className="card flex flex-col justify-between relative"
                  >
                    {isCompleted && <GoalConfetti />}

                    {/* Top Section */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-[var(--radius-control)] bg-surface-sunken border border-line flex items-center justify-center text-primary">
                          {renderCategoryIcon(g.category)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-sans font-bold text-sm text-ink truncate">
                            {g.name}
                          </h3>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-ink-subtle">
                            {g.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 z-20">
                        <button
                          onClick={() => triggerEdit(g)}
                          className="p-1 rounded-[var(--radius-control)] text-ink-subtle hover:text-ink hover:bg-surface-sunken transition-all cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingGoalId(g.id)}
                          className="p-1 rounded-[var(--radius-control)] text-ink-subtle hover:text-loss hover:bg-red-500/10 transition-all cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Ring & Data content */}
                    <div className="flex items-center justify-between gap-6 my-6">
                      <div className="space-y-3 min-w-0">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-ink-subtle uppercase font-bold tracking-wider leading-none">
                            Saved amount
                          </span>
                          <span className="text-xl font-bold font-mono mt-1.5 leading-none text-primary">
                            {formatINR(g.currentAmount)}
                          </span>
                          <span className="text-xs text-ink-subtle mt-1 leading-none">
                            of {formatINR(g.targetAmount)}
                          </span>
                        </div>

                        <p className="text-xs text-ink-muted">
                          {isCompleted ? (
                            <span className="amount-gain font-bold">
                              Goal Achieved!
                            </span>
                          ) : (
                            <span>{formatINR(remaining)} to go</span>
                          )}
                        </p>
                      </div>

                      {/* SVG progress ring */}
                      <div className="relative shrink-0 flex items-center justify-center w-24 h-24 select-none">
                        <svg
                          viewBox="0 0 100 100"
                          className="w-full h-full -rotate-90"
                        >
                          <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            className="stroke-line"
                            strokeWidth="7"
                            fill="transparent"
                          />
                          <motion.circle
                            cx="50"
                            cy="50"
                            r={radius}
                            stroke="var(--primary)"
                            strokeWidth="7"
                            fill="transparent"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: strokeOffset }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                          <span className="text-base font-bold font-mono text-ink">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom stats row */}
                    <div className="border-t border-line pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-ink-subtle text-xs">
                          <Calendar size={13} className="shrink-0" />
                          <span>Target: {formatDate(g.deadline)}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-[var(--radius-control)] border ${daysBadge.style}`}
                        >
                          {daysBadge.text}
                        </span>
                      </div>

                      {!isCompleted && (
                        <button
                          onClick={() => setAddingMoneyGoal(g)}
                          className="w-full py-2 border border-dashed border-line rounded-[var(--radius-control)] text-xs font-bold text-primary transition-all hover:bg-surface-sunken cursor-pointer"
                        >
                          + Save Money
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deletingGoalId}
          onClose={() => setDeletingGoalId(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Savings Goal"
          message="Are you sure you want to delete this saving target? This action cannot be undone."
        />

        {/* Save Money modal */}
        <Modal
          isOpen={!!addingMoneyGoal}
          onClose={() => {
            setAddingMoneyGoal(null);
            resetMoney();
          }}
          title={`Save Money - ${addingMoneyGoal?.name}`}
          size="sm"
        >
          {addingMoneyGoal && (
            <form
              onSubmit={handleMoneySubmit(onAddMoneySubmit)}
              className="space-y-6"
            >
              <div className="bg-surface-sunken border border-line rounded-[var(--radius-control)] p-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-ink-subtle uppercase font-bold tracking-wider">
                    Current savings
                  </span>
                  <span className="text-base font-bold font-mono text-ink mt-1">
                    {formatINR(addingMoneyGoal.currentAmount)}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-ink-subtle uppercase font-bold tracking-wider">
                    Remaining target
                  </span>
                  <span className="text-base font-bold font-mono text-primary mt-1">
                    {formatINR(
                      addingMoneyGoal.targetAmount -
                        addingMoneyGoal.currentAmount
                    )}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center py-4 border-b border-line">
                <span className="text-xs text-ink-subtle uppercase font-bold tracking-wider mb-2">
                  Contribution Amount
                </span>
                <div className="flex items-center justify-center w-full">
                  <span className="text-3xl font-sans font-bold mr-2 text-primary">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    autoFocus
                    {...registerMoney("amount", { valueAsNumber: true })}
                    className="bg-transparent text-center font-mono font-bold text-4xl text-ink placeholder:text-ink-subtle focus:outline-hidden min-w-0 max-w-[200px]"
                  />
                </div>
                {moneyErrors.amount && (
                  <span className="text-[11px] amount-loss mt-2 font-medium">
                    {moneyErrors.amount.message}
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setAddingMoneyGoal(null);
                    resetMoney();
                  }}
                  disabled={isMoneySubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isMoneySubmitting}
                >
                  Save Money
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Create / Edit Goal Modal */}
        <Modal
          isOpen={isCreateOpen || !!editingGoal}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingGoal(null);
            resetGoal();
          }}
          title={editingGoal ? "Edit Savings Goal" : "Create Savings Goal"}
          size="lg"
        >
          <form
            onSubmit={handleGoalSubmit(
              editingGoal ? onEditSubmit : onCreateSubmit
            )}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink-subtle uppercase tracking-wider">
                    Goal Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dream Bike, Emergency Fund"
                    {...registerGoal("name")}
                    className="input"
                  />
                  {goalErrors.name && (
                    <span className="text-[11px] amount-loss font-medium">
                      {goalErrors.name.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink-subtle uppercase tracking-wider">
                    Category *
                  </label>
                  <select
                    {...registerGoal("category")}
                    className="input"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option
                        key={c}
                        value={c}
                        className="bg-surface text-ink"
                      >
                        {c}
                      </option>
                    ))}
                  </select>
                  {goalErrors.category && (
                    <span className="text-[11px] amount-loss font-medium">
                      {goalErrors.category.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink-subtle uppercase tracking-wider">
                    Target Amount (INR) *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 100000"
                    {...registerGoal("targetAmount", { valueAsNumber: true })}
                    className="input font-mono"
                  />
                  {goalErrors.targetAmount && (
                    <span className="text-[11px] amount-loss font-medium">
                      {goalErrors.targetAmount.message}
                    </span>
                  )}
                </div>

                {!editingGoal && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-ink-subtle uppercase tracking-wider">
                      Already Saved Amount (INR)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 10000"
                      {...registerGoal("currentAmount", {
                        valueAsNumber: true,
                      })}
                      className="input font-mono"
                    />
                    {goalErrors.currentAmount && (
                      <span className="text-[11px] amount-loss font-medium">
                        {goalErrors.currentAmount.message}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-ink-subtle uppercase tracking-wider">
                    Target Date *
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
                      size={16}
                    />
                    <input
                      type="date"
                      {...registerGoal("deadline")}
                      className="input pl-10"
                    />
                  </div>
                  {goalErrors.deadline && (
                    <span className="text-[11px] amount-loss font-medium">
                      {goalErrors.deadline.message}
                    </span>
                  )}
                </div>

                {/* Color presets selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink-subtle uppercase tracking-wider block">
                    Choose Theme Color *
                  </label>
                  <div className="flex gap-3">
                    {PRESET_COLORS.map((col) => {
                      const isSelected = formColor === col;
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setGoalValue("color", col)}
                          style={{ backgroundColor: col }}
                          className={`w-8 h-8 rounded-[var(--radius-control)] border cursor-pointer flex items-center justify-center transition-all ${
                            isSelected
                              ? "ring-2 ring-primary border-white"
                              : "border-transparent"
                          }`}
                        >
                          {isSelected && (
                            <span className="text-xs text-white">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Icon tag selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink-subtle uppercase tracking-wider block">
                    Goal Icon Tag *
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_TAGS.map((tag) => {
                      const isSelected = formIcon === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setGoalValue("icon", tag)}
                          className={`w-10 h-10 rounded-[var(--radius-control)] border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-on-primary border-primary"
                              : "bg-surface border-line text-ink-muted hover:border-ink-subtle"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingGoal(null);
                  resetGoal();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editingGoal ? "Save Changes" : "Create Goal"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
};

export default GoalsPage;
