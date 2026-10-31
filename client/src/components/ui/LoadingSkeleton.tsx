import React from "react";
import { cn } from "../../utils/cn";

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return <div className={cn("rounded-lg animate-shimmer", className)} />;
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="card-surface overflow-hidden">
      <div className="p-4 border-b border-[#E8EAF0] flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="divide-y divide-[#F0F2F6]">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-4 flex items-center gap-4">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <Skeleton
                key={cIdx}
                className={cn("h-4", cIdx === 0 ? "w-48" : cIdx === 1 ? "w-32" : "w-24 flex-1")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const StatCardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="card-surface p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-32" />
          <div className="pt-2 border-t border-[#F0F2F6]">
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  );
};
