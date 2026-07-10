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
import { useToast } from "@/hooks/useToast";
import type { Goal } from "@/types/finance.types";
import { formatINR, formatDate } from "@/lib/utils";
import PageTransition from "@/components/common/PageTransition";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";

// Validation schemas
const goalCreateSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Max 50 characters"),
  category: z.string().min(1, "Category is required"),
  targetAmount: z
    .number({ message: "Target amount is required" })
    .positive("Target must be greater than 0")
    .max(100000000, "Target cannot exceed ₹100,000,000"),
  currentAmount: z
    .number({ message: "Saved amount is required" })
    .min(0, "Saved amount cannot be negative"),
  deadline: z.string().min(1, "Deadline date is required"),
  color: z.string().min(1, "Color is required"),
  icon: z.string().min(1, "Icon emoji is required"),
});

const addMoneySchema = z.object({
  amount: z
    .number({ message: "Amount is required" })
    .positive("Amount must be greater than 0"),
});

type GoalFormValues = z.infer<typeof goalCreateSchema>;

// Preset colors and emojis
const PRESET_COLORS = [
  "#10B981",
  "#7C3AED",
  "#06B6D4",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
];

const PRESET_EMOJIS = [
  "🛡️",
  "✈️",
  "💻",
  "🏍️",
  "🏠",
  "🎓",
  "💍",
  "🚗",
  "💵",
  "🎄",
  "🎁",
  "📈",
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

// Confetti Effect for Completed Goals
const GoalConfetti: React.FC = () => {
  const confettiParticles = useMemo(() => {
    const colors = [
      "#F59E0B",
      "#10B981",
      "#06B6D4",
      "#7C3AED",
      "#EF4444",
      "#EC4899",
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

  // Dialog and edit state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [addingMoneyGoal, setAddingMoneyGoal] = useState<Goal | null>(null);

  // Forms
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
      icon: PRESET_EMOJIS[0],
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

  // Summary Metrics calculations
  const summary = useMemo(() => {
    const active = goals.length;
    const target = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const saved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    return { active, target, saved };
  }, [goals]);

  // Days left calculation helper
  const getDaysRemaining = (deadlineStr: string) => {
    const diffTime = new Date(deadlineStr).getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysBadge = (days: number) => {
    if (days < 0)
      return {
        text: "Overdue",
        style: "bg-red-negative/10 border-red-negative/20 text-red-negative",
      };
    if (days < 30)
      return {
        text: `${days} days left`,
        style:
          "bg-red-negative/10 border-red-negative/20 text-red-negative animate-pulse",
      };
    if (days <= 90)
      return {
        text: `${days} days left`,
        style: "bg-gold-savings/10 border-gold-savings/20 text-gold-savings",
      };
    return {
      text: `${days} days left`,
      style:
        "bg-green-positive/10 border-green-positive/20 text-green-positive",
    };
  };

  // Submit create goal
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

  // Submit edit goal
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

  // Submit add money
  const onAddMoneySubmit = async (values: { amount: number }) => {
    if (!addingMoneyGoal) return;

    const remaining =
      addingMoneyGoal.targetAmount - addingMoneyGoal.currentAmount;
    if (values.amount > remaining) {
      showToast(
        `Amount cannot exceed the remaining needed (₹${remaining})`,
        "warning",
      );
      return;
    }

    try {
      addToGoal(addingMoneyGoal.id, values.amount);
      showToast(
        `₹${values.amount} added to ${addingMoneyGoal.name}!`,
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
      <div className="space-y-6">
        {/* Header Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">
              Savings Goals
            </h1>
            <p className="text-xs text-white/50 font-medium">
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
              <div className="glassmorphism bg-bg-surface/40 p-5 rounded-2xl border border-white/8 shadow-glow-purple/2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Active Goals
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-purple-primary/10 border border-purple-primary/20 flex items-center justify-center text-purple-light">
                    <Target size={16} />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white font-mono mt-3">
                  {summary.active}
                </h2>
              </div>

              <div className="glassmorphism bg-bg-surface/40 p-5 rounded-2xl border border-white/8 shadow-glow-blue/2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Total Saved
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-primary/10 border border-blue-primary/20 flex items-center justify-center text-blue-primary">
                    <TrendingUp size={16} />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white font-mono mt-3">
                  {summary.saved}
                </h2>
              </div>

              <div className="glassmorphism bg-bg-surface/40 p-5 rounded-2xl border border-white/8 shadow-glow-green/2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Total Target
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-green-positive/10 border border-green-positive/20 flex items-center justify-center text-green-positive">
                    <Trophy size={16} />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white font-mono mt-3">
                  {summary.target}
                </h2>
              </div>
            </div>

            {/* Goals cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map((g) => {
                const percentage =
                  g.targetAmount > 0
                    ? (g.currentAmount / g.targetAmount) * 100
                    : 0;
                const isCompleted = percentage >= 100;
                const remaining = g.targetAmount - g.currentAmount;

                const daysLeft = getDaysRemaining(g.deadline);
                const daysBadge = getDaysBadge(daysLeft);

                // Circular progress calculations
                const radius = 45;
                const circumference = 2 * Math.PI * radius;
                const strokeOffset =
                  circumference * (1 - Math.min(100, percentage) / 100);

                // Card borders
                const cardStyles = isCompleted
                  ? "border-gold-savings shadow-glow-gold/10"
                  : "border-white/8 hover:shadow-glow-purple/2";

                return (
                  <motion.div
                    key={g.id}
                    layout
                    className={`glassmorphism bg-bg-surface/40 rounded-[20px] p-6 border flex flex-col justify-between hover:scale-[1.01] transition-all duration-300 relative ${cardStyles}`}
                  >
                    {/* Render Confetti on achiever state */}
                    {isCompleted && <GoalConfetti />}

                    {/* Top Section */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0 w-11 h-11 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center select-none">
                          {g.icon}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-display font-extrabold text-sm text-white truncate">
                            {g.name}
                          </h3>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">
                            {g.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 z-20">
                        <button
                          onClick={() => triggerEdit(g)}
                          className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingGoalId(g.id)}
                          className="p-1 rounded-lg text-white/30 hover:text-red-negative hover:bg-red-negative/5 transition-all cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Ring & Data content */}
                    <div className="flex items-center justify-between gap-6 my-6">
                      {/* Left Column values */}
                      <div className="space-y-3 min-w-0">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider leading-none">
                            Saved amount
                          </span>
                          <span
                            className="text-xl font-bold font-mono mt-1.5 leading-none"
                            style={{ color: g.color }}
                          >
                            {formatINR(g.currentAmount)}
                          </span>
                          <span className="text-xs text-white/40 mt-1 leading-none">
                            of {formatINR(g.targetAmount)}
                          </span>
                        </div>

                        <p className="text-xs text-white/50">
                          {isCompleted ? (
                            <span className="text-gold-savings font-bold">
                              🎉 Goal Achieved!
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
                            className="stroke-white/5"
                            strokeWidth="7"
                            fill="transparent"
                          />
                          <motion.circle
                            cx="50"
                            cy="50"
                            r={radius}
                            stroke={isCompleted ? "#F59E0B" : g.color}
                            strokeWidth="7"
                            fill="transparent"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: strokeOffset }}
                            transition={{ duration: 1.0, ease: "easeOut" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                          <span className="text-base font-bold font-mono text-white">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom stats row */}
                    <div className="border-t border-white/5 pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-white/50 text-xs">
                          <Calendar size={13} className="shrink-0" />
                          <span>Target: {formatDate(g.deadline)}</span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${daysBadge.style}`}
                        >
                          {daysBadge.text}
                        </span>
                      </div>

                      {!isCompleted && (
                        <button
                          onClick={() => setAddingMoneyGoal(g)}
                          className="w-full py-2 border border-dashed rounded-xl text-xs font-bold transition-all hover:bg-white/4 cursor-pointer"
                          style={{
                            borderColor: `${g.color}35`,
                            color: g.color,
                          }}
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
              {/* Progress Summary info */}
              <div className="bg-white/3 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                    Current savings
                  </span>
                  <span className="text-base font-bold font-mono text-white mt-1">
                    {formatINR(addingMoneyGoal.currentAmount)}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                    Remaining target
                  </span>
                  <span className="text-base font-bold font-mono text-purple-light mt-1">
                    {formatINR(
                      addingMoneyGoal.targetAmount -
                        addingMoneyGoal.currentAmount,
                    )}
                  </span>
                </div>
              </div>

              {/* Amount input */}
              <div className="flex flex-col items-center py-4 border-b border-white/10 focus-within:border-purple-primary transition-colors">
                <span className="text-xs text-white/45 uppercase font-bold tracking-wider mb-2">
                  Contribution Amount
                </span>
                <div className="flex items-center justify-center w-full">
                  <span className="text-3xl font-display font-bold mr-2 text-purple-light">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    autoFocus
                    {...registerMoney("amount", { valueAsNumber: true })}
                    className="bg-transparent text-center font-mono font-bold text-4xl text-white placeholder:text-white/15 focus:outline-hidden min-w-0 max-w-[200px]"
                  />
                </div>
                {moneyErrors.amount && (
                  <span className="text-[11px] text-red-negative mt-2 font-medium">
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
              editingGoal ? onEditSubmit : onCreateSubmit,
            )}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Goal Name <span className="text-red-negative">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dream Bike, Emergency Fund"
                    {...registerGoal("name")}
                    className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden transition-all placeholder:text-white/20"
                  />
                  {goalErrors.name && (
                    <span className="text-[11px] text-red-negative font-medium">
                      {goalErrors.name.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Category <span className="text-red-negative">*</span>
                  </label>
                  <select
                    {...registerGoal("category")}
                    className="w-full bg-bg-surface border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden transition-all"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option
                        key={c}
                        value={c}
                        className="bg-bg-surface text-white"
                      >
                        {c}
                      </option>
                    ))}
                  </select>
                  {goalErrors.category && (
                    <span className="text-[11px] text-red-negative font-medium">
                      {goalErrors.category.message}
                    </span>
                  )}
                </div>

                {/* Target Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Target Amount (INR){" "}
                    <span className="text-red-negative">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 100000"
                    {...registerGoal("targetAmount", { valueAsNumber: true })}
                    className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden transition-all placeholder:text-white/20 font-mono"
                  />
                  {goalErrors.targetAmount && (
                    <span className="text-[11px] text-red-negative font-medium">
                      {goalErrors.targetAmount.message}
                    </span>
                  )}
                </div>

                {/* Initial amount saved - show only when creating */}
                {!editingGoal && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                      Already Saved Amount (INR)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 10000"
                      {...registerGoal("currentAmount", {
                        valueAsNumber: true,
                      })}
                      className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden transition-all placeholder:text-white/20 font-mono"
                    />
                    {goalErrors.currentAmount && (
                      <span className="text-[11px] text-red-negative font-medium">
                        {goalErrors.currentAmount.message}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Deadline */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Target Date <span className="text-red-negative">*</span>
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                      size={16}
                    />
                    <input
                      type="date"
                      {...registerGoal("deadline")}
                      className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-hidden transition-all"
                    />
                  </div>
                  {goalErrors.deadline && (
                    <span className="text-[11px] text-red-negative font-medium">
                      {goalErrors.deadline.message}
                    </span>
                  )}
                </div>

                {/* Color presets selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider block">
                    Choose Theme Color{" "}
                    <span className="text-red-negative">*</span>
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
                          className={`w-8 h-8 rounded-full border cursor-pointer flex items-center justify-center transition-all ${
                            isSelected
                              ? "ring-2 ring-purple-light scale-110 border-white"
                              : "border-transparent hover:scale-105"
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

                {/* Emojis selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider block">
                    Goal Icon <span className="text-red-negative">*</span>
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_EMOJIS.map((emoji) => {
                      const isSelected = formIcon === emoji;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setGoalValue("icon", emoji)}
                          className={`w-10 h-10 rounded-xl border text-xl flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-purple-primary/10 border-purple-primary shadow-inner scale-110"
                              : "bg-white/2 border-white/5 hover:border-white/15"
                          }`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal actions footer */}
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
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
