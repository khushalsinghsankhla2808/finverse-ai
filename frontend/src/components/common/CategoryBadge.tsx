import React from 'react';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className }) => {
  const getBadgeStyles = (cat: string) => {
    const mappings: Record<string, { bg: string; text: string; border: string }> = {
      Housing: {
        bg: 'bg-purple-primary/10',
        text: 'text-purple-light',
        border: 'border-purple-primary/20',
      },
      Food: {
        bg: 'bg-cyan-data/10',
        text: 'text-cyan-data',
        border: 'border-cyan-data/20',
      },
      Transport: {
        bg: 'bg-green-positive/10',
        text: 'text-green-positive',
        border: 'border-green-positive/20',
      },
      Shopping: {
        bg: 'bg-gold-savings/10',
        text: 'text-gold-savings',
        border: 'border-gold-savings/20',
      },
      Entertainment: {
        bg: 'bg-red-negative/10',
        text: 'text-red-negative',
        border: 'border-red-negative/20',
      },
      Groceries: {
        bg: 'bg-violet-500/10',
        text: 'text-violet-400',
        border: 'border-violet-500/20',
      },
      Utilities: {
        bg: 'bg-pink-500/10',
        text: 'text-pink-400',
        border: 'border-pink-500/20',
      },
      Income: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
      },
      Transfer: {
        bg: 'bg-blue-600/10',
        text: 'text-blue-400',
        border: 'border-blue-600/20',
      },
      Healthcare: {
        bg: 'bg-teal-500/10',
        text: 'text-teal-400',
        border: 'border-teal-500/20',
      },
      Education: {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-400',
        border: 'border-indigo-500/20',
      },
      Investment: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
      },
      Other: {
        bg: 'bg-gray-500/10',
        text: 'text-gray-400',
        border: 'border-gray-500/20',
      },
    };

    return mappings[cat] ?? { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
  };

  const { bg, text, border } = getBadgeStyles(category);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border select-none',
        bg,
        text,
        border,
        className
      )}
    >
      {category}
    </span>
  );
};

export default CategoryBadge;
