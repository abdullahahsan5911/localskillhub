import React from "react";

interface FeaturedRibbonProps {
  shortLabel?: string;
  tier?: number;
  localScore?: number;
  featuredSince?: string | null;
  showOnHover?: boolean;
  showTooltip?: boolean;
  containerClassName?: string;
  tooltipClassName?: string;
  title?: string;
  subtitle?: string;
}

const FeaturedRibbon: React.FC<FeaturedRibbonProps> = ({
  shortLabel = "Pd",
  tier,
  localScore,
  featuredSince,
  showOnHover = false,
  showTooltip = true,
  containerClassName = "",
  tooltipClassName = "",
  title = "Featured In",
  subtitle = "Visualization",
}) => {
  const hoverVisibility = showOnHover
    ? "opacity-0 transition-opacity duration-200 group-hover:opacity-100"
    : "";

  return (
    <div className={`${containerClassName} ${hoverVisibility}`.trim()}>
      <div
        className="w-8 h-14 bg-[#b89a56] text-white text-[11px] font-bold flex items-center justify-center shadow-sm mx-auto"
        style={{
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 70%, 0 100%)"
        }}
      >
        {shortLabel}
      </div>
      {typeof tier === "number" && (
        <div className="mt-1 text-center text-[11px] font-semibold text-[#8f7339]">
          {tier}
        </div>
      )}

      {showTooltip && (
        <div className={` rounded-xl border border-gray-200 bg-white p-3 shadow-lg opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none ${tooltipClassName}`.trim()}>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
          <p className="mt-1 text-[12px] font-semibold text-blue-600">{subtitle}</p>
          {(typeof tier === "number" || typeof localScore === "number" || featuredSince) && (
            <div className="mt-2 space-y-1 text-[10px] text-gray-600">
              {typeof tier === "number" && (
                <p><span className="font-medium text-gray-700">Badge Tier:</span> {tier}/5</p>
              )}
              {typeof localScore === "number" && (
                <p><span className="font-medium text-gray-700">Local Score:</span> {localScore}</p>
              )}
              {featuredSince && (
                <p><span className="font-medium text-gray-700">Featured Since:</span> {featuredSince}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeaturedRibbon;
