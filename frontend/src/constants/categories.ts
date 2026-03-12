import {
  Palette, Pen, Sparkles, LayoutGrid, Type, Printer, Package,
  Video, Film, Clapperboard, Scissors, Box,
  Camera, User, ShoppingBag, Calendar,
  Code, Smartphone, Monitor, Server, Database,
  FileText, PenTool, TrendingUp, BarChart, Search,
  Shirt, Home, Building, Brush, Wrench, Gamepad2, Music, Mic
} from "lucide-react";

export interface Category {
  id: string;
  name: string;
  icon: any;
  image?: string;
    color: string;
  lightColor: string;
}

const categoryAsset = (fileName: string) => `/assets/categories/${fileName}.svg`;

export const CATEGORIES: Category[] = [
  // Design & Visual Arts
  {
    id: "graphic-design",
    name: "Graphic Design",
    icon: Palette,
    image: categoryAsset("graphic-design"),
    color: "#8B5CF6",
    lightColor: "#EDE9FE"
  },
  {
    id: "ui-ux-design",
    name: "UI/UX Design",
    icon: LayoutGrid,
    image: categoryAsset("ui-ux-design"),
    color: "#3B82F6",
    lightColor: "#DBEAFE"
  },
  {
    id: "illustration",
    name: "Illustration",
    icon: Pen,
    image: categoryAsset("illustration"),
    color: "#EC4899",
    lightColor: "#FCE7F3"
  },
  {
    id: "branding-identity",
    name: "Branding & Identity",
    icon: Sparkles,
    image: categoryAsset("branding"),
    color: "#F59E0B",
    lightColor: "#FEF3C7"
  },
  {
    id: "logo-design",
    name: "Logo Design",
    icon: Sparkles,
    image: categoryAsset("logo-design"),
    color: "#10B981",
    lightColor: "#D1FAE5"
  },
  {
    id: "typography",
    name: "Typography",
    icon: Type,
    image: categoryAsset("typography"),
    color: "#6366F1",
    lightColor: "#E0E7FF"
  },
  {
    id: "print-design",
    name: "Print Design",
    icon: Printer,
    image: categoryAsset("print-design"),
    color: "#8B5CF6",
    lightColor: "#EDE9FE"
  },
  {
    id: "packaging-design",
    name: "Packaging Design",
    icon: Package,
    image: categoryAsset("packaging"),
    color: "#14B8A6",
    lightColor: "#CCFBF1"
  },

  // Motion & Video
  {
    id: "video-production",
    name: "Video Production",
    icon: Video,
    image: categoryAsset("video-production"),
    color: "#EF4444",
    lightColor: "#FEE2E2"
  },
  {
    id: "animation",
    name: "Animation",
    icon: Film,
    image: categoryAsset("animation"),
    color: "#F59E0B",
    lightColor: "#FEF3C7"
  },
  {
    id: "motion-graphics",
    name: "Motion Graphics",
    icon: Clapperboard,
    image: categoryAsset("motion-graphics"),
    color: "#8B5CF6",
    lightColor: "#EDE9FE"
  },
  {
    id: "video-editing",
    name: "Video Editing",
    icon: Scissors,
    image: categoryAsset("video-editing"),
    color: "#3B82F6",
    lightColor: "#DBEAFE"
  },
  {
    id: "3d-animation",
    name: "3D Animation",
    icon: Box,
    image: categoryAsset("3d-animation"),
    color: "#EC4899",
    lightColor: "#FCE7F3"
  },

  // Photography
  {
    id: "photography",
    name: "Photography",
    icon: Camera,
    image: categoryAsset("photography"),
    color: "#06B6D4",
    lightColor: "#CFFAFE"
  },
  {
    id: "portrait-photography",
    name: "Portrait Photography",
    icon: User,
    image: categoryAsset("portrait"),
    color: "#F59E0B",
    lightColor: "#FEF3C7"
  },
  {
    id: "product-photography",
    name: "Product Photography",
    icon: ShoppingBag,
    image: categoryAsset("product-photo"),
    color: "#10B981",
    lightColor: "#D1FAE5"
  },
  {
    id: "event-photography",
    name: "Event Photography",
    icon: Calendar,
    image: categoryAsset("event-photo"),
    color: "#8B5CF6",
    lightColor: "#EDE9FE"
  },

  // Development
  {
    id: "web-development",
    name: "Web Development",
    icon: Code,
    image: categoryAsset("web-dev"),
    color: "#3B82F6",
    lightColor: "#DBEAFE"
  },
  {
    id: "mobile-app-development",
    name: "Mobile App Development",
    icon: Smartphone,
    image: categoryAsset("mobile-dev"),
    color: "#10B981",
    lightColor: "#D1FAE5"
  },
  {
    id: "frontend-development",
    name: "Frontend Development",
    icon: Monitor,
    image: categoryAsset("frontend"),
    color: "#06B6D4",
    lightColor: "#CFFAFE"
  },
  {
    id: "backend-development",
    name: "Backend Development",
    icon: Server,
    image: categoryAsset("backend"),
    color: "#6366F1",
    lightColor: "#E0E7FF"
  },
  {
    id: "full-stack-development",
    name: "Full Stack Development",
    icon: Database,
    image: categoryAsset("fullstack"),
    color: "#8B5CF6",
    lightColor: "#EDE9FE"
  },

  // Creative & Content
  {
    id: "content-writing",
    name: "Content Writing",
    icon: FileText,
    image: categoryAsset("content-writing"),
    color: "#F59E0B",
    lightColor: "#FEF3C7"
  },
  {
    id: "copywriting",
    name: "Copywriting",
    icon: PenTool,
    image: categoryAsset("copywriting"),
    color: "#EC4899",
    lightColor: "#FCE7F3"
  },
  {
    id: "social-media-content",
    name: "Social Media Content",
    icon: TrendingUp,
    image: categoryAsset("social-media"),
    color: "#8B5CF6",
    lightColor: "#EDE9FE"
  },
  {
    id: "digital-marketing",
    name: "Digital Marketing",
    icon: BarChart,
    image: categoryAsset("digital-marketing"),
    color: "#10B981",
    lightColor: "#D1FAE5"
  },
  {
    id: "seo",
    name: "SEO",
    icon: Search,
    image: categoryAsset("seo"),
    color: "#3B82F6",
    lightColor: "#DBEAFE"
  },

  // Creative Fields
  {
    id: "fashion-design",
    name: "Fashion Design",
    icon: Shirt,
    image: categoryAsset("fashion"),
    color: "#EC4899",
    lightColor: "#FCE7F3"
  },
  {
    id: "interior-design",
    name: "Interior Design",
    icon: Home,
    image: categoryAsset("interior"),
    color: "#14B8A6",
    lightColor: "#CCFBF1"
  },
  {
    id: "architecture",
    name: "Architecture",
    icon: Building,
    image: categoryAsset("architecture"),
    color: "#6366F1",
    lightColor: "#E0E7FF"
  },
  {
    id: "product-design",
    name: "Product Design",
    icon: Brush,
    image: categoryAsset("product-design"),
    color: "#F59E0B",
    lightColor: "#FEF3C7"
  },
  {
    id: "industrial-design",
    name: "Industrial Design",
    icon: Wrench,
    image: categoryAsset("industrial"),
    color: "#64748B",
    lightColor: "#F1F5F9"
  },
  {
    id: "game-design",
    name: "Game Design",
    icon: Gamepad2,
    image: categoryAsset("game-design"),
    color: "#8B5CF6",
    lightColor: "#EDE9FE"
  },
  {
    id: "sound-design",
    name: "Sound Design",
    icon: Music,
    image: categoryAsset("sound-design"),
    color: "#06B6D4",
    lightColor: "#CFFAFE"
  },
  {
    id: "music-production",
    name: "Music Production",
    icon: Mic,
    image: categoryAsset("music-production"),
    color: "#EC4899",
    lightColor: "#FCE7F3"
  }
];

