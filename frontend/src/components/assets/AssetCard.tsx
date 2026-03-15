import { Star } from "lucide-react";
import { UserHoverCard, UserHoverCardData } from "@/components/UserHoverCard";

interface AssetCardProps {
  asset: any;
  onDownload?: () => void;
  onClick?: () => void;
}

const AssetCard = ({ asset, onDownload, onClick }: AssetCardProps) => {
  const preview = asset.previewImages?.[0];
  const isFree = !asset.price || asset.price === 0;

  return (
    <div
      className="group rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {preview ? (
          <img
            src={preview}
            alt={asset.title}
            className="h-auto w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
            No preview
          </div>
        )}
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">{asset.title}</h3>
            {asset.ownerId?.name && asset.ownerId?._id ? (
              <UserHoverCard
                user={{
                  id: asset.ownerId._id,
                  name: asset.ownerId.name,
                  avatarUrl: asset.ownerId.avatar,
                  role: "Creator",
                  projectImages: preview ? [preview] : undefined,
                } as UserHoverCardData}
              >
                <p className="mt-0.5 text-xs text-gray-500 hover:text-black hover:underline hover:font-bold">by {asset.ownerId.name}</p>
              </UserHoverCard>
            ) : asset.ownerId?.name ? (
              <p className="mt-0.5 text-xs text-gray-500">by {asset.ownerId.name}</p>
            ) : null}
          </div>
          <div className="text-right text-sm font-semibold text-gray-900">
            {isFree ? "Free" : `₹${asset.price}`}
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{asset.ratings?.average?.toFixed?.(1) || "New"}</span>
            {asset.ratings?.count ? <span className="text-gray-400">({asset.ratings.count})</span> : null}
          </div>
          <span>{asset.downloads || 0} downloads</span>
        </div>
        {/* <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDownload?.();
          }}
          className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-black"
        >
          {isFree ? "Download" : "Buy & Download"}
        </button> */}
      </div>
    </div>
  );
};

export default AssetCard;
