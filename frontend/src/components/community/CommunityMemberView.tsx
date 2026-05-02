import { useMemo, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import PostsEventsList from "../common/PostsEventsList";
import Avatar from "@/components/Avatar";
import { FiHeart, FiRepeat } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { resolveAvatarSrc } from "@/lib/avatar";
import {
  FiCalendar,
  FiClock,
  FiLoader,
  FiMessageSquare,
  FiLink,
  FiMoreHorizontal,
  FiChevronDown,
  FiChevronUp,
  FiTrendingUp,
} from "react-icons/fi";
import type { Community, CommunityPostItem } from "./types";

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

interface CommunityMemberViewProps {
  community: Community;
  headerMembers: number;
  posts: CommunityPostItem[];
  postsLoading: boolean;
  featuredMembers: any[];
  formatRelativeTime: (iso: string) => string;
  onCommunityUpdated: (community: Community) => void;
  onRefreshPosts?: () => void;
}

type MemberTab = "home" | "about" | "posts" | "people";

const HOME_POSTS_INITIAL = 5;
const MEMBERS_PREVIEW_COUNT = 3;

type CommunityFeedItem =
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
      event: any;
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

const normalizeCommunityId = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    const id = (value as { _id?: string })._id;
    return typeof id === "string" ? id : "";
  }
  return "";
};

