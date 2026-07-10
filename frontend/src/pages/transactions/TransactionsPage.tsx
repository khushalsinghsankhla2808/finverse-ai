import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  X,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  FileText,
  Filter,
} from 'lucide-react';
import { useFinanceStore } from '@/stores/financeStore';
import { useToast } from '@/hooks/useToast';
import type { Transaction } from '@/types/finance.types';
import { formatINR, formatDate, getCategoryColor } from '@/lib/utils';
import Modal from '@/components/common/Modal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import EmptyState from '@/components/common/EmptyState';
import CategoryBadge from '@/components/common/CategoryBadge';
import Button from '@/components/common/Button';
import PageTransition from '@/components/common/PageTransition';

// Validation Schema
const transactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z
    .number({ message: 'Amount is required' })
    .positive('Amount must be greater than 0')
    .max(10000000, 'Amount cannot exceed ₹1,000,0000'),
  category: z.string().min(1, 'Category is required'),
  merchant: z.string().min(2, 'Merchant must be at least 2 characters').max(50, 'Max 50 characters'),
  date: z.string().min(1, 'Date is required'),
  note: z.string().max(200, 'Note cannot exceed 200 characters').optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

// Category options
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

export const TransactionsPage: React.FC = () => {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useFinanceStore();
  const { showToast } = useToast();

  // Filter and pagination states
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
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

  // Receipt Mock State
  const [receiptFile, setReceiptFile] = useState<string | null>(null);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingTransaction) {
      reset({
        type: editingTransaction.type,
        amount: Math.abs(editingTransaction.amount),
        category: editingTransaction.category,
        merchant: editingTransaction.merchant || '',
        date: editingTransaction.date,
        note: editingTransaction.note || '',
      });
      setReceiptFile(editingTransaction.receiptUrl || null);
    } else {
      reset({
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        amount: undefined,
        category: '',
        merchant: '',
        note: '',
      });
      setReceiptFile(null);
    }
  }, [editingTransaction, reset]);

  // Handle outside clicks for category multi-select dropdown
  useEffect(() => {
    if (!isCategoryDropdownOpen) return;
    const handleOutsideClick = () => setIsCategoryDropdownOpen(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [isCategoryDropdownOpen]);

  // Dynamic summary figures for CURRENT MONTH (July 2026 as benchmark)
  const summary = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const currentMonthTxns = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const income = currentMonthTxns
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = currentMonthTxns
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      income,
      expense,
      net: income - expense,
    };
  }, [transactions]);

  // Filter logic
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Sort newest first
    result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Type filter
    if (activeType !== 'all') {
      result = result.filter((t) => t.type === activeType);
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.merchant && t.merchant.toLowerCase().includes(q)) ||
          (t.note && t.note.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((t) => selectedCategories.includes(t.category));
    }

    // Date Range
    if (dateFrom) {
      result = result.filter((t) => t.date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((t) => t.date <= dateTo);
    }

    return result;
  }, [transactions, activeType, search, selectedCategories, dateFrom, dateTo]);

  // Pagination calculations
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;

  // Reset pagination if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeType, selectedCategories, dateFrom, dateTo]);

  // Unique categories list for filtering dropdown
  const uniqueCategories = useMemo(() => {
    const cats = transactions.map((t) => t.category);
    return Array.from(new Set(cats));
  }, [transactions]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = paginatedTransactions.map((t) => t.id);
      setSelectedIds(ids);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const clearFilters = () => {
    setSearch('');
    setActiveType('all');
    setSelectedCategories([]);
    setDateFrom('');
    setDateTo('');
  };

  const onAddSubmit = async (values: TransactionFormValues) => {
    try {
      const finalAmount = values.type === 'income' ? values.amount : -values.amount;

      const payload = {
        name: values.merchant,
        category: values.category,
        amount: finalAmount,
        date: values.date,
        type: values.type,
        merchant: values.merchant,
        note: values.note || '',
        receiptUrl: receiptFile || undefined,
      };

      addTransaction(payload);
      showToast('Transaction added successfully', 'success');
      setIsAddModalOpen(false);
      reset();
    } catch (err) {
      showToast('Failed to add transaction', 'error');
    }
  };

  const onEditSubmit = async (values: TransactionFormValues) => {
    if (!editingTransaction) return;

    try {
      const finalAmount = values.type === 'income' ? values.amount : -values.amount;

      const payload = {
        name: values.merchant,
        category: values.category,
        amount: finalAmount,
        date: values.date,
        type: values.type,
        merchant: values.merchant,
        note: values.note || '',
        receiptUrl: receiptFile || undefined,
      };

      updateTransaction(editingTransaction.id, payload);
      showToast('Transaction updated successfully', 'success');
      setEditingTransaction(null);
    } catch (err) {
      showToast('Failed to update transaction', 'error');
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingTransactionId) return;
    deleteTransaction(deletingTransactionId);
    showToast('Transaction deleted', 'error');
    setDeletingTransactionId(null);
  };

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteTransaction(id));
    showToast(`${selectedIds.length} transactions deleted`, 'error');
    setSelectedIds([]);
    setIsBulkDeleteOpen(false);
  };

  // Mock upload receipt zone selector
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0].name);
    }
  };

  // Categories helper list to quickly render active icons
  const getCategoryEmoji = (cat: string) => {
    return CATEGORY_OPTIONS.find((c) => c.id === cat)?.emoji || '💰';
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Transactions</h1>
            <p className="text-xs text-white/50 font-medium">Manage your income & expenses</p>
          </div>
          <Button variant="primary" leftIcon={<Plus size={16} />} onClick={() => setIsAddModalOpen(true)}>
            Add Transaction
          </Button>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="glassmorphism bg-bg-surface/40 p-5 rounded-2xl border border-white/8 shadow-glow-green/2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Income This Month</span>
              <div className="w-8 h-8 rounded-lg bg-green-positive/10 border border-green-positive/20 flex items-center justify-center text-green-positive">
                <TrendingUp size={16} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white font-mono mt-3">{formatINR(summary.income)}</h2>
          </div>

          <div className="glassmorphism bg-bg-surface/40 p-5 rounded-2xl border border-white/8 shadow-glow-red/2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Expenses This Month</span>
              <div className="w-8 h-8 rounded-lg bg-red-negative/10 border border-red-negative/20 flex items-center justify-center text-red-negative">
                <TrendingDown size={16} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white font-mono mt-3">{formatINR(summary.expense)}</h2>
          </div>

          <div className="glassmorphism bg-bg-surface/40 p-5 rounded-2xl border border-white/8 shadow-glow-purple/2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Net Cash Flow</span>
              <div className="w-8 h-8 rounded-lg bg-purple-primary/10 border border-purple-primary/20 flex items-center justify-center text-purple-light">
                <ArrowRightLeft size={16} />
              </div>
            </div>
            <h2 className={`text-2xl font-bold font-mono mt-3 ${summary.net >= 0 ? 'text-green-positive' : 'text-red-negative'}`}>
              {summary.net >= 0 ? '+' : ''}{formatINR(summary.net)}
            </h2>
          </div>
        </div>

        {/* Filter Workspace */}
        <div className="glassmorphism bg-bg-surface/30 p-5 border border-white/8 rounded-2xl space-y-4">
          {/* Row 1: Sliding Pill Tabs */}
          <div className="flex border-b border-white/5 pb-3">
            <div className="flex bg-white/4 p-1 rounded-xl border border-white/5 relative">
              {['all', 'income', 'expense', 'transfer'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveType(tab as any)}
                  className={`relative px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                    activeType === tab ? 'text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {activeType === tab && (
                    <motion.div
                      layoutId="activeFilterTab"
                      transition={{ type: 'spring', damping: 22, stiffness: 220 }}
                      className="absolute inset-0 bg-purple-primary rounded-lg shadow-glow-purple/30 z-0"
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Search, Categories, Ranges */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-center">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                type="text"
                placeholder="Search description, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-hidden transition-all placeholder:text-white/20"
              />
            </div>

            {/* Category dropdown Multi-Select */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="w-full flex items-center justify-between bg-white/3 hover:bg-white/5 border border-white/8 rounded-xl px-4 py-2 text-sm text-white focus:outline-hidden transition-all text-left cursor-pointer"
              >
                <span className="truncate">
                  {selectedCategories.length === 0
                    ? 'All Categories'
                    : `${selectedCategories.length} selected`}
                </span>
                <Filter size={14} className="text-white/40" />
              </button>

              <AnimatePresence>
                {isCategoryDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute z-20 left-0 right-0 mt-1 glassmorphism bg-bg-surface/90 border border-white/10 rounded-xl shadow-xl max-h-56 overflow-y-auto p-2 space-y-1"
                  >
                    {uniqueCategories.map((cat) => {
                      const isChecked = selectedCategories.includes(cat);
                      return (
                        <label
                          key={cat}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white hover:bg-white/5 transition-colors cursor-pointer font-medium"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategories((prev) => [...prev, cat]);
                              } else {
                                setSelectedCategories((prev) => prev.filter((c) => c !== cat));
                              }
                            }}
                            className="accent-purple-primary rounded-sm h-3.5 w-3.5"
                          />
                          <span>{getCategoryEmoji(cat)}</span>
                          <span>{cat}</span>
                        </label>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Date Pickers */}
            <div className="flex items-center gap-2 sm:col-span-2">
              <div className="relative flex-1">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-hidden transition-all"
                />
              </div>
              <span className="text-xs text-white/30">to</span>
              <div className="relative flex-1">
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-hidden transition-all"
                />
              </div>

              {(search || activeType !== 'all' || selectedCategories.length > 0 || dateFrom || dateTo) && (
                <button
                  onClick={clearFilters}
                  className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all cursor-pointer shrink-0"
                  title="Clear Filters"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Transactions Table Workspace */}
        <div className="glassmorphism bg-bg-surface/20 border border-white/8 rounded-2xl overflow-hidden shadow-xl">
          {filteredTransactions.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No transactions found"
              description="We couldn't find any transaction matching your active filter criteria."
              actionLabel="Reset Filters"
              onAction={clearFilters}
            />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase font-bold tracking-wider text-white/40">
                      <th className="py-4 px-6 w-12">
                        <input
                          type="checkbox"
                          checked={
                            paginatedTransactions.length > 0 &&
                            selectedIds.length === paginatedTransactions.length
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="accent-purple-primary cursor-pointer rounded-sm"
                        />
                      </th>
                      <th className="py-4 px-4">Merchant / Details</th>
                      <th className="py-4 px-4">Category</th>
                      <th className="py-4 px-4">Date</th>
                      <th className="py-4 px-4 text-right">Amount</th>
                      <th className="py-4 px-6 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((txn) => {
                      const isSelected = selectedIds.includes(txn.id);
                      const isExpense = txn.type === 'expense';
                      const isTransfer = txn.type === 'transfer';
                      const initialLetter = (txn.merchant || txn.name || '?')[0].toUpperCase();
                      const categoryColor = getCategoryColor(txn.category);

                      return (
                        <motion.tr
                          layout
                          key={txn.id}
                          className={`border-b border-white/3 hover:bg-white/2 transition-colors duration-150 group ${
                            isSelected ? 'bg-white/4' : ''
                          }`}
                        >
                          <td className="py-4 px-6">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleSelectOne(txn.id, e.target.checked)}
                              className="accent-purple-primary cursor-pointer rounded-sm"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border border-white/5 select-none shrink-0"
                              >
                                {initialLetter}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-sm text-white truncate max-w-xs">
                                  {txn.merchant || txn.name}
                                </span>
                                {txn.note && (
                                  <span className="text-[10px] text-white/40 truncate max-w-xs mt-0.5">
                                    {txn.note}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <CategoryBadge category={txn.category} />
                          </td>
                          <td className="py-4 px-4 text-xs text-white/55 font-medium">
                            {formatDate(txn.date)}
                          </td>
                          <td className={`py-4 px-4 text-right font-semibold font-mono text-sm ${
                            isExpense ? 'text-red-negative' : isTransfer ? 'text-blue-primary' : 'text-green-positive'
                          }`}>
                            {isExpense ? '-' : isTransfer ? '' : '+'}{formatINR(Math.abs(txn.amount))}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => setEditingTransaction(txn)}
                                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => setDeletingTransactionId(txn.id)}
                                className="p-1.5 rounded-lg text-white/40 hover:text-red-negative hover:bg-red-negative/10 transition-all cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-white/5">
                {paginatedTransactions.map((txn) => {
                  const isSelected = selectedIds.includes(txn.id);
                  const isExpense = txn.type === 'expense';
                  const isTransfer = txn.type === 'transfer';
                  const categoryColor = getCategoryColor(txn.category);

                  return (
                    <div
                      key={txn.id}
                      className={`p-4 flex items-center justify-between gap-3 ${
                        isSelected ? 'bg-white/4' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectOne(txn.id, e.target.checked)}
                          className="accent-purple-primary cursor-pointer rounded-sm"
                        />
                        <div
                          style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs select-none shrink-0"
                        >
                          {getCategoryEmoji(txn.category)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm text-white truncate">
                            {txn.merchant || txn.name}
                          </span>
                          <span className="text-[10px] text-white/40 mt-0.5">
                            {formatDate(txn.date)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`font-semibold font-mono text-sm ${
                          isExpense ? 'text-red-negative' : isTransfer ? 'text-blue-primary' : 'text-green-positive'
                        }`}>
                          {isExpense ? '-' : isTransfer ? '' : '+'}{formatINR(Math.abs(txn.amount))}
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setEditingTransaction(txn)}
                            className="p-1 rounded-lg text-white/40 hover:text-white"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => setDeletingTransactionId(txn.id)}
                            className="p-1 rounded-lg text-white/40 hover:text-red-negative"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination controls */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/1 text-xs text-white/55">
                <span>
                  Showing {Math.min(filteredTransactions.length, (currentPage - 1) * itemsPerPage + 1)} to{' '}
                  {Math.min(filteredTransactions.length, currentPage * itemsPerPage)} of{' '}
                  {filteredTransactions.length} items
                </span>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((c) => c - 1)}
                    className="p-1.5 rounded-lg border border-white/5 bg-white/2 text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/5 cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="font-medium text-white px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((c) => c + 1)}
                    className="p-1.5 rounded-lg border border-white/5 bg-white/2 text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-white/5 cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Floating Bulk Selection Bar */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glassmorphism bg-purple-primary/10 border border-purple-primary/30 p-3 rounded-2xl flex items-center justify-between gap-6 shadow-[0_10px_30px_rgba(124,58,237,0.15)] max-w-sm w-[90%]"
            >
              <div className="flex flex-col pl-2">
                <span className="text-xs font-bold text-white leading-none">
                  {selectedIds.length} Selected
                </span>
                <span className="text-[10px] text-white/50 mt-1">Bulk action workspace</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds([])}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 size={13} />}
                  onClick={() => setIsBulkDeleteOpen(true)}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm Single Delete */}
        <ConfirmDialog
          isOpen={!!deletingTransactionId}
          onClose={() => setDeletingTransactionId(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Transaction"
          message="Are you sure you want to delete this transaction? This action cannot be undone."
        />

        {/* Confirm Bulk Delete */}
        <ConfirmDialog
          isOpen={isBulkDeleteOpen}
          onClose={() => setIsBulkDeleteOpen(false)}
          onConfirm={handleBulkDelete}
          title="Delete Selected Transactions"
          message={`Are you sure you want to delete all ${selectedIds.length} selected transactions? This action is permanent.`}
        />

        {/* Add Transaction Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            reset();
          }}
          title="Add Transaction"
          size="lg"
        >
          <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Type Selection */}
                <div className="flex bg-white/4 p-1 rounded-xl border border-white/5">
                  {(['income', 'expense', 'transfer'] as const).map((type) => {
                    const typeColor =
                      type === 'income'
                        ? 'bg-green-positive shadow-glow-green/10'
                        : type === 'expense'
                        ? 'bg-red-negative shadow-glow-red/10'
                        : 'bg-blue-600 shadow-glow-blue/10';

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setValue('type', type)}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                          formType === type
                            ? `${typeColor} text-white`
                            : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>

                {/* Giant Amount Input */}
                <div className="flex flex-col items-center py-4 border-b border-white/10 group focus-within:border-purple-primary transition-colors">
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

                {/* Category Emoji Selector Matrix */}
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
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs gap-1 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-primary/10 border-purple-primary text-white shadow-glow-purple/5'
                              : 'bg-white/2 border-white/5 text-white/60 hover:border-white/15 hover:text-white'
                          }`}
                        >
                          <span className="text-lg leading-none">{cat.emoji}</span>
                          <span className="font-semibold text-[10px] truncate max-w-full">
                            {cat.label}
                          </span>
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

              {/* Right Column */}
              <div className="space-y-4">
                {/* Merchant input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Merchant / Description <span className="text-red-negative">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Swiggy, Amazon India, Salary"
                    {...register('merchant')}
                    className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden transition-all placeholder:text-white/20"
                  />
                  {errors.merchant && (
                    <span className="text-[11px] text-red-negative font-medium">
                      {errors.merchant.message}
                    </span>
                  )}
                </div>

                {/* Date Picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Date <span className="text-red-negative">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input
                      type="date"
                      {...register('date')}
                      className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-hidden transition-all"
                    />
                  </div>
                  {errors.date && (
                    <span className="text-[11px] text-red-negative font-medium">
                      {errors.date.message}
                    </span>
                  )}
                </div>

                {/* Notes Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    maxLength={200}
                    placeholder="Add description notes (max 200 characters)..."
                    {...register('note')}
                    className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden transition-all resize-none placeholder:text-white/20"
                  />
                  {errors.note && (
                    <span className="text-[11px] text-red-negative font-medium">
                      {errors.note.message}
                    </span>
                  )}
                </div>

                {/* Mock Receipt Upload */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Receipt Upload
                  </label>
                  <label className="border border-dashed border-white/10 bg-white/2 hover:border-purple-primary/45 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative group">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                    {receiptFile ? (
                      <div className="flex items-center gap-2 text-white text-xs bg-purple-primary/10 border border-purple-primary/20 px-3 py-1.5 rounded-lg select-none">
                        <FileText size={14} className="text-purple-light" />
                        <span className="font-semibold max-w-[150px] truncate">{receiptFile}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setReceiptFile(null);
                          }}
                          className="hover:text-red-negative transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud size={24} className="text-white/35 group-hover:text-purple-light transition-colors mb-2" />
                        <span className="text-xs font-bold text-white/60">Upload receipt</span>
                        <span className="text-[10px] text-white/30 mt-1">Accepts PNG, JPG, PDF</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAddModalOpen(false);
                  reset();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Add Transaction
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Transaction Modal */}
        <Modal
          isOpen={!!editingTransaction}
          onClose={() => setEditingTransaction(null)}
          title="Edit Transaction"
          size="lg"
        >
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Type Selection */}
                <div className="flex bg-white/4 p-1 rounded-xl border border-white/5">
                  {(['income', 'expense', 'transfer'] as const).map((type) => {
                    const typeColor =
                      type === 'income'
                        ? 'bg-green-positive shadow-glow-green/10'
                        : type === 'expense'
                        ? 'bg-red-negative shadow-glow-red/10'
                        : 'bg-blue-600 shadow-glow-blue/10';

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setValue('type', type)}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                          formType === type
                            ? `${typeColor} text-white`
                            : 'text-white/40 hover:text-white/70'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>

                {/* Giant Amount Input */}
                <div className="flex flex-col items-center py-4 border-b border-white/10 group focus-within:border-purple-primary transition-colors">
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

                {/* Category Emoji Selector Matrix */}
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
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs gap-1 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-primary/10 border-purple-primary text-white shadow-glow-purple/5'
                              : 'bg-white/2 border-white/5 text-white/60 hover:border-white/15 hover:text-white'
                          }`}
                        >
                          <span className="text-lg leading-none">{cat.emoji}</span>
                          <span className="font-semibold text-[10px] truncate max-w-full">
                            {cat.label}
                          </span>
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

              {/* Right Column */}
              <div className="space-y-4">
                {/* Merchant input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Merchant / Description <span className="text-red-negative">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Swiggy, Amazon India, Salary"
                    {...register('merchant')}
                    className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden transition-all placeholder:text-white/20"
                  />
                  {errors.merchant && (
                    <span className="text-[11px] text-red-negative font-medium">
                      {errors.merchant.message}
                    </span>
                  )}
                </div>

                {/* Date Picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Date <span className="text-red-negative">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input
                      type="date"
                      {...register('date')}
                      className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-hidden transition-all"
                    />
                  </div>
                  {errors.date && (
                    <span className="text-[11px] text-red-negative font-medium">
                      {errors.date.message}
                    </span>
                  )}
                </div>

                {/* Notes Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    maxLength={200}
                    placeholder="Add description notes (max 200 characters)..."
                    {...register('note')}
                    className="w-full bg-white/3 hover:bg-white/5 border border-white/8 focus:border-purple-primary rounded-xl px-4 py-2.5 text-sm text-white focus:outline-hidden transition-all resize-none placeholder:text-white/20"
                  />
                  {errors.note && (
                    <span className="text-[11px] text-red-negative font-medium">
                      {errors.note.message}
                    </span>
                  )}
                </div>

                {/* Mock Receipt Upload */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    Receipt Upload
                  </label>
                  <label className="border border-dashed border-white/10 bg-white/2 hover:border-purple-primary/45 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative group">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                    {receiptFile ? (
                      <div className="flex items-center gap-2 text-white text-xs bg-purple-primary/10 border border-purple-primary/20 px-3 py-1.5 rounded-lg select-none">
                        <FileText size={14} className="text-purple-light" />
                        <span className="font-semibold max-w-[150px] truncate">{receiptFile}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setReceiptFile(null);
                          }}
                          className="hover:text-red-negative transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud size={24} className="text-white/35 group-hover:text-purple-light transition-colors mb-2" />
                        <span className="text-xs font-bold text-white/60">Upload receipt</span>
                        <span className="text-[10px] text-white/30 mt-1">Accepts PNG, JPG, PDF</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <Button variant="ghost" onClick={() => setEditingTransaction(null)} disabled={isSubmitting}>
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

export default TransactionsPage;
