import React from "react";
import { LucideIcon, Plus } from "lucide-react";
import { cn } from "../../utils/cn";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        "card-surface p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto",
        className
      )}
    >
      <div className="h-14 w-14 rounded-2xl bg-[#EEF4FF] border border-[#D4E3FF] text-[#4169E1] flex items-center justify-center mb-4 shadow-sm">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-[#202938] mb-1">{title}</h3>
      <p className="text-xs text-[#758096] max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#4169E1] hover:bg-[#3055C4] rounded-xl shadow-sm shadow-[#4169E1]/20 transition-all cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