const CommunityMemberView = ({
  community,
  headerMembers,
  posts,
  postsLoading,
  featuredMembers,
  formatRelativeTime,
  onCommunityUpdated,
  onRefreshPosts,
}: CommunityMemberViewProps) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<MemberTab>("home");
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [homePostsLimit, setHomePostsLimit] = useState(HOME_POSTS_INITIAL);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [communityEvents, setCommunityEvents] = useState<any[]>([]);
  const [communityJobs, setCommunityJobs] = useState<CommunityJobItem[]>([]);
  const [communityArticles, setCommunityArticles] = useState<CommunityArticleItem[]>([]);
  const [communityProducts, setCommunityProducts] = useState<CommunityProductItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [memberFollowLoading, setMemberFollowLoading] = useState<Record<string, boolean>>({});

  const currentUserId = (user as any)?._id;
  const members = Array.isArray(community.members) ? community.members : [];
  const ownerId = String((community.ownerId as any)?._id || community.ownerId || "");
  const ownerName = (community.ownerId as any)?.name || "Page owner";

  const isMember = useMemo(
    () => members.some((member: any) => String(member?._id || member?.id || member) === String(currentUserId || "")),
    [members, currentUserId],
  );

  const getPostEngagementScore = (post: CommunityPostItem) => {
    const likesValue = (post as any)?.likes;
    const commentsValue = (post as any)?.comments;

    const likesCount = Array.isArray(likesValue)
      ? likesValue.length
      : Number((post as any)?.likesCount ?? (post as any)?.likeCount ?? 0);

    const commentsCount = Array.isArray(commentsValue)
      ? commentsValue.length
      : Number((post as any)?.commentsCount ?? (post as any)?.commentCount ?? 0);

    return likesCount + commentsCount;
  };

  const sortedPostsByEngagement = useMemo(
    () =>
      [...posts].sort((a, b) => {
        const scoreDifference = getPostEngagementScore(b) - getPostEngagementScore(a);
        if (scoreDifference !== 0) return scoreDifference;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }),
    [posts],
  );

  // Home tab: top posts by engagement, paginated
  const homePostsVisible = useMemo(
    () => sortedPostsByEngagement.slice(0, homePostsLimit),
    [sortedPostsByEngagement, homePostsLimit],
  );
  const hasMoreHomePosts = homePostsLimit < sortedPostsByEngagement.length;

  const communityFeed = useMemo<CommunityFeedItem[]>(() => {
    const postItems = sortedPostsByEngagement.slice(0, homePostsLimit).map((post) => ({
      type: "post" as const,
      id: `post-${post._id}`,
      timestamp: post.createdAt,
      communityId: post.communityId || String(community._id),
      post,
    }));

    const eventItems = communityEvents.map((event: any) => ({
      type: "event" as const,
      id: `event-${event._id}`,
      timestamp: event.date,
      communityId: normalizeCommunityId(event.communityId) || String(community._id),
      event,
    }));

    const jobItems = communityJobs.map((job) => ({
      type: "job" as const,
      id: `job-${job._id}`,
      timestamp: job.createdAt || job._id,
      communityId: normalizeCommunityId(job.communityId) || String(community._id),
      job,
    }));

    const articleItems = communityArticles.map((article) => ({
      type: "article" as const,
      id: `article-${article._id}`,
      timestamp: article.createdAt || article._id,
      communityId: normalizeCommunityId(article.communityId) || String(community._id),
      article,
    }));

    const productItems = communityProducts.map((product) => ({
      type: "product" as const,
      id: `product-${product._id}`,
      timestamp: product.createdAt || product._id,
      communityId: normalizeCommunityId(product.communityId) || String(community._id),
      product,
    }));

    return [...postItems, ...eventItems, ...jobItems, ...articleItems, ...productItems].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [sortedPostsByEngagement, homePostsLimit, communityEvents, communityJobs, communityArticles, communityProducts, community._id]);

  const followingIds = useMemo(
    () => (Array.isArray((user as any)?.following) ? (user as any).following.map((id: any) => String(id)) : []),
    [user],
  );

  // People sidebar: show limited or all
  const visibleMembers = useMemo(
    () => (showAllMembers ? featuredMembers : featuredMembers.slice(0, MEMBERS_PREVIEW_COUNT)),
    [featuredMembers, showAllMembers],
  );

  const ownedCommunity = useMemo(() => {
    if (!currentUserId) return null;
    return (
      myCommunities.find((communityPage) => String((communityPage as any).ownerId?._id || (communityPage as any).ownerId || "") === String(currentUserId)) ||
      null
    );
  }, [currentUserId, myCommunities]);

  useEffect(() => {
    const loadMyCommunities = async () => {
      if (!isAuthenticated) {
        setMyCommunities([]);
        return;
      }

      try {
        const res = await api.getMyCommunities();
        const payload: any = (res as any).data || res;
        const list = payload.communities || payload.data?.communities || payload.data || [];
        setMyCommunities(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error("Failed to load owned communities", error);
        setMyCommunities([]);
      }
    };

    void loadMyCommunities();
  }, [isAuthenticated]);

  const handleToggleMembership = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      setMembershipLoading(true);
      if (isMember) {
        await api.leaveCommunity(community._id);
      } else {
        await api.joinCommunity(community._id);
      }

      const refreshed = await api.getCommunityById(community._id);
      const payload: any = (refreshed as any).data || refreshed;
      const nextCommunity = payload.community || payload.data?.community || payload.data || payload;
      onCommunityUpdated(nextCommunity as Community);

      toast({ title: isMember ? "Unfollowed page" : "Following page" });
    } catch (error: any) {
      console.error(error);
      const message =
        error?.message ||
        (isMember
          ? "Could not unfollow this page right now."
          : "Could not follow this page right now.");
      toast({ title: message, variant: "destructive" });
    } finally {
      setMembershipLoading(false);
    }
  };

  const handleLikePost = async (post: CommunityPostItem) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await api.toggleCommunityPostLike(community._id as string, post._id as string);
      if (onRefreshPosts) await onRefreshPosts();
      toast({ title: 'Updated like' });
    } catch (error) {
      console.error('Like failed', error);
      toast({ title: 'Could not like post', variant: 'destructive' });
    }
  };

  const handleRepost = async (post: CommunityPostItem) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!ownedCommunity) {
      toast({ title: 'Create a page to do post', variant: 'destructive' });
      return;
    }

    const latest = posts.find((item) => item._id === post._id) || post;
    const hasReposted = Boolean(
      currentUserId &&
      Array.isArray((latest as any).reposts) &&
      (latest as any).reposts.some((id: any) => String(id) === String(currentUserId))
    );

    try {
      if (hasReposted) {
        await api.repostCommunityPost(community._id, post._id);
      } else {
        await api.createCommunityPost(ownedCommunity._id, {
          content: post.content,
          images: Array.isArray(post.images) ? post.images : [],
          links: Array.isArray(post.links) ? post.links : [],
          repostOf: post._id,
        });
        await api.repostCommunityPost(community._id, post._id);
      }
      toast({ title: hasReposted ? 'Repost removed' : 'Reposted to your page' });
      if (onRefreshPosts) await onRefreshPosts();
    } catch (error) {
      console.error('Repost failed', error);
      toast({ title: 'Could not repost', variant: 'destructive' });
    }
  };

  const openComments = async (post: CommunityPostItem) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  };

  const handleAddComment = async (postId: string, communityId: string, content: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await api.commentCommunityPost(communityId as string, postId as string, content);
      if (onRefreshPosts) await onRefreshPosts();
      toast({ title: 'Comment posted' });
    } catch (error) {
      console.error('Comment failed', error);
      toast({ title: 'Could not post comment', variant: 'destructive' });
      throw error;
    }
  };

  const handleAddReply = async (postId: string, communityId: string, commentId: string, content: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await api.replyCommunityPostComment(communityId as string, postId as string, commentId, content);
      if (onRefreshPosts) await onRefreshPosts();
      toast({ title: 'Reply posted' });
    } catch (error) {
      console.error('Reply failed', error);
      toast({ title: 'Could not post reply', variant: 'destructive' });
      throw error;
    }
  };

  // Handlers for jobs, articles, products likes and comments
  const handleLikeItem = async (type: string, item: any) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      if (type === 'job') {
        await api.toggleCommunityJobLike(item._id);
      } else if (type === 'article') {
        await api.toggleCommunityArticleLike(item._id);
      } else if (type === 'product') {
        await api.toggleCommunityProductLike(item._id);
      }
      if (onRefreshPosts) await onRefreshPosts();
      toast({ title: 'Updated like' });
    } catch (error) {
      console.error('Like failed', error);
      toast({ title: 'Could not like item', variant: 'destructive' });
    }
  };

  const handleAddCommentItem = async (type: string, itemId: string, communityId: string, content: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      if (type === 'job') {
        await api.commentCommunityJob(itemId, content);
      } else if (type === 'article') {
        await api.commentCommunityArticle(itemId, content);
      } else if (type === 'product') {
        await api.commentCommunityProduct(itemId, content);
      }
      if (onRefreshPosts) await onRefreshPosts();
      toast({ title: 'Comment posted' });
    } catch (error) {
      console.error('Comment failed', error);
      toast({ title: 'Could not post comment', variant: 'destructive' });
      throw error;
    }
  };

  const handleAddReplyItem = async (type: string, itemId: string, communityId: string, commentId: string, content: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      if (type === 'job') {
        await api.replyCommunityJobComment(itemId, commentId, content);
      } else if (type === 'article') {
        await api.replyCommunityArticleComment(itemId, commentId, content);
      } else if (type === 'product') {
        await api.replyCommunityProductComment(itemId, commentId, content);
      }
      if (onRefreshPosts) await onRefreshPosts();
      toast({ title: 'Reply posted' });
    } catch (error) {
      console.error('Reply failed', error);
      toast({ title: 'Could not post reply', variant: 'destructive' });
      throw error;
    }
  };

  const handleRepostItem = async (type: string, item: any) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!ownedCommunity) {
      toast({ title: 'Create a page to repost', variant: 'destructive' });
      return;
    }

    toast({ title: 'Repost feature for items coming soon', variant: 'default' });
  };

  const handleMessageOwner = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!ownerId) {
      toast({ title: "Owner not available", variant: "destructive" });
      return;
    }
    navigate(`/messages?targetUserId=${encodeURIComponent(ownerId)}`);
  };

  const getEntityId = (entity: any) => String(entity?._id || entity?.userId?._id || entity?.userId || entity?.id || entity || "");

  const getProfileLink = (entity: any) => {
    const id = getEntityId(entity);
    const role = entity?.role || entity?.accountType || entity?.userId?.role;
    if (!id) return "#";
    if (role === "freelancer") return `/freelancers/${id}`;
    if (role === "client" || role === "company") return `/clients/${id}`;
    return `/clients/${id}`;
  };

  const handleToggleMemberFollow = async (member: any) => {
    const memberId = getEntityId(member);
    if (!memberId || String(memberId) === String(currentUserId || "")) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const isFollowing = followingIds.includes(String(memberId));
    setMemberFollowLoading((prev) => ({ ...prev, [memberId]: true }));
    try {
      if (isFollowing) {
        await api.unfollowUser(memberId);
        toast({ title: 'Unfollowed user' });
      } else {
        await api.followUser(memberId);
        toast({ title: 'Following user' });
      }
      await refreshUser?.();
    } catch (error) {
      console.error('Failed to toggle follow', error);
      toast({ title: 'Could not update follow', variant: 'destructive' });
    } finally {
      setMemberFollowLoading((prev) => ({ ...prev, [memberId]: false }));
    }
  };
  const ownerProfileLink = useMemo(() => getProfileLink(community.ownerId), [community.ownerId]);

  const renderAbout = () => (
    <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 md:p-5">
      <p className="mb-2 sm:mb-3 text-sm sm:text-base md:text-lg font-semibold text-slate-900">
        About this page
      </p>
      <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-slate-500">
        <p className="break-words">
          {community.description || community.tagline || "No description added yet."}
        </p>
        <p className="break-words">
          {community.industry || community.category || "Community"}
        </p>
        {community.website && (
          <a
            href={
              /^https?:\/\//i.test(community.website)
                ? community.website
                : `https://${community.website}`
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[#0a66c2] hover:underline break-all text-xs sm:text-sm"
          >
            <FiLink size={12} className="shrink-0" />
            <span className="truncate max-w-[180px] sm:max-w-full">
              {community.website}
            </span>
          </a>
        )}
      </div>
    </div>
  );

  const renderPeople = () => (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500">
      <p className="font-medium text-slate-700">People also follow</p>
      <div className="mt-3 space-y-3">
        {featuredMembers.length > 0 ? (
          <>
            {visibleMembers.map((member: any) => {
              const name = member?.name || member?.fullName || "Member";
              const memberId = getEntityId(member);
              const isSelfMember = String(memberId) === String(currentUserId || "");
              const isFollowingMember = followingIds.includes(memberId);
              const isFollowMutating = Boolean(memberFollowLoading[memberId]);
              return (
                <div key={member?._id || member?.userId || name} className="flex items-start gap-2 sm:gap-2.5">
                  <div className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
                    <img src={resolveAvatarSrc(member?.avatar)} alt={name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={getProfileLink(member)} className="block truncate text-xs sm:text-sm font-medium text-slate-900 hover:underline">{name}</Link>
                    <p className="truncate text-[11px] sm:text-xs text-slate-500">{member?.headline || "Suggested follow"}</p>
                    {!isSelfMember && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void handleToggleMemberFollow(member)}
                        disabled={isFollowMutating}
                        className="mt-1.5 sm:mt-2 h-6 sm:h-7 rounded-full border-slate-300 px-2.5 sm:px-3 text-[10px] sm:text-[11px]"
                      >
                        {isFollowMutating ? "..." : isFollowingMember ? "Following" : "Follow"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Show more / Show less toggle */}
            {featuredMembers.length > MEMBERS_PREVIEW_COUNT && (
              <button
                type="button"
                onClick={() => setShowAllMembers((prev) => !prev)}
                className="mt-1 flex w-full items-center justify-center gap-1 rounded-md py-1.5 text-[11px] sm:text-xs font-medium text-[#0a66c2] hover:bg-blue-50 transition-colors"
              >
                {showAllMembers ? (
                  <>
                    <FiChevronUp size={13} />
                    Show less
                  </>
                ) : (
                  <>
                    <FiChevronDown size={13} />
                    Show {featuredMembers.length - MEMBERS_PREVIEW_COUNT} more
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          <p className="text-xs text-slate-400">Suggestions will appear here.</p>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2 text-slate-400">
        <FiCalendar size={13} />
        <span>{headerMembers} followers</span>
      </div>
    </div>
  );

  // Home tab: top-engaged posts with "Show more" pagination
  const renderHomePosts = () => {
    if (postsLoading) {
      return (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white py-10">
          <FiLoader size={20} className="animate-spin text-slate-400" />
        </div>
      );
    }

    if (sortedPostsByEngagement.length === 0) {
      return (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
          No posts yet.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Top posts label */}
        <div className="flex items-center gap-1.5 px-1 text-xs font-medium text-slate-500">
          <FiTrendingUp size={13} className="text-emerald-600" />
          <span>Top posts by engagement</span>
        </div>

        <PostsEventsList
          feed={communityFeed}
          loading={postsLoading || activityLoading || jobsLoading || articlesLoading || productsLoading}
          feedPosts={homePostsVisible}
          currentUserId={currentUserId}
          formatRelative={formatRelativeTime}
          onLikePost={handleLikePost}
          onRepost={handleRepost}
          onOpenComments={openComments}
          onAddComment={handleAddComment}
          onAddReply={handleAddReply}
          onLikeItem={handleLikeItem}
          onRepostItem={handleRepostItem}
          onAddCommentItem={handleAddCommentItem}
          onAddReplyItem={handleAddReplyItem}
        />

        {/* Show more button */}
        {hasMoreHomePosts && (
          <button
            type="button"
            onClick={() => setHomePostsLimit((prev) => prev + HOME_POSTS_INITIAL)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-xs sm:text-sm font-medium text-[#0a66c2] hover:bg-blue-50 transition-colors"
          >
            <FiChevronDown size={15} />
            Show more posts ({sortedPostsByEngagement.length - homePostsLimit} remaining)
          </button>
        )}

        {/* Collapse back option once expanded beyond initial */}
        {homePostsLimit > HOME_POSTS_INITIAL && !hasMoreHomePosts && (
          <button
            type="button"
            onClick={() => setHomePostsLimit(HOME_POSTS_INITIAL)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-xs sm:text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <FiChevronUp size={15} />
            Show less
          </button>
        )}
      </div>
    );
  };

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setActivityLoading(true);
        const res = await api.getEvents();
        const payload: any = (res as any).data || res;
        const events = payload.events || payload.data?.events || payload.data || [];
        setCommunityEvents(
          (Array.isArray(events) ? events : []).filter(
            (ev: any) => normalizeCommunityId(ev.communityId) === String(community._id),
          ),
        );
      } catch (error) {
        console.error('Failed to load community events', error);
        setCommunityEvents([]);
      } finally {
        setActivityLoading(false);
      }
    };

    void loadEvents();
  }, [community._id]);

  useEffect(() => {
    const loadExtraContent = async () => {
      try {
        setJobsLoading(true);
        setArticlesLoading(true);
        setProductsLoading(true);

        const [jobsRes, articlesRes, productsRes] = await Promise.allSettled([
          api.getCommunityJobs({ communityId: community._id, limit: 50, includeImages: true, includeLinks: true }),
          api.getCommunityArticles({ communityId: community._id, limit: 50, includeImages: true, includeLinks: true }),
          api.getCommunityProducts({ communityId: community._id, limit: 50, includeImages: true, includeLinks: true }),
        ]);

        const jobsPayload: any = jobsRes.status === "fulfilled" ? (jobsRes.value as any).data || jobsRes.value || {} : {};
        const articlesPayload: any = articlesRes.status === "fulfilled" ? (articlesRes.value as any).data || articlesRes.value || {} : {};
        const productsPayload: any = productsRes.status === "fulfilled" ? (productsRes.value as any).data || productsRes.value || {} : {};

        const jobs = jobsPayload.jobs || jobsPayload.data?.jobs || jobsPayload.data || [];
        const articles = articlesPayload.articles || articlesPayload.data?.articles || articlesPayload.data || [];
        const products = productsPayload.products || productsPayload.data?.products || productsPayload.data || [];

        const communityId = String(community._id);
        setCommunityJobs(
          Array.isArray(jobs)
            ? jobs
                .map((item: any) => ({
                  ...item,
                  images: Array.isArray(item.images) ? item.images : [],
                  links: Array.isArray(item.links) ? item.links : [],
                }))
                .filter((item: any) => normalizeCommunityId(item.communityId) === communityId || String(item.communityId || "") === communityId)
            : []
        );
        setCommunityArticles(
          Array.isArray(articles)
            ? articles
                .map((item: any) => ({
                  ...item,
                  images: Array.isArray(item.images) ? item.images : [],
                  links: Array.isArray(item.links) ? item.links : [],
                }))
                .filter((item: any) => normalizeCommunityId(item.communityId) === communityId || String(item.communityId || "") === communityId)
            : []
        );
        setCommunityProducts(
          Array.isArray(products)
            ? products
                .map((item: any) => ({
                  ...item,
                  images: Array.isArray(item.images) ? item.images : [],
                  links: Array.isArray(item.links) ? item.links : [],
                }))
                .filter((item: any) => normalizeCommunityId(item.communityId) === communityId || String(item.communityId || "") === communityId)
            : []
        );
      } catch (error) {
        console.error("Failed to load community content", error);
        setCommunityJobs([]);
        setCommunityArticles([]);
        setCommunityProducts([]);
      } finally {
        setJobsLoading(false);
        setArticlesLoading(false);
        setProductsLoading(false);
      }
    };

    void loadExtraContent();
  }, [community._id]);

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="relative h-28 sm:h-32 overflow-hidden">
          {community.coverImage ? (
            <img src={community.coverImage} alt={`${community.name} background`} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(90deg,#b7ae9f_0%,#b8aea0_55%,#d7d0c4_55%,#e7e2d7_100%)]" />
          )}
        </div>
        <div className="relative px-3 pb-3 sm:px-4 sm:pb-3 md:px-6">
          <div className="absolute -top-10 sm:-top-12 h-20 w-20 sm:h-24 sm:w-24 overflow-hidden border-4 border-white bg-slate-100 shadow-sm">
            {community.logo ? (
              <img src={community.logo} alt={`${community.name} logo`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#d9d2c7_0%,#c1b5a1_50%,#b1c0d0_100%)] text-xl sm:text-2xl font-semibold text-white">
                {community.name?.charAt(0)?.toUpperCase() || "C"}
              </div>
            )}
          </div>

          <div className="pt-12 sm:pt-14 sm:pl-28">
            <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-xl sm:text-2xl md:text-[28px] font-semibold leading-tight text-slate-900">{community.name}</h1>
                <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500">
                  {community.industry || community.category || "Community"}
                  {headerMembers ? ` · ${headerMembers} follower${headerMembers > 1 ? "s" : ""}` : ""}
                </p>
                {community.tagline && <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-600 line-clamp-2">{community.tagline}</p>}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-full bg-[#0a66c2] px-3 sm:px-4 text-xs sm:text-sm text-white hover:bg-[#004182]"
                  onClick={handleToggleMembership}
                  disabled={membershipLoading}
                >
                  {membershipLoading ? <FiLoader size={13} className="animate-spin" /> : isMember ? "Following" : "Follow"}
                </Button>
                <Button type="button" size="sm" variant="outline" className="h-8 rounded-full border-[#0a66c2] px-3 sm:px-4 text-xs sm:text-sm text-[#0a66c2] hover:bg-blue-700" onClick={handleMessageOwner}>
                  Message
                </Button>
               
              </div>
            </div>

            <div className="mt-3 sm:mt-4 flex flex-wrap gap-4 sm:gap-6 border-b border-slate-200 text-sm">
              {[
                { id: "home", label: "Home" },
                { id: "about", label: "About" },
                { id: "posts", label: "Posts" },
                { id: "people", label: "People" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as MemberTab)}
                  className={`pb-2 text-xs sm:text-sm ${
                    activeTab === item.id
                      ? "border-b-2 border-emerald-700 font-semibold text-emerald-700"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-8">
          {/* HOME: top posts by engagement with Show More */}
          {activeTab === "home" && renderHomePosts()}

          {/* POSTS: all posts, original behaviour */}
          {activeTab === "posts" && (
            <PostsEventsList
              posts={posts}
              loading={postsLoading}
              feedPosts={posts}
              currentUserId={currentUserId}
              formatRelative={formatRelativeTime}
              onLikePost={handleLikePost}
              onRepost={handleRepost}
              onOpenComments={openComments}
              onAddComment={handleAddComment}
              onAddReply={handleAddReply}
              onLikeItem={handleLikeItem}
              onRepostItem={handleRepostItem}
              onAddCommentItem={handleAddCommentItem}
              onAddReplyItem={handleAddReplyItem}
            />
          )}

          {activeTab === "about" && renderAbout()}
          {activeTab === "people" && renderPeople()}
        </div>

        <div className="space-y-3 lg:col-span-4">
          {activeTab !== "about" && renderAbout()}
          {activeTab !== "people" && renderPeople()}

          <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4 text-xs text-slate-500">
            <p className="font-medium text-slate-700">Page owner</p>
            <div className="mt-2 flex items-center gap-3">
              <Link to={ownerProfileLink} className="flex min-w-0 items-center gap-3">
                <Avatar
                  src={resolveAvatarSrc((community.ownerId as any)?.avatar)}
                  name={ownerName}
                  size={40}
                  className="h-9 w-9 sm:h-10 sm:w-10"
                />
                <span className="truncate text-xs sm:text-sm font-medium text-slate-900 hover:underline">{ownerName}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityMemberView;