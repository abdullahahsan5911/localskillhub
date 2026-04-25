export const DISCOVERY_TABS = ["Projects", "People", "Assets", "Images"] as const;
export type DiscoveryTab = (typeof DISCOVERY_TABS)[number];

export const DISCOVERY_TAB_PATHS: Record<DiscoveryTab, string> = {
  Projects: "/",
  People: "/people",
  Assets: "/assets",
  Images: "/images",
};
