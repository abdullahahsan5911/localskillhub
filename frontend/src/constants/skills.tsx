import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Briefcase,
  Brush,
  Camera,
  ChartNoAxesColumn,
  Clapperboard,
  Code2,
  Database,
  FilePenLine,
  Globe,
  Hammer,
  Headphones,
  Layout,
  Megaphone,
  Monitor,
  Palette,
  PenTool,
  Search,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
} from "lucide-react";

export interface SkillOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const SKILL_OPTIONS: SkillOption[] = [
  { value: "web_development", label: "Web Development", icon: Code2 },
  { value: "frontend_development", label: "Frontend Development", icon: Layout },
  { value: "backend_development", label: "Backend Development", icon: Server },
  { value: "mobile_app_development", label: "Mobile App Development", icon: Smartphone },
  { value: "ui_ux_design", label: "UI/UX Design", icon: PenTool },
  { value: "graphic_design", label: "Graphic Design", icon: Palette },
  { value: "logo_design", label: "Logo Design", icon: Sparkles },
  { value: "video_editing", label: "Video Editing", icon: Clapperboard },
  { value: "motion_graphics", label: "Motion Graphics", icon: Monitor },
  { value: "photography", label: "Photography", icon: Camera },
  { value: "content_writing", label: "Content Writing", icon: FilePenLine },
  { value: "copywriting", label: "Copywriting", icon: FilePenLine },
  { value: "seo", label: "SEO", icon: Search },
  { value: "digital_marketing", label: "Digital Marketing", icon: Megaphone },
  { value: "social_media_management", label: "Social Media Management", icon: Globe },
  { value: "data_analysis", label: "Data Analysis", icon: ChartNoAxesColumn },
  { value: "database_management", label: "Database Management", icon: Database },
  { value: "cybersecurity", label: "Cybersecurity", icon: ShieldCheck },
  { value: "ai_ml", label: "AI/ML", icon: Bot },
  { value: "virtual_assistance", label: "Virtual Assistance", icon: Headphones },
  { value: "project_management", label: "Project Management", icon: Briefcase },
  { value: "illustration", label: "Illustration", icon: Brush },
  { value: "3d_modeling", label: "3D Modeling", icon: Hammer },
];

const SKILL_MAP = new Map<string, SkillOption>();

const normalizeKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

for (const option of SKILL_OPTIONS) {
  SKILL_MAP.set(normalizeKey(option.value), option);
  SKILL_MAP.set(normalizeKey(option.label), option);
}

export const getSkillOption = (skillLabel: string): SkillOption | undefined => {
  return SKILL_MAP.get(normalizeKey(skillLabel));
};

export const getSkillIcon = (skillLabel: string): LucideIcon => {
  return getSkillOption(skillLabel)?.icon || Wrench;
};
