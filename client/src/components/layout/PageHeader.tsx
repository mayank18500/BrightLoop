import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  backHref,
  badge,
  actions,
  className,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8EAF0]",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {backHref && (
          <button
            type="button"
            onClick={() => navigate(backHref)}
            className="mt-1 p-1.5 rounded-xl border border-[#E8EAF0] bg-white text-[#758096] hover:text-[#202938] hover:bg-[#F8F9FA] transition cursor-pointer shadow-sm"
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-[#202938]">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[#758096] max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
    </div>
  );
};
