import type { LucideIcon } from "lucide-react";
import type { IconType } from "react-icons";
import {
  FaDiscord,
  FaDocker,
  FaFigma,
  FaGithub,
  FaGoogle,
  FaJira,
  FaMailchimp,
  FaShopify,
  FaSlack,
  FaTrello,
  FaWordpress,
} from "react-icons/fa";
import {
  Box,
  Brush,
  Camera,
  Clapperboard,
  Code2,
  Cpu,
  Database,
  FileCode2,
  Film,
  Image,
  Layers,
  Mail,
  Megaphone,
  MessageSquare,
  Monitor,
  Music2,
  PenTool,
  PencilRuler,
  Presentation,
  Rocket,
  Scissors,
  Search,
  Shield,
  Smartphone,
  Terminal,
  Timer,
  Wand2,
  Wrench,
  Workflow,
} from "lucide-react";

export interface ToolOption {
  value: string;
  label: string;
  icon: LucideIcon | IconType;
}

export type ToolIconType = LucideIcon | IconType;

const TOOL_ICON_COLOR_PALETTE = [
  "text-blue-600",
  "text-violet-600",
  "text-emerald-600",
  "text-rose-600",
  "text-amber-600",
  "text-cyan-600",
  "text-fuchsia-600",
  "text-orange-600",
  "text-lime-600",
];

export const TOOL_OPTIONS: ToolOption[] = [
  { value: "figma", label: "Figma", icon: FaFigma },
  { value: "adobe_photoshop", label: "Adobe Photoshop", icon: Image },
  { value: "adobe_illustrator", label: "Adobe Illustrator", icon: Brush },
  { value: "adobe_premiere_pro", label: "Adobe Premiere Pro", icon: Film },
  { value: "adobe_after_effects", label: "Adobe After Effects", icon: Clapperboard },
  { value: "canva", label: "Canva", icon: Presentation },
  { value: "blender", label: "Blender", icon: Box },
  { value: "autocad", label: "AutoCAD", icon: PencilRuler },
  { value: "sketch", label: "Sketch", icon: Layers },
  { value: "framer", label: "Framer", icon: Monitor },
  { value: "webflow", label: "Webflow", icon: Smartphone },
  { value: "wordpress", label: "WordPress", icon: FaWordpress },
  { value: "shopify", label: "Shopify", icon: FaShopify },
  { value: "vs_code", label: "VS Code", icon: Code2 },
  { value: "github", label: "GitHub", icon: FaGithub },
  { value: "notion", label: "Notion", icon: Layers },
  { value: "jira", label: "Jira", icon: FaJira },
  { value: "google_analytics", label: "Google Analytics", icon: Search },
  { value: "capcut", label: "CapCut", icon: Scissors },
  { value: "lightroom", label: "Lightroom", icon: Camera },
  { value: "audition", label: "Adobe Audition", icon: Music2 },
  { value: "davinci_resolve", label: "DaVinci Resolve", icon: Film },
  { value: "cinema_4d", label: "Cinema 4D", icon: Box },
  { value: "maya", label: "Autodesk Maya", icon: Box },
  { value: "zbrush", label: "ZBrush", icon: Brush },
  { value: "procreate", label: "Procreate", icon: PencilRuler },
  { value: "adobe_xd", label: "Adobe XD", icon: Monitor },
  { value: "invision", label: "InVision", icon: Layers },
  { value: "miro", label: "Miro", icon: Presentation },
  { value: "clickup", label: "ClickUp", icon: Workflow },
  { value: "trello", label: "Trello", icon: FaTrello },
  { value: "asana", label: "Asana", icon: Workflow },
  { value: "slack", label: "Slack", icon: FaSlack },
  { value: "discord", label: "Discord", icon: FaDiscord },
  { value: "zoom", label: "Zoom", icon: Camera },
  { value: "google_meet", label: "Google Meet", icon: Camera },
  { value: "google_docs", label: "Google Docs", icon: FileCode2 },
  { value: "google_sheets", label: "Google Sheets", icon: Presentation },
  { value: "excel", label: "Microsoft Excel", icon: Presentation },
  { value: "powerpoint", label: "PowerPoint", icon: Presentation },
  { value: "word", label: "Microsoft Word", icon: FileCode2 },
  { value: "chatgpt", label: "ChatGPT", icon: Wand2 },
  { value: "midjourney", label: "Midjourney", icon: Wand2 },
  { value: "notebooklm", label: "NotebookLM", icon: Wand2 },
  { value: "copilot", label: "GitHub Copilot", icon: Code2 },
  { value: "claude", label: "Claude", icon: Wand2 },
  { value: "cursor", label: "Cursor", icon: Terminal },
  { value: "postman", label: "Postman", icon: Rocket },
  { value: "insomnia", label: "Insomnia", icon: Rocket },
  { value: "docker", label: "Docker", icon: FaDocker },
  { value: "kubernetes", label: "Kubernetes", icon: Cpu },
  { value: "firebase", label: "Firebase", icon: Database },
  { value: "supabase", label: "Supabase", icon: Database },
  { value: "mongodb", label: "MongoDB", icon: Database },
  { value: "mysql", label: "MySQL", icon: Database },
  { value: "postgresql", label: "PostgreSQL", icon: Database },
  { value: "seo_tools", label: "SEO Tools", icon: Search },
  { value: "semrush", label: "SEMrush", icon: Search },
  { value: "ahrefs", label: "Ahrefs", icon: Search },
  { value: "meta_ads_manager", label: "Meta Ads Manager", icon: Megaphone },
  { value: "google_ads", label: "Google Ads", icon: FaGoogle },
  { value: "mailchimp", label: "Mailchimp", icon: FaMailchimp },
  { value: "hubspot", label: "HubSpot", icon: Shield },
  { value: "buffer", label: "Buffer", icon: Timer },
  { value: "hootsuite", label: "Hootsuite", icon: Timer },
];

const TOOL_MAP = new Map<string, ToolOption>();

const normalizeKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

for (const option of TOOL_OPTIONS) {
  TOOL_MAP.set(normalizeKey(option.value), option);
  TOOL_MAP.set(normalizeKey(option.label), option);
}

export const getToolOption = (toolLabel: string): ToolOption | undefined => {
  return TOOL_MAP.get(normalizeKey(toolLabel));
};

export const getToolIconColorClass = (toolValueOrLabel: string): string => {
  const normalized = normalizeKey(toolValueOrLabel);
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TOOL_ICON_COLOR_PALETTE.length;
  return TOOL_ICON_COLOR_PALETTE[index];
};

export const getToolIcon = (toolLabel: string): ToolIconType => {
  return getToolOption(toolLabel)?.icon || Wrench;
};
