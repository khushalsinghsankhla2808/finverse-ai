import React from 'react';
import { cn } from '@/lib/utils';
import { renderCategoryIcon } from '@/lib/categoryIcons';

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className }) => {
  const getBadgeStyles = (cat: string) => {
    switch (cat) {
      case 'Income':
      case 'Salary':
        return 'bg-gain/10 text-gain border-gain/20';
      case 'Expense':
      case 'Healthcare':
      case 'Medical':
        return 'bg-loss/10 text-loss border-loss/20';
      case 'Savings':
      case 'Emergency':
      case 'Investment':
      case 'Investments':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border select-none',
        getBadgeStyles(category),
        className
      )}
    >
      {renderCategoryIcon(category, { className: 'w-3 h-3 mr-1 shrink-0' })}
      <span>{category}</span>
    </span>
  );
};

export default CategoryBadge;
