import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  colorClass: string; // Tailwind color class name prefix
  hexColor: string; // for custom border / glow
  path: string;
}

interface QuickActionsProps {
  onAddTransaction: () => void;
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAddTransaction, className }) => {
  const navigate = useNavigate();

  const actions: ActionItem[] = [
    { icon: Plus, label: 'Add Transaction', colorClass: 'green-positive', hexColor: '#10B981', path: '/transactions' },
    { icon: ArrowRight, label: 'Transfer Money', colorClass: 'blue-primary', hexColor: '#2563EB', path: '/transactions' },
    { icon: Wallet, label: 'Set Budget', colorClass: 'purple-primary', hexColor: '#7C3AED', path: '/budgets' },
    { icon: Target, label: 'Create Goal', colorClass: 'gold-savings', hexColor: '#F59E0B', path: '/goals' },
    { icon: Bot, label: 'AI Assistant', colorClass: 'cyan-data', hexColor: '#06B6D4', path: '/ai-assistant' },
  ];

  const handleActionClick = (action: ActionItem) => {
    if (action.label === 'Add Transaction') {
      onAddTransaction();
    } else {
      navigate(action.path);
    }
  };

  return (
    <div className={cn("glassmorphism rounded-2xl p-5 border border-white/8 flex flex-col h-full justify-between select-none", className)}>
      <div>
        <h3 className="text-sm font-bold font-display text-white tracking-wide mb-1">
          Quick Actions
        </h3>
        <p className="text-[11px] text-white/40 mb-4 font-medium uppercase tracking-wider">
          Fast Financial Shortcuts
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className="group relative flex items-center justify-between p-3 rounded-xl bg-white/2 hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer overflow-hidden text-left"
            >
              {/* Left Accent Bar on Hover */}
              <motion.div
                initial={{ x: -4, opacity: 0 }}
                whileHover={{ x: 0, opacity: 1 }}
                className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{ backgroundColor: action.hexColor }}
              />

              <div className="flex items-center gap-3">
                {/* Icon Circle */}
                <div
                  className="h-9 w-9 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                  style={{
                    backgroundColor: `rgba(255,255,255,0.03)`,
                    color: action.hexColor,
                    border: `1px solid rgba(255,255,255,0.05)`,
                  }}
                >
                  <Icon size={16} />
                </div>
                <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                  {action.label}
                </span>
              </div>

              {/* Right Chevron */}
              <div className="text-white/30 group-hover:text-white transition-all duration-300 transform group-hover:translate-x-1">
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
