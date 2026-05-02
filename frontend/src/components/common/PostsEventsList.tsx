import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiHeart, FiMessageSquare, FiRepeat, FiCalendar, FiMapPin, FiChevronLeft, FiChevronRight, FiEdit2, FiTrash2 } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { resolveAvatarSrc } from "@/lib/avatar";
import api from "@/lib/api";
import Avatar from "@/components/Avatar";

interface EventItem {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  date: string;
  attendees?: any[];
  communityId?: string | { _id?: string };
  images?: string[];
  links?: string[];
}

interface CommunityPostItem {
  _id: string;
  communityId: string;
  content: string;
  images?: string[];
  links?: string[];
  authorId: { _id?: string; name?: string; avatar?: string } | any;
  createdAt: string;
  likes?: any[];
  reposts?: any[];
  comments?: any[];
}

interface JobItem {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  salary?: string;
  type?: string;
  communityId?: string | { _id?: string };
  images?: string[];
  links?: string[];
  createdAt?: string;
}

interface ArticleItem {
  _id: string;
  title: string;
  content?: string;
  images?: string[];
  links?: string[];
  communityId?: string | { _id?: string };
  createdAt?: string;
}

interface ProductItem {
  _id: string;
  title: string;
  description?: string;
  price?: string | number;
  images?: string[];
  links?: string[];
  communityId?: string | { _id?: string };
  createdAt?: string;
}

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
      job: JobItem;
    }
  | {
      type: "article";
      id: string;
      timestamp: string;
      communityId: string;
      article: ArticleItem;
    }
  | {
      type: "product";
      id: string;
      timestamp: string;
      communityId: string;
      product: ProductItem;
    };

