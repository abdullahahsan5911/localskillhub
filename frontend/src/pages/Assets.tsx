import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import SearchFilterSection from "@/components/SearchFilterSection";
import { DISCOVERY_TAB_PATHS, DiscoveryTab } from "@/constants/discoveryTabs";
import api from "@/lib/api";
import AssetCard from "@/components/assets/AssetCard";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES } from "@/constants/categories";

type AssetSortOption = "Recommended" | "Top rated" | "Most downloaded" | "Newest";

const Assets = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeDiscoveryTab: DiscoveryTab = "Assets";
  const { user: currentUser } = useAuth();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const previewItemRefs = useRef<HTMLDivElement[]>([]);
  const [sortOption, setSortOption] = useState<AssetSortOption>("Recommended");

  const sortAssets = (list: any[], option: AssetSortOption) => {
    const getCreatedAtFromObjectId = (id?: string) => {
      if (!id || id.length < 8) return 0;
      const seconds = Number.parseInt(id.slice(0, 8), 16);
      return Number.isNaN(seconds) ? 0 : seconds * 1000;
    };

    const getTimestamp = (value?: string) => {
      if (!value) return 0;
      const ms = Date.parse(value);
      return Number.isNaN(ms) ? 0 : ms;
    };

    const onboardingInterests = Array.isArray(currentUser?.interests)
      ? currentUser.interests
      : [];

    const interestKeywords = onboardingInterests
      .map((interest) => {
        const category = CATEGORIES.find((cat) => cat.id === interest);
        if (!category) return [interest];
        return [category.id, category.name];
      })
      .flat()
      .map((value) => value.toLowerCase().replace(/[-_]/g, " "));

    const getInterestMatchScore = (asset: any) => {
      if (interestKeywords.length === 0) return 0;

      const haystack = [asset.title, asset.description, asset.category, ...(asset.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return interestKeywords.reduce((score, keyword) => {
        if (!keyword) return score;
        return haystack.includes(keyword) ? score + 1 : score;
      }, 0);
    };

    const sorted = [...list];
    sorted.sort((a, b) => {
      const ratingA = a.ratings?.average ?? 0;
      const ratingB = b.ratings?.average ?? 0;
      const downloadsA = a.downloads ?? 0;
      const downloadsB = b.downloads ?? 0;
      const ratingCountA = a.ratings?.count ?? 0;
      const ratingCountB = b.ratings?.count ?? 0;
      const createdAtA = getTimestamp(a.createdAt) || getCreatedAtFromObjectId(a._id);
      const createdAtB = getTimestamp(b.createdAt) || getCreatedAtFromObjectId(b._id);
      const interestScoreA = getInterestMatchScore(a);
      const interestScoreB = getInterestMatchScore(b);

      switch (option) {
        case "Top rated":
          return ratingB - ratingA || ratingCountB - ratingCountA || createdAtB - createdAtA;
        case "Most downloaded":
          return downloadsB - downloadsA || createdAtB - createdAtA || ratingB - ratingA;
        case "Newest":
          return createdAtB - createdAtA || downloadsB - downloadsA || ratingB - ratingA;
        case "Recommended":
        default:
          if (interestScoreA !== interestScoreB) {
            return interestScoreB - interestScoreA;
          }

          return ratingB - ratingA || downloadsB - downloadsA || createdAtB - createdAtA;
      }
    });

    return sorted;
  };

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const res = await api.getAssets({ q: search, category });
      const list = (res as any).data?.assets ?? (res as any).data ?? [];
      setAssets(sortAssets(list, sortOption));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setAssets((previous) => sortAssets(previous, sortOption));
  }, [sortOption, currentUser?.interests]);

  useEffect(() => { 
    const params = new URLSearchParams(location.search);
    const assetId = params.get("assetId");
    if (!assetId) return;

    const existing = assets.find((asset) => asset._id === assetId);
    if (existing) {
      setSelectedAsset(existing);
      return;
    }

    (async () => {
      try {
        const res = await api.getAsset(assetId);
        const asset = (res as any).data?.asset ?? (res as any).data;
        if (asset) {
          setSelectedAsset(asset);
        }
      } catch (error) {
        console.error(error);
      }
    })();
  }, [location.search, assets]);

  useEffect(() => {
    if (!selectedAsset) return;

    const params = new URLSearchParams(location.search);
    const indexParam = params.get("imageIndex");
    if (indexParam == null) return;

    const index = Number(indexParam);
    if (Number.isNaN(index)) return;

    const target = previewItemRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedAsset, location.search]);

  const handleDiscoveryTabChange = (tab: DiscoveryTab) => {
    const path = DISCOVERY_TAB_PATHS[tab];
    if (path) navigate(path);
  };

  const handleDownload = async (asset: any) => {
    try {
      const res = await api.downloadAsset(asset._id);
      const url = (res as any).data?.fileUrl;
      if (url) {
        const win = window.open(url, "_blank");
        if (!win) {
          alert("Please allow pop-ups or open the link manually to download this asset.");
        }
      } else {
        alert("Download link is not available for this asset.");
      }
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Unable to download this asset right now.");
    }
  };

  return (
    <Layout>
      <SearchFilterSection
        searchValue={search}
        onSearchChange={setSearch}
        onSearchSubmit={fetchAssets}
        activeDiscoveryTab={activeDiscoveryTab}
        onDiscoveryTabChange={handleDiscoveryTabChange}
        showDiscoveryTabs={true}
        showCategoryGrid={false}
        showFilterButton={false}
        showRecommended={true}
        recommendedOptions={["Recommended", "Top rated", "Most downloaded", "Newest"]}
        selectedRecommended={sortOption}
        onRecommendedChange={(value) => setSortOption(value as AssetSortOption)}
      />

      <section className="border-b border-gray-200 bg-white">
        <div className="w-full px-4 sm:px-6 py-12 flex flex-col items-center justify-center">
          <h1 className="text-4xl text-center md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
            Assets
          </h1>
          <p className="text-lg text-gray-600 max-w-xl text-center">
            Browse asset collections and resources from local freelancers.
          </p>
        </div>
      </section>

      
      <section className="py-10">
        <div className="w-full px-4 sm:px-6">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl border border-gray-200 bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center">
              <p className="text-lg text-gray-600 mb-1">No assets found yet.</p>
              <p className="text-sm text-gray-500">
                Try adjusting your search or check back as freelancers publish more resources.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {assets.map((asset) => (
                <AssetCard
                  key={asset._id}
                  asset={asset}
                  onClick={() => setSelectedAsset(asset)}
                  onDownload={() => handleDownload(asset)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {selectedAsset && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-2 sm:px-4"
          onClick={() => setSelectedAsset(null)}
        >
          <div
            className="relative flex h-[92vh] md:h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-[#FDE047] text-gray-900 shadow-2xl md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedAsset(null)}
              className="absolute right-3 top-3 z-30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-900/25 bg-white/70 text-gray-900 backdrop-blur-sm transition hover:bg-white md:hidden"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="order-2 md:order-1 flex min-h-0 flex-1 flex-col justify-between gap-4 sm:gap-6 overflow-y-auto md:overflow-visible p-4 pt-14 sm:p-8 md:p-10 md:pt-10">
              <div className="space-y-3 sm:space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-900/40 px-3 sm:px-4 py-1 text-[10px] sm:text-xs font-semibold tracking-[0.3em] uppercase">
                  <span>Asset Preview</span>
                </div>
                <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                  {selectedAsset.title}
                </h2>
                {selectedAsset.description && (
                  <p className="max-w-md text-xs sm:text-sm md:text-base text-gray-800/90">
                    {selectedAsset.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 text-[10px] sm:text-xs md:text-sm text-gray-900/80 max-w-md">
                <div>
                  <p className="font-semibold uppercase tracking-[0.2em] text-[0.55rem] sm:text-[0.65rem] mb-1">Creator</p>
                  <p className="truncate">{selectedAsset.ownerId?.name ?? "Local creator"}</p>
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-[0.2em] text-[0.55rem] sm:text-[0.65rem] mb-1">Access</p>
							<p>Free download</p>
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-[0.2em] text-[0.55rem] sm:text-[0.65rem] mb-1">Downloads</p>
                  <p>{selectedAsset.downloads || 0}</p>
                </div>
                <div>
                  <p className="font-semibold uppercase tracking-[0.2em] text-[0.55rem] sm:text-[0.65rem] mb-1">Rating</p>
                  <p>{selectedAsset.ratings?.average?.toFixed?.(1) || "New"}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDownload(selectedAsset)}
                  className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-black"
                >
                  Download Asset
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAsset(null)}
                  className="hidden md:inline-flex items-center justify-center rounded-full border border-gray-900/40 bg-transparent px-5 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-900/5"
                >
                  Close preview
                </button>
              </div>
            </div>

            <div className="order-1 relative h-[42vh] border-b border-black flex-1 bg-gray-900/5 flex md:hidden">
              {selectedAsset.previewImages && selectedAsset.previewImages.length > 0 ? (
                <div className="flex h-full w-full flex-col gap-3 overflow-y-auto p-3 scrollbar-custom snap-y snap-mandatory">
                  {selectedAsset.previewImages.map((src: string, index: number) => (
                    <div
                      key={src + index}
                      ref={(el) => {
                        if (el) previewItemRefs.current[index] = el;
                      }}
                      className="flex w-full min-h-[calc(42vh-1.5rem)] items-center justify-center snap-start"
                    >
                      <img
                        src={src}
                        alt={`${selectedAsset.title} preview ${index + 1}`}
                        className="max-h-full w-full h-auto object-contain shadow-lg"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-center text-sm font-semibold text-gray-500">
                  Preview image not available
                </div>
              )}
            </div>

            <div className="relative hidden border-l border-black h-full flex-1 bg-gray-900/5 md:flex">
              {selectedAsset.previewImages && selectedAsset.previewImages.length > 0 ? (
                <div className="flex h-full w-full flex-col gap-4 overflow-y-auto p-6 scrollbar-custom">
                  {selectedAsset.previewImages.map((src: string, index: number) => (
                    <div
                      key={src + index}
                      ref={(el) => {
                        if (el) previewItemRefs.current[index] = el;
                      }}
                      className="flex w-full items-center justify-center"
                    >
                      <img
                        src={src}
                        alt={`${selectedAsset.title} preview ${index + 1}`}
                        className="w-full h-auto object-contain shadow-lg"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-center text-sm font-semibold text-gray-500">
                  Preview image not available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Assets;
