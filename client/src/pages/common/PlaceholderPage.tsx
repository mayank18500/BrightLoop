import React from "react";
import { LucideIcon, Sparkles, Layers } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";

export interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  module: string;
  icon?: LucideIcon;
  badge?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  subtitle,
  module,
  icon: Icon = Layers,
  badge = "Configured",
}) => {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        badge={
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EEF4FF] text-[#4169E1] border border-[#D4E3FF]">
            {badge}
          </span>
        }
      />

      <div className="card-surface p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-[#EEF4FF] text-[#4169E1] border border-[#D4E3FF] flex items-center justify-center shadow-sm">
          <Icon className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#202938]">{title}</h3>
          <p className="text-xs text-[#758096] max-w-md mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="pt-4 flex items-center gap-2 text-xs font-medium text-[#4169E1] bg-[#FAFBFD] px-4 py-2 rounded-xl border border-[#E8EAF0]">
          <Sparkles className="h-4 w-4" />
          <span>Module '{module}' is ready for Phase 2–9 full integration.</span>
        </div>
      </div>
    </div>
  );
};
