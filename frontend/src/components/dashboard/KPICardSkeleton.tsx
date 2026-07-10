import React from 'react';
import LoadingSkeleton from '../common/LoadingSkeleton';

export const KPICardSkeleton: React.FC = () => {
  return (
    <div className="glassmorphism rounded-2xl p-5 border border-white/8 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <LoadingSkeleton className="h-4 w-24" />
        <LoadingSkeleton className="h-10 w-10 rounded-full" />
      </div>
      <LoadingSkeleton className="h-8 w-36" />
      <LoadingSkeleton className="h-4 w-48" />
    </div>
  );
};

export default KPICardSkeleton;
