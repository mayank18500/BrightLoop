import React from "react";
import { AlertTriangle, Info, HelpCircle } from "lucide-react";
import { cn } from "../../utils/cn";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "primary";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const iconConfig = {
    danger: {
      Icon: AlertTriangle,
      iconBg: "bg-[#FDEEEE] text-[#DC5353] border-[#FACDCD]",
      buttonBg: "bg-[#DC5353] hover:bg-[#C93B3B] text-white shadow-sm shadow-[#DC5353]/20",
    },
    warning: {
      Icon: AlertTriangle,
      iconBg: "bg-[#FEF7EC] text-[#E6A23C] border-[#FDEBD0]",
      buttonBg: "bg-[#E6A23C] hover:bg-[#D48F28] text-white shadow-sm shadow-[#E6A23C]/20",
    },
    info: {
      Icon: Info,
      iconBg: "bg-[#EEF5FD] text-[#4385DB] border-[#D7E8FC]",
      buttonBg: "bg-[#4385DB] hover:bg-[#3273C7] text-white shadow-sm shadow-[#4385DB]/20",
    },
    primary: {
      Icon: HelpCircle,
      iconBg: "bg-[#EEF4FF] text-[#4169E1] border-[#D4E3FF]",
      buttonBg: "bg-[#4169E1] hover:bg-[#3055C4] text-white shadow-sm shadow-[#4169E1]/20",
    },
  }[variant];

  const { Icon, iconBg, buttonBg } = iconConfig;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl border border-[#E8EAF0] shadow-xl p-6 overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border",
              iconBg
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="text-base font-semibold text-[#202938]">{title}</h3>
            <p className="text-xs text-[#758096] leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#F0F2F6] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-[#202938] bg-white border border-[#E8EAF0] hover:bg-[#F8F9FA] rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50",
              buttonBg
            )}
          >
            {isLoading && (
              <div className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
