import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "../../utils/cn";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  shortcut?: string;
  wrapperClassName?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  shortcut,
  wrapperClassName,
  className,
  ...props
}) => {
  return (
    <div className={cn("relative flex items-center", wrapperClassName)}>
      <Search className="absolute left-3.5 h-4 w-4 text-[#758096] pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-white border border-[#E8EAF0] rounded-xl text-[#202938] placeholder:text-[#9CA3AF]",
          "focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#EEF4FF] transition-all",
          className
        )}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            onClear?.();
          }}
          className="absolute right-3 p-0.5 rounded-md text-[#9CA3AF] hover:text-[#202938] hover:bg-[#F4F5F7] transition cursor-pointer"
          title="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : shortcut ? (
        <kbd className="hidden sm:inline-flex absolute right-3 items-center px-1.5 py-0.5 text-[10px] font-mono text-[#758096] bg-[#F4F5F7] border border-[#E8EAF0] rounded">
          {shortcut}
        </kbd>
      ) : null}
    </div>
  );
};