interface Props {
  feed?: FeedItem[];
  posts?: CommunityPostItem[];
  loading?: boolean;
  currentUserId?: string;
  togglingEvents?: string[];
  formatRelative?: (iso: string) => string;
  formatDate?: (iso: string) => string;
  communityNameById?: Map<string, string>;
  feedPosts?: CommunityPostItem[];
  onLikePost?: (post: CommunityPostItem) => void;
  onRepost?: (post: CommunityPostItem) => void;
  onOpenComments?: (post: CommunityPostItem) => void;
  onAddComment?: (postId: string, communityId: string, content: string) => Promise<void>;
  onAddReply?: (postId: string, communityId: string, commentId: string, content: string) => Promise<void>;
  onJoinEvent?: (eventId: string, attending: boolean) => void;
  // Admin / moderation callbacks
  onEditPost?: (post: CommunityPostItem) => void;
  onDeletePost?: (post: CommunityPostItem) => void;
  onEditEvent?: (event: EventItem) => void;
  onDeleteEvent?: (event: EventItem) => void;
  onEditJob?: (job: JobItem) => void;
  onDeleteJob?: (job: JobItem) => void;
  onEditArticle?: (article: ArticleItem) => void;
  onDeleteArticle?: (article: ArticleItem) => void;
  onEditProduct?: (product: ProductItem) => void;
  onDeleteProduct?: (product: ProductItem) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  isAdminView?: boolean;
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

const PostsEventsList = ({
  feed = [],
  posts = [],
  loading,
  currentUserId,
  togglingEvents = [],
  formatRelative,
  formatDate,
  communityNameById,
  feedPosts = [],
  onLikePost,
  onRepost,
  onOpenComments,
  onAddComment,
  onAddReply,
  onJoinEvent,
  onEditJob,
  onDeleteJob,
  onEditArticle,
  onDeleteArticle,
  onEditProduct,
  onDeleteProduct,
  onEditPost,
  onDeletePost,
  onEditEvent,
  onDeleteEvent,
  onDeleteComment,
  isAdminView = false,
}: Props) => {
  const [activeFilter, setActiveFilter] = useState<"all" | "posts" | "events" | "jobs" | "articles" | "products">("all");
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [imageCarouselIndex, setImageCarouselIndex] = useState<Record<string, number>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [loadingComment, setLoadingComment] = useState<string | null>(null);
  const [fallbackFeed, setFallbackFeed] = useState<FeedItem[]>([]);
  const [loadingFallbackFeed, setLoadingFallbackFeed] = useState(false);

  const shouldLoadFallbackFeed = (!feed || feed.length === 0);

  useEffect(() => {
    if (!shouldLoadFallbackFeed) {
      setFallbackFeed([]);
      setLoadingFallbackFeed(false);
      return;
    }

    let cancelled = false;

    const loadFallbackFeed = async () => {
      setLoadingFallbackFeed(true);
      try {
        const [eventsRes, jobsRes, articlesRes, productsRes] = await Promise.allSettled([
          api.getEvents(),
          api.getCommunityJobs({ limit: 50 }),
          api.getCommunityArticles({ limit: 50 }),
          api.getCommunityProducts({ limit: 50 }),
        ]);

        if (cancelled) return;

        const eventPayload: any = eventsRes.status === "fulfilled" ? (eventsRes.value as any).data || eventsRes.value || {} : {};
        const jobsPayload: any = jobsRes.status === "fulfilled" ? (jobsRes.value as any).data || jobsRes.value || {} : {};
        const articlesPayload: any = articlesRes.status === "fulfilled" ? (articlesRes.value as any).data || articlesRes.value || {} : {};
        const productsPayload: any = productsRes.status === "fulfilled" ? (productsRes.value as any).data || productsRes.value || {} : {};

        const rawEvents = eventPayload.events || eventPayload.data?.events || eventPayload.data || [];
        const rawJobs = jobsPayload.jobs || jobsPayload.data?.jobs || jobsPayload.data || [];
        const rawArticles = articlesPayload.articles || articlesPayload.data?.articles || articlesPayload.data || [];
        const rawProducts = productsPayload.products || productsPayload.data?.products || productsPayload.data || [];

        const visibleCommunityIds = new Set(
          (posts || [])
            .map((post) => normalizeCommunityId(post.communityId))
            .filter(Boolean),
        );

        const includeItem = (communityId: string) => {
          if (visibleCommunityIds.size === 0) return true;
          if (!communityId) return true;
          return visibleCommunityIds.has(communityId);
        };

        const postItems: FeedItem[] = (posts || []).map((post) => ({
          type: "post",
          id: `post-${post._id}`,
          timestamp: post.createdAt,
          communityId: normalizeCommunityId(post.communityId),
          post,
        }));

        const eventItems: FeedItem[] = (Array.isArray(rawEvents) ? rawEvents : [])
          .map((event: EventItem) => {
            const communityId = normalizeCommunityId(event.communityId);
            return {
              type: "event" as const,
              id: `event-${event._id}`,
              timestamp: event.date,
              communityId,
              event,
            };
          })
          .filter((item) => includeItem(item.communityId));

        const jobItems: FeedItem[] = (Array.isArray(rawJobs) ? rawJobs : [])
          .map((job: JobItem) => {
            const communityId = normalizeCommunityId(job.communityId);
            return {
              type: "job" as const,
              id: `job-${job._id}`,
              timestamp: job.createdAt || job._id,
              communityId,
              job,
            };
          })
          .filter((item) => includeItem(item.communityId));

        const articleItems: FeedItem[] = (Array.isArray(rawArticles) ? rawArticles : [])
          .map((article: ArticleItem) => {
            const communityId = normalizeCommunityId(article.communityId);
            return {
              type: "article" as const,
              id: `article-${article._id}`,
              timestamp: article.createdAt || article._id,
              communityId,
              article,
            };
          })
          .filter((item) => includeItem(item.communityId));

        const productItems: FeedItem[] = (Array.isArray(rawProducts) ? rawProducts : [])
          .map((product: ProductItem) => {
            const communityId = normalizeCommunityId(product.communityId);
            return {
              type: "product" as const,
              id: `product-${product._id}`,
              timestamp: product.createdAt || product._id,
              communityId,
              product,
            };
          })
          .filter((item) => includeItem(item.communityId));

        const merged = [...postItems, ...eventItems, ...jobItems, ...articleItems, ...productItems].sort((a, b) => {
          const at = new Date(a.timestamp).getTime() || 0;
          const bt = new Date(b.timestamp).getTime() || 0;
          return bt - at;
        });

        setFallbackFeed(merged);
      } catch {
        if (!cancelled) {
          setFallbackFeed((posts || []).map((post) => ({
            type: "post",
            id: `post-${post._id}`,
            timestamp: post.createdAt,
            communityId: normalizeCommunityId(post.communityId),
            post,
          })));
        }
      } finally {
        if (!cancelled) setLoadingFallbackFeed(false);
      }
    };

    void loadFallbackFeed();

    return () => {
      cancelled = true;
    };
  }, [posts, shouldLoadFallbackFeed]);

  const derivedFeed = useMemo<FeedItem[]>(() => {
    if (feed && feed.length > 0) return feed;
    if (fallbackFeed.length > 0) return fallbackFeed;
    if (posts && posts.length > 0) {
      return posts.map((p) => ({ type: "post" as const, id: `post-${p._id}`, timestamp: p.createdAt, communityId: p.communityId || "", post: p }));
    }
    return [];
  }, [feed, fallbackFeed, posts]);

  const isLoading = Boolean(loading || (shouldLoadFallbackFeed && loadingFallbackFeed));

  const visible = useMemo(() => {
    if (activeFilter === "all") return derivedFeed;
    if (activeFilter === "posts") return derivedFeed.filter((i) => i.type === "post");
    if (activeFilter === "events") return derivedFeed.filter((i) => i.type === "event");
    if (activeFilter === "jobs") return derivedFeed.filter((i) => i.type === "job");
    if (activeFilter === "articles") return derivedFeed.filter((i) => i.type === "article");
    return derivedFeed.filter((i) => i.type === "product");
  }, [derivedFeed, activeFilter]);

  const handleCommentSubmit = async (postId: string, communityId: string) => {
    const content = (commentInput[postId] || "").trim();
    if (!content || !onAddComment) return;
    try {
      setLoadingComment(postId);
      await onAddComment(postId, communityId, content);
      setCommentInput((prev) => ({ ...prev, [postId]: "" }));
    } finally {
      setLoadingComment(null);
    }
  };

  const handleReplySubmit = async (postId: string, communityId: string, commentId: string) => {
    const content = (replyInputs[commentId] || "").trim();
    if (!content || !onAddReply) return;
    try {
      setLoadingComment(commentId);
      await onAddReply(postId, communityId, commentId, content);
      setReplyInputs((prev) => ({ ...prev, [commentId]: "" }));
    } finally {
      setLoadingComment(null);
    }
  };

  const getProfileLink = (entity: any) => {
    const id = entity?._id || entity?.id || entity || "";
    const role = entity?.role || entity?.accountType;
    if (!id) return "#";
    if (role === "freelancer") return `/freelancers/${id}`;
    if (role === "client" || role === "company") return `/clients/${id}`;
    return `/freelancers/${id}`;
  };

  const renderAttachmentGallery = (itemId: string, images?: string[], altPrefix = "Attachment") => {
    if (!Array.isArray(images) || images.length === 0) return null;
    const index = imageCarouselIndex[itemId] || 0;

    if (images.length === 1) {
      return (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          <img src={images[0]} alt={`${altPrefix}`} className="w-full object-cover" />
        </div>
      );
    }

    return (
      <div className="mt-3 relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
        <img src={images[index]} alt={`${altPrefix}`} className="w-full object-cover" />
        <button
          type="button"
          onClick={() => setImageCarouselIndex((prev) => ({ ...prev, [itemId]: ((prev[itemId] || 0) - 1 + images.length) % images.length }))}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
          aria-label="Previous image"
        >
          <FiChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => setImageCarouselIndex((prev) => ({ ...prev, [itemId]: ((prev[itemId] || 0) + 1) % images.length }))}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
          aria-label="Next image"
        >
          <FiChevronRight size={18} />
        </button>
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/60 px-2.5 py-1">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setImageCarouselIndex((prev) => ({ ...prev, [itemId]: idx }))}
              className={`h-1.5 rounded-full transition-colors ${idx === index ? "bg-white w-6" : "bg-white/50 w-1.5"}`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <button className={`rounded-full px-2 py-1 ${activeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border'}`} onClick={() => setActiveFilter('all')}>All</button>
          <button className={`rounded-full px-2 py-1 ${activeFilter === 'posts' ? 'bg-slate-900 text-white' : 'bg-white border'}`} onClick={() => setActiveFilter('posts')}>Posts</button>
          <button className={`rounded-full px-2 py-1 ${activeFilter === 'events' ? 'bg-slate-900 text-white' : 'bg-white border'}`} onClick={() => setActiveFilter('events')}>Events</button>
          <button className={`rounded-full px-2 py-1 ${activeFilter === 'jobs' ? 'bg-slate-900 text-white' : 'bg-white border'}`} onClick={() => setActiveFilter('jobs')}>Jobs</button>
          <button className={`rounded-full px-2 py-1 ${activeFilter === 'articles' ? 'bg-slate-900 text-white' : 'bg-white border'}`} onClick={() => setActiveFilter('articles')}>Articles</button>
          <button className={`rounded-full px-2 py-1 ${activeFilter === 'products' ? 'bg-slate-900 text-white' : 'bg-white border'}`} onClick={() => setActiveFilter('products')}>Products</button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-slate-400">Loading...</div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm font-medium text-slate-500">No items</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => {
            // Posts
            if (item.type === "post") {
              const post = item.post;
              const latest = feedPosts.find((p) => p._id === post._id) || post;
              const likesCount = Array.isArray((latest as any).likes) ? (latest as any).likes.length : Number((latest as any).likesCount ?? 0);
              const commentsCount = Array.isArray((latest as any).comments) ? (latest as any).comments.length : Number((latest as any).commentsCount ?? 0);
              const repostsCount = Array.isArray((latest as any).reposts) ? (latest as any).reposts.length : Number((latest as any).repostsCount ?? 0);
              const isLiked = Boolean(currentUserId && Array.isArray((latest as any).likes) && (latest as any).likes.some((id: any) => String(id) === String(currentUserId)));
              const isReposted = Boolean(currentUserId && Array.isArray((latest as any).reposts) && (latest as any).reposts.some((id: any) => String(id) === String(currentUserId)));

              return (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm sm:p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <Link to={`/communities/${item.communityId}`} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-100">
                      {communityNameById?.get(item.communityId) || 'Community'}
                    </Link>
                    <span>•</span>
                    <span>{formatRelative ? formatRelative(post.createdAt) : post.createdAt}</span>
                  </div>

                  <div className="mb-2.5 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center">
                      <Avatar src={resolveAvatarSrc((post.authorId as any)?.avatar)} name={(post.authorId as any)?.name || 'User'} size={36} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link to={getProfileLink(post.authorId)} className="truncate text-sm font-semibold text-slate-900 hover:underline">{(post.authorId as any)?.name || 'Member'}</Link>
                      <p className="text-[11px] text-slate-400">Posted</p>
                    </div>
                    {isAdminView && (onEditPost || onDeletePost) ? (
                      <div className="flex items-center gap-1">
                        {onEditPost ? (
                          <button
                            type="button"
                            onClick={() => onEditPost(post)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                            title="Edit post"
                          >
                            <FiEdit2 size={12} />
                          </button>
                        ) : null}
                        {onDeletePost ? (
                          <button
                            type="button"
                            onClick={() => onDeletePost(post)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            title="Delete post"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{post.content}</p>

                  {Array.isArray(post.images) && post.images.length > 0 && (
                    <div className="mt-3 w-full">
                      {post.images.length === 1 ? (
                        <div className="overflow-hidden rounded-xl border border-slate-200">
                          <img src={post.images[0]} alt="Post attachment" className="w-full object-cover" />
                        </div>
                      ) : (
                        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                          <img 
                            src={post.images[imageCarouselIndex[post._id] || 0]} 
                            alt="Post attachment" 
                            className="w-full object-cover"
                          />
                          {post.images.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={() => setImageCarouselIndex((prev) => ({ ...prev, [post._id]: ((prev[post._id] || 0) - 1 + post.images!.length) % post.images!.length }))}
                                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                                aria-label="Previous image"
                              >
                                <FiChevronLeft size={18} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setImageCarouselIndex((prev) => ({ ...prev, [post._id]: ((prev[post._id] || 0) + 1) % post.images!.length }))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                                aria-label="Next image"
                              >
                                <FiChevronRight size={18} />
                              </button>
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/60 rounded-full px-2.5 py-1">
                                {post.images.map((_, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setImageCarouselIndex((prev) => ({ ...prev, [post._id]: idx }))}
                                    className={`h-1.5 rounded-full transition-colors ${
                                      idx === (imageCarouselIndex[post._id] || 0) ? "bg-white w-6" : "bg-white/50 w-1.5"
                                    }`}
                                    aria-label={`Go to image ${idx + 1}`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {Array.isArray(post.links) && post.links.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {post.links.map((ln, idx) => (
                        <a key={idx} href={ln} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                          {ln}
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-2 text-xs text-slate-500">
                    <button type="button" onClick={() => onLikePost && onLikePost(post)} className={`inline-flex items-center gap-2 ${isLiked ? 'text-red-600' : 'hover:text-slate-700'}`}>
                      <FiHeart />
                      <span className="tabular-nums">{likesCount}</span>
                    </button>

                    <button type="button" onClick={() => setExpandedPostId(expandedPostId === post._id ? null : post._id)} className="inline-flex items-center gap-2 hover:text-slate-700">
                      <FiMessageSquare />
                      <span className="tabular-nums">{commentsCount}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRepost && onRepost(post)}
                      aria-pressed={isReposted}
                      className={`inline-flex items-center gap-2 ${isReposted ? 'text-emerald-600' : 'hover:text-slate-700'}`}
                    >
                      <FiRepeat />
                      <span className="tabular-nums">{repostsCount}</span>
                    </button>
                  </div>

                  {expandedPostId === post._id && (
                    <div className="mt-4 border-t border-slate-100 pt-3 space-y-3">
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {Array.isArray((latest as any).comments) && (latest as any).comments.length > 0 ? (
                          (latest as any).comments.map((c: any) => (
                            <div key={c._id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                              <div className="flex items-start gap-2">
                                <div className="h-7 w-7 flex-shrink-0">
                                  <Avatar src={resolveAvatarSrc(c.author?.avatar)} name={c.author?.name || 'User'} size={28} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <Link to={getProfileLink(c.author)} className="text-xs font-semibold text-slate-900 hover:underline">{c.author?.name || 'User'}</Link>
                                  <p className="mt-1 text-xs text-slate-700 whitespace-pre-wrap break-words">{c.content}</p>
                                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                                    <button type="button" className="hover:text-slate-700" onClick={() => setReplyInputs((s) => ({ ...s, [c._id]: s[c._id] || '' }))}>Reply</button>
                                    {isAdminView && onDeleteComment ? (
                                      <button
                                        type="button"
                                        className="text-slate-500 hover:text-red-600"
                                        onClick={() => onDeleteComment(post._id, c._id)}
                                      >
                                        Delete
                                      </button>
                                    ) : null}
                                  </div>
                                  {replyInputs[c._id] !== undefined && (
                                    <div className="mt-2 flex gap-2">
                                      <input 
                                        value={replyInputs[c._id]} 
                                        onChange={(e) => setReplyInputs((s) => ({ ...s, [c._id]: e.target.value }))} 
                                        className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-xs" 
                                        placeholder="Write a reply"
                                      />
                                      <Button 
                                        type="button" 
                                        size="sm" 
                                        onClick={() => handleReplySubmit(post._id, post.communityId, c._id)} 
                                        disabled={loadingComment === c._id}
                                        className="h-7 text-xs"
                                      >
                                        {loadingComment === c._id ? 'Posting...' : 'Reply'}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500">No comments yet</p>
                        )}
                      </div>

                      <div className="flex gap-2 border-t border-slate-100 pt-3">
                        <div className="h-7 w-7 flex-shrink-0">
                          <Avatar src={resolveAvatarSrc("")} name={""} size={28} />
                        </div>
                        <div className="flex-1 flex gap-2 min-w-0">
                          <input 
                            value={commentInput[post._id] || ""} 
                            onChange={(e) => setCommentInput((prev) => ({ ...prev, [post._id]: e.target.value }))} 
                            placeholder="Write a comment..." 
                            className="flex-1 rounded-full border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
                          />
                          <Button 
                            type="button" 
                            onClick={() => handleCommentSubmit(post._id, post.communityId)} 
                            disabled={loadingComment === post._id || !commentInput[post._id]?.trim()}
                            className="h-8 px-3 text-xs flex-shrink-0"
                          >
                            {loadingComment === post._id ? 'Posting...' : 'Post'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            }

            // Events
            if (item.type === "event") {
              const event = item.event;
              const communityName = communityNameById?.get(item.communityId) || 'Community';
              const attending = Array.isArray(event.attendees) && event.attendees.some((a: any) => {
                const aid = a?._id || a?.userId || a || null;
                return !!aid && String(aid) === String(currentUserId);
              });

              return (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-[linear-gradient(145deg,#fff7ed,#ffffff)] p-4 transition-all hover:border-slate-300 hover:shadow-sm sm:p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    {item.communityId ? (
                      <Link to={`/communities/${item.communityId}`} className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 font-semibold text-orange-700 hover:bg-orange-100">
                        {communityName}
                      </Link>
                    ) : (
                      <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 font-semibold text-orange-700">Community event</span>
                    )}
                    <span>•</span>
                    <span>{formatDate ? formatDate(event.date) : event.date}</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="rounded-xl border border-orange-200 bg-white px-2.5 py-2 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">{new Date(event.date).toLocaleDateString("en-US", { month: "short" })}</p>
                      <p className="text-sm font-semibold text-slate-900">{new Date(event.date).toLocaleDateString("en-US", { day: "numeric" })}</p>
                    </div>

                    <div className="min-w-0 flex-1">
                      {isAdminView && (onEditEvent || onDeleteEvent) ? (
                        <div className="mb-2 flex justify-end gap-1">
                          {onEditEvent ? (
                            <button
                              type="button"
                              onClick={() => onEditEvent(event)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                              title="Edit event"
                            >
                              <FiEdit2 size={12} />
                            </button>
                          ) : null}
                          {onDeleteEvent ? (
                            <button
                              type="button"
                              onClick={() => onDeleteEvent(event)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600"
                              title="Delete event"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          ) : null}
                        </div>
                      ) : null}

                      {/* Event author (if present) */}
                      {((event as any).author || (event as any).creator || (event as any).createdBy || (event as any).authorId || (event as any).user) ? (
                        <div className="mb-2.5 flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center">
                            <Avatar src={resolveAvatarSrc(((event as any).author || (event as any).creator || (event as any).createdBy || (event as any).authorId || (event as any).user)?.avatar)} name={(((event as any).author || (event as any).creator || (event as any).createdBy || (event as any).authorId || (event as any).user)?.name) || 'User'} size={32} />
                          </div>
                          <div className="min-w-0">
                            <Link to={getProfileLink((event as any).author || (event as any).creator || (event as any).createdBy || (event as any).authorId || (event as any).user)} className="truncate text-sm font-semibold text-slate-900 hover:underline">{(((event as any).author || (event as any).creator || (event as any).createdBy || (event as any).authorId || (event as any).user)?.name) || 'Member'}</Link>
                            <p className="text-[11px] text-slate-400">Posted</p>
                          </div>
                        </div>
                      ) : null}

                      <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1"><FiCalendar size={11} />{formatDate ? formatDate(event.date) : event.date}</span>
                        {event.location ? (<span className="inline-flex items-center gap-1"><FiMapPin size={11} />{event.location}</span>) : null}
                        {Array.isArray(event.attendees) ? (<span className="inline-flex items-center gap-1"><FiHeart size={11} />{event.attendees.length} attending</span>) : null}
                      </div>
                      {event.description ? (<p className="mt-2 text-xs leading-relaxed text-slate-600">{event.description}</p>) : null}
                      {Array.isArray(event.images) && event.images.length > 0 && (
                        <div className="mt-3 w-full">
                          {event.images.length === 1 ? (
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                              <img src={event.images[0]} alt="Event attachment" className="w-full object-cover" />
                            </div>
                          ) : (
                            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                              <img
                                src={event.images[imageCarouselIndex[event._id] || 0]}
                                alt="Event attachment"
                                className="w-full object-cover"
                              />
                              {event.images.length > 1 && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setImageCarouselIndex((prev) => ({ ...prev, [event._id]: ((prev[event._id] || 0) - 1 + event.images!.length) % event.images!.length }))}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                                    aria-label="Previous image"
                                  >
                                    <FiChevronLeft size={18} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setImageCarouselIndex((prev) => ({ ...prev, [event._id]: ((prev[event._id] || 0) + 1) % event.images!.length }))}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors"
                                    aria-label="Next image"
                                  >
                                    <FiChevronRight size={18} />
                                  </button>
                                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/60 rounded-full px-2.5 py-1">
                                    {event.images.map((_, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setImageCarouselIndex((prev) => ({ ...prev, [event._id]: idx }))}
                                        className={`h-1.5 rounded-full transition-colors ${
                                          idx === (imageCarouselIndex[event._id] || 0) ? "bg-white w-6" : "bg-white/50 w-1.5"
                                        }`}
                                        aria-label={`Go to image ${idx + 1}`}
                                      />
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {Array.isArray(event.links) && event.links.length > 0 && (
                        <div className="mt-3 flex flex-col gap-2">
                          {event.links.map((ln: string, idx: number) => (
                            <a key={idx} href={ln} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                              {ln}
                            </a>
                          ))}
                        </div>
                      )}

                      {onJoinEvent ? (
                        <Button variant={attending ? undefined : "outline"} size={"sm"} disabled={togglingEvents.includes(event._id)} className={`mt-3 h-8 rounded-full px-3 text-[11px] ${attending ? 'bg-slate-900 text-white' : ''}`} onClick={() => onJoinEvent(event._id, attending)}>
                          {togglingEvents.includes(event._id) ? 'Updating...' : (attending ? 'Leave event' : 'Join event')}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            }

            // Jobs
            if (item.type === 'job') {
              const job = item.job;
              // Admin action buttons for jobs
              const jobActions = isAdminView && (onEditJob || onDeleteJob) ? (
                <div className="mb-2 flex justify-end gap-1">
                  {onEditJob ? (
                    <button
                      type="button"
                      onClick={() => onEditJob(job)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      title="Edit job"
                    >
                      <FiEdit2 size={12} />
                    </button>
                  ) : null}
                  {onDeleteJob ? (
                    <button
                      type="button"
                      onClick={() => onDeleteJob(job)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Delete job"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  ) : null}
                </div>
              ) : null;
              return (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm sm:p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <Link to={`/communities/${item.communityId}`} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-100">
                      {communityNameById?.get(item.communityId) || 'Community'}
                    </Link>
                    <span>•</span>
                    <span>{formatDate ? formatDate(job?.createdAt || '') : (job?.createdAt || '')}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{job?.title}</h3>
                  <p className="mt-1 text-xs text-slate-700">{job?.location || ''} • {job?.type || ''} • {job?.salary || ''}</p>
                  {job?.description && <p className="mt-2 text-sm text-slate-700 line-clamp-3">{job.description}</p>}
                  {renderAttachmentGallery(item.id, job.images, 'Job attachment')}
                      {jobActions}
                  {Array.isArray(job.links) && job.links.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {job.links.map((ln, idx) => (
                        <a key={idx} href={ln} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                          {ln}
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              );
            }

            // Articles
            if (item.type === 'article') {
              const article = item.article;
              const articleActions = isAdminView && (onEditArticle || onDeleteArticle) ? (
                <div className="mb-2 flex justify-end gap-1">
                  {onEditArticle ? (
                    <button
                      type="button"
                      onClick={() => onEditArticle(article)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      title="Edit article"
                    >
                      <FiEdit2 size={12} />
                    </button>
                  ) : null}
                  {onDeleteArticle ? (
                    <button
                      type="button"
                      onClick={() => onDeleteArticle(article)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Delete article"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  ) : null}
                </div>
              ) : null;
              return (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm sm:p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <Link to={`/communities/${item.communityId}`} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-100">
                      {communityNameById?.get(item.communityId) || 'Community'}
                    </Link>
                    <span>•</span>
                    <span>{formatDate ? formatDate(article?.createdAt || '') : (article?.createdAt || '')}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{article?.title}</h3>
                  {article?.content && <p className="mt-2 text-sm text-slate-700 line-clamp-4">{article.content}</p>}
                  {renderAttachmentGallery(item.id, article.images, 'Article attachment')}
                  {articleActions}
                  {Array.isArray(article.links) && article.links.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {article.links.map((ln, idx) => (
                        <a key={idx} href={ln} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                          {ln}
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              );
            }

            // Products
            if (item.type === 'product') {
              const product = item.product;
              const productActions = isAdminView && (onEditProduct || onDeleteProduct) ? (
                <div className="mb-2 flex justify-end gap-1">
                  {onEditProduct ? (
                    <button
                      type="button"
                      onClick={() => onEditProduct(product)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      title="Edit product"
                    >
                      <FiEdit2 size={12} />
                    </button>
                  ) : null}
                  {onDeleteProduct ? (
                    <button
                      type="button"
                      onClick={() => onDeleteProduct(product)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-red-50 hover:text-red-600"
                      title="Delete product"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  ) : null}
                </div>
              ) : null;
              return (
                <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm sm:p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <Link to={`/communities/${item.communityId}`} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-100">
                      {communityNameById?.get(item.communityId) || 'Community'}
                    </Link>
                    <span>•</span>
                    <span>{formatDate ? formatDate(product?.createdAt || '') : (product?.createdAt || '')}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{product?.title}</h3>
                  <p className="mt-1 text-xs text-slate-700">{product?.price ? `$${product.price}` : ''}</p>
                  {product?.description && <p className="mt-2 text-sm text-slate-700 line-clamp-3">{product.description}</p>}
                  {renderAttachmentGallery(item.id, product.images, 'Product attachment')}
                  {productActions}
                  {Array.isArray(product.links) && product.links.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                      {product.links.map((ln, idx) => (
                        <a key={idx} href={ln} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                          {ln}
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default PostsEventsList;
