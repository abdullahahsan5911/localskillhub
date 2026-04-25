import React from "react";
import { X } from "lucide-react";
import { getToolIcon } from "@/constants/tools";

interface ToolBadgeListProps {
  tools: string[];
  limit?: number;
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
  labelClassName?: string;
  onRemove?: (index: number) => void;
  removeButtonClassName?: string;
}

export const ToolBadgeList: React.FC<ToolBadgeListProps> = ({
  tools,
  limit,
  className,
  itemClassName,
  iconClassName,
  labelClassName,
  onRemove,
  removeButtonClassName,
}) => {
  const items = typeof limit === "number" ? tools.slice(0, limit) : tools;

  if (!items.length) return null;

  return (
    <div className={className || "flex flex-wrap gap-2"}>
      {items.map((tool, index) => {
        const ToolIcon = getToolIcon(tool);
        return (
          <span
            key={`${tool}-${index}`}
            className={
              itemClassName ||
              "flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs sm:text-sm text-slate-700"
            }
          >
            <ToolIcon className={iconClassName || "w-3.5 h-3.5 text-slate-500"} />
            <span className={labelClassName || "font-semibold truncate"}>{tool}</span>
            {onRemove && (
              <button
                type="button"
                className={
                  removeButtonClassName ||
                  "w-4 h-4 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-rose-500 transition-colors shrink-0"
                }
                onClick={() => onRemove(index)}
              >
                <X size={9} />
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
};
