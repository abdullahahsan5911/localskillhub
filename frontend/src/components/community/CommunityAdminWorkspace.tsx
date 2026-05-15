import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PostsEventsList from "@/components/common/PostsEventsList";
import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { resolveAvatarSrc } from "@/lib/avatar";
import { uploadToCloudinary } from "@/lib/cloudinary";
import {
  FiCalendar,
  FiClock,
  FiEye,
  FiLoader,
  FiMessageSquare,
  FiPlus,
  FiSearch,
  FiLink,
  FiTrash2,
  FiUsers,
  FiHeart,
  FiRepeat,
  FiMenu,
  FiBarChart2,
  FiBriefcase,
  FiFileText,
  FiPackage,
} from "react-icons/fi";
import type { Community, CommunityPostItem } from "./types";

interface CommunityAdminWorkspaceProps {
  community: Community;
  headerMembers: number;
  posts: CommunityPostItem[];
  postsLoading: boolean;
  coverImageUploading: boolean;
  profileImageUploading: boolean;
  showOwnerViewToggle: boolean;
  onSwitchToMember: () => void;
  onUploadImage: (file?: File, target?: "logo" | "coverImage") => void;
  onRemoveImage: (target: "logo" | "coverImage") => void;
  onCommunityUpdated: (community: Community) => void;
  onRefreshPosts: () => void;
  formatRelativeTime: (iso: string) => string;
}

type AdminTab = "dashboard" | "posts" | "activity";
type CreateMode = "menu" | "post" | "event" | "job" | "article" | "product";

type EditableEvent = {
  _id: string;
  title?: string;
  description?: string;
  location?: string;
  date?: string;
  images?: string[];
  links?: string[];
};

const tabLabels: Array<{ id: AdminTab; label: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "posts", label: "Page posts" },
  { id: "activity", label: "Activity" },
];

const normalizeCommunityId = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    const id = (value as { _id?: string })._id;
    return typeof id === "string" ? id : "";
  }
  return "";
};

