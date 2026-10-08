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
        return 'bg-green-positive/10 text-green-positive border-green-positive/20';
      case 'Expense':
      case 'Healthcare':
      case 'Medical':
        return 'bg-red-negative/10 text-red-negative border-red-negative/20';
      case 'Savings':
      case 'Emergency':
      case 'Investment':
      case 'Investments':
        return 'bg-gold-savings/10 text-gold-savings border-gold-savings/20';
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
