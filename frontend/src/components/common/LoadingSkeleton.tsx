import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-shimmer rounded bg-white/5 border border-white/5',
        className
      )}
    />
  );
};

export default LoadingSkeleton;
