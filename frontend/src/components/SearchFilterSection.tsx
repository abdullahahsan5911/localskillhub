import { FiSearch, FiSliders, FiImage, FiLayers, FiChevronDown } from "react-icons/fi";
import VisualCategoryGrid from "./VisualCategoryGrid";
import { DISCOVERY_TABS, DiscoveryTab } from "@/constants/discoveryTabs";

interface SearchFilterSectionProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  activeDiscoveryTab?: DiscoveryTab;
  onDiscoveryTabChange?: (tab: DiscoveryTab) => void;
  selectedCategoryId?: string;
  onCategorySelect?: (categoryId: string) => void;
  showDiscoveryTabs?: boolean;
  showCategoryGrid?: boolean;
  }

const SearchFilterSection = ({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  activeDiscoveryTab,
  onDiscoveryTabChange,
  selectedCategoryId,
  onCategorySelect,
  showDiscoveryTabs = true,
  showCategoryGrid = true,
 
}: SearchFilterSectionProps) => {
  return (
    <section className="sticky top-16 z-40 border-y border-gray-200 bg-white/95 backdrop-blur-md">
      <div className="w-full px-4 sm:px-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-gray-300 px-5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50">
            <FiSliders className="h-4 w-4" />
            Filter
          </button>

          <div className="flex-1 rounded-full border border-gray-300 bg-white px-5">
            <div className="flex flex-col gap-3 py-2 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <FiSearch className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Behance-style categories, freelancers, or services..."
                  className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-500"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSearchSubmit()}
                />
              </div>

              {showDiscoveryTabs && (
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide border-t border-gray-200 pt-2 lg:border-t-0 lg:border-l lg:pl-4 lg:pt-0">
                  {DISCOVERY_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => onDiscoveryTabChange?.(tab)}
                      className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                        activeDiscoveryTab === tab
                          ? "bg-black text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                    aria-label="Toggle image discovery"
                  >
                    <FiImage className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold text-gray-900 transition-colors hover:text-black xl:px-2">
            <FiLayers className="h-4 w-4" />
            Recommended
            <FiChevronDown className="h-4 w-4" />
          </button>
        </div>

        {showCategoryGrid && (
          <div>
            <VisualCategoryGrid 
              activeId={selectedCategoryId} 
              onSelect={onCategorySelect} 
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchFilterSection;
