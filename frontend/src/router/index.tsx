import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { useAuthStore } from '@/stores/authStore';
import {
  Home,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import TransactionsPage from '@/pages/transactions/TransactionsPage';
import AnalyticsPage from '@/pages/analytics/AnalyticsPage';
import BudgetsPage from '@/pages/budgets/BudgetsPage';
import GoalsPage from '@/pages/goals/GoalsPage';
import InvestmentsPage from '@/pages/investments/InvestmentsPage';
import AIAssistantPage from '@/pages/ai/AIAssistantPage';

import SettingsPage from '@/pages/settings/SettingsPage';


// Lazy load actual pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));

// Root redirect logic
const RootRedirect: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

// Shimmer Loader for lazy-loaded pages inside AppLayout
const PageSuspenseFallback: React.FC = () => (
  <div className="flex h-[60vh] w-full items-center justify-center">
    <Loader2 className="animate-spin text-purple-light" size={32} />
  </div>
);

// Reusable Placeholder page for coming modules
interface PlaceholderProps {
  title: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

// @ts-ignore
const PlaceholderPage: React.FC<PlaceholderProps> = ({ title, icon: Icon }) => {
  const navigate = useNavigateHelper();
  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="glassmorphism max-w-md w-full p-8 border border-white/8 rounded-2xl flex flex-col items-center gap-6 shadow-glow-purple/5">
          <div className="h-16 w-16 rounded-2xl bg-purple-primary/10 border border-purple-primary/20 flex items-center justify-center text-purple-light shadow-glow-purple/10">
            <Icon size={30} />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold font-display text-white">{title}</h1>
            <p className="text-xs text-white/50 leading-relaxed">
              This module is coming in Phase 2. We are currently building premium features and AI integrations.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-primary hover:bg-purple-light text-white text-sm font-semibold rounded-lg shadow-glow-purple transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </div>
    </PageTransition>
  );
};

// Navigate helper because router context is active inside routes
import { useNavigate as useNavigateHelper } from 'react-router-dom';

// Custom 404 Page
const NotFoundPage: React.FC = () => {
  const navigate = useNavigateHelper();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg-base text-center px-4 text-white">
      <div className="glassmorphism max-w-md w-full p-8 border border-white/8 rounded-2xl flex flex-col items-center gap-6 shadow-glow-red/5">
        <span className="font-display font-extrabold text-7xl text-transparent bg-clip-text bg-linear-to-r from-red-negative via-purple-light to-purple-primary">
          404
        </span>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold font-display">Lost in the FinVerse</h2>
          <p className="text-xs text-white/40 leading-relaxed">
            The page you are looking for does not exist or has been shifted across dimensions.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-purple-primary to-purple-light text-white text-sm font-semibold rounded-lg shadow-glow-purple transition-all duration-200 cursor-pointer"
        >
          <Home size={16} /> Return Home
        </button>
      </div>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageSuspenseFallback />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<PageSuspenseFallback />}>
        <RegisterPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageSuspenseFallback />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'transactions',
        element: <TransactionsPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'budgets',
        element: <BudgetsPage />,
      },
      {
        path: 'goals',
        element: <GoalsPage />,
      },
      {
        path: 'investments',
        element: <InvestmentsPage />,
      },
      {
        path: 'ai-assistant',
        element: <AIAssistantPage />,
      },
      {
        path: 'reports',
        element: (<Suspense fallback={<PageSuspenseFallback />}><ReportsPage /></Suspense>),
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
