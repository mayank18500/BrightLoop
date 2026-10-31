import React from "react";
import { cn } from "../../utils/cn";

export type StatusVariant =
  | "DRAFT"
  | "SENT"
  | "CONFIRMED"
  | "ACTIVE"
  | "PAUSED"
  | "CLOSED"
  | "PAID"
  | "CANCELLED"
  | "OVERDUE"
  | "ACCEPTED"
  | "EXPIRED"
  | "PARTIAL"
  | "PENDING"
  | "SUCCESS"
  | "WARNING"
  | "DANGER"
  | "INFO"
  | string;

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = "md",
  dot = true,
  className,
}) => {
  const normalized = (status || "").toUpperCase();

  // Map status to subtle semantic styling
  const getBadgeStyle = (): {
    bg: string;
    text: string;
    border: string;
    dotColor: string;
    displayLabel: string;
  } => {
    switch (normalized) {
      case "ACTIVE":
      case "PAID":
      case "ACCEPTED":
      case "SUCCESS":
        return {
          bg: "bg-[#E8F8F0]",
          text: "text-[#16A36A]",
          border: "border-[#D1F2E2]",
          dotColor: "bg-[#16A36A]",
          displayLabel: label || (normalized === "PAID" ? "Paid" : "Active"),
        };

      case "CONFIRMED":
        return {
          bg: "bg-[#EEF4FF]",
          text: "text-[#4169E1]",
          border: "border-[#D4E3FF]",
          dotColor: "bg-[#4169E1]",
          displayLabel: label || "Confirmed",
        };

      case "SENT":
      case "PENDING":
      case "PARTIAL":
        return {
          bg: "bg-[#EEF5FD]",
          text: "text-[#4385DB]",
          border: "border-[#D7E8FC]",
          dotColor: "bg-[#4385DB]",
          displayLabel: label || (normalized === "SENT" ? "Sent" : "Pending"),
        };

      case "DRAFT":
        return {
          bg: "bg-[#F4F5F7]",
          text: "text-[#758096]",
          border: "border-[#E8EAF0]",
          dotColor: "bg-[#9CA3AF]",
          displayLabel: label || "Draft",
        };

      case "PAUSED":
      case "WARNING":
        return {
          bg: "bg-[#FEF7EC]",
          text: "text-[#E6A23C]",
          border: "border-[#FDEBD0]",
          dotColor: "bg-[#E6A23C]",
          displayLabel: label || "Paused",
        };

      case "OVERDUE":
      case "EXPIRED":
      case "CANCELLED":
      case "CLOSED":
      case "DANGER":
        return {
          bg: "bg-[#FDEEEE]",
          text: "text-[#DC5353]",
          border: "border-[#FACDCD]",
          dotColor: "bg-[#DC5353]",
          displayLabel:
            label ||
            (normalized === "OVERDUE"
              ? "Overdue"
              : normalized === "EXPIRED"
                ? "Expired"
                : normalized === "CANCELLED"
                  ? "Cancelled"
                  : "Closed"),
        };

      default:
        return {
          bg: "bg-[#F4F5F7]",
          text: "text-[#202938]",
          border: "border-[#E8EAF0]",
          dotColor: "bg-[#758096]",
          displayLabel: label || status,
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border rounded-full transition-colors",
        style.bg,
        style.text,
        style.border,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", style.dotColor)} />}
      <span>{style.displayLabel}</span>
    </span>
  );
};
