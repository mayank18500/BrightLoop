import React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "../../utils/cn";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: string | number;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
  accentColor?: "blue" | "navy" | "green" | "amber" | "rose";
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  accentColor = "blue",
  className,
  onClick,
}) => {
  // Restrained accent styling for icons
  const accentStyles = {
    blue: "bg-[#EEF4FF] text-[#4169E1] border-[#D4E3FF]",
    navy: "bg-[#172554]/5 text-[#172554] border-[#172554]/10",
    green: "bg-[#E8F8F0] text-[#16A36A] border-[#D1F2E2]",
    amber: "bg-[#FEF7EC] text-[#E6A23C] border-[#FDEBD0]",
    rose: "bg-[#FDEEEE] text-[#DC5353] border-[#FACDCD]",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "card-surface p-5 relative overflow-hidden transition-all duration-200",
        onClick && "cursor-pointer hover:border-[#D1D5DB] hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#758096] uppercase tracking-wider">{title}</p>
          <div className="text-2xl lg:text-[28px] font-bold tracking-tight text-[#202938]">
            {value}
          </div>
        </div>
        <div
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform",
            accentStyles[accentColor]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(trend || subtitle) && (
        <div className="mt-4 pt-3 border-t border-[#F0F2F6] flex items-center justify-between text-xs">
          {trend && (
            <div className="flex items-center gap-1.5 font-medium">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold",
                  trend.direction === "up"
                    ? "bg-[#E8F8F0] text-[#16A36A]"
                    : trend.direction === "down"
                      ? "bg-[#FDEEEE] text-[#DC5353]"
                      : "bg-[#F4F5F7] text-[#758096]"
                )}
              >
                {trend.direction === "up" && <TrendingUp className="h-3 w-3" />}
                {trend.direction === "down" && <TrendingDown className="h-3 w-3" />}
                {trend.value}
              </span>
              <span className="text-[#758096] text-[11px]">{trend.label || "vs last month"}</span>
            </div>
          )}
          {subtitle && !trend && <span className="text-[#758096]">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
