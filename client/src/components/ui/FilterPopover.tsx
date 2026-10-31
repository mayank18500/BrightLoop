import React, { useState, useRef, useEffect } from "react";
import { Filter, Check, ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterPopoverProps {
  label: string;
  options: FilterOption[];
  selectedId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const FilterPopover: React.FC<FilterPopoverProps> = ({
  label,
  options,
  selectedId,
  onChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const activeOption = options.find((opt) => opt.id === selectedId);

  return (
    <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer",
          selectedId !== "ALL" && selectedId !== ""
            ? "bg-[#EEF4FF] text-[#4169E1] border-[#D4E3FF]"
            : "bg-white text-[#202938] border-[#E8EAF0] hover:bg-[#F8F9FA] hover:border-[#D1D5DB]"
        )}
      >
        <Filter className="h-3.5 w-3.5 text-current shrink-0" />
        <span>
          {label}: <strong className="font-semibold">{activeOption?.label || "All"}</strong>
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-[#758096] transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-56 rounded-xl bg-white border border-[#E8EAF0] shadow-lg z-50 py-1 divide-y divide-[#F0F2F6] animate-in fade-in zoom-in-95 duration-100">
          <div className="p-1">
            {options.map((option) => {
              const isSelected = option.id === selectedId;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer text-left",
                    isSelected
                      ? "bg-[#EEF4FF] text-[#4169E1] font-semibold"
                      : "text-[#202938] hover:bg-[#F4F5F7]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <Check className="h-3.5 w-3.5 text-[#4169E1]" />
                    ) : (
                      <span className="w-3.5" />
                    )}
                    <span>{option.label}</span>
                  </div>
                  {option.count !== undefined && (
                    <span className="text-[11px] font-normal text-[#758096] px-1.5 py-0.5 rounded bg-[#F4F5F7]">
                      {option.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
