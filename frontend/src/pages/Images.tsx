import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import SearchFilterSection from "@/components/SearchFilterSection";
import { DISCOVERY_TAB_PATHS, DiscoveryTab } from "@/constants/discoveryTabs";

const Images = () => {
  const navigate = useNavigate();
  const activeDiscoveryTab: DiscoveryTab = "Images";

  const handleDiscoveryTabChange = (tab: DiscoveryTab) => {
    const path = DISCOVERY_TAB_PATHS[tab];
    if (path) navigate(path);
  };
  return (
    <Layout>
      <section className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
            Images
          </h1>
          <p className="text-lg text-gray-600 max-w-xl">
            Explore image-based portfolio items.
          </p>
        </div>
      </section>

      <SearchFilterSection
        searchValue=""
        onSearchChange={() => {}}
        onSearchSubmit={() => {}}
        activeDiscoveryTab={activeDiscoveryTab}
        onDiscoveryTabChange={handleDiscoveryTabChange}
        showDiscoveryTabs={true}
        showCategoryGrid={false}
      />

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-lg text-gray-600">
              This is the Images page. Implement the content for Images here.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Images;
