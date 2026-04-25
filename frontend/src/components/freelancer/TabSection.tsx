import React from "react";
import { PortfolioTab, AssetsTab } from "../../pages/FreelancerDashboard";
import type { FreelancerProfile, AssetItem } from "../../pages/freelancer-dashboard/types";

// Tab configuration
const TABS = [
  { id: "profile", label: "Profile" },
  { id: "portfolio", label: "Portfolio" },
  { id: "assets", label: "Assets" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

interface TabSectionProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  profile: FreelancerProfile | null;
  assets: AssetItem[];
  loading: boolean;
  user: any;
  onRefresh: () => void;
  renderProfileSettings: () => React.ReactNode;
}

/**
 * TabSection Component
 * 
 * Manages tab navigation, rendering, and content switching for freelancer profile.
 * Handles Profile, Portfolio, and Assets tabs with smooth scrolling to content.
 */
export const TabSection: React.FC<TabSectionProps> = ({
  activeTab,
  onTabChange,
  profile,
  assets,
  loading,
  renderProfileSettings,
}) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileSettings();
      case "portfolio":
        return (
          <div id="freelancer-portfolio-section" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
            <PortfolioTab profile={profile} onRefresh={() => {}} />
          </div>
        );
      case "assets":
        return (
          <div id="freelancer-assets-section" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
            <AssetsTab assets={assets} onRefresh={() => {}} />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Content */}
      {renderTabContent()}

      {/* Tab Navigation */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-4 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
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
    </div>
  );
};
