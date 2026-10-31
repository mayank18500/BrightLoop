import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

export interface DateRangePickerProps {
  selectedRange?: string;
  onChange?: (range: string) => void;
  className?: string;
}

const PRESETS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "this_month", label: "This Month" },
  { id: "last_month", label: "Last Month" },
  { id: "this_year", label: "This Year (YTD)" },
  { id: "all", label: "All Time" },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  selectedRange = "30d",
  onChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const currentLabel = PRESETS.find((p) => p.id === selectedRange)?.label || "Last 30 Days";

  return (
    <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-white text-[#202938] border border-[#E8EAF0] rounded-xl hover:bg-[#F8F9FA] hover:border-[#D1D5DB] transition-all cursor-pointer shadow-sm"
      >
        <Calendar className="h-3.5 w-3.5 text-[#758096]" />
        <span>{currentLabel}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-[#758096] transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white border border-[#E8EAF0] shadow-lg z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-[#758096] uppercase tracking-wider border-b border-[#F0F2F6]">
            Period Range
          </div>
          <div className="p-1">
            {PRESETS.map((preset) => {
              const isSelected = preset.id === selectedRange;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    onChange?.(preset.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer",
                    isSelected
                      ? "bg-[#EEF4FF] text-[#4169E1] font-semibold"
                      : "text-[#202938] hover:bg-[#F4F5F7]"
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
