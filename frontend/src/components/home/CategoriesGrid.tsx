import { Link } from "react-router-dom";
import { CATEGORIES } from "@/constants/categories";

// Show top 6 popular categories on homepage
const topCategories = [
  "web-development",
  "graphic-design", 
  "video-production",
  "digital-marketing",
  "photography",
  "content-writing"
];

const CategoriesGrid = () => {
  const displayCategories = CATEGORIES.filter(cat => topCategories.includes(cat.id));

  return (
    <section className="bg-foreground">
      <div className="container pb-20">
        <p className="text-center text-primary-foreground/40 text-sm mb-6">Browse Top Categories</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {displayCategories.map((cat) => {
            const Icon = cat.icon;
            
            return (
              <Link
                key={cat.id}
                to={`/browse?category=${cat.id}`}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden"
              >
                {cat.image ? (
                  <>
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        // Fallback to gradient if image fails
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div 
                      className="hidden absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                      style={{ 
                        background: `linear-gradient(135deg, ${cat.color} 0%, ${cat.lightColor} 100%)` 
                      }}
                    />
                  </>
                ) : (
                  <div 
                    className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                    style={{ 
                      background: `linear-gradient(135deg, ${cat.color} 0%, ${cat.lightColor} 100%)` 
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-foreground/60 group-hover:bg-foreground/50 transition-colors duration-300" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <Icon className="w-8 h-8 text-primary-foreground mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="text-sm font-semibold text-primary-foreground text-center">{cat.name}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoriesGrid;