// Helper functions
export const getCategoryById = (id: string): Category | undefined => {
  return CATEGORIES.find(cat => cat.id === id);
};

export const getCategoryByName = (name: string): Category | undefined => {
  return CATEGORIES.find(cat => cat.name.toLowerCase() === name.toLowerCase());
};

export const getCategoriesByIds = (ids: string[]): Category[] => {
  return CATEGORIES.filter(cat => ids.includes(cat.id));
};

// Category groups for filtering
export const CATEGORY_GROUPS = {
  design: ["graphic-design", "ui-ux-design", "illustration", "branding-identity", "logo-design", "typography", "print-design", "packaging-design"],
  video: ["video-production", "animation", "motion-graphics", "video-editing", "3d-animation"],
  photography: ["photography", "portrait-photography", "product-photography", "event-photography"],
  development: ["web-development", "mobile-app-development", "frontend-development", "backend-development", "full-stack-development"],
  content: ["content-writing", "copywriting", "social-media-content", "digital-marketing", "seo"],
  creative: ["fashion-design", "interior-design", "architecture", "product-design", "industrial-design", "game-design", "sound-design", "music-production"]
};

export const getCategoryGroup = (categoryId: string): string | null => {
  for (const [group, ids] of Object.entries(CATEGORY_GROUPS)) {
    if (ids.includes(categoryId)) {
      return group;
    }
  }
  return null;
};
