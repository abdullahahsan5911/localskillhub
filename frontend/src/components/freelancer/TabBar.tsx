import React from "react";

// Re-export tab types
export type TabId = "profile" | "skills" | "education" | "certificates" | "portfolio" | "assets";

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  loading: boolean;
}

const TAB_CONFIG = [
  { id: "profile", label: "Profile" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "certificates", label: "Certificates" },
  { id: "portfolio", label: "Showcase Your Work" },
  { id: "assets", label: "Assets" },
] as const;

/**
 * TabBar Component
 * 
 * Reusable tab navigation bar for freelancer profile section.
 * Displays tabs and loading indicator at the bottom of content.
 * 
 * Usage:
 * ```tsx
 * <TabBar activeTab={activeTab} onTabChange={setActiveTab} loading={loading} />
 * ```
 */
export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange, loading }) => {
  return (
    <>
      {/* Tab Navigation */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-4 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {TAB_CONFIG.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-t-md border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && <p className="text-xs sm:text-sm text-slate-500">Refreshing profile…</p>}
    </>
  );
};
