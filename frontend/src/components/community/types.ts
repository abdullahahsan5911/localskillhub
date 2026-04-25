export interface Community {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  logo?: string;
  coverImage?: string;
  tagline?: string;
  website?: string;
  industry?: string;
  members?: any[];
  admins?: any[];
  restrictedMembers?: any[];
  following?: any[];
  followers?: any[];
  ownerId?: string | { _id: string };
}

export interface CommunityPostItem {
  _id: string;
  communityId: string;
  content: string;
  images?: string[];
  links?: string[];
  authorId: { _id: string; name: string; avatar?: string; role?: string; accountType?: string };
  isHidden?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityFeedItem {
  type: "post" | "event";
  createdAt: string;
  post?: CommunityPostItem;
  event?: {
    _id: string;
    title: string;
    description?: string;
    location?: string;
    date: string;
    communityId?: string;
    images?: string[];
    links?: string[];
  };
  community?: {
    _id: string;
    name: string;
    logo?: string;
    category?: string;
    industry?: string;
    coverImage?: string;
    tagline?: string;
  };
}
