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
  description?: string;
  color: string;
  lightColor: string;
}

export const CATEGORIES: Category[] = [
  // Design & Visual Arts
  {
    id: "graphic-design",
    name: "Graphic Design",
    icon: Palette,
    image: "/assets/categories/graphic-design.jpg",
    description: "Visual communication and branding",
    color: "#8B5CF6",
    lightColor: "#EDE9FE"
  },
  {
    id: "ui-ux-design",
    name: "UI/UX Design",
    icon: LayoutGrid,
    image: "/assets/categories/ui-ux-design.jpg",
    description: "User interface and experience design",
    color: "#3B82F6",
    lightColor: "#DBEAFE"
  },
  {
    id: "illustration",
    name: "Illustration",
    icon: Pen,
    image: "/assets/categories/illustration.jpg",
    description: "Digital and traditional illustration",
    color: "#EC4899",
    lightColor: "#FCE7F3"
  },
  {
    id: "branding-identity",
    name: "Branding & Identity",
    icon: Sparkles,
    image: "/assets/categories/branding.jpg",
    description: "Brand strategy and visual identity",
    color: "#F59E0B",
    lightColor: "#FEF3C7"
  },
  {
    id: "logo-design",
    name: "Logo Design",
    icon: Sparkles,
    image: "/assets/categories/logo-design.jpg",
    description: "Professional logo creation",
    color: "#10B981",
    lightColor: "#D1FAE5"
  },
  {
    id: "typography",
    name: "Typography",
    icon: Type,
    image: "/assets/categories/typography.jpg",
    description: "Type design and lettering",
    color: "#6366F1",
    lightColor: "#E0E7FF"
  },
  {
    id: "print-design",
    name: "Print Design",
    icon: Printer,
    image: "/assets/categories/print-design.jpg",
    description: "Print materials and layouts",
    color: "#8B5CF6",
    lightColor: "#EDE9FE"
  },
  {
    id: "packaging-design",
    name: "Packaging Design",
    icon: Package,
    image: "/assets/categories/packaging.jpg",
    description: "Product packaging design",
    color: "#14B8A6",
    lightColor: "#CCFBF1"
  },

  // Motion & Video
  {
    id: "video-production",
    name: "Video Production",
    icon: Video,
    image: "/assets/categories/video-production.jpg",
    description: "Professional video creation",
    color: "#EF4444",
    lightColor: "#FEE2E2"
  },
  {
    id: "animation",
    name: "Animation",
    icon: Film,
    image: "/assets/categories/animation.jpg",
    description: "2D and 3D animation",
    color: "#F59E0B",
    lightColor: "#FEF3C7"
  },
  {
    id: "motion-graphics",
    name: "Motion Graphics",
    icon: Clapperboard,
    image: "/assets/categories/motion-graphics.jpg",
    description: "Animated graphics and titles",
    color: "#8B5CF6",
    lightColor: "#EDE9FE"
  },
  {
    id: "video-editing",
    name: "Video Editing",
    icon: Scissors,
    image: "/assets/categories/video-editing.jpg",
    description: "Professional video editing",
    color: "#3B82F6",
    lightColor: "#DBEAFE"
  },
  {
    id: "3d-animation",
    name: "3D Animation",
    icon: Box,
    image: "/assets/categories/3d-animation.jpg",
    description: "3D modeling and animation",
    color: "#EC4899",
    lightColor: "#FCE7F3"
  },

  // Photography
  {
    id: "photography",
    name: "Photography",
    icon: Camera,
    image: "/assets/categories/photography.jpg",
    description: "Professional photography",
    color: "#06B6D4",
    lightColor: "#CFFAFE"
  },
  {
    id: "portrait-photography",
    name: "Portrait Photography",
    icon: User,
    image: "/assets/categories/portrait.jpg",
    description: "Portrait and headshot photography",
    color: "#F59E0B",
    lightColor: "#FEF3C7"
  },
  {
    id: "product-photography",
    name: "Product Photography",
    icon: ShoppingBag,
    image: "/assets/categories/product-photo.jpg",
    description: "E-commerce and product shots",
    color: "#10B981",
    lightColor: "#D1FAE5"
  },
  {
    id: "event-photography",
    name: "Event Photography",
    icon: Calendar,
    image: "/assets/categories/event-photo.jpg",
    description: "Events and occasions",
    color: "#8B5CF6",
    lightColor: "#EDE9FE"
  },

  // Development
  {
    id: "web-development",
    name: "Web Development",
    icon: Code,
    image: "/assets/categories/web-dev.jpg",
    description: "Website development",
    color: "#3B82F6",
    lightColor: "#DBEAFE"
  },
  {
    id: "mobile-app-development",
    name: "Mobile App Development",
    icon: Smartphone,
    image: "/assets/categories/mobile-dev.jpg",
    description: "iOS and Android apps",
    color: "#10B981",
    lightColor: "#D1FAE5"
  },
  {
    id: "frontend-development",
    name: "Frontend Development",
    icon: Monitor,
    image: "/assets/categories/frontend.jpg",
    description: "UI development",
    color: "#06B6D4",
    lightColor: "#CFFAFE"
  },
  {
    id: "backend-development",
    name: "Backend Development",
    icon: Server,
    image: "/assets/categories/backend.jpg",
    description: "Server-side development",
    color: "#6366F1",
    lightColor: "#E0E7FF"
  },
  {
    id: "full-stack-development",
    name: "Full Stack Development",
    icon: Database,
    image: "/assets/categories/fullstack.jpg",
    description: "End-to-end development",
    color: "#8B5CF6",
    lightColor: "#EDE9FE"
  },

  // Creative & Content
  {
    id: "content-writing",
    name: "Content Writing",
    icon: FileText,
    image: "/assets/categories/content-writing.jpg",
    description: "Blog posts and articles",
    color: "#F59E0B",
    lightColor: "#FEF3C7"
  },
  {
    id: "copywriting",
    name: "Copywriting",
    icon: PenTool,
    image: "/assets/categories/copywriting.jpg",
    description: "Marketing and ad copy",
    color: "#EC4899",
    lightColor: "#FCE7F3"
  },
  {
    id: "social-media-content",
    name: "Social Media Content",
    icon: TrendingUp,
    image: "/assets/categories/social-media.jpg",
    description: "Social media management",
    color: "#8B5CF6",
    lightColor: "#EDE9FE"
  },
  {
    id: "digital-marketing",
    name: "Digital Marketing",
    icon: BarChart,
    image: "/assets/categories/digital-marketing.jpg",
    description: "Marketing strategy and campaigns",
    color: "#10B981",
    lightColor: "#D1FAE5"
  },
  {
    id: "seo",
    name: "SEO",
    icon: Search,
    image: "/assets/categories/seo.jpg",
    description: "Search engine optimization",
    color: "#3B82F6",
    lightColor: "#DBEAFE"
  },

  // Creative Fields
  {
    id: "fashion-design",
    name: "Fashion Design",
    icon: Shirt,
    image: "/assets/categories/fashion.jpg",
    description: "Fashion and apparel design",
    color: "#EC4899",
    lightColor: "#FCE7F3"
  },
  {
    id: "interior-design",
    name: "Interior Design",
    icon: Home,
    image: "/assets/categories/interior.jpg",
    description: "Interior and space design",
    color: "#14B8A6",
    lightColor: "#CCFBF1"
  },
  {
    id: "architecture",
    name: "Architecture",
    icon: Building,
    image: "/assets/categories/architecture.jpg",
    description: "Architectural design",
    color: "#6366F1",
    lightColor: "#E0E7FF"
  },
  {
    id: "product-design",
    name: "Product Design",
    icon: Brush,
    image: "/assets/categories/product-design.jpg",
    description: "Physical product design",
    color: "#F59E0B",
    lightColor: "#FEF3C7"
  },
  {
    id: "industrial-design",
    name: "Industrial Design",
    icon: Wrench,
    image: "/assets/categories/industrial.jpg",
    description: "Manufacturing and industrial design",
    color: "#64748B",
    lightColor: "#F1F5F9"
  },
  {
    id: "game-design",
    name: "Game Design",
    icon: Gamepad2,
    image: "/assets/categories/game-design.jpg",
    description: "Video game design",
    color: "#8B5CF6",
    lightColor: "#EDE9FE"
  },
  {
    id: "sound-design",
    name: "Sound Design",
    icon: Music,
    image: "/assets/categories/sound-design.jpg",
    description: "Audio and sound effects",
    color: "#06B6D4",
    lightColor: "#CFFAFE"
  },
  {
    id: "music-production",
    name: "Music Production",
    icon: Mic,
    image: "/assets/categories/music-production.jpg",
    description: "Music composition and production",
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
