import React from "react";
import { cn } from "../../utils/cn";

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}) => {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="block text-xs font-semibold text-[#202938]">
          {label}
          {required && <span className="text-[#DC5353] ml-1">*</span>}
        </label>
        {hint && <span className="text-[11px] text-[#758096]">{hint}</span>}
      </div>
      <div>{children}</div>
      {error && <p className="text-[11px] text-[#DC5353] font-medium mt-1">{error}</p>}
    </div>
  );
};
