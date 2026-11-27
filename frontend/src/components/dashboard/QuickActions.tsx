
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

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAddTransaction,
  className,
}) => {
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
    <div
      className={cn(
        'card relative box-border flex w-full min-w-0 max-w-full flex-col gap-4 h-auto select-none',
        className
      )}
      style={{
        height: 'auto',
        minHeight: 'fit-content',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div className="w-full min-w-0">
        <h3 className="text-sm font-bold font-sans text-ink tracking-wide mb-1">
          Quick Actions
        </h3>

        <p className="text-[11px] text-ink-subtle font-medium uppercase tracking-wider">
          Fast Financial Shortcuts
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex w-full min-w-0 flex-col gap-2">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.label}
              type="button"
              onClick={() => handleActionClick(action)}
              className="
                group relative flex w-full min-w-0 shrink-0
                box-border items-center justify-between
                min-h-[56px] py-2 px-3.5
                rounded-[var(--radius-control)]
                bg-surface-sunken
                hover:bg-surface
                border border-line
                transition-all duration-150
                cursor-pointer text-left
              "
            >
              {/* Icon and Label */}
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="
                    h-9 w-9 shrink-0
                    flex items-center justify-center
                    rounded-[var(--radius-control)]
                    bg-surface border border-line
                    text-primary
                  "
                >
                  <Icon size={16} />
                </div>

                <span className="text-sm font-semibold text-ink group-hover:text-primary transition-colors truncate">
                  {action.label}
                </span>
              </div>

              {/* Arrow */}
              <div className="shrink-0 ml-2 text-ink-subtle group-hover:text-primary transition-all duration-150">
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
