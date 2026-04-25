import { CATEGORIES } from "@/constants/categories";

interface VisualCategoryItem {
  id: string;
  title: string;
  image: string;
  color: string;
  icon: any;
}

interface VisualCategoryGridProps {
  activeId?: string;
  onSelect?: (id: string) => void;
}

export const visualCategoryItems: VisualCategoryItem[] = CATEGORIES.map(
  (category) => ({
    id: category.id,
    title: category.name,
    image: category.image || "",
    color: category.color,
    icon: category.icon,
  })
);

const VisualCategoryGrid = ({ activeId, onSelect }: VisualCategoryGridProps) => {
  return (
    <section className="w-full">
      {/* Horizontal Scroll */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 sm:gap-3 min-w-max px-1 sm:px-2 py-2">
          {visualCategoryItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                onClick={() => onSelect?.(item.id)}
                className={`relative flex items-center gap-1 sm:gap-2 h-9 sm:h-10 px-3 sm:px-4 rounded-xl overflow-hidden border transition-all duration-300
                ${isActive ? "border-black" : "border-gray-200 hover:border-gray-400"}`}
              >
                {/* Background image */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50"></div>
                {/* Content */}
                <div className="relative flex items-center gap-1 sm:gap-2 text-white">
                  {Icon && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                    {item.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default VisualCategoryGrid;