const CommunityAdminWorkspace = ({
  community,
  headerMembers,
  posts,
  postsLoading,
  coverImageUploading,
  profileImageUploading,
  showOwnerViewToggle,
  onSwitchToMember,
  onUploadImage,
  onRemoveImage,
  onCommunityUpdated,
  onRefreshPosts,
  formatRelativeTime,
}: CommunityAdminWorkspaceProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>("menu");
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [postContent, setPostContent] = useState("");
  const [postImages, setPostImages] = useState<string[]>([]);
  const [postLinks, setPostLinks] = useState<string[]>([]);
  const [postLinkInput, setPostLinkInput] = useState("");
  const [postImageUploading, setPostImageUploading] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
  });
  const [eventImages, setEventImages] = useState<string[]>([]);
  const [eventLinks, setEventLinks] = useState<string[]>([]);
  const [eventLinkInput, setEventLinkInput] = useState("");
  const [eventImageUploading, setEventImageUploading] = useState(false);
  
  // Job form state
  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    location: "",
    salary: "",
    type: "full-time",
  });
  const [jobImages, setJobImages] = useState<string[]>([]);
  const [jobLinks, setJobLinks] = useState<string[]>([]);
  const [jobLinkInput, setJobLinkInput] = useState("");
  const [jobImageUploading, setJobImageUploading] = useState(false);
  
  // Article form state
  const [articleForm, setArticleForm] = useState({
    title: "",
    content: "",
  });
  const [articleImages, setArticleImages] = useState<string[]>([]);
  const [articleLinks, setArticleLinks] = useState<string[]>([]);
  const [articleLinkInput, setArticleLinkInput] = useState("");
  const [articleImageUploading, setArticleImageUploading] = useState(false);
  
  // Product form state
  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    price: "",
  });
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productLinks, setProductLinks] = useState<string[]>([]);
  const [productLinkInput, setProductLinkInput] = useState("");
  const [productImageUploading, setProductImageUploading] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "",
    tagline: "",
    website: "",
    industry: "",
  });

  const [activityLoading, setActivityLoading] = useState(false);
  const [communityEvents, setCommunityEvents] = useState<any[]>([]);
  const [communityJobs, setCommunityJobs] = useState<any[]>([]);
  const [communityArticles, setCommunityArticles] = useState<any[]>([]);
  const [communityProducts, setCommunityProducts] = useState<any[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverCommunities, setDiscoverCommunities] = useState<Community[]>(
    [],
  );
  const [submittingPost, setSubmittingPost] = useState(false);
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [submittingJob, setSubmittingJob] = useState(false);
  const [submittingArticle, setSubmittingArticle] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [mutating, setMutating] = useState<string | null>(null);
  const [deletePostConfirmOpen, setDeletePostConfirmOpen] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deleteCommentConfirmOpen, setDeleteCommentConfirmOpen] =
    useState(false);
  const [deleteCommentInfo, setDeleteCommentInfo] = useState<{
    postId: string;
    commentId: string;
  } | null>(null);
  const [deleteEventConfirmOpen, setDeleteEventConfirmOpen] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

  const [deleteJobConfirmOpen, setDeleteJobConfirmOpen] = useState(false);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [deleteArticleConfirmOpen, setDeleteArticleConfirmOpen] =
    useState(false);
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);
  const [deleteProductConfirmOpen, setDeleteProductConfirmOpen] =
    useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  const [deletePageOpen, setDeletePageOpen] = useState(false);
  const [deletePageConfirmText, setDeletePageConfirmText] = useState("");
  const [deletingPage, setDeletingPage] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPostItem | null>(
    null,
  );
  const [editingEvent, setEditingEvent] = useState<EditableEvent | null>(null);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [restrictDialogOpen, setRestrictDialogOpen] = useState(false);

  // ─── delete post ───────────────────────────────────────────────────────────
  const handleDeletePost = async (post: CommunityPostItem) => {
    setDeletePostId(post._id as string);
    setDeletePostConfirmOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!deletePostId) return;
    const postId = deletePostId;
    try {
      setMutating(postId);
      setDeletePostConfirmOpen(false);
      await api.deleteCommunityPost(community._id as string, postId);
      toast({ title: "Post deleted" });
      onRefreshPosts();
    } catch (error) {
      console.error("Failed to delete post", error);
      toast({ title: "Could not delete post", variant: "destructive" });
    } finally {
      setMutating(null);
      setDeletePostId(null);
    }
  };

  const cancelDeletePost = () => {
    setDeletePostConfirmOpen(false);
    setDeletePostId(null);
  };

  // ─── delete comment ────────────────────────────────────────────────────────
  const handleDeleteComment = (postId: string, commentId: string) => {
    setDeleteCommentInfo({ postId, commentId });
    setDeleteCommentConfirmOpen(true);
  };

  const confirmDeleteComment = async () => {
    if (!deleteCommentInfo) return;
    const { postId, commentId } = deleteCommentInfo;
    try {
      setMutating(commentId);
      setDeleteCommentConfirmOpen(false);
      await api.deleteCommunityPostComment(
        community._id as string,
        postId,
        commentId,
      );
      toast({ title: "Comment deleted" });
      onRefreshPosts();
    } catch (error) {
      console.error("Failed to delete comment", error);
      toast({ title: "Could not delete comment", variant: "destructive" });
    } finally {
      setMutating(null);
      setDeleteCommentInfo(null);
    }
  };

  const cancelDeleteComment = () => {
    setDeleteCommentConfirmOpen(false);
    setDeleteCommentInfo(null);
  };

  // ─── delete event ─────────────────────────────────────────────────────────
  const handleDeleteEvent = async (event: EditableEvent) => {
    setDeleteEventId(event._id);
    setDeleteEventConfirmOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (!deleteEventId) return;
    const eventId = deleteEventId;
    try {
      setMutating(eventId);
      setDeleteEventConfirmOpen(false);
      await api.deleteEvent(eventId);
      setCommunityEvents((prev) =>
        prev.filter((event: any) => String(event?._id) !== eventId),
      );
      toast({ title: "Event deleted" });
    } catch (error) {
      console.error("Failed to delete event", error);
      toast({ title: "Could not delete event", variant: "destructive" });
    } finally {
      setMutating(null);
      setDeleteEventId(null);
    }
  };

  const cancelDeleteEvent = () => {
    setDeleteEventConfirmOpen(false);
    setDeleteEventId(null);
  };

  const handleDeleteJob = (job: any) => {
    setDeleteJobId(job._id || job.id || null);
    setDeleteJobConfirmOpen(true);
  };

  const confirmDeleteJob = async () => {
    if (!deleteJobId) return;
    const id = deleteJobId;
    try {
      setMutating(id);
      setDeleteJobConfirmOpen(false);
      await api.deleteCommunityJob(id);
      setCommunityJobs((prev) =>
        (prev || []).filter((j: any) => String(j._id) !== String(id)),
      );
      toast({ title: "Job deleted" });
    } catch (error) {
      console.error("Failed to delete job", error);
      toast({ title: "Could not delete job", variant: "destructive" });
    } finally {
      setMutating(null);
      setDeleteJobId(null);
    }
  };

  const cancelDeleteJob = () => {
    setDeleteJobConfirmOpen(false);
    setDeleteJobId(null);
  };

  const handleDeleteArticle = (article: any) => {
    setDeleteArticleId(article._id || article.id || null);
    setDeleteArticleConfirmOpen(true);
  };

  const confirmDeleteArticle = async () => {
    if (!deleteArticleId) return;
    const id = deleteArticleId;
    try {
      setMutating(id);
      setDeleteArticleConfirmOpen(false);
      await api.deleteCommunityArticle(id);
      setCommunityArticles((prev) =>
        (prev || []).filter((a: any) => String(a._id) !== String(id)),
      );
      toast({ title: "Article deleted" });
    } catch (error) {
      console.error("Failed to delete article", error);
      toast({ title: "Could not delete article", variant: "destructive" });
    } finally {
      setMutating(null);
      setDeleteArticleId(null);
    }
  };

  const cancelDeleteArticle = () => {
    setDeleteArticleConfirmOpen(false);
    setDeleteArticleId(null);
  };

  const handleDeleteProduct = (product: any) => {
    setDeleteProductId(product._id || product.id || null);
    setDeleteProductConfirmOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProductId) return;
    const id = deleteProductId;
    try {
      setMutating(id);
      setDeleteProductConfirmOpen(false);
      await api.deleteCommunityProduct(id);
      setCommunityProducts((prev) =>
        (prev || []).filter((p: any) => String(p._id) !== String(id)),
      );
      toast({ title: "Product deleted" });
    } catch (error) {
      console.error("Failed to delete product", error);
      toast({ title: "Could not delete product", variant: "destructive" });
    } finally {
      setMutating(null);
      setDeleteProductId(null);
    }
  };

  const cancelDeleteProduct = () => {
    setDeleteProductConfirmOpen(false);
    setDeleteProductId(null);
  };

  // ─── edit post ─────────────────────────────────────────────────────────────
  const openEditPost = (post: CommunityPostItem) => {
    setEditingPost(post);
    setPostContent(post.content || "");
    setPostImages(Array.isArray(post.images) ? post.images : []);
    setPostLinks(Array.isArray(post.links) ? post.links : []);
    setCreateOpen(true);
    setCreateMode("post");
    setActiveTab("posts");
  };

  const toDateTimeLocalValue = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const openEditEvent = (event: EditableEvent) => {
    setEditingEvent(event);
    setCreateOpen(true);
    setCreateMode("event");
    setEventForm({
      title: event.title || "",
      description: event.description || "",
      location: event.location || "",
      date: toDateTimeLocalValue(event.date),
    });
    setEventImages(Array.isArray(event.images) ? event.images : []);
    setEventLinks(Array.isArray(event.links) ? event.links : []);
    setActiveTab("posts");
  };

  const openEditJob = (job: any) => {
    navigate(`/communities/${community._id}/edit-job/${job._id}`);
  };

  const openEditArticle = (article: any) => {
    navigate(`/communities/${community._id}/edit-article/${article._id}`);
  };

  const openEditProduct = (product: any) => {
    navigate(`/communities/${community._id}/edit-product/${product._id}`);
  };

  // ─── delete page ───────────────────────────────────────────────────────────
  const confirmDeletePage = async () => {
    const typed = deletePageConfirmText.trim();
    const expectedName = String(community.name || "").trim();
    const confirmed =
      typed === "DELETE" || (expectedName && typed === expectedName);
    if (!confirmed) {
      toast({
        title: "Confirmation text does not match",
        description: "Type DELETE or the exact page name to confirm.",
        variant: "destructive",
      });
      return;
    }
    try {
      setDeletingPage(true);
      setDeletePageOpen(false);
      await updateCommunityState(
        api.deleteCommunity(community._id),
        "Page deleted and related data removed",
      );
      setDeletePageConfirmText("");
      navigate("/admin/communities");
    } catch (error) {
      console.error("Failed to delete page", error);
      toast({ title: "Could not delete page", variant: "destructive" });
    } finally {
      setDeletingPage(false);
    }
  };

  const cancelDeletePage = () => {
    setDeletePageOpen(false);
    setDeletePageConfirmText("");
  };

  const ownerId = String(
    (community.ownerId as any)?._id || community.ownerId || "",
  );
  const { user } = useAuth();
  const members = Array.isArray(community.members) ? community.members : [];
  const admins = Array.isArray(community.admins) ? community.admins : [];
  const restrictedMembers = Array.isArray(community.restrictedMembers)
    ? community.restrictedMembers
    : [];
  const following = Array.isArray(community.following)
    ? community.following
    : [];

  const memberCandidates = useMemo(
    () =>
      members.filter(
        (member: any) =>
          String(member?._id || member?.id || member) !== ownerId,
      ),
    [members, ownerId],
  );

  const currentUserId = user?._id ? String(user._id) : null;
  const adminIds = admins.map((a: any) => String(a?._id || a));
  const restrictedMemberIds = restrictedMembers.map((r: any) =>
    String(r?._id || r),
  );
  const canEdit = Boolean(
    currentUserId &&
    (user?.role === "admin" ||
      currentUserId === ownerId ||
      adminIds.includes(currentUserId)),
  );
  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    members.forEach((member: any) => {
      const id = String(member?._id || member?.id || member || "");
      const name = member?.name || member?.fullName;
      if (id && typeof name === "string" && name.trim()) {
        map.set(id, name);
      }
    });
    return map;
  }, [members]);

  const resolveMemberUserId = (member: any) => {
    // member can be a plain id, a membership object with userId, or a populated user
    return String(
      member?.userId?._id ||
        member?.userId ||
        member?._id ||
        member?.id ||
        member ||
        "",
    );
  };

  const latestPost = useMemo(() => {
    if (posts.length === 0) return null;
    return (
      [...posts].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )[0] || null
    );
  }, [posts]);

  const missingPageDescription = !community.description?.trim();
  const missingPageWebsite = !community.website?.trim();
  const showPageInfoPrompt = missingPageDescription || missingPageWebsite;

  // ─── activity aggregation ──────────────────────────────────────────────────
  const activityStats = useMemo(() => {
    let totalLikes = 0;
    let totalComments = 0;
    let totalReposts = 0;

    posts.forEach((post) => {
      const likes = Array.isArray((post as any).likes)
        ? (post as any).likes.length
        : Number((post as any).likesCount ?? (post as any).likeCount ?? 0);
      const comments = Array.isArray((post as any).comments)
        ? (post as any).comments.length
        : Number(
            (post as any).commentsCount ?? (post as any).commentCount ?? 0,
          );
      const reposts = Array.isArray((post as any).reposts)
        ? (post as any).reposts.length
        : Number((post as any).repostsCount ?? (post as any).repostCount ?? 0);

      totalLikes += likes;
      totalComments += comments;
      totalReposts += reposts;
    });

    return { totalLikes, totalComments, totalReposts };
  }, [posts]);

  const adminFeed = useMemo(() => {
    const postItems = posts.map((post) => ({
      type: "post" as const,
      id: `post-${post._id}`,
      timestamp: post.createdAt,
      communityId: String(post.communityId || community._id || ""),
      post,
    }));

    const eventItems = communityEvents.map((event: any) => ({
      type: "event" as const,
      id: `event-${event._id}`,
      timestamp: event.date,
      communityId:
        normalizeCommunityId(event.communityId) || String(community._id || ""),
      event,
    }));

    const jobItems = communityJobs.map((job: any) => ({
      type: "job" as const,
      id: `job-${job._id}`,
      timestamp: job.createdAt || job._id,
      communityId:
        normalizeCommunityId(job.communityId) || String(community._id || ""),
      job,
    }));

    const articleItems = communityArticles.map((article: any) => ({
      type: "article" as const,
      id: `article-${article._id}`,
      timestamp: article.createdAt || article._id,
      communityId:
        normalizeCommunityId(article.communityId) ||
        String(community._id || ""),
      article,
    }));

    const productItems = communityProducts.map((product: any) => ({
      type: "product" as const,
      id: `product-${product._id}`,
      timestamp: product.createdAt || product._id,
      communityId:
        normalizeCommunityId(product.communityId) ||
        String(community._id || ""),
      product,
    }));

    return [
      ...postItems,
      ...eventItems,
      ...jobItems,
      ...articleItems,
      ...productItems,
    ].sort(
      (a, b) =>
        new Date(b.timestamp || 0).getTime() -
        new Date(a.timestamp || 0).getTime(),
    );
  }, [
    posts,
    communityEvents,
    communityJobs,
    communityArticles,
    communityProducts,
    community._id,
  ]);

  useEffect(() => {
    setEditForm({
      name: community.name || "",
      description: community.description || "",
      category: community.category || "",
      tagline: community.tagline || "",
      website: community.website || "",
      industry: community.industry || "",
    });
  }, [community]);

  useEffect(() => {
    const loadDiscover = async () => {
      try {
        setDiscoverLoading(true);
        const res = await api.getCommunities({ limit: 12 });
        const payload: any = (res as any).data || res;
        const list =
          payload.communities ||
          payload.data?.communities ||
          payload.data ||
          [];
        const currentId = String(community._id);
        const followedIds = new Set(
          following.map((item: any) => String(item?._id || item)),
        );
        setDiscoverCommunities(
          (Array.isArray(list) ? list : []).filter(
            (item: Community) =>
              String(item._id) !== currentId &&
              !followedIds.has(String(item._id)),
          ),
        );
      } catch (error) {
        console.error("Failed to load discover communities", error);
        setDiscoverCommunities([]);
      } finally {
        setDiscoverLoading(false);
      }
    };
    void loadDiscover();
  }, [community._id, following]);

  useEffect(() => {
    const loadData = async () => {
      if (activeTab !== "activity" && activeTab !== "posts") return;
      try {
        setActivityLoading(true);
        const eventsRes = await api.getEvents();
        const payload: any = (eventsRes as any).data || eventsRes;
        const events =
          payload.events || payload.data?.events || payload.data || [];
        setCommunityEvents(
          (Array.isArray(events) ? events : []).filter(
            (event: any) =>
              normalizeCommunityId(event.communityId) === String(community._id),
          ),
        );
        // load jobs/articles/products
        try {
          const jobsRes = await api.getCommunityJobs({
            communityId: community._id,
            includeImages: true,
            includeLinks: true,
          });
          const jobsPayload: any = (jobsRes as any).data || jobsRes;
          const jobs =
            jobsPayload.jobs ||
            jobsPayload.data?.jobs ||
            jobsPayload.data ||
            [];
          setCommunityJobs(
            (Array.isArray(jobs) ? jobs : [])
              .map((j: any) => ({
                ...j,
                images: Array.isArray(j.images) ? j.images : [],
                links: Array.isArray(j.links) ? j.links : [],
              })),
          );
        } catch (err) {
          setCommunityJobs([]);
        }
        try {
          const articlesRes = await api.getCommunityArticles({
            communityId: community._id,
            includeImages: true,
            includeLinks: true,
          });
          const artPayload: any = (articlesRes as any).data || articlesRes;
          const arts =
            artPayload.articles ||
            artPayload.data?.articles ||
            artPayload.data ||
            [];
          setCommunityArticles(
            (Array.isArray(arts) ? arts : [])
              .map((a: any) => ({
                ...a,
                images: Array.isArray(a.images) ? a.images : [],
                links: Array.isArray(a.links) ? a.links : [],
              })),
          );
        } catch (err) {
          setCommunityArticles([]);
        }
        try {
          const productsRes = await api.getCommunityProducts({
            communityId: community._id,
            includeImages: true,
            includeLinks: true,
          });
          const prodPayload: any = (productsRes as any).data || productsRes;
          const prods =
            prodPayload.products ||
            prodPayload.data?.products ||
            prodPayload.data ||
            [];
          setCommunityProducts(
            (Array.isArray(prods) ? prods : [])
              .map((p: any) => ({
                ...p,
                images: Array.isArray(p.images) ? p.images : [],
                links: Array.isArray(p.links) ? p.links : [],
              })),
          );
        } catch (err) {
          setCommunityProducts([]);
        }
      } catch (error) {
        console.error("Failed to load community data", error);
        setCommunityEvents([]);
      } finally {
        setActivityLoading(false);
      }
    };
    void loadData();
  }, [activeTab, community._id]);

  const closeCreateDialog = () => {
    setCreateOpen(false);
    setCreateMode("menu");
    setPostContent("");
    setPostImages([]);
    setPostLinks([]);
    setPostLinkInput("");
    setPostImageUploading(false);
    setEventForm({ title: "", description: "", location: "", date: "" });
    setEventImages([]);
    setEventLinks([]);
    setEventLinkInput("");
    setEventImageUploading(false);
    setJobForm({ title: "", description: "", location: "", salary: "", type: "full-time" });
    setJobImages([]);
    setJobLinks([]);
    setJobLinkInput("");
    setJobImageUploading(false);
    setArticleForm({ title: "", content: "" });
    setArticleImages([]);
    setArticleLinks([]);
    setArticleLinkInput("");
    setArticleImageUploading(false);
    setProductForm({ title: "", description: "", price: "" });
    setProductImages([]);
    setProductLinks([]);
    setProductLinkInput("");
    setProductImageUploading(false);
    setEditingPost(null);
    setEditingEvent(null);
    setEditingJob(null);
    setEditingArticle(null);
    setEditingProduct(null);
  };

  const openPromoteDialog = () => setPromoteDialogOpen(true);
  const closePromoteDialog = () => setPromoteDialogOpen(false);

  const openRestrictDialog = () => setRestrictDialogOpen(true);
  const closeRestrictDialog = () => setRestrictDialogOpen(false);

  const uploadAttachmentImage = async (
    files: File[] = [],
    target: "post" | "event" | "job" | "article" | "product" = "post",
  ) => {
    if (files.length === 0) return;
    try {
      if (target === "post") setPostImageUploading(true);
      else if (target === "event") setEventImageUploading(true);
      else if (target === "job") setJobImageUploading(true);
      else if (target === "article") setArticleImageUploading(true);
      else if (target === "product") setProductImageUploading(true);

      const folder =
        target === "post"
          ? "community-posts"
          : target === "event"
          ? "community-events"
          : target === "job"
          ? "community-jobs"
          : target === "article"
          ? "community-articles"
          : "community-products";
      const uploaded = await Promise.all(
        files.map((file) => uploadToCloudinary(file, folder)),
      );
      const nextUrls = uploaded.map((item) => item.url);
      if (target === "post") setPostImages((c) => [...c, ...nextUrls]);
      else if (target === "event") setEventImages((c) => [...c, ...nextUrls]);
      else if (target === "job") setJobImages((c) => [...c, ...nextUrls]);
      else if (target === "article") setArticleImages((c) => [...c, ...nextUrls]);
      else if (target === "product") setProductImages((c) => [...c, ...nextUrls]);
    } catch (error) {
      console.error("Failed to upload attachment image", error);
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      if (target === "post") setPostImageUploading(false);
      else if (target === "event") setEventImageUploading(false);
      else if (target === "job") setJobImageUploading(false);
      else if (target === "article") setArticleImageUploading(false);
      else if (target === "product") setProductImageUploading(false);
    }
  };

  const addAttachmentLink = (
    target: "post" | "event" | "job" | "article" | "product" = "post",
  ) => {
    const rawValue =
      target === "post"
        ? postLinkInput
        : target === "event"
        ? eventLinkInput
        : target === "job"
        ? jobLinkInput
        : target === "article"
        ? articleLinkInput
        : productLinkInput;
    const trimmedValue = rawValue.trim();
    if (!trimmedValue) return;
    const normalizedValue = /^https?:\/\//i.test(trimmedValue)
      ? trimmedValue
      : `https://${trimmedValue}`;
    if (target === "post") {
      setPostLinks((c) =>
        c.includes(normalizedValue) ? c : [...c, normalizedValue],
      );
      setPostLinkInput("");
    } else if (target === "event") {
      setEventLinks((c) =>
        c.includes(normalizedValue) ? c : [...c, normalizedValue],
      );
      setEventLinkInput("");
    } else if (target === "job") {
      setJobLinks((c) =>
        c.includes(normalizedValue) ? c : [...c, normalizedValue],
      );
      setJobLinkInput("");
    } else if (target === "article") {
      setArticleLinks((c) =>
        c.includes(normalizedValue) ? c : [...c, normalizedValue],
      );
      setArticleLinkInput("");
    } else if (target === "product") {
      setProductLinks((c) =>
        c.includes(normalizedValue) ? c : [...c, normalizedValue],
      );
      setProductLinkInput("");
    }
  };

  const savePageDetails = async () => {
    try {
      setSavingEdit(true);
      if (!canEdit) {
        toast({
          title: "You don't have permission to update this page",
          variant: "destructive",
        });
        return;
      }
      const res = await api.updateCommunity(community._id, editForm);
      const updated =
        (res as any).data?.community ||
        (res as any).data?.data?.community ||
        (res as any).data ||
        community;
      onCommunityUpdated(updated as Community);
      toast({ title: "Page details saved" });
      setEditOpen(false);
      try {
        localStorage.setItem(
          "communities-updated",
          JSON.stringify({ id: String(community._id), ts: Date.now() }),
        );
      } catch (_) {}
    } catch (error) {
      console.error("savePageDetails error", error);
      const serverMessage =
        (error as any)?.response?.data?.message ||
        (error as any)?.message ||
        String(error);
      toast({
        title: serverMessage || "Could not save page details",
        variant: "destructive",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const createPost = async () => {
    if (!postContent.trim()) return;
    try {
      setSubmittingPost(true);
      if (editingPost) {
        await api.updateCommunityPost(
          community._id,
          editingPost._id as string,
          {
            content: postContent.trim(),
            images: postImages,
            links: postLinks,
          },
        );
        toast({ title: "Post updated" });
        onRefreshPosts();
        setActiveTab("posts");
        setEditingPost(null);
        closeCreateDialog();
      } else {
        await api.createCommunityPost(community._id, {
          content: postContent.trim(),
          images: postImages,
          links: postLinks,
        });
        toast({ title: "Post created" });
        onRefreshPosts();
        setActiveTab("posts");
        closeCreateDialog();
      }
    } catch (error) {
      console.error(error);
      toast({
        title: editingPost ? "Could not update post" : "Could not create post",
        variant: "destructive",
      });
    } finally {
      setSubmittingPost(false);
    }
  };

  const createEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.date) return;
    try {
      setSubmittingEvent(true);
      const eventPayload = {
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        location: eventForm.location.trim(),
        date: eventForm.date,
        communityId: community._id,
        images: eventImages,
        links: eventLinks,
      };

      const res = editingEvent
        ? await api.updateEvent(editingEvent._id, eventPayload)
        : await api.createEvent(eventPayload);
      const payload: any = (res as any).data || res;
      const savedEvent =
        payload.event || payload.data?.event || payload.data || payload;

      if (editingEvent) {
        setCommunityEvents((current) =>
          (Array.isArray(current) ? current : []).map((item: any) =>
            String(item?._id) === String(editingEvent._id) ? savedEvent : item,
          ),
        );
        toast({ title: "Event updated" });
      } else {
        setCommunityEvents((current) => [
          savedEvent,
          ...(Array.isArray(current) ? current : []),
        ]);
        toast({ title: "Event created" });
      }

      setActiveTab("posts");
      closeCreateDialog();
    } catch (error) {
      console.error(error);
      toast({
        title: editingEvent
          ? "Could not update event"
          : "Could not create event",
        variant: "destructive",
      });
    } finally {
      setSubmittingEvent(false);
    }
  };

  const createJob = async () => {
    if (!jobForm.title.trim()) return;
    try {
      setSubmittingJob(true);
      const jobPayload = {
        title: jobForm.title.trim(),
        description: jobForm.description.trim(),
        location: jobForm.location.trim(),
        salary: jobForm.salary.trim(),
        type: jobForm.type,
        communityId: community._id,
        images: jobImages,
        links: jobLinks,
      };

      const res = editingJob
        ? await api.updateCommunityJob(editingJob._id, jobPayload)
        : await api.createCommunityJob(jobPayload);
      const payload: any = (res as any).data || res;
      const savedJob =
        payload.job || payload.data?.job || payload.data || payload;

      if (editingJob) {
        setCommunityJobs((current) =>
          (Array.isArray(current) ? current : []).map((item: any) =>
            String(item?._id) === String(editingJob._id) ? savedJob : item,
          ),
        );
        toast({ title: "Job updated" });
      } else {
        setCommunityJobs((current) => [
          savedJob,
          ...(Array.isArray(current) ? current : []),
        ]);
        toast({ title: "Job created" });
      }

      setActiveTab("posts");
      closeCreateDialog();
    } catch (error) {
      console.error(error);
      toast({
        title: editingJob ? "Could not update job" : "Could not create job",
        variant: "destructive",
      });
    } finally {
      setSubmittingJob(false);
    }
  };

  const createArticle = async () => {
    if (!articleForm.title.trim() || !articleForm.content.trim()) return;
    try {
      setSubmittingArticle(true);
      const articlePayload = {
        title: articleForm.title.trim(),
        content: articleForm.content.trim(),
        communityId: community._id,
        images: articleImages,
        links: articleLinks,
      };

      const res = editingArticle
        ? await api.updateCommunityArticle(editingArticle._id, articlePayload)
        : await api.createCommunityArticle(articlePayload);
      const payload: any = (res as any).data || res;
      const savedArticle =
        payload.article || payload.data?.article || payload.data || payload;

      if (editingArticle) {
        setCommunityArticles((current) =>
          (Array.isArray(current) ? current : []).map((item: any) =>
            String(item?._id) === String(editingArticle._id) ? savedArticle : item,
          ),
        );
        toast({ title: "Article updated" });
      } else {
        setCommunityArticles((current) => [
          savedArticle,
          ...(Array.isArray(current) ? current : []),
        ]);
        toast({ title: "Article created" });
      }

      setActiveTab("posts");
      closeCreateDialog();
    } catch (error) {
      console.error(error);
      toast({
        title: editingArticle
          ? "Could not update article"
          : "Could not create article",
        variant: "destructive",
      });
    } finally {
      setSubmittingArticle(false);
    }
  };

  const createProduct = async () => {
    if (!productForm.title.trim()) return;
    try {
      setSubmittingProduct(true);
      const productPayload = {
        title: productForm.title.trim(),
        description: productForm.description.trim(),
        price: productForm.price.trim(),
        communityId: community._id,
        images: productImages,
        links: productLinks,
      };

      const res = editingProduct
        ? await api.updateCommunityProduct(editingProduct._id, productPayload)
        : await api.createCommunityProduct(productPayload);
      const payload: any = (res as any).data || res;
      const savedProduct =
        payload.product || payload.data?.product || payload.data || payload;

      if (editingProduct) {
        setCommunityProducts((current) =>
          (Array.isArray(current) ? current : []).map((item: any) =>
            String(item?._id) === String(editingProduct._id) ? savedProduct : item,
          ),
        );
        toast({ title: "Product updated" });
      } else {
        setCommunityProducts((current) => [
          savedProduct,
          ...(Array.isArray(current) ? current : []),
        ]);
        toast({ title: "Product created" });
      }

      setActiveTab("posts");
      closeCreateDialog();
    } catch (error) {
      console.error(error);
      toast({
        title: editingProduct
          ? "Could not update product"
          : "Could not create product",
        variant: "destructive",
      });
    } finally {
      setSubmittingProduct(false);
    }
  };

  const updateCommunityState = async (
    promise: Promise<any>,
    successTitle: string,
  ) => {
    try {
      const res = await promise;
      const updated =
        (res as any).data?.community ||
        (res as any).data?.data?.community ||
        (res as any).data ||
        community;
      onCommunityUpdated(updated as Community);
      toast({ title: successTitle });
    } catch (error) {
      console.error(error);
      toast({ title: "Action failed", variant: "destructive" });
    }
  };

  // Like/repost/comment handlers required by PostsEventsList (admin can still interact)
  const handleLikePost = async (post: CommunityPostItem) => {
    try {
      await api.toggleCommunityPostLike(
        community._id as string,
        post._id as string,
      );
      onRefreshPosts();
    } catch (error) {
      console.error("Like failed", error);
      toast({ title: "Could not like post", variant: "destructive" });
    }
  };

  const handleRepost = async (post: CommunityPostItem) => {
    try {
      const hasReposted = Boolean(
        Array.isArray((post as any).reposts) &&
        (post as any).reposts.some(
          (id: any) => String(id) === String((user as any)?._id || ""),
        ),
      );
      if (hasReposted) {
        await api.repostCommunityPost(
          community._id as string,
          post._id as string,
        );
        toast({ title: "Repost removed" });
        onRefreshPosts();
        return;
      }

      await api.createCommunityPost(community._id as string, {
        content: post.content,
        images: Array.isArray(post.images) ? post.images : [],
        links: Array.isArray(post.links) ? post.links : [],
        repostOf: post._id,
      });
      await api.repostCommunityPost(
        community._id as string,
        post._id as string,
      );
      toast({ title: "Reposted to your page" });
      onRefreshPosts();
    } catch (error) {
      console.error("Repost failed", error);
      toast({ title: "Could not repost", variant: "destructive" });
    }
  };

  const openComments = async (_post: CommunityPostItem) => {};

  const handleAddComment = async (
    postId: string,
    communityId: string,
    content: string,
  ) => {
    try {
      await api.commentCommunityPost(communityId, postId, content);
      onRefreshPosts();
      toast({ title: "Comment posted" });
    } catch (error) {
      console.error("Comment failed", error);
      toast({ title: "Could not post comment", variant: "destructive" });
      throw error;
    }
  };

  const handleAddReply = async (
    postId: string,
    communityId: string,
    commentId: string,
    content: string,
  ) => {
    try {
      await api.replyCommunityPostComment(
        communityId,
        postId,
        commentId,
        content,
      );
      onRefreshPosts();
      toast({ title: "Reply posted" });
    } catch (error) {
      console.error("Reply failed", error);
      toast({ title: "Could not post reply", variant: "destructive" });
      throw error;
    }
  };

  // Generic handlers for jobs/articles/products/events where supported
  const refreshCommunityEvents = async () => {
    try {
      const eventsRes = await api.getEvents();
      const payload: any = (eventsRes as any).data || eventsRes;
      const events =
        payload.events || payload.data?.events || payload.data || [];
      setCommunityEvents(
        (Array.isArray(events) ? events : []).filter(
          (event: any) =>
            normalizeCommunityId(event.communityId) === String(community._id),
        ),
      );
    } catch (err) {
      // ignore
    }
  };

  const handleLikeItem = async (type: string, item: any) => {
    try {
      if (type === "post") return await handleLikePost(item);
      if (type === "event") {
        await api.toggleEventLike(item._id);
        await refreshCommunityEvents();
        return;
      }
      toast({
        title: "Not supported",
        description: "Liking this item type is not implemented yet.",
      });
    } catch (error) {
      console.error("Like failed", error);
      toast({ title: "Could not like item", variant: "destructive" });
    }
  };

  const handleRepostItem = async (type: string, item: any) => {
    try {
      if (type === "post") return await handleRepost(item);
      toast({
        title: "Not supported",
        description: "Reposting this item type is not implemented yet.",
      });
    } catch (error) {
      console.error("Repost failed", error);
      toast({ title: "Could not repost", variant: "destructive" });
    }
  };

  const handleAddCommentItem = async (
    type: string,
    itemId: string,
    communityId: string,
    content: string,
  ) => {
    try {
      if (type === "event") {
        await api.commentEvent(itemId, content);
        await refreshCommunityEvents();
        toast({ title: "Comment posted" });
        return;
      }
      toast({
        title: "Not supported",
        description: "Commenting on this item type is not implemented yet.",
      });
    } catch (error) {
      console.error("Comment failed", error);
      toast({ title: "Could not post comment", variant: "destructive" });
      throw error;
    }
  };

  const handleAddReplyItem = async (
    type: string,
    itemId: string,
    communityId: string,
    commentId: string,
    content: string,
  ) => {
    try {
      if (type === "event") {
        await api.replyEventComment(itemId, commentId, content);
        await refreshCommunityEvents();
        toast({ title: "Reply posted" });
        return;
      }
      toast({
        title: "Not supported",
        description: "Replying on this item type is not implemented yet.",
      });
    } catch (error) {
      console.error("Reply failed", error);
      toast({ title: "Could not post reply", variant: "destructive" });
      throw error;
    }
  };

  const handleOpenCommentsItem = async (type: string, item: any) => {
    // No-op for now; PostsEventsList already toggles UI locally. This is here if we want to prefetch comments.
    if (type === "event") {
      await refreshCommunityEvents();
    }
  };

  const currentFollowing = following.map((item: any) => ({
    _id: String(item?._id || item),
    name: item?.name || "Community",
    logo: item?.logo,
    category: item?.category,
    industry: item?.industry,
  }));

  const getMemberRoleLabel = (member: any) => {
    const rawRole = String(
      member?.role || member?.accountType || member?.userId?.role || "",
    ).toLowerCase();
    if (rawRole === "freelancer") return "Freelancer";
    if (rawRole === "client") return "Client";
    if (rawRole === "company") return "Client";
    return "Member";
  };

  // ─── Sidebar content (shared between desktop and mobile drawer) ────────────
  const SidebarContent = () => (
    <div className="rounded-lg border border-slate-200 bg-white p-2">
      {/* Mini community card */}
      <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
        <div className="relative h-16 sm:h-20 overflow-hidden">
          {community.coverImage ? (
            <img
              src={community.coverImage}
              alt={`${community.name} background`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(90deg,#b7ae9f_0%,#b8aea0_55%,#d7d0c4_55%,#e7e2d7_100%)]" />
          )}
          <div className="absolute right-2 top-2 flex gap-1">
            {community.coverImage && (
              <button
                type="button"
                onClick={() => onRemoveImage("coverImage")}
                className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <FiTrash2 size={11} />
              </button>
            )}
            <label className="flex h-6 w-6 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70">
              <FiPlus size={12} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={coverImageUploading}
                onChange={(e) =>
                  onUploadImage(e.target.files?.[0], "coverImage")
                }
              />
            </label>
          </div>
        </div>

        <div className="relative px-3 pb-3 sm:px-4">
          <div className="absolute -top-7 sm:-top-9 h-10 w-10 sm:h-12 sm:w-12 overflow-hidden border-2 border-white bg-slate-100 shadow-sm">
            {community.logo ? (
              <img
                src={community.logo}
                alt={`${community.name} logo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#d9d2c7_0%,#c1b5a1_50%,#b1c0d0_100%)] text-lg sm:text-2xl font-semibold text-white">
                {community.name?.charAt(0)?.toUpperCase() || "C"}
              </div>
            )}
            {community.logo && (
              <button
                type="button"
                onClick={() => onRemoveImage("logo")}
                className="absolute right-0 top-0 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <FiTrash2 size={9} />
              </button>
            )}
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center text-white">
              <span className="inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-black/55">
                <FiPlus size={10} />
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={profileImageUploading}
                onChange={(e) => onUploadImage(e.target.files?.[0], "logo")}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mt-10 border-b border-slate-100 pb-3">
        <p className="truncate text-sm sm:text-base font-semibold text-slate-900">
          {community.name}
        </p>
        <p className="truncate text-xs text-slate-500">
          {community.industry || community.category || "Community"}
        </p>
        <p className="mt-1 text-xs text-slate-400">{headerMembers} followers</p>
      </div>

      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
        <Button
          type="button"
          onClick={() => {
            setCreateOpen(true);
            setMobileSidebarOpen(false);
          }}
          className="h-8 w-full rounded-full bg-[#0a66c2] text-white hover:bg-[#004182] text-xs sm:text-sm"
        >
          <FiPlus className="mr-1" size={13} />
          Create
        </Button>
        {showOwnerViewToggle && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onSwitchToMember();
              setMobileSidebarOpen(false);
            }}
            className="h-8 w-full rounded-full border-slate-300 text-slate-500 hover:bg-white hover:text-slate-900 text-xs sm:text-sm"
          >
            View as member
          </Button>
        )}
      </div>

      <div className="mt-3 space-y-1">
        {tabLabels.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActiveTab(item.id);
              setMobileSidebarOpen(false);
            }}
            className={`flex w-full rounded-md px-2.5 py-2 text-left text-sm ${activeTab === item.id ? "bg-emerald-50 font-semibold text-emerald-700" : "text-slate-600 hover:bg-slate-50"}`}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            navigate("/messages");
            setMobileSidebarOpen(false);
          }}
          className="flex w-full rounded-md  px-2.5 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
        >
          Inbox
        </button>
        {canEdit && (
          <>
            <button
              type="button"
              onClick={() => {
                setEditOpen(true);
                setMobileSidebarOpen(false);
              }}
              className="flex w-full rounded-md px-2.5 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
            >
              Edit Page
            </button>
            <button
              type="button"
              onClick={() => {
                setSettingsOpen(true);
                setMobileSidebarOpen(false);
              }}
              className="flex w-full rounded-md px-2.5 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
            >
              Settings
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="mt-3">
      {/* ── Mobile top bar ─────────────────────────────────────────────────── */}
      <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 lg:hidden">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-100">
            {community.logo ? (
              <img
                src={community.logo}
                alt={community.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#d9d2c7_0%,#c1b5a1_50%,#b1c0d0_100%)] text-sm font-semibold text-white">
                {community.name?.charAt(0)?.toUpperCase() || "C"}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {community.name}
            </p>
            <p className="text-xs text-slate-400 capitalize">{activeTab}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <FiMenu size={16} />
        </button>
      </div>

      {/* ── Mobile sidebar sheet ───────────────────────────────────────────── */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-72 overflow-y-auto p-3">
          <SheetHeader className="mb-3">
            <SheetTitle className="text-sm">Admin workspace</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <div className="grid gap-3 lg:grid-cols-12">
        {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
        <div className="hidden lg:block space-y-3 lg:col-span-3">
          <SidebarContent />
        </div>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div className="space-y-3 lg:col-span-6">
          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm sm:text-base font-semibold text-slate-900">
                    Dashboard
                  </p>
                  <p className="text-xs text-slate-500">
                    Manage posts and activity
                  </p>
                </div>
              </div>

              {showPageInfoPrompt && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm font-medium text-amber-800">
                    Update page info
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    {missingPageDescription && missingPageWebsite
                      ? "Add your page description and website link so visitors can learn more."
                      : missingPageDescription
                        ? "Add a page description so visitors understand what your page is about."
                        : "Add a website link so visitors can quickly access your external page."}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-3 h-8 rounded-full border-amber-300 bg-white px-3 text-[11px] text-amber-800 hover:bg-amber-800"
                    onClick={() => setEditOpen(true)}
                  >
                    Update page info
                  </Button>
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 sm:p-3">
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-500">
                    Followers
                  </p>
                  <p className="mt-1 text-lg sm:text-xl font-semibold text-slate-900">
                    {headerMembers}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 sm:p-3">
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-500">
                    Posts
                  </p>
                  <p className="mt-1 text-lg sm:text-xl font-semibold text-slate-900">
                    {posts.length}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-100 bg-slate-50 p-2.5 sm:p-3">
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-500">
                    Following
                  </p>
                  <p className="mt-1 text-lg sm:text-xl font-semibold text-slate-900">
                    {currentFollowing.length}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {postsLoading ? (
                  <div className="flex items-center gap-2 py-4 text-xs text-slate-400">
                    <FiLoader size={13} className="animate-spin" /> Loading
                    posts...
                  </div>
                ) : posts.length === 0 ? (
                  <div className="py-8 text-center">
                    <FiMessageSquare
                      size={22}
                      className="mx-auto mb-2 text-slate-300"
                    />
                    <p className="text-xs text-slate-400">
                      No posts yet. Start the conversation.
                    </p>
                  </div>
                ) : latestPost ? (
                  <PostsEventsList
                    posts={[latestPost]}
                    loading={false}
                    feedPosts={[latestPost]}
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
                    onOpenCommentsItem={handleOpenCommentsItem}
                    onEditPost={openEditPost}
                    onDeletePost={handleDeletePost}
                    onDeleteComment={handleDeleteComment}
                    isAdminView
                  />
                ) : null}

                {!postsLoading && posts.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 rounded-full border-slate-300 px-4 text-xs text-slate-600 "
                    onClick={() => setActiveTab("posts")}
                  >
                    Show all posts
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* POSTS */}
          {activeTab === "posts" && (
            <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm sm:text-base font-semibold text-slate-900">
                    Page content
                  </p>
                  <p className="text-xs text-slate-500">
                    Manage your page posts and events
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500"
                  onClick={() => setCreateOpen(true)}
                >
                  Create
                </button>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-left text-xs sm:text-sm text-slate-500"
                >
                  Start a post
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {postsLoading ||
                (activityLoading && communityEvents.length === 0) ? (
                  <div className="flex items-center gap-2 py-4 text-xs text-slate-400">
                    <FiLoader size={13} className="animate-spin" /> Loading
                    content...
                  </div>
                ) : adminFeed.length === 0 ? (
                  <div className="py-8 text-center">
                    <FiMessageSquare
                      size={22}
                      className="mx-auto mb-2 text-slate-300"
                    />
                    <p className="text-xs text-slate-400">
                      No posts or events yet. Start the conversation.
                    </p>
                  </div>
                ) : (
                  <PostsEventsList
                    feed={adminFeed}
                    loading={false}
                    feedPosts={posts}
                    currentUserId={currentUserId}
                    formatRelative={formatRelativeTime}
                    formatDate={formatRelativeTime}
                    onLikePost={handleLikePost}
                    onRepost={handleRepost}
                    onOpenComments={openComments}
                    onAddComment={handleAddComment}
                    onAddReply={handleAddReply}
                    onLikeItem={handleLikeItem}
                    onRepostItem={handleRepostItem}
                    onAddCommentItem={handleAddCommentItem}
                    onAddReplyItem={handleAddReplyItem}
                    onOpenCommentsItem={handleOpenCommentsItem}
                    onEditPost={openEditPost}
                    onDeletePost={handleDeletePost}
                    onEditEvent={openEditEvent}
                    onDeleteEvent={handleDeleteEvent}
                    onEditJob={openEditJob}
                    onDeleteJob={handleDeleteJob}
                    onEditArticle={openEditArticle}
                    onDeleteArticle={handleDeleteArticle}
                    onEditProduct={openEditProduct}
                    onDeleteProduct={handleDeleteProduct}
                    onDeleteComment={handleDeleteComment}
                    isAdminView
                  />
                )}
              </div>
            </div>
          )}

          {/* ACTIVITY */}
          {activeTab === "activity" && (
            <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm sm:text-base font-semibold text-slate-900">
                    Activity
                  </p>
                  <p className="text-xs text-slate-500">
                    Engagement across all posts
                  </p>
                </div>
              </div>

              {/* Engagement summary cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 sm:p-3 text-center">
                  <FiHeart size={14} className="mx-auto mb-1 text-rose-400" />
                  <p className="text-lg sm:text-xl font-semibold text-slate-900">
                    {activityStats.totalLikes}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500">Likes</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 sm:p-3 text-center">
                  <FiMessageSquare
                    size={14}
                    className="mx-auto mb-1 text-blue-400"
                  />
                  <p className="text-lg sm:text-xl font-semibold text-slate-900">
                    {activityStats.totalComments}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500">
                    Comments
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 sm:p-3 text-center">
                  <FiRepeat
                    size={14}
                    className="mx-auto mb-1 text-emerald-500"
                  />
                  <p className="text-lg sm:text-xl font-semibold text-slate-900">
                    {activityStats.totalReposts}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500">
                    Reposts
                  </p>
                </div>
              </div>

              {/* Followers section */}
              <div className="mt-4">
                <div className="mb-2 flex items-center gap-2">
                  <FiUsers size={13} className="text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700">
                    Followers ({headerMembers})
                  </p>
                </div>
                {members.length > 0 ? (
                  <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-2">
                    {members.slice(0, 5).map((member: any) => {
                      const name = member?.name || member?.fullName || "Member";
                      const id = member?._id || member?.id || "";
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5"
                        >
                          <Avatar
                            src={resolveAvatarSrc(member?.avatar)}
                            name={name}
                            size={28}
                            className="h-7 w-7"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-slate-900">
                              {name}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">
                              {member?.headline || member?.role || "Follower"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {members.length > 5 && (
                      <p className="px-2 text-[11px] text-slate-400">
                        +{members.length - 5} more followers
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No followers yet.</p>
                )}
              </div>

              {/* Per-post breakdown */}
              <div className="mt-4">
                <div className="mb-2 flex items-center gap-2">
                  <FiBarChart2 size={13} className="text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700">
                    Post engagement
                  </p>
                </div>

                {activityLoading ? (
                  <div className="flex items-center gap-2 py-4 text-xs text-slate-400">
                    <FiLoader size={13} className="animate-spin" /> Loading
                    activity...
                  </div>
                ) : posts.length === 0 ? (
                  <div className="py-6 text-center">
                    <FiEye size={22} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-xs text-slate-400">
                      No posts to show activity for.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {posts.map((post) => {
                      const likes = Array.isArray((post as any).likes)
                        ? (post as any).likes.length
                        : Number(
                            (post as any).likesCount ??
                              (post as any).likeCount ??
                              0,
                          );
                      const commentsArr = Array.isArray((post as any).comments)
                        ? (post as any).comments
                        : [];
                      const commentsCount =
                        commentsArr.length ||
                        Number(
                          (post as any).commentsCount ??
                            (post as any).commentCount ??
                            0,
                        );
                      const reposts = Array.isArray((post as any).reposts)
                        ? (post as any).reposts.length
                        : Number(
                            (post as any).repostsCount ??
                              (post as any).repostCount ??
                              0,
                          );

                      return (
                        <div
                          key={post._id}
                          className="rounded-lg border border-slate-200 bg-white p-3"
                        >
                          {/* Post preview */}
                          <p className="line-clamp-2 text-xs sm:text-sm text-slate-700">
                            {post.content}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {formatRelativeTime(post.createdAt)}
                          </p>

                          {/* Engagement row */}
                          <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2 text-[11px] sm:text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <FiHeart size={11} className="text-rose-400" />
                              {likes} like{likes !== 1 ? "s" : ""}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <FiMessageSquare
                                size={11}
                                className="text-blue-400"
                              />
                              {commentsCount} comment
                              {commentsCount !== 1 ? "s" : ""}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <FiRepeat
                                size={11}
                                className="text-emerald-500"
                              />
                              {reposts} repost{reposts !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Comments list with delete */}
                          {commentsArr.length > 0 && (
                            <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2">
                              <p className="text-[11px] font-medium text-slate-500">
                                Comments
                              </p>
                              {commentsArr.map((comment: any) => {
                                const commentId =
                                  comment?._id || comment?.id || "";
                                const commentAuthorId = String(
                                  comment?.author?._id ||
                                    comment?.authorId?._id ||
                                    comment?.authorId ||
                                    comment?.user?._id ||
                                    comment?.userId?._id ||
                                    comment?.userId ||
                                    comment?.createdBy?._id ||
                                    comment?.createdBy ||
                                    "",
                                );
                                const authorName =
                                  comment?.author?.name ||
                                  comment?.author?.fullName ||
                                  comment?.authorId?.name ||
                                  comment?.authorId?.fullName ||
                                  comment?.user?.name ||
                                  comment?.user?.fullName ||
                                  comment?.userId?.name ||
                                  comment?.userId?.fullName ||
                                  comment?.createdBy?.name ||
                                  comment?.createdBy?.fullName ||
                                  (commentAuthorId
                                    ? memberNameById.get(commentAuthorId)
                                    : "") ||
                                  "Member";
                                const commentAuthorAvatar =
                                  comment?.author?.avatar ||
                                  comment?.authorId?.avatar ||
                                  comment?.user?.avatar ||
                                  "";
                                return (
                                  <div
                                    key={commentId}
                                    className="flex items-start justify-between gap-2 rounded-md bg-slate-50 px-2 py-1.5"
                                  >
                                    <div className="min-w-0 flex flex-1 items-start gap-2">
                                      <Avatar
                                        src={resolveAvatarSrc(
                                          commentAuthorAvatar,
                                        )}
                                        name={authorName}
                                        size={24}
                                        className="mt-0.5 h-6 w-6"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-[11px] font-medium text-slate-700">
                                          {authorName}
                                        </p>
                                        <p className="text-[11px] text-slate-500 break-words">
                                          {comment?.content ||
                                            comment?.text ||
                                            ""}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteComment(
                                          post._id as string,
                                          commentId,
                                        )
                                      }
                                      disabled={mutating === commentId}
                                      className="shrink-0 rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                                      title="Delete comment"
                                    >
                                      {mutating === commentId ? (
                                        <FiLoader
                                          size={11}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        <FiTrash2 size={11} />
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Events */}
              {communityEvents.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-2">
                    <FiCalendar size={13} className="text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700">
                      Events ({communityEvents.length})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {communityEvents.map((event) => (
                      <div
                        key={event._id}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                      >
                        <p className="text-xs sm:text-sm font-semibold text-slate-900">
                          {event.title}
                        </p>
                        {event.description && (
                          <p className="mt-1 text-xs text-slate-700">
                            {event.description}
                          </p>
                        )}
                        {Array.isArray(event.images) &&
                          event.images.length > 0 && (
                            <div className="mt-2 overflow-hidden rounded-md border border-slate-100">
                              <img
                                src={event.images[0]}
                                alt={event.title}
                                className="w-full object-cover"
                              />
                            </div>
                          )}
                        {event.date && (
                          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <FiClock size={11} />
                            {formatRelativeTime(event.date)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────────── */}
        <div className="space-y-3 lg:col-span-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
            <p className="mb-3 text-sm font-semibold text-slate-900">
              Following pages
            </p>
            <div className="space-y-2">
              {currentFollowing.length > 0 ? (
                currentFollowing.slice(0, 4).map((item: any) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-2 sm:gap-2.5"
                  >
                    <div className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 overflow-hidden rounded-full bg-slate-100">
                      {item.logo ? (
                        <img
                          src={item.logo}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-900">
                        {item.name}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {item.industry || item.category || "Community"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">
                  Follow other pages to fill your feed.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3 sm:p-4">
            <p className="mb-2 text-sm font-semibold text-slate-900">
              Discover
            </p>
            {discoverLoading ? (
              <div className="flex items-center gap-2 py-4 text-xs text-slate-400">
                <FiLoader size={13} className="animate-spin" /> Loading...
              </div>
            ) : discoverCommunities.length > 0 ? (
              <div className="space-y-2">
                {discoverCommunities.slice(0, 4).map((item) => (
                  <div
                    key={item._id}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 sm:px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-100">
                        {item.logo ? (
                          <img
                            src={resolveAvatarSrc(item.logo)}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#d9d2c7_0%,#c1b5a1_50%,#b1c0d0_100%)] text-xs font-semibold text-white">
                            {item.name?.charAt(0)?.toUpperCase() || "C"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/communities/${item._id}`}
                          className="block truncate text-xs sm:text-sm font-medium text-slate-900 hover:underline"
                        >
                          {item.name}
                        </Link>
                        <p className="truncate text-[11px] sm:text-xs text-slate-500">
                          {item.industry || item.category || "Community"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No communities to discover.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Create / Edit post dialog ─────────────────────────────────────── */}
      {/* Promote member dialog */}
      <Dialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Promote member to admin</DialogTitle>
            <DialogDescription>
              Select a member to grant admin access.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
            {memberCandidates.filter(
              (m: any) => !adminIds.includes(resolveMemberUserId(m)),
            ).length > 0 ? (
              memberCandidates
                .filter((m: any) => !adminIds.includes(resolveMemberUserId(m)))
                .map((member: any) => {
                  const memberId = resolveMemberUserId(member);
                  const memberName =
                    member?.name || member?.userId?.name || "Member";
                  const memberRole = getMemberRoleLabel(
                    member?.userId || member,
                  );
                  return (
                    <div
                      key={memberId}
                      className="flex items-center justify-between rounded-md bg-white px-3 py-2"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <Avatar
                          src={resolveAvatarSrc(
                            member?.avatar || member?.userId?.avatar,
                          )}
                          name={memberName}
                          size={34}
                          className="h-8 w-8 sm:h-9 sm:w-9"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {memberName}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {memberRole}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await api.addCommunityAdmin(
                              community._id,
                              memberId,
                            );
                            const updatedCommunity = {
                              ...community,
                              admins: [...(community.admins || []), member],
                            };
                            onCommunityUpdated(updatedCommunity);
                            setPromoteDialogOpen(false);
                            toast({ title: "Admin added" });
                          } catch (error) {
                            console.error("Add admin failed", error);
                            toast({
                              title: "Could not add admin",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Promote
                      </Button>
                    </div>
                  );
                })
            ) : (
              <p className="text-xs text-slate-500">
                No members available to promote.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPromoteDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restrict member dialog */}
      <Dialog open={restrictDialogOpen} onOpenChange={setRestrictDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Restrict member</DialogTitle>
            <DialogDescription>
              Select a member to restrict from participating.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
            {memberCandidates.filter(
              (m: any) =>
                !adminIds.includes(resolveMemberUserId(m)) &&
                !restrictedMemberIds.includes(resolveMemberUserId(m)),
            ).length > 0 ? (
              memberCandidates
                .filter(
                  (m: any) =>
                    !adminIds.includes(resolveMemberUserId(m)) &&
                    !restrictedMemberIds.includes(resolveMemberUserId(m)),
                )
                .map((member: any) => {
                  const memberId = resolveMemberUserId(member);
                  const memberName =
                    member?.name || member?.userId?.name || "Member";
                  const memberRole = getMemberRoleLabel(
                    member?.userId || member,
                  );
                  return (
                    <div
                      key={memberId}
                      className="flex items-center justify-between rounded-md bg-white px-3 py-2"
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <Avatar
                          src={resolveAvatarSrc(
                            member?.avatar || member?.userId?.avatar,
                          )}
                          name={memberName}
                          size={34}
                          className="h-8 w-8 sm:h-9 sm:w-9"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {memberName}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {memberRole}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await api.addRestrictedCommunityMember(
                              community._id,
                              memberId,
                            );
                            const updatedCommunity = {
                              ...community,
                              restrictedMembers: [
                                ...(community.restrictedMembers || []),
                                member,
                              ],
                            };
                            onCommunityUpdated(updatedCommunity);
                            setRestrictDialogOpen(false);
                            toast({ title: "Member restricted" });
                          } catch (error) {
                            console.error("Restrict member failed", error);
                            toast({
                              title: "Could not restrict member",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Restrict
                      </Button>
                    </div>
                  );
                })
            ) : (
              <p className="text-xs text-slate-500">
                No members available to restrict.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRestrictDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setCreateMode("menu");
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {createMode === "menu"
                ? "Create"
                : createMode === "post"
                  ? editingPost
                    ? "Edit post"
                    : "Start a post"
                  : editingEvent
                    ? "Edit event"
                    : "Create an event"}
            </DialogTitle>
            <DialogDescription>
              {createMode === "menu"
                ? "Choose what you want to add to the page."
                : createMode === "post"
                  ? "Publish a page post for your followers."
                  : createMode === "event"
                    ? editingEvent
                      ? "Update your page event details."
                      : "Schedule a page event for your community."
                    : createMode === "job"
                      ? editingJob
                        ? "Update your job posting details."
                        : "Post a job to reach candidates outside your network."
                      : createMode === "article"
                        ? editingArticle
                          ? "Update your article details."
                          : "Publish an article to connect with followers through long-form content."
                        : createMode === "product"
                          ? editingProduct
                            ? "Update your product details."
                            : "Add a product to spotlight your organization's products."
                          : ""}
            </DialogDescription>
          </DialogHeader>

          {createMode === "menu" && (
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => setCreateMode("post")}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-slate-300 hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <FiMessageSquare className=" text-slate-500 " />
                  <p className="text-sm font-semibold text-slate-900">
                    Create post
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Share an update with your followers.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setCreateMode("event")}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-slate-300 hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <FiCalendar className=" text-slate-500" />
                  <p className="text-sm font-semibold text-slate-900">
                    Create event
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Host a session or meetup.
                </p>
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(`/communities/${community._id}/post-job`)
                }
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-slate-300 hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <FiBriefcase className=" text-slate-500" />
                  <p className="text-sm font-semibold text-slate-900">
                    Share that you're hiring
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Reach candidates outside your network with a job post.
                </p>
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(`/communities/${community._id}/write-article`)
                }
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-slate-300 hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <FiFileText className="mb-2 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-900">
                    Publish an article
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Connect with followers through long-form content.
                </p>
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(`/communities/${community._id}/add-product`)
                }
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-slate-300 hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <FiPackage className=" text-slate-500" />
                  <p className="text-sm font-semibold text-slate-900">
                    Add a product
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Spotlight your organization's products.
                </p>
              </button>
            </div>
          )}

          {createMode === "post" && (
            <div className="space-y-3">
              <Textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Write your post..."
                className="min-h-28 sm:min-h-32 text-sm"
              />
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900">
                    {postImageUploading ? (
                      <FiLoader size={12} className="animate-spin" />
                    ) : (
                      <FiPlus size={12} />
                    )}
                    Add images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={postImageUploading}
                      onChange={(e) =>
                        void uploadAttachmentImage(
                          Array.from(e.target.files || []),
                          "post",
                        )
                      }
                    />
                  </label>
                  <div className="flex flex-1 min-w-0 gap-2">
                    <Input
                      value={postLinkInput}
                      onChange={(e) => setPostLinkInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAttachmentLink("post");
                        }
                      }}
                      placeholder="Add a link"
                      className="h-9 text-xs sm:text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addAttachmentLink("post")}
                      className="h-9 shrink-0 rounded-full px-3 text-xs"
                    >
                      Add
                    </Button>
                  </div>
                </div>
                {postImages.length > 0 && (
                  <div className="mt-3 grid gap-2 grid-cols-2">
                    {postImages.map((url, i) => (
                      <div
                        key={`${url}-${i}`}
                        className="relative overflow-hidden rounded-lg border border-slate-200 bg-white"
                      >
                        <img
                          src={url}
                          alt=""
                          className="h-28 sm:h-32 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPostImages((c) =>
                              c.filter((_, idx) => idx !== i),
                            )
                          }
                          className="absolute right-2 top-2 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-black/55 text-white"
                        >
                          <FiTrash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {postLinks.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {postLinks.map((link) => (
                      <span
                        key={link}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 sm:px-3 py-1 text-xs text-slate-600"
                      >
                        <FiLink size={11} />
                        <span className="max-w-[120px] sm:max-w-[180px] truncate">
                          {link}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setPostLinks((c) => c.filter((l) => l !== link))
                          }
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <FiTrash2 size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {createMode === "event" && (
            <div className="space-y-3">
              <Input
                placeholder="Event title"
                value={eventForm.title}
                onChange={(e) =>
                  setEventForm((p) => ({ ...p, title: e.target.value }))
                }
                className="text-sm"
              />
              <Input
                type="datetime-local"
                value={eventForm.date}
                onChange={(e) =>
                  setEventForm((p) => ({ ...p, date: e.target.value }))
                }
                className="text-sm"
              />
              <Input
                placeholder="Location"
                value={eventForm.location}
                onChange={(e) =>
                  setEventForm((p) => ({ ...p, location: e.target.value }))
                }
                className="text-sm"
              />
              <Textarea
                placeholder="Description"
                value={eventForm.description}
                onChange={(e) =>
                  setEventForm((p) => ({ ...p, description: e.target.value }))
                }
                className="text-sm"
              />
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900">
                    {eventImageUploading ? (
                      <FiLoader size={12} className="animate-spin" />
                    ) : (
                      <FiPlus size={12} />
                    )}
                    Add images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={eventImageUploading}
                      onChange={(e) =>
                        void uploadAttachmentImage(
                          Array.from(e.target.files || []),
                          "event",
                        )
                      }
                    />
                  </label>
                  <div className="flex flex-1 min-w-0 gap-2">
                    <Input
                      value={eventLinkInput}
                      onChange={(e) => setEventLinkInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAttachmentLink("event");
                        }
                      }}
                      placeholder="Add a link"
                      className="h-9 text-xs sm:text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addAttachmentLink("event")}
                      className="h-9 shrink-0 rounded-full px-3 text-xs"
                    >
                      Add
                    </Button>
                  </div>
                </div>
                {eventImages.length > 0 && (
                  <div className="mt-3 grid gap-2 grid-cols-2">
                    {eventImages.map((url, i) => (
                      <div
                        key={`${url}-${i}`}
                        className="relative overflow-hidden rounded-lg border border-slate-200 bg-white"
                      >
                        <img
                          src={url}
                          alt=""
                          className="h-28 sm:h-32 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setEventImages((c) =>
                              c.filter((_, idx) => idx !== i),
                            )
                          }
                          className="absolute right-2 top-2 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-black/55 text-white"
                        >
                          <FiTrash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {eventLinks.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {eventLinks.map((link) => (
                      <span
                        key={link}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 sm:px-3 py-1 text-xs text-slate-600"
                      >
                        <FiLink size={11} />
                        <span className="max-w-[120px] sm:max-w-[180px] truncate">
                          {link}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEventLinks((c) => c.filter((l) => l !== link))
                          }
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <FiTrash2 size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {createMode === "job" && (
            <div className="space-y-3">
              <Input
                placeholder="Job title"
                value={jobForm.title}
                onChange={(e) =>
                  setJobForm((p) => ({ ...p, title: e.target.value }))
                }
                className="text-sm"
              />
              <Input
                placeholder="Location"
                value={jobForm.location}
                onChange={(e) =>
                  setJobForm((p) => ({ ...p, location: e.target.value }))
                }
                className="text-sm"
              />
              <Input
                placeholder="Salary"
                value={jobForm.salary}
                onChange={(e) =>
                  setJobForm((p) => ({ ...p, salary: e.target.value }))
                }
                className="text-sm"
              />
              <select
                value={jobForm.type}
                onChange={(e) =>
                  setJobForm((p) => ({ ...p, type: e.target.value }))
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="freelance">Freelance</option>
              </select>
              <Textarea
                placeholder="Job description"
                value={jobForm.description}
                onChange={(e) =>
                  setJobForm((p) => ({ ...p, description: e.target.value }))
                }
                className="text-sm"
              />
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900">
                    {jobImageUploading ? (
                      <FiLoader size={12} className="animate-spin" />
                    ) : (
                      <FiPlus size={12} />
                    )}
                    Add images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={jobImageUploading}
                      onChange={(e) =>
                        void uploadAttachmentImage(
                          Array.from(e.target.files || []),
                          "job",
                        )
                      }
                    />
                  </label>
                  <div className="flex flex-1 min-w-0 gap-2">
                    <Input
                      value={jobLinkInput}
                      onChange={(e) => setJobLinkInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAttachmentLink("job");
                        }
                      }}
                      placeholder="Add a link"
                      className="h-9 text-xs sm:text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addAttachmentLink("job")}
                      className="h-9 shrink-0 rounded-full px-3 text-xs"
                    >
                      Add
                    </Button>
                  </div>
                </div>
                {jobImages.length > 0 && (
                  <div className="mt-3 grid gap-2 grid-cols-2">
                    {jobImages.map((url, i) => (
                      <div
                        key={`${url}-${i}`}
                        className="relative overflow-hidden rounded-lg border border-slate-200 bg-white"
                      >
                        <img
                          src={url}
                          alt=""
                          className="h-28 sm:h-32 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setJobImages((c) => c.filter((_, idx) => idx !== i))
                          }
                          className="absolute right-2 top-2 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-black/55 text-white"
                        >
                          <FiTrash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {jobLinks.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {jobLinks.map((link) => (
                      <span
                        key={link}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 sm:px-3 py-1 text-xs text-slate-600"
                      >
                        <FiLink size={11} />
                        <span className="max-w-[120px] sm:max-w-[180px] truncate">
                          {link}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setJobLinks((c) => c.filter((l) => l !== link))
                          }
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <FiTrash2 size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {createMode === "article" && (
            <div className="space-y-3">
              <Input
                placeholder="Article title"
                value={articleForm.title}
                onChange={(e) =>
                  setArticleForm((p) => ({ ...p, title: e.target.value }))
                }
                className="text-sm"
              />
              <Textarea
                placeholder="Article content"
                value={articleForm.content}
                onChange={(e) =>
                  setArticleForm((p) => ({ ...p, content: e.target.value }))
                }
                className="min-h-48 text-sm"
              />
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900">
                    {articleImageUploading ? (
                      <FiLoader size={12} className="animate-spin" />
                    ) : (
                      <FiPlus size={12} />
                    )}
                    Add images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={articleImageUploading}
                      onChange={(e) =>
                        void uploadAttachmentImage(
                          Array.from(e.target.files || []),
                          "article",
                        )
                      }
                    />
                  </label>
                  <div className="flex flex-1 min-w-0 gap-2">
                    <Input
                      value={articleLinkInput}
                      onChange={(e) => setArticleLinkInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAttachmentLink("article");
                        }
                      }}
                      placeholder="Add a link"
                      className="h-9 text-xs sm:text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addAttachmentLink("article")}
                      className="h-9 shrink-0 rounded-full px-3 text-xs"
                    >
                      Add
                    </Button>
                  </div>
                </div>
                {articleImages.length > 0 && (
                  <div className="mt-3 grid gap-2 grid-cols-2">
                    {articleImages.map((url, i) => (
                      <div
                        key={`${url}-${i}`}
                        className="relative overflow-hidden rounded-lg border border-slate-200 bg-white"
                      >
                        <img
                          src={url}
                          alt=""
                          className="h-28 sm:h-32 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setArticleImages((c) =>
                              c.filter((_, idx) => idx !== i),
                            )
                          }
                          className="absolute right-2 top-2 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-black/55 text-white"
                        >
                          <FiTrash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {articleLinks.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {articleLinks.map((link) => (
                      <span
                        key={link}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 sm:px-3 py-1 text-xs text-slate-600"
                      >
                        <FiLink size={11} />
                        <span className="max-w-[120px] sm:max-w-[180px] truncate">
                          {link}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setArticleLinks((c) => c.filter((l) => l !== link))
                          }
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <FiTrash2 size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {createMode === "product" && (
            <div className="space-y-3">
              <Input
                placeholder="Product title"
                value={productForm.title}
                onChange={(e) =>
                  setProductForm((p) => ({ ...p, title: e.target.value }))
                }
                className="text-sm"
              />
              <Input
                placeholder="Price"
                value={productForm.price}
                onChange={(e) =>
                  setProductForm((p) => ({ ...p, price: e.target.value }))
                }
                className="text-sm"
              />
              <Textarea
                placeholder="Product description"
                value={productForm.description}
                onChange={(e) =>
                  setProductForm((p) => ({ ...p, description: e.target.value }))
                }
                className="text-sm"
              />
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 sm:p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900">
                    {productImageUploading ? (
                      <FiLoader size={12} className="animate-spin" />
                    ) : (
                      <FiPlus size={12} />
                    )}
                    Add images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={productImageUploading}
                      onChange={(e) =>
                        void uploadAttachmentImage(
                          Array.from(e.target.files || []),
                          "product",
                        )
                      }
                    />
                  </label>
                  <div className="flex flex-1 min-w-0 gap-2">
                    <Input
                      value={productLinkInput}
                      onChange={(e) => setProductLinkInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addAttachmentLink("product");
                        }
                      }}
                      placeholder="Add a link"
                      className="h-9 text-xs sm:text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addAttachmentLink("product")}
                      className="h-9 shrink-0 rounded-full px-3 text-xs"
                    >
                      Add
                    </Button>
                  </div>
                </div>
                {productImages.length > 0 && (
                  <div className="mt-3 grid gap-2 grid-cols-2">
                    {productImages.map((url, i) => (
                      <div
                        key={`${url}-${i}`}
                        className="relative overflow-hidden rounded-lg border border-slate-200 bg-white"
                      >
                        <img
                          src={url}
                          alt=""
                          className="h-28 sm:h-32 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setProductImages((c) =>
                              c.filter((_, idx) => idx !== i),
                            )
                          }
                          className="absolute right-2 top-2 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-black/55 text-white"
                        >
                          <FiTrash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {productLinks.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {productLinks.map((link) => (
                      <span
                        key={link}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 sm:px-3 py-1 text-xs text-slate-600"
                      >
                        <FiLink size={11} />
                        <span className="max-w-[120px] sm:max-w-[180px] truncate">
                          {link}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setProductLinks((c) => c.filter((l) => l !== link))
                          }
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <FiTrash2 size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {createMode !== "menu" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateMode("menu")}
              >
                Back
              </Button>
            )}
            {createMode === "menu" ? (
              <Button
                type="button"
                variant="outline"
                onClick={closeCreateDialog}
              >
                Close
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  if (createMode === "post") return createPost();
                  if (createMode === "event") return createEvent();
                  if (createMode === "job") return createJob();
                  if (createMode === "article") return createArticle();
                  if (createMode === "product") return createProduct();
                  return undefined;
                }}
                disabled={
                  createMode === "post"
                    ? submittingPost
                    : createMode === "event"
                      ? submittingEvent
                      : createMode === "job"
                        ? submittingJob
                        : createMode === "article"
                          ? submittingArticle
                          : createMode === "product"
                            ? submittingProduct
                            : false
                }
              >
                {createMode === "post"
                  ? submittingPost
                    ? "Saving..."
                    : editingPost
                      ? "Update"
                      : "Publish"
                  : createMode === "event"
                    ? submittingEvent
                      ? "Saving..."
                      : editingEvent
                        ? "Update"
                        : "Publish"
                    : createMode === "job"
                      ? submittingJob
                        ? "Saving..."
                        : editingJob
                          ? "Update"
                          : "Publish"
                      : createMode === "article"
                        ? submittingArticle
                          ? "Saving..."
                          : editingArticle
                            ? "Update"
                            : "Publish"
                        : createMode === "product"
                          ? submittingProduct
                            ? "Saving..."
                            : editingProduct
                              ? "Update"
                              : "Publish"
                          : "Publish"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete post confirmation */}
      <Dialog
        open={deletePostConfirmOpen}
        onOpenChange={setDeletePostConfirmOpen}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={cancelDeletePost}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeletePost}
              disabled={mutating !== null}
            >
              {mutating ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete comment confirmation */}
      <Dialog
        open={deleteCommentConfirmOpen}
        onOpenChange={setDeleteCommentConfirmOpen}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelDeleteComment}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteComment}
              disabled={mutating !== null}
            >
              {mutating ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete event confirmation */}
      <Dialog
        open={deleteEventConfirmOpen}
        onOpenChange={setDeleteEventConfirmOpen}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={cancelDeleteEvent}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteEvent}
              disabled={mutating !== null}
            >
              {mutating ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete job confirmation */}
      <Dialog
        open={deleteJobConfirmOpen}
        onOpenChange={setDeleteJobConfirmOpen}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete job</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={cancelDeleteJob}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteJob}
              disabled={mutating !== null}
            >
              {mutating ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete article confirmation */}
      <Dialog
        open={deleteArticleConfirmOpen}
        onOpenChange={setDeleteArticleConfirmOpen}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this article? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelDeleteArticle}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteArticle}
              disabled={mutating !== null}
            >
              {mutating ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete product confirmation */}
      <Dialog
        open={deleteProductConfirmOpen}
        onOpenChange={setDeleteProductConfirmOpen}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelDeleteProduct}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteProduct}
              disabled={mutating !== null}
            >
              {mutating ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete page confirmation */}
      <Dialog
        open={deletePageOpen}
        onOpenChange={(open) => {
          setDeletePageOpen(open);
          if (!open) setDeletePageConfirmText("");
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete page</DialogTitle>
            <DialogDescription>
              This permanently removes this page and related posts, events,
              comments, likes, and community follow links. This action will only
              delete the page and its content; your user account will not be
              deleted and you will not be logged out. Type DELETE or the page
              name to continue.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deletePageConfirmText}
            onChange={(e) => setDeletePageConfirmText(e.target.value)}
            placeholder={`Type DELETE or ${community.name}`}
          />
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancelDeletePage}
              disabled={deletingPage}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeletePage}
              disabled={deletingPage}
            >
              {deletingPage ? "Deleting..." : "Delete page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit page sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>Edit Page</SheetTitle>
            <SheetDescription>
              Edit your page details and urls.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-5 space-y-3">
            <Input
              value={editForm.name}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Page name"
            />
            <Textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Description"
            />
            <Input
              value={editForm.tagline}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, tagline: e.target.value }))
              }
              placeholder="Tagline"
            />
            {/* <Input value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))} placeholder="Category" /> */}
            <Input
              value={editForm.industry}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, industry: e.target.value }))
              }
              placeholder="Industry"
            />
            <Input
              value={editForm.website}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, website: e.target.value }))
              }
              placeholder="Website URL"
            />
          </div>
          <div className="mt-5 flex gap-2">
            <Button
              type="button"
              className="flex-1"
              onClick={savePageDetails}
              disabled={savingEdit}
            >
              {savingEdit ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings sheet */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-2xl"
        >
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>
              Promote members, restrict members, and delete the page.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-6">
            <section>
              <div className="mb-3">
                <p className="text-sm font-semibold text-slate-900">Admins</p>
                <p className="text-xs text-slate-400">
                  Current page admins. Promote new admins from the dialog.
                </p>
              </div>
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                {admins && admins.length > 0 ? (
                  admins.slice(0, 6).map((a: any) => {
                    const id = String(a?._id || a?.id || a || "");
                    const name = a?.name || a?.fullName || "Admin";
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 rounded-full bg-white px-2 py-1 border border-slate-100"
                      >
                        <Avatar
                          src={resolveAvatarSrc(a?.avatar)}
                          name={name}
                          size={28}
                        />
                        <span className="text-xs font-medium text-slate-800">
                          {name}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await api.removeCommunityAdmin(community._id, id);
                              const updatedCommunity = {
                                ...community,
                                admins: (community.admins || []).filter(
                                  (a: any) => String(a?._id || a) !== id,
                                ),
                              };
                              onCommunityUpdated(updatedCommunity);
                              toast({ title: "Admin removed" });
                            } catch (error) {
                              console.error("Remove admin failed", error);
                              toast({
                                title: "Could not remove admin",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500">
                    No admins assigned yet.
                  </p>
                )}
                <div>
                  <Button type="button" size="sm" onClick={openPromoteDialog}>
                    Assign admin
                  </Button>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3">
                <p className="text-sm font-semibold text-slate-900">
                  Restricted members
                </p>
                <p className="text-xs text-slate-400">
                  Members prevented from participating. Manage restrictions from
                  the dialog.
                </p>
              </div>
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                {restrictedMembers && restrictedMembers.length > 0 ? (
                  restrictedMembers.slice(0, 6).map((m: any) => {
                    const id = String(m?._id || m?.id || m || "");
                    const name = m?.name || m?.fullName || "Member";
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 rounded-full bg-white px-2 py-1 border border-slate-100"
                      >
                        <Avatar
                          src={resolveAvatarSrc(m?.avatar)}
                          name={name}
                          size={28}
                        />
                        <span className="text-xs font-medium text-slate-800">
                          {name}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await api.removeRestrictedCommunityMember(
                                community._id,
                                id,
                              );
                              const updatedCommunity = {
                                ...community,
                                restrictedMembers: (
                                  community.restrictedMembers || []
                                ).filter(
                                  (r: any) => String(r?._id || r) !== id,
                                ),
                              };
                              onCommunityUpdated(updatedCommunity);
                              toast({ title: "Restriction removed" });
                            } catch (error) {
                              console.error("Remove restriction failed", error);
                              toast({
                                title: "Could not remove restriction",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500">
                    No restricted members.
                  </p>
                )}
                <div>
                  <Button type="button" size="sm" onClick={openRestrictDialog}>
                    Restrict member
                  </Button>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="max-w-[70%]">
                  <p className="text-sm font-semibold text-red-700">
                    Delete page
                  </p>
                  <p className="text-xs text-red-600">
                    This permanently removes the page and all associated content
                    (posts, events, comments, likes, and follow links). This
                    action only deletes the page — it will not log you out or
                    delete your user account.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeletePageOpen(true)}
                >
                  Delete
                </Button>
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CommunityAdminWorkspace;
