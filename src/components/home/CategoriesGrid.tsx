import { Link } from "react-router-dom";

import webDesignImg from "@/assets/categories/web-design.jpg";
import graphicDesignImg from "@/assets/categories/graphic-design.jpg";
import videoProductionImg from "@/assets/categories/video-production.jpg";
import digitalMarketingImg from "@/assets/categories/digital-marketing.jpg";
import photographyImg from "@/assets/categories/photography.jpg";
import contentWritingImg from "@/assets/categories/content-writing.jpg";

const categories = [
  { name: "Web Development", image: webDesignImg },
  { name: "Graphic Design", image: graphicDesignImg },
  { name: "Video Production", image: videoProductionImg },
  { name: "Digital Marketing", image: digitalMarketingImg },
  { name: "Photography", image: photographyImg },
  { name: "Content Writing", image: contentWritingImg },
];

const CategoriesGrid = () => {
  return (
    <section className="bg-foreground">
      <div className="container pb-20">
        <p className="text-center text-primary-foreground/40 text-sm mb-6">Browse Top Categories</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to="/browse"
              className="group relative aspect-[4/3] rounded-xl overflow-hidden"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-foreground/60 group-hover:bg-foreground/50 transition-colors duration-300" />
              <div className="absolute bottom-0 left-0 p-4">
                <h3 className="text-sm font-semibold text-primary-foreground">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesGrid;
