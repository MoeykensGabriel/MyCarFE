import React from "react";
import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  Icon: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, Icon, actions }: PageHeaderProps) {
  return (
    <div className="bg-white rounded-xl border border-[#c4c6cd] border-l-4 border-l-[#041627] shadow-sm p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center text-[#041627] shrink-0 shadow-inner">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-none">
            {title}
          </h1>
          {subtitle && (
            <div className="text-xs md:text-sm text-slate-500 font-semibold mt-2 leading-none flex items-center gap-1">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {actions && (
        <div className="shrink-0 flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
