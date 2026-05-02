import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { resolveAvatarSrc } from "@/lib/avatar";
import Avatar from "@/components/Avatar";
import { UserHoverCard, UserHoverCardData } from "@/components/UserHoverCard";
import {
  FiCalendar,
  FiCompass,
  FiLoader,
  FiMapPin,
  FiMessageSquare,
  FiSearch,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { FiHeart, FiRepeat } from "react-icons/fi";
import PostsEventsList from "../components/common/PostsEventsList";
import { HiOutlineSparkles } from "react-icons/hi2";

interface Community {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  members?: { _id: string; name: string }[];
  ownerId?: string | { _id: string };
}

interface EventItem {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  date: string;
  attendees?: any[];
  communityId?: string | { _id?: string };
}

interface CommunityPostItem {
  _id: string;
  communityId: string;
  content: string;
  images?: string[];
  links?: string[];
  authorId: { _id: string; name: string; avatar?: string };
  createdAt: string;
  reposts?: any[];
  repostsCount?: number;
}

interface CommunityJobItem {
  _id: string;
  communityId?: string | { _id?: string };
  title: string;
  description?: string;
  location?: string;
  salary?: string;
  type?: string;
  images?: string[];
  links?: string[];
  createdAt?: string;
}

interface CommunityArticleItem {
  _id: string;
  communityId?: string | { _id?: string };
  title: string;
  content?: string;
  images?: string[];
  links?: string[];
  createdAt?: string;
}

interface CommunityProductItem {
  _id: string;
  communityId?: string | { _id?: string };
  title: string;
  description?: string;
  price?: string;
  images?: string[];
  links?: string[];
  createdAt?: string;
}

interface LeaderboardUser {
  userId: {
    _id: string;
    name: string;
    avatar?: string;
    location?: { city?: string; state?: string; country?: string };
    portfolio: Array<{ title: string; images: string[]; imageUrl?: string }>;
  };
  reputation?: {
    localTrustScore?: number;
    overallScore?: number;
    skillTrustScore?: number;
  };
}

const normalizeLeaderboard = (payload: any): LeaderboardUser[] => {
  const rawList =
    payload?.data?.data?.leaderboard ??
    payload?.data?.leaderboard ??
    payload?.leaderboard ??
    [];
  if (!Array.isArray(rawList)) return [];
  return rawList.map((item: any, index: number) => {
    const candidateUser =
      item?.userId && typeof item.userId === "object"
        ? item.userId
        : item?.user && typeof item.user === "object"
        ? item.user
        : null;
    const fallbackId = item?._id || item?.id || item?.userId || `lb-${index}`;
    const rawPortfolio = candidateUser?.portfolio || item?.portfolio;
    const safePortfolio = Array.isArray(rawPortfolio) ? rawPortfolio : [];
    return {
      userId: {
        _id: String(candidateUser?._id || candidateUser?.id || fallbackId),
        name: candidateUser?.name || item?.name || "Anonymous",
        avatar: candidateUser?.avatar || item?.avatar,
        location: candidateUser?.location || item?.location,
        portfolio: safePortfolio.map((p: any) => ({
          title: p?.title || "",
          images: Array.isArray(p?.images) ? p.images : [],
          imageUrl: p?.imageUrl,
        })),
      },
      reputation: {
        localTrustScore: item?.reputation?.localTrustScore ?? item?.localTrustScore,
        overallScore: item?.reputation?.overallScore ?? item?.overallScore,
        skillTrustScore: item?.reputation?.skillTrustScore ?? item?.skillTrustScore,
      },
    };
  });
};

const rankStyle = (i: number) => {
  if (i === 0) return "bg-amber-100 text-amber-700 border border-amber-300";
  if (i === 1) return "bg-slate-100 text-slate-600 border border-slate-300";
  if (i === 2) return "bg-orange-100 text-orange-600 border border-orange-200";
  return "bg-slate-50 text-slate-500 border border-slate-200";
};

function Section({ title, icon, children, action }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-2 overflow-hidden px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 sm:h-8 sm:w-8">
            {icon}
          </div>
          <p className="truncate text-sm font-semibold text-slate-900 tracking-tight">{title}</p>
        </div>
        {action ? <div className="w-full min-w-0 sm:w-auto">{action}</div> : null}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function CommunityCard({
  c, action,
}: {
  c: Community;
  action?: React.ReactNode;
}) {
  const members = Array.isArray(c.members) ? c.members : [];
  const admins = Array.isArray((c as any).admins) ? (c as any).admins : [];
  const owner = (c as any).ownerId;
  const adminIds = new Set(admins.map((a: any) => String((a && (a._id || a)) || "")));
  const followersCount = members.filter((m: any) => {
    const id = String((m && (m._id || m)) || "");
    if (!id) return false;
    if (String(owner) === id) return false;
    if (adminIds.has(id)) return false;
    return true;
  }).length;
  return (
    <div className="flex min-w-0 flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 hover:border-slate-300 hover:bg-slate-100/80 transition-colors sm:flex-row sm:items-start sm:px-4 sm:py-3.5 sm:gap-4">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <div className="flex-shrink-0">
          <Avatar src={resolveAvatarSrc((c as any).logo || (c as any).coverImage)} name={c.name} size={40} />
        </div>
        <div className="min-w-0">
          <Link to={`/communities/${c._id}`} className="block no-underline text-inherit">
            <p className="text-sm font-semibold text-slate-900 truncate hover:underline">{c.name}</p>
            {c.description ? (
              <p className={`text-xs text-slate-500 mt-0.5 break-words leading-relaxed ${c.description.length > 140 ? 'line-clamp-2' : ''}`}>
                {c.description}
              </p>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">No description provided</p>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
              {c.category && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 border border-slate-200">
                  <FiCompass size={10} />
                  <span className="truncate max-w-[120px]">{c.category}</span>
                </span>
              )}
              {Array.isArray(c.members) && (
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <FiUsers size={11} />
                  <span className="tabular-nums">{followersCount}</span>
                  <span>members</span>
                </span>
              )}
            </div>
          </Link>
        </div>
      </div>
      {action && (
        <div className="w-full mt-2 sm:mt-0 sm:w-auto sm:self-end">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            {action}
          </div>
        </div>
      )}
    </div>
  );
}

const normalizeCommunityId = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    const id = (value as { _id?: string })._id;
    return typeof id === "string" ? id : "";
  }
  return "";
};

type FeedItem =
  | {
      type: "post";
      id: string;
      timestamp: string;
      communityId: string;
      post: CommunityPostItem;
    }
  | {
      type: "event";
      id: string;
      timestamp: string;
      communityId: string;
      event: EventItem;
    }
  | {
      type: "job";
      id: string;
      timestamp: string;
      communityId: string;
      job: CommunityJobItem;
    }
  | {
      type: "article";
      id: string;
      timestamp: string;
      communityId: string;
      article: CommunityArticleItem;
    }
  | {
      type: "product";
      id: string;
      timestamp: string;
      communityId: string;
      product: CommunityProductItem;
    };

const Communities = () => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [feedJobs, setFeedJobs] = useState<CommunityJobItem[]>([]);
  const [feedArticles, setFeedArticles] = useState<CommunityArticleItem[]>([]);
  const [feedProducts, setFeedProducts] = useState<CommunityProductItem[]>([]);
  const [loadingFeedJobs, setLoadingFeedJobs] = useState(true);
  const [loadingFeedArticles, setLoadingFeedArticles] = useState(true);
  const [loadingFeedProducts, setLoadingFeedProducts] = useState(true);
  const [togglingEvents, setTogglingEvents] = useState<string[]>([]);
  const [feedPosts, setFeedPosts] = useState<CommunityPostItem[]>([]);
  const [loadingFeedPosts, setLoadingFeedPosts] = useState(true);
  const [myRank, setMyRank] = useState<{
    rank: number | null;
    localScore: number | null;
    globalScore: number | null;
  } | null>(null);

  

  const totalCommunities = communities.length;
  const myCommunitiesCount = myCommunities.length;
  const navigate = useNavigate();
  const hasOwnedCommunities = myCommunities.some((c) => {
    const ownerId = (c as any).ownerId ? ((c as any).ownerId as any)._id || (c as any).ownerId : (c as any).ownerId;
    const currentUserId = (user as any)?._id;
    return !!ownerId && !!currentUserId && String(ownerId) === String(currentUserId);
  });
  const communityNameById = useMemo(
    () => new Map(communities.map((community) => [community._id, community.name])),
    [communities]
  );

  const matchesSearchAndCategory = (_community: Community) => true;

  const myCommunityIdSet = useMemo(() => {
    return new Set(
      myCommunities
        .map((c) => {
          const raw = (c as any)?._id ?? c;
          if (typeof raw === "string") return raw;
          if (raw && typeof raw === "object" && "_id" in raw) return String((raw as any)._id);
          return "";
        })
        .filter(Boolean)
    );
  }, [myCommunities]);

  const refreshCommunityList = useMemo(() => {
    const communityMap = new Map<string, Community>();
    [...communities, ...myCommunities].forEach((communityItem) => {
      const id = String((communityItem as any)?._id || communityItem);
      if (id && !communityMap.has(id)) {
        communityMap.set(id, communityItem);
      }
    });
    return Array.from(communityMap.values());
  }, [communities, myCommunities]);

  const filteredMyCommunities = useMemo(
    () => myCommunities.filter(matchesSearchAndCategory),
    [myCommunities]
  );

  const isInMyCommunities = (id: string) => myCommunityIdSet.has(String(id));

  const filteredDiscoverCommunities = useMemo(
    () =>
      communities
        .filter((c) => !isInMyCommunities(c._id))
        .filter(matchesSearchAndCategory),
    [communities, myCommunities]
  );

  const visibleCommunityIds = useMemo(
    () => new Set([...filteredMyCommunities, ...filteredDiscoverCommunities].map((community) => community._id)),
    [filteredMyCommunities, filteredDiscoverCommunities]
  );

  const mixedFeed = useMemo<FeedItem[]>(() => {
    const postItems: FeedItem[] = feedPosts
      .filter((post) => visibleCommunityIds.has(post.communityId))
      .map((post) => ({
        type: "post",
        id: `post-${post._id}`,
        timestamp: post.createdAt,
        communityId: post.communityId,
        post,
      }));

    const eventItems: FeedItem[] = events
      .map((event) => {
        const eventCommunityId = normalizeCommunityId(event.communityId);
        return {
          type: "event" as const,
          id: `event-${event._id}`,
          timestamp: event.date,
          communityId: eventCommunityId,
          event,
        };
      })
      .filter((eventItem) => !eventItem.communityId || visibleCommunityIds.has(eventItem.communityId));

    const jobItems: FeedItem[] = feedJobs
      .map((job) => ({
        type: "job" as const,
        id: `job-${job._id}`,
        timestamp: job.createdAt || job._id,
        communityId: normalizeCommunityId(job.communityId),
        job,
      }))
      .filter((jobItem) => !jobItem.communityId || visibleCommunityIds.has(jobItem.communityId));

    const articleItems: FeedItem[] = feedArticles
      .map((article) => ({
        type: "article" as const,
        id: `article-${article._id}`,
        timestamp: article.createdAt || article._id,
        communityId: normalizeCommunityId(article.communityId),
        article,
      }))
      .filter((articleItem) => !articleItem.communityId || visibleCommunityIds.has(articleItem.communityId));

    const productItems: FeedItem[] = feedProducts
      .map((product) => ({
        type: "product" as const,
        id: `product-${product._id}`,
        timestamp: product.createdAt || product._id,
        communityId: normalizeCommunityId(product.communityId),
        product,
      }))
      .filter((productItem) => !productItem.communityId || visibleCommunityIds.has(productItem.communityId));

    return [...postItems, ...eventItems, ...jobItems, ...articleItems, ...productItems].sort((a, b) => {
      const at = new Date(a.timestamp).getTime() || 0;
      const bt = new Date(b.timestamp).getTime() || 0;
      return bt - at;
    });
  }, [events, feedPosts, feedJobs, feedArticles, feedProducts, visibleCommunityIds]);

  const refreshCommunities = async () => {
    try {
      setLoadingCommunities(true);
      const [allRes, myRes] = await Promise.all([
        api.getCommunities({ limit: 20 }),
        isAuthenticated ? api.getMyCommunities() : Promise.resolve({ data: { communities: [] } } as any),
      ]);
      if ((allRes as any).data?.communities) setCommunities((allRes as any).data!.communities as Community[]);
      if ((myRes as any).data?.communities) setMyCommunities((myRes as any).data!.communities as Community[]);
    } catch (err) {
      console.error("Failed to load communities", err);
    } finally {
      setLoadingCommunities(false);
    }
  };

  const refreshEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await api.getEvents();
      const payload: any = (res as any).data || res;
      const list: EventItem[] = payload.events || payload.data?.events || payload.data || [];
      setEvents(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load events", err);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const refreshFeedPosts = async (communityList: Community[]) => {
    if (communityList.length === 0) {
      setFeedPosts([]);
      setFeedJobs([]);
      setFeedArticles([]);
      setFeedProducts([]);
      setLoadingFeedPosts(false);
      setLoadingFeedJobs(false);
      setLoadingFeedArticles(false);
      setLoadingFeedProducts(false);
      return;
    }

    setLoadingFeedPosts(true);
    setLoadingFeedJobs(true);
    setLoadingFeedArticles(true);
    setLoadingFeedProducts(true);
    try {
      const [postResponses, jobsRes, articlesRes, productsRes] = await Promise.allSettled([
        Promise.allSettled(communityList.map((community) => api.getCommunityPosts(community._id, { limit: 5 }))),
        api.getCommunityJobs({ limit: 50 }),
        api.getCommunityArticles({ limit: 50 }),
        api.getCommunityProducts({ limit: 50 }),
      ]);

      const allPosts: CommunityPostItem[] = [];

      if (postResponses.status === "fulfilled") {
        postResponses.value.forEach((result, index) => {
          if (result.status !== "fulfilled") return;
          const payload: any = (result.value as any).data || {};
          const rawPosts = payload.data?.posts || payload.posts || [];
          const posts: CommunityPostItem[] = Array.isArray(rawPosts) ? rawPosts : [];
          const communityId = communityList[index]?._id;

          posts.forEach((post) => {
            allPosts.push({
              ...post,
              communityId: post.communityId || communityId,
            });
          });
        });
      }

      allPosts.sort((a, b) => {
        const at = new Date(a.createdAt).getTime() || 0;
        const bt = new Date(b.createdAt).getTime() || 0;
        return bt - at;
      });

      setFeedPosts(allPosts);

      const jobsPayload: any = jobsRes.status === "fulfilled" ? (jobsRes.value as any).data || {} : {};
      const articlesPayload: any = articlesRes.status === "fulfilled" ? (articlesRes.value as any).data || {} : {};
      const productsPayload: any = productsRes.status === "fulfilled" ? (productsRes.value as any).data || {} : {};

      setFeedJobs(Array.isArray(jobsPayload.data?.jobs || jobsPayload.jobs) ? (jobsPayload.data?.jobs || jobsPayload.jobs) : []);
      setFeedArticles(Array.isArray(articlesPayload.data?.articles || articlesPayload.articles) ? (articlesPayload.data?.articles || articlesPayload.articles) : []);
      setFeedProducts(Array.isArray(productsPayload.data?.products || productsPayload.products) ? (productsPayload.data?.products || productsPayload.products) : []);
    } catch (err) {
      console.error("Failed to load feed content", err);
      setFeedPosts([]);
      setFeedJobs([]);
      setFeedArticles([]);
      setFeedProducts([]);
    } finally {
      setLoadingFeedPosts(false);
      setLoadingFeedJobs(false);
      setLoadingFeedArticles(false);
      setLoadingFeedProducts(false);
    }
  };

  const refreshLeaderboard = async () => {
    setLoadingLeaderboard(true);
    setLeaderboard([]);

    if (!isAuthenticated) {
      setLoadingLeaderboard(false);
      setMyRank(null);
      return;
    }

    const leaderboardCity = String((user as any)?.location?.city || "").trim();
    if (!leaderboardCity) {
      setLoadingLeaderboard(false);
      setMyRank(null);
      return;
    }

    try {
      const res = await api.getLeaderboard({ limit: 10, city: leaderboardCity });
      const lb = normalizeLeaderboard(res as any);

      // Build a lightweight fallback from recent feedPosts activity (localScore)
      const counts: Record<string, { user: any; count: number }> = {};
      (feedPosts || []).forEach((p) => {
        const author: any = p.authorId || {};
        const rawId = author && (author._id ?? author) ? (author._id ?? author) : `anon-${p._id}`;
        const id = String(rawId);
        const name = (typeof author === 'object' && author?.name) ? author.name : (typeof author === 'string' ? author : 'Unknown');
        const avatar = (typeof author === 'object' && author?.avatar) ? author.avatar : undefined;
        if (!counts[id]) counts[id] = { user: { _id: id, name: name || 'Unknown', avatar }, count: 0 };
        counts[id].count += 1;
      });
      const fallback = Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((c) => ({ userId: c.user, reputation: { localTrustScore: c.count } }));

      // Combine API leaderboard and fallback, prioritizing API scores but sorting by localTrustScore
      const combined = [...(lb || []), ...fallback];
      const byId = new Map<string, any>();
      combined.forEach((item: any) => {
        const id = item?.userId?._id || item?.userId || '';
        if (!id) return;
        const key = String(id);
        const existing = byId.get(key);
        const score = Number(item.reputation?.localTrustScore ?? 0);
        if (!existing || score > (existing.reputation?.localTrustScore ?? 0)) {
          byId.set(key, { ...item, userId: { _id: key, name: item.userId?.name || (item.userId && item.userId.name) || 'Unknown', avatar: item.userId?.avatar || item.userId?.avatar } });
          // ensure reputation shape
          const updated = byId.get(key);
          updated.reputation = { localTrustScore: score, overallScore: updated.reputation?.overallScore ?? null };
          byId.set(key, updated);
        }
      });

      let finalList = Array.from(byId.values()).map((item: any) => ({
        userId: item.userId,
        reputation: { localTrustScore: Number(item.reputation?.localTrustScore ?? 0) },
      }));

      // keep only entries that look like users and sort strictly by localTrustScore desc
      finalList = finalList
        .filter((it: any) => it && it.userId && (it.userId._id || it.userId))
        .sort((a: any, b: any) => Number(b.reputation.localTrustScore) - Number(a.reputation.localTrustScore));

      // if we have fewer than 10, fill with community members (localScore 0)
      if (finalList.length < 10) {
        const added = new Set(finalList.map((it: any) => String(it.userId._id || it.userId)));
        for (const c of communities) {
          if (!Array.isArray(c.members)) continue;
          for (const m of c.members) {
            const id = String((m as any)._id || m);
            if (!id || added.has(id)) continue;
            finalList.push({ userId: { _id: id, name: (m as any).name || 'Unknown' }, reputation: { localTrustScore: 0 } });
            added.add(id);
            if (finalList.length >= 10) break;
          }
          if (finalList.length >= 10) break;
        }
      }

      finalList = finalList.slice(0, 10);
      setLeaderboard(finalList as any);
    } catch (err) {
      console.error("Failed to load leaderboard", err);
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }

    if (isAuthenticated) {
      try {
        const rankRes = await api.getUserRank();
        const d = (rankRes.data as any)?.data || (rankRes.data as any);
        if (d && (typeof d.rank === "number" || d.rank === null)) {
          setMyRank({ rank: d.rank, localScore: typeof d.localScore === "number" ? d.localScore : null, globalScore: typeof d.globalScore === "number" ? d.globalScore : null });
        } else {
          setMyRank(null);
        }
      } catch {
        setMyRank(null);
      }
    } else {
      setMyRank(null);
    }
  };

  useEffect(() => {
    refreshCommunities();
    refreshLeaderboard();
    refreshEvents();
  }, [isAuthenticated, (user as any)?.location?.city]);

  const communitiesKey = useMemo(
    () => communities.map((community) => community._id).join(","),
    [communities]
  );

  useEffect(() => {
    void refreshFeedPosts(refreshCommunityList);
  }, [communitiesKey, refreshCommunityList]);

  const handleJoin = async (id: string) => {
    try { await api.joinCommunity(id); await refreshCommunities(); } catch (err) { console.error(err); }
  };

  const handleLeave = async (id: string) => {
    try { await api.leaveCommunity(id); await refreshCommunities(); } catch (err) { console.error(err); }
  };

  const handleJoinEvent = async (eventId: string, attending: boolean) => {
    if (!isAuthenticated) return;
    if (togglingEvents.includes(eventId)) return;
    setTogglingEvents((s) => [...s, eventId]);
    try {
      if (attending) {
        await api.unjoinEvent(eventId);
        toast({ title: 'Left event', description: 'You have left the event.' });
      } else {
        await api.joinEvent(eventId);
        toast({ title: 'Joined event', description: 'You are now attending the event.' });
      }
      await refreshEvents();
    } catch (err: any) {
      console.error('Failed to toggle event join', err);
      const msg = err?.response?.data?.message || err?.message || 'Unable to update event attendance.';
      toast({ title: 'Update failed', description: msg, variant: 'destructive' });
    } finally {
      setTogglingEvents((s) => s.filter((id) => id !== eventId));
    }
  };

  const openCommentsForPost = (post: CommunityPostItem) => {
    if (!isAuthenticated) return;
  };

  const currentUserId = (user as any)?._id;

  const handleLikePost = async (post: CommunityPostItem) => {
    if (!isAuthenticated) return;

    const postId = post._id;
    // optimistic update
    setFeedPosts((prev) =>
      prev.map((p) => {
        if (p._id !== postId) return p;
        const likesArr = Array.isArray((p as any).likes) ? [...(p as any).likes] : [];
        const isLiked = Boolean(currentUserId && likesArr.some((id: any) => String(id) === String(currentUserId)));
        if (isLiked) {
          return { ...p, likes: likesArr.filter((id: any) => String(id) !== String(currentUserId)) } as any;
        }
        likesArr.push(currentUserId);
        return { ...p, likes: likesArr } as any;
      })
    );

    try {
      await api.toggleCommunityPostLike(post.communityId as string, post._id as string);
      toast({ title: 'Updated like' });
    } catch (err) {
      console.error('Like failed', err);
      toast({ title: 'Could not like post', variant: 'destructive' });
      // revert by refreshing
      await refreshFeedPosts(communities);
    }
  };

  const handleRepost = async (post: CommunityPostItem) => {
    if (!isAuthenticated) return;

    const ownedCommunity = myCommunities.find((community) => {
      const ownerId = (community as any).ownerId ? ((community as any).ownerId as any)._id || (community as any).ownerId : (community as any).ownerId;
      return !!ownerId && !!currentUserId && String(ownerId) === String(currentUserId);
    });

    if (!ownedCommunity) {
      toast({ title: 'Create a page to do post', variant: 'destructive' });
      return;
    }

    const latest = feedPosts.find((item) => item._id === post._id) || post;
    const hasReposted = Boolean(currentUserId && Array.isArray((latest as any).reposts) && (latest as any).reposts.some((id: any) => String(id) === String(currentUserId)));

    try {
      if (hasReposted) {
        await api.repostCommunityPost(post.communityId as string, post._id as string);
        setFeedPosts((prev) =>
          prev
            .filter((p) =>
              !(
                String((p as any).repostOf) === String(post._id) &&
                String(((p as any).authorId as any)?._id || (p as any).authorId) === String(currentUserId)
              )
            )
            .map((p) =>
              p._id === post._id
                ? {
                    ...p,
                    reposts: Array.isArray(p.reposts)
                      ? p.reposts.filter((id: any) => String(id) !== String(currentUserId))
                      : [],
                    repostsCount: Math.max(0, Number(p.repostsCount || 0) - 1),
                  }
                : p,
            ),
        );
        toast({ title: 'Repost removed' });
        await refreshFeedPosts(refreshCommunityList);
        return;
      }

      await api.createCommunityPost(ownedCommunity._id, {
        content: post.content,
        images: Array.isArray(post.images) ? post.images : [],
        links: Array.isArray(post.links) ? post.links : [],
        repostOf: post._id,
      });
      await api.repostCommunityPost(post.communityId as string, post._id as string);
      setFeedPosts((prev) =>
        prev.map((p) =>
          p._id === post._id
            ? {
                ...p,
                reposts: Array.isArray(p.reposts) ? [...p.reposts, currentUserId] : [currentUserId],
                repostsCount: Number(p.repostsCount || 0) + 1,
              }
            : p,
        ),
      );
      toast({ title: 'Reposted to your page' });
      await refreshFeedPosts(refreshCommunityList);
    } catch (err) {
      console.error('Repost failed', err);
      toast({ title: 'Could not repost', variant: 'destructive' });
    }
  };

  const handleAddComment = async (postId: string, communityId: string, content: string) => {
    if (!isAuthenticated) return;
    try {
      const target = feedPosts.find(p => p._id === postId);
      if (!target) throw new Error('Post not found');
      await api.commentCommunityPost(communityId as string, postId as string, content);
      toast({ title: 'Comment posted' });
      await refreshFeedPosts(communities);
    } catch (err: any) {
      console.error('Comment failed', err);
      toast({ title: err?.response?.data?.message || 'Could not post comment', variant: 'destructive' });
      throw err;
    }
  };

  const handleReply = async (postId: string, communityId: string, commentId: string, content: string) => {
    if (!isAuthenticated) return;
    try {
      const target = feedPosts.find(p => p._id === postId);
      if (!target) throw new Error('Post not found');
      await api.replyCommunityPostComment(communityId as string, postId as string, commentId, content);
      toast({ title: 'Reply posted' });
      await refreshFeedPosts(communities);
    } catch (err: any) {
      console.error('Reply failed', err);
      toast({ title: err?.response?.data?.message || 'Could not post reply', variant: 'destructive' });
      throw err;
    }
  };

  const handleDeleteCommunity = async (id: string) => {
    try {
      await api.deleteCommunity(id);
      toast({ title: "Community deleted", description: "The community has been removed successfully." });
      await refreshCommunities();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.response?.data?.message || "Unable to delete this community.", variant: "destructive" });
    }
  };

  const isOwner = (community: Community) => {
    const ownerId = (community.ownerId as any)?._id || community.ownerId;
    const currentUserId = (user as any)?._id;
    return !!ownerId && !!currentUserId && ownerId.toString() === currentUserId.toString();
  };

  const formatDate = (iso: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelative = (iso: string) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${Math.max(1, mins)}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(iso);
  };

  const formatCount = (n?: number) => {
    const num = Number(n || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return String(num);
  };

  return (
    <Layout>
      <div className="mx-auto w-full max-w-[1400px] space-y-4 px-3 py-5 sm:space-y-6 sm:px-4 sm:py-8 lg:px-6">

        {/* ── Page Header ── */}
        <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(120deg,#f8fafc_0%,#ffffff_60%,#f3f4f6_100%)] px-4 py-4 shadow-sm sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Communities Network</h1>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
              Discover communities, join discussions, and follow events in one professional feed.
            </p>
          </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                <FiUsers size={11} />
                <span className="font-medium">Your communities:</span>
                <span className="tabular-nums">{myCommunitiesCount}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                <FiCompass size={11} />
                <span className="font-medium">All communities:</span>
                <span className="tabular-nums">{totalCommunities}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
                <FiMessageSquare size={11} />
                <span className="font-medium">Feed items:</span>
                <span className="tabular-nums">{mixedFeed.length}</span>
              </span>
            </div>

              <div className="grid w-full gap-2 sm:grid-cols-[minmax(0,1fr),auto] lg:w-auto">
                <div />
                <div className="sm:w-auto">
                  <Button
                    onClick={() => navigate(!hasOwnedCommunities ? "/communities/manage?showCreate=1" : "/communities/manage")}
                    className="h-9 w-full rounded-full bg-slate-900 px-4 text-xs text-white hover:bg-slate-800 sm:w-auto"
                  >
                    Create Community
                  </Button>
                </div>
              </div>
          </div>
        </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">

          <div className="space-y-4 lg:col-span-3 lg:space-y-5 min-w-0">
            {/* Topics section removed per request */}

            <Section
              title="Your Communities"
              icon={<FiUsers size={16} />}
            >
              {loadingCommunities ? (
                <div className="flex items-center justify-center py-8">
                  <FiLoader className="h-5 w-5 text-slate-400 animate-spin" />
                </div>
              ) : myCommunities.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-5 text-center text-xs text-slate-500">
                  You have not joined a community yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMyCommunities.map((c) => (
                    <CommunityCard
                      key={c._id}
                      c={c}
                      action={
                        isOwner(c) ? (
                          <Link to={`/communities/${c._id}?view=admin`} className="w-full sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-full rounded-lg border-slate-200 px-3 text-xs text-slate-700 sm:w-auto"
                            >
                              Manage
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-full rounded-lg border-slate-200 px-3 text-xs text-slate-600  sm:w-auto"
                            onClick={() => handleLeave(c._id)}
                          >
                            Leave
                          </Button>
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </Section>

            <Section title="Discover" icon={<FiCompass size={16} />}>
              {loadingCommunities ? (
                <div className="flex items-center justify-center py-8">
                  <FiLoader className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : filteredDiscoverCommunities.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-5 text-center text-xs text-slate-500">
                  No additional communities match your current filters.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDiscoverCommunities.map((community) => (
                    <CommunityCard
                      key={community._id}
                      c={community}
                      action={
                        isAuthenticated ? (
                          <Button
                            size="sm"
                            className="h-8 w-full rounded-lg bg-slate-900 px-3 text-xs text-white hover:bg-slate-800 sm:w-auto"
                            onClick={() => handleJoin(community._id)}
                          >
                            Join
                          </Button>
                        ) : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </Section>
          </div>

          <div className="space-y-4 lg:col-span-6 lg:space-y-5 min-w-0">
            <Section title="Community Activity" icon={<FiTrendingUp size={16} />}>
              {(loadingFeedPosts || loadingEvents || loadingFeedJobs || loadingFeedArticles || loadingFeedProducts) ? (
                <div className="flex items-center justify-center py-10">
                  <FiLoader className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : mixedFeed.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <FiMessageSquare className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                  <p className="text-sm font-medium text-slate-500">No activity yet</p>
                  <p className="mt-1 text-xs text-slate-400">Posts, events, jobs, articles, and products from all communities will appear here.</p>
                </div>
              ) : (
                <PostsEventsList
                  feed={mixedFeed}
                  loading={loadingFeedPosts || loadingEvents || loadingFeedJobs || loadingFeedArticles || loadingFeedProducts}
                  feedPosts={feedPosts}
                  currentUserId={currentUserId}
                  togglingEvents={togglingEvents}
                  formatRelative={formatRelative}
                  formatDate={formatDate}
                  communityNameById={communityNameById}
                  onLikePost={handleLikePost}
                  onRepost={handleRepost}
                  onOpenComments={openCommentsForPost}
                  onAddComment={handleAddComment}
                  onAddReply={handleReply}
                  onJoinEvent={handleJoinEvent}
                />
              )}
            </Section>
          </div>

          <div className="space-y-4 lg:col-span-3 lg:space-y-5 lg:pl-2 lg:sticky lg:top-24 lg:self-start min-w-0">
            <Section title="Local Leaderboard" icon={<FiTrendingUp size={16} />}>
              {loadingLeaderboard ? (
                <div className="flex items-center justify-center py-10">
                  <FiLoader className="h-5 w-5 text-slate-400 animate-spin" />
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <FiTrendingUp size={28} className="mb-2 text-slate-300" />
                  <p className="text-sm text-slate-400">No leaderboard data available yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(leaderboard.length > 0 ? leaderboard : (function(){
                    // fallback: build simple leaderboard from recent feed posts (local activity)
                    const counts: Record<string, { user: any; count: number }> = {};
                    (feedPosts || []).forEach((p) => {
                      const author: any = p.authorId || {};
                      const rawId = author && (author._id ?? author) ? (author._id ?? author) : `anon-${p._id}`;
                      const id = String(rawId);
                      const name = (typeof author === 'object' && author?.name) ? author.name : (typeof author === 'string' ? author : 'Unknown');
                      const avatar = (typeof author === 'object' && author?.avatar) ? author.avatar : undefined;
                      if (!counts[id]) counts[id] = { user: { _id: id, name: name || 'Unknown', avatar }, count: 0 };
                      counts[id].count += 1;
                    });
                    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10).map((c) => ({ userId: c.user, reputation: { localTrustScore: c.count } }));
                  })()).map((item: any, index: number) => {
                    const freelancer = item.userId;
                    const localScore = item.reputation?.localTrustScore ?? 0;
                    const hoverUser: UserHoverCardData = {
                      id: freelancer._id,
                      name: freelancer.name || "Unknown",
                      avatarUrl: freelancer.avatar,
                      city: freelancer.location?.city,
                      state: freelancer.location?.state,
                      country: freelancer.location?.country,
                      rating: item.reputation?.overallScore,
                      projectImages: (freelancer.portfolio || [])
                        .map((p: any) => p.images?.[0] || p.imageUrl || "")
                        .filter((url: string) => Boolean(url)),
                    };

                    return (
                      <div
                        key={freelancer._id || `leaderboard-${index}`}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-150"
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${rankStyle(index)}`}>
                          {index + 1}
                        </div>
                        <Avatar src={freelancer.avatar} name={freelancer.name} />
                        <div className="flex-1 min-w-0">
                          <UserHoverCard user={hoverUser}>
                            <div>
                              <Link
                                to={`/freelancers/${freelancer._id}`}
                                className="text-xs sm:text-sm font-semibold text-slate-900 hover:underline truncate block"
                              >
                                {freelancer.name || "Anonymous"}
                              </Link>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                <FiMapPin size={9} />
                                <span className="truncate">{freelancer.location?.city || "Unknown"}</span>
                              </div>
                            </div>
                          </UserHoverCard>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-slate-900 tabular-nums">{localScore}</p>
                          <p className="text-[9px] text-slate-400 uppercase tracking-wide font-medium leading-tight">Trust</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>

            {isAuthenticated && myRank && (
              <Section title="Your Rank" icon={<HiOutlineSparkles size={16} />}>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="text-[11px] text-slate-500">Current local rank</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {typeof myRank.rank === "number" ? `#${myRank.rank}` : "Unranked"}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                      <p className="text-slate-400">Local score</p>
                      <p className="font-semibold text-slate-900">{myRank.localScore ?? "-"}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                      <p className="text-slate-400">Global score</p>
                      <p className="font-semibold text-slate-900">{myRank.globalScore ?? "-"}</p>
                    </div>
                  </div>
                </div>
              </Section>
            )}

          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Communities;