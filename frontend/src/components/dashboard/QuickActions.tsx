import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  ArrowRight,
  Wallet,
  Target,
  Bot,
  ChevronRight,
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface ActionItem {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  path: string;
}

interface QuickActionsProps {
  onAddTransaction: () => void;
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAddTransaction, className }) => {
  const navigate = useNavigate();

  const actions: ActionItem[] = [
    { icon: Plus, label: 'Add Transaction', path: '/transactions' },
    { icon: ArrowRight, label: 'Transfer Money', path: '/transactions' },
    { icon: Wallet, label: 'Set Budget', path: '/budgets' },
    { icon: Target, label: 'Create Goal', path: '/goals' },
    { icon: Bot, label: 'AI Assistant', path: '/ai-assistant' },
  ];

  const handleActionClick = (action: ActionItem) => {
    if (action.label === 'Add Transaction') {
      onAddTransaction();
    } else {
      navigate(action.path);
    }
  };

  return (
    <div className={cn("card flex flex-col justify-between select-none", className)}>
      <div>
        <h3 className="text-sm font-bold font-sans text-ink tracking-wide mb-1">
          Quick Actions
        </h3>
        <p className="text-[11px] text-ink-subtle mb-4 font-medium uppercase tracking-wider">
          Fast Financial Shortcuts
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className="group relative flex items-center justify-between py-2.5 px-3.5 rounded-[var(--radius-control)] bg-surface-sunken hover:bg-surface border border-line transition-all duration-150 cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 flex items-center justify-center rounded-[var(--radius-control)] bg-surface border border-line text-primary">
                  <Icon size={16} />
                </div>
                <span className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">
                  {action.label}
                </span>
              </div>

              <div className="text-ink-subtle group-hover:text-primary transition-all duration-150">
                <ChevronRight size={16} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
