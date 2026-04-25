import React from "react";

export interface PanelProps {
  id?: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({ id, title, icon, children }) => (
  <section
    id={id}
    className="rounded-lg sm:rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
  >
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
        {icon}
      </div>
      <p className="text-xs sm:text-sm font-semibold text-slate-900">{title}</p>
    </div>
    <div className="px-3 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-5">{children}</div>
  </section>
);
