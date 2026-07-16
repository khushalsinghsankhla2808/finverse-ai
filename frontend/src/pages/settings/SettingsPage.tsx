import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '@/config/firebase';
import type { Variants } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  User,
  Lock,
  Sliders,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Crown,
  Check,
  AlertTriangle,
  Download,
  Trash2,
  LogOut,
  Globe,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCurrencyStore } from '@/stores/currencyStore';
import { useToast } from '@/hooks/useToast';
import authService from '@/services/authService';
import reportService from '@/services/reportService';
import PageTransition from '@/components/common/PageTransition';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_ ]+$/, 'Only letters, numbers, underscores, and spaces')
    .trim(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .max(128)
      .regex(PASSWORD_REGEX, 'Must include uppercase, number, and special character'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type PasswordFormValues = z.infer<typeof passwordSchema>;

// ─── Animation Variants ───────────────────────────────────────────────────────

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SectionCardProps {
  index: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accentColor?: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({
  index,
  icon,
  title,
  subtitle,
  accentColor = 'purple',
  children,
}) => {
  const accentMap: Record<string, string> = {
    purple: 'bg-purple-primary/10 border-purple-primary/20 text-purple-light',
    blue:   'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green:  'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    amber:  'bg-amber-500/10 border-amber-500/20 text-amber-400',
    red:    'bg-red-negative/10 border-red-negative/20 text-red-400',
  };

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="glassmorphism bg-bg-surface/40 border border-white/8 rounded-2xl overflow-hidden"
    >
      {/* Card Header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-white/5">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${accentMap[accentColor]}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-base font-bold text-white font-display">{title}</h2>
          <p className="text-xs text-white/40 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {/* Card Body */}
      <div className="px-6 py-5 space-y-5">{children}</div>
    </motion.div>
  );
};

// Toggle Switch
const Toggle: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
  label: string;
  description?: string;
}> = ({ checked, onChange, id, label, description }) => (
  <label htmlFor={id} className="flex items-center justify-between gap-4 cursor-pointer group">
    <div>
      <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{label}</p>
      {description && <p className="text-xs text-white/40 mt-0.5">{description}</p>}
    </div>
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${
        checked ? 'bg-purple-primary' : 'bg-white/10'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </label>
);

// Form field wrapper
const Field: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, error, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">{label}</label>
    {children}
    {error && (
      <p className="text-xs text-red-400 flex items-center gap-1">
        <AlertTriangle size={11} />
        {error}
      </p>
    )}
  </div>
);

const inputClass =
  'w-full h-10 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-purple-primary/60 focus:bg-white/8 transition-all duration-200';

// ─── Main Page ────────────────────────────────────────────────────────────────

export const SettingsPage: React.FC = () => {
  const { user, setUser, logout } = useAuth();
  const { activeCurrency, setActiveCurrency, currencies } = useCurrencyStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Password visibility
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Notification prefs (localStorage-persisted, no backend field yet)
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem('finverse_notif_prefs');
      return stored
        ? JSON.parse(stored)
        : { budget_alert: true, goal_milestone: true, transaction: false, system: true };
    } catch {
      return { budget_alert: true, goal_milestone: true, transaction: false, system: true };
    }
  });

  // Delete account modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // ── Profile Form ─────────────────────────────────────────────────────────

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting, isDirty: profileDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '' },
  });

  const onProfileSave = async (values: ProfileFormValues) => {
    try {
      const res = await authService.updateProfile({ name: values.name });
      setUser({ ...user!, name: res.data.name });
      showToast('Profile updated successfully', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update profile', 'error');
    }
  };

  // ── Password Form ─────────────────────────────────────────────────────────

  const {
    register: regPw,
    handleSubmit: handlePwSubmit,
    reset: resetPw,
    formState: { errors: pwErrors, isSubmitting: pwSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onPasswordSave = async (values: PasswordFormValues) => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No authenticated user found.');
      }

      // Check if user signed in via Google (password changes are handled by Google)
      const isGoogleUser = user.providerData.some((p) => p.providerId === 'google.com');
      if (isGoogleUser) {
        throw new Error('Google Sign-In accounts cannot change password here. Please manage this in your Google Account Settings.');
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password in Firebase
      await updatePassword(user, values.newPassword);
      showToast('Password changed successfully', 'success');
      resetPw();
    } catch (err: any) {
      console.error('Password change error:', err);
      showToast(err.message || 'Failed to change password. Please check your current password.', 'error');
    }
  };

  // ── Currency change ───────────────────────────────────────────────────────

  const handleCurrencyChange = async (code: string) => {
    setActiveCurrency(code);
    try {
      await authService.updateProfile({ currency: code });
      showToast(`Currency set to ${code}`, 'success');
    } catch {
      // non-fatal — store is already updated client-side
    }
  };

  // ── Notification prefs ────────────────────────────────────────────────────

  const toggleNotif = (key: string, val: boolean) => {
    const next = { ...notifPrefs, [key]: val };
    setNotifPrefs(next);
    localStorage.setItem('finverse_notif_prefs', JSON.stringify(next));
  };

  // ── Export Data ───────────────────────────────────────────────────────────

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await reportService.generate({
        type: 'comprehensive',
        format: 'pdf',
        period: 'all',
      });
      const url = res?.data?.downloadUrl;
      if (url) {
        window.open(url, '_blank');
        showToast('Report generated — download started', 'success');
      } else {
        showToast('Report queued — check Reports page', 'success');
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  // ── Delete Account ────────────────────────────────────────────────────────

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeletingAccount(true);
    try {
      await authService.deleteAccount();
      showToast('Account deleted. Goodbye 👋', 'success');
      logout();
      navigate('/login');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to delete account', 'error');
      setDeletingAccount(false);
    }
  };

  // User initials
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'US';
  const isPremium = user?.plan === 'Premium';

  // Account created / last login (these come through /auth/me as IUserDocument fields)
  const userDoc = user as any;
  const createdAt = userDoc?.createdAt ? new Date(userDoc.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : null;
  const lastLogin = userDoc?.lastLogin ? new Date(userDoc.lastLogin).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : null;

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Settings</h1>
          <p className="text-xs text-white/50 font-medium mt-1">Manage your account, security, and preferences</p>
        </div>

        {/* ── 1. PROFILE ──────────────────────────────────────────────────────── */}
        <SectionCard index={0} icon={<User size={18} />} title="Profile" subtitle="Your public identity on FinVerse" accentColor="purple">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-purple-primary flex items-center justify-center text-white text-xl font-bold shadow-[0_0_24px_rgba(124,58,237,0.35)]">
                {initials}
              </div>
              {isPremium && (
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-linear-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                  <Crown size={12} className="text-white" />
                </div>
              )}
            </div>
            <div>
              <p className="text-base font-bold text-white">{user?.name || 'User'}</p>
              <p className="text-sm text-white/50">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold leading-none ${
                  isPremium
                    ? 'bg-linear-to-r from-amber-400 to-amber-600 text-bg-base shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'bg-white/10 text-white/50'
                }`}>
                  {isPremium ? '✦ Premium' : 'Free Plan'}
                </span>
              </div>
            </div>
          </div>

          {/* Name edit form */}
          <form onSubmit={handleProfileSubmit(onProfileSave)} className="space-y-4 pt-2 border-t border-white/5">
            <Field label="Display Name" error={profileErrors.name?.message}>
              <input
                id="settings-name"
                {...regProfile('name')}
                className={inputClass}
                placeholder="Your display name"
                autoComplete="name"
              />
            </Field>
            <Field label="Email Address">
              <div className="relative">
                <input
                  id="settings-email"
                  value={user?.email || ''}
                  readOnly
                  className={`${inputClass} opacity-50 cursor-not-allowed pr-24`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 font-semibold uppercase tracking-wider">
                  Read-only
                </span>
              </div>
              <p className="text-xs text-white/30">Email is tied to your authentication and cannot be changed here.</p>
            </Field>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={profileSubmitting}
                disabled={!profileDirty}
                leftIcon={<Check size={14} />}
              >
                Save Changes
              </Button>
            </div>
          </form>

          {/* Account metadata */}
          {(createdAt || lastLogin) && (
            <div className="flex flex-wrap gap-4 pt-2 border-t border-white/5">
              {createdAt && (
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <Calendar size={13} />
                  <span>Member since <span className="text-white/60">{createdAt}</span></span>
                </div>
              )}
              {lastLogin && (
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <User size={13} />
                  <span>Last login <span className="text-white/60">{lastLogin}</span></span>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* ── 2. SECURITY ─────────────────────────────────────────────────────── */}
        <SectionCard index={1} icon={<Lock size={18} />} title="Security" subtitle="Manage your password and active sessions" accentColor="blue">
          <form onSubmit={handlePwSubmit(onPasswordSave)} className="space-y-4">
            <Field label="Current Password" error={pwErrors.currentPassword?.message}>
              <div className="relative">
                <input
                  id="settings-current-password"
                  type={showCurrent ? 'text' : 'password'}
                  {...regPw('currentPassword')}
                  className={`${inputClass} pr-10`}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            <Field label="New Password" error={pwErrors.newPassword?.message}>
              <div className="relative">
                <input
                  id="settings-new-password"
                  type={showNew ? 'text' : 'password'}
                  {...regPw('newPassword')}
                  className={`${inputClass} pr-10`}
                  placeholder="Min 8 chars, uppercase, number, special char"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            <Field label="Confirm New Password" error={pwErrors.confirmPassword?.message}>
              <div className="relative">
                <input
                  id="settings-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  {...regPw('confirmPassword')}
                  className={`${inputClass} pr-10`}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                loading={pwSubmitting}
                leftIcon={<Lock size={14} />}
              >
                Change Password
              </Button>
            </div>
          </form>

          {/* Logout all devices */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div>
              <p className="text-sm font-medium text-white/80">Log Out</p>
              <p className="text-xs text-white/40 mt-0.5">Sign out of your current session</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<LogOut size={14} />}
              onClick={() => { logout(); navigate('/login'); }}
            >
              Log Out
            </Button>
          </div>
        </SectionCard>

        {/* ── 3. PREFERENCES ──────────────────────────────────────────────────── */}
        <SectionCard index={2} icon={<Sliders size={18} />} title="Preferences" subtitle="Personalise your FinVerse experience" accentColor="green">
          {/* Currency */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
              <Globe size={12} />
              Currency
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {currencies.map((c) => (
                <button
                  key={c.code}
                  id={`currency-${c.code}`}
                  onClick={() => handleCurrencyChange(c.code)}
                  className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    activeCurrency.code === c.code
                      ? 'bg-purple-primary/15 border-purple-primary/50 text-white shadow-glow-purple/10'
                      : 'bg-white/3 border-white/8 text-white/50 hover:bg-white/6 hover:text-white/80'
                  }`}
                >
                  <span className="text-lg leading-none">{c.flag}</span>
                  <span className="text-[11px] font-bold">{c.code}</span>
                  {activeCurrency.code === c.code && (
                    <Check size={10} className="text-purple-light" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/30">
              Selected: <span className="text-white/60 font-medium">{activeCurrency.name} ({activeCurrency.symbol})</span>
              {' '}· Synced to your account
            </p>
          </div>
        </SectionCard>

        {/* ── 4. NOTIFICATIONS ─────────────────────────────────────────────────── */}
        <SectionCard index={3} icon={<Bell size={18} />} title="Notifications" subtitle="Control which alerts FinVerse sends you" accentColor="amber">
          <div className="space-y-5">
            <Toggle
              id="notif-budget"
              checked={notifPrefs.budget_alert}
              onChange={(v) => toggleNotif('budget_alert', v)}
              label="Budget Overspend Alerts"
              description="Get notified when a category exceeds its limit"
            />
            <div className="h-px bg-white/5" />
            <Toggle
              id="notif-goal"
              checked={notifPrefs.goal_milestone}
              onChange={(v) => toggleNotif('goal_milestone', v)}
              label="Goal Milestone Reminders"
              description="Alerts when you hit savings milestones or deadlines approach"
            />
            <div className="h-px bg-white/5" />
            <Toggle
              id="notif-transaction"
              checked={notifPrefs.transaction}
              onChange={(v) => toggleNotif('transaction', v)}
              label="Transaction Notifications"
              description="Notify on new income or expense transactions"
            />
            <div className="h-px bg-white/5" />
            <Toggle
              id="notif-system"
              checked={notifPrefs.system}
              onChange={(v) => toggleNotif('system', v)}
              label="System & AI Insights"
              description="Platform updates and AI-generated financial suggestions"
            />
          </div>
          <p className="text-xs text-white/30 pt-2 border-t border-white/5">
            Preferences saved locally. Server-side delivery coming in a future update.
          </p>
        </SectionCard>

        {/* ── 5. DATA & PRIVACY ────────────────────────────────────────────────── */}
        <SectionCard index={4} icon={<Shield size={18} />} title="Data & Privacy" subtitle="Export or permanently delete your account data" accentColor="red">
          {/* Export */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white/80">Export My Data</p>
              <p className="text-xs text-white/40 mt-0.5">
                Download a comprehensive PDF report of all your financial data
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={exporting}
              leftIcon={<Download size={14} />}
              onClick={handleExport}
            >
              Export
            </Button>
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-red-negative/5 border border-red-negative/15">
            <div>
              <p className="text-sm font-semibold text-red-400">Delete Account</p>
              <p className="text-xs text-white/40 mt-0.5">
                Permanently removes your account and all associated data. This is irreversible.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete
            </Button>
          </div>
        </SectionCard>
      </div>

      {/* ── Delete Account Confirmation Modal ──────────────────────────────────── */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteConfirmText('');
        }}
        title="Delete Account"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteConfirmText('');
              }}
              disabled={deletingAccount}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deletingAccount}
              disabled={deleteConfirmText !== 'DELETE'}
              leftIcon={<Trash2 size={14} />}
              onClick={handleDeleteAccount}
            >
              Delete Forever
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-red-negative/10 border border-red-negative/20 flex items-center justify-center text-red-400">
              <AlertTriangle size={26} />
            </div>
            <div>
              <p className="text-sm text-white/70 leading-relaxed">
                This will permanently delete your account and{' '}
                <span className="text-red-400 font-semibold">all associated data</span> including
                transactions, budgets, goals, investments, and AI history.
              </p>
              <p className="text-xs text-white/40 mt-2">This action cannot be undone.</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Type <span className="text-red-400 font-mono">DELETE</span> to confirm
            </label>
            <input
              id="delete-confirm-input"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className={`${inputClass} border-red-negative/20 focus:border-red-negative/60`}
              placeholder="DELETE"
              autoComplete="off"
            />
          </div>
        </div>
      </Modal>
    </PageTransition>
  );
};

export default SettingsPage;
