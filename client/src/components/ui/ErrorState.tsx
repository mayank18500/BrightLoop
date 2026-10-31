import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "../../utils/cn";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Failed to load information",
  message = "An unexpected error occurred while communicating with the server. Please try again.",
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        "card-surface p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto border-[#FACDCD]",
        className
      )}
    >
      <div className="h-12 w-12 rounded-2xl bg-[#FDEEEE] border border-[#FACDCD] text-[#DC5353] flex items-center justify-center mb-3.5 shadow-sm">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-[#202938] mb-1">{title}</h3>
      <p className="text-xs text-[#758096] mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-[#202938] bg-white border border-[#E8EAF0] hover:bg-[#F8F9FA] rounded-xl transition cursor-pointer shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5 text-[#758096]" />
          Retry Request
        </button>
      )}
    </div>
  );
};
