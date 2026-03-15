import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import SearchFilterSection from "@/components/SearchFilterSection";
import { DISCOVERY_TAB_PATHS, DiscoveryTab } from "@/constants/discoveryTabs";
import api from "@/lib/api";
import { UserHoverCard, UserHoverCardData } from "@/components/UserHoverCard";

interface ImageItem {
  id: string;
  assetId: string;
  imageUrl: string;
  imageIndex: number;
  title?: string;
  ownerName?: string;
  ownerId?: string;
  price?: number;
  downloads?: number;
  rating?: number;
}

const Images = () => {
  const navigate = useNavigate();
  const activeDiscoveryTab: DiscoveryTab = "Images";

  const [search, setSearch] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDiscoveryTabChange = (tab: DiscoveryTab) => {
    const path = DISCOVERY_TAB_PATHS[tab];
    if (path) navigate(path);
  };

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await api.getAssets({ q: search });
      const assetList = (res as any).data?.assets ?? (res as any).data ?? [];

      const flattened: ImageItem[] = [];
      assetList.forEach((asset: any) => {
        (asset.previewImages || []).forEach((url: string, index: number) => {
          flattened.push({
            id: `${asset._id}-${index}`,
            assetId: asset._id,
            imageUrl: url,
            imageIndex: index,
            title: asset.title,
            ownerName: asset.ownerId?.name,
            ownerId: asset.ownerId?._id,
            price: asset.price,
            downloads: asset.downloads,
            rating: asset.ratings?.average,
          });
        });
      });

      setImages(flattened);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageClick = (item: ImageItem) => {
    navigate(`/assets?assetId=${item.assetId}&imageIndex=${item.imageIndex}`);
  };

  return (
    <Layout>
      <section className="border-b border-gray-200 bg-white">
        <div className="w-full px-4 sm:px-6 py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
            Images
          </h1>
          <p className="text-lg text-gray-600 max-w-xl">
            Explore image-based portfolio items.
          </p>
        </div>
      </section>

      <SearchFilterSection
        searchValue={search}
        onSearchChange={setSearch}
        onSearchSubmit={fetchImages}
        activeDiscoveryTab={activeDiscoveryTab}
        onDiscoveryTabChange={handleDiscoveryTabChange}
        showDiscoveryTabs={true}
        showCategoryGrid={false}
      />

      <section className="py-10">
        <div className="w-full px-4 sm:px-6">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl border border-gray-200 bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center">
              <p className="text-lg text-gray-600 mb-1">No images found yet.</p>
              <p className="text-sm text-gray-500">
                Try adjusting your search or check back as creators publish more visual work.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {images.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleImageClick(item)}
                  className="group text-left"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100">
                    <img
                      src={item.imageUrl}
                      alt={item.title || "Asset preview"}
                      className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs text-gray-500">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {item.title || "Untitled asset"}
                      </p>
                      {item.ownerName && item.ownerId ? (
                        <UserHoverCard 
                          user={{
                            id: item.ownerId,
                            name: item.ownerName,
                            rating: item.rating,
                            projectImages: item.imageUrl ? [item.imageUrl] : undefined, 
                          } as UserHoverCardData}
                        >
                          <p className="truncate">{item.ownerName}</p>
                        </UserHoverCard>
                      ) : item.ownerName ? (
                        <p className="truncate">{item.ownerName}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {item.price !== undefined && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                          {!item.price || item.price === 0 ? "Free" : `₹${item.price}`}
                        </span>
                      )}
                      {item.downloads !== undefined && (
                        <span className="text-[11px]">{item.downloads} downloads</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Images;
