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
        bg: 'bg-[#FF9A6B]/15',
        text: 'text-[#FF9A6B]',
        border: 'border-[#FF9A6B]/30',
      },
      Food: {
        bg: 'bg-[#2DD4BF]/15',
        text: 'text-[#2DD4BF]',
        border: 'border-[#2DD4BF]/30',
      },
      Transport: {
        bg: 'bg-[#FF6B9D]/15',
        text: 'text-[#FF6B9D]',
        border: 'border-[#FF6B9D]/30',
      },
      Shopping: {
        bg: 'bg-[#FFB896]/15',
        text: 'text-[#FFB896]',
        border: 'border-[#FFB896]/30',
      },
      Entertainment: {
        bg: 'bg-[#5EEAD4]/15',
        text: 'text-[#5EEAD4]',
        border: 'border-[#5EEAD4]/30',
      },
      Groceries: {
        bg: 'bg-[#2DD4BF]/15',
        text: 'text-[#2DD4BF]',
        border: 'border-[#2DD4BF]/30',
      },
      Utilities: {
        bg: 'bg-amber-400/15',
        text: 'text-amber-300',
        border: 'border-amber-400/30',
      },
      Income: {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
      },
      Transfer: {
        bg: 'bg-[#2DD4BF]/15',
        text: 'text-[#2DD4BF]',
        border: 'border-[#2DD4BF]/30',
      },
      Healthcare: {
        bg: 'bg-[#5EEAD4]/15',
        text: 'text-[#5EEAD4]',
        border: 'border-[#5EEAD4]/30',
      },
      Education: {
        bg: 'bg-[#FF9A6B]/15',
        text: 'text-[#FF9A6B]',
        border: 'border-[#FF9A6B]/30',
      },
      Investment: {
        bg: 'bg-[#FFB896]/15',
        text: 'text-[#FFB896]',
        border: 'border-[#FFB896]/30',
      },
      Other: {
        bg: 'bg-[#7B8494]/15',
        text: 'text-[#A3ABB8]',
        border: 'border-[#7B8494]/30',
      },
    };

    return mappings[cat] ?? { bg: 'bg-[#7B8494]/15', text: 'text-[#A3ABB8]', border: 'border-[#7B8494]/30' };
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
