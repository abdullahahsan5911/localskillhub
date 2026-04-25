import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import CommunityAdminWorkspace from "@/components/community/CommunityAdminWorkspace";
import CommunityMemberView from "@/components/community/CommunityMemberView";
import type { Community, CommunityPostItem } from "@/components/community/types";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { FiLoader } from "react-icons/fi";

const CommunityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const [community, setCommunity] = useState<Community | null>(null);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [coverImageUploading, setCoverImageUploading] = useState(false);

  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const currentUserId = (user as any)?._id as string | undefined;

  const isOwner = useMemo(() => {
    if (!community || !currentUserId) return false;
    const ownerId = (community.ownerId as any)?._id || community.ownerId;
    return !!ownerId && ownerId.toString() === currentUserId.toString();
  }, [community, currentUserId]);

  const requestedView = searchParams.get("view");
  const pageView: "admin" | "member" = requestedView === "member" ? "member" : isOwner ? "admin" : "member";

  useEffect(() => {
    const hasView = searchParams.has("view");
    if (!isOwner && pageView === "admin") {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("view", "member");
        return next;
      }, { replace: true });
      return;
    }

    if (isOwner && !hasView) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("view", "admin");
        return next;
      }, { replace: true });
    }
  }, [isOwner, pageView, searchParams, setSearchParams]);

  const loadCommunity = async () => {
    if (!id) return;
    try {
      setCommunityLoading(true);
      const res = await api.getCommunityById(id);
      const payload: any = (res as any).data || res;
      const c = payload.community || payload.data?.community || payload.data || payload;
      setCommunity(c as Community);
    } catch (err) {
      console.error("Failed to load community", err);
      toast({
        title: "Community not found",
        description: "This community could not be loaded.",
        variant: "destructive",
      });
    } finally {
      setCommunityLoading(false);
    }
  };

  const loadPosts = async () => {
    if (!id) {
      setPosts([]);
      return;
    }
    try {
      setPostsLoading(true);
      const res = await api.getCommunityPosts(id, { limit: 20 });
      const data = (res as any).data?.data || (res as any).data || {};
      setPosts((data.posts as CommunityPostItem[]) || []);
    } catch (err) {
      console.error("Failed to load posts", err);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    void loadCommunity();
    void loadPosts();
  }, [id]);

  const formatDate = (iso: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelativeTime = (iso: string) => {
    if (!iso) return "";
    const ts = new Date(iso).getTime();
    const diffMs = Date.now() - ts;
    const mins = Math.max(1, Math.floor(diffMs / 60000));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(iso);
  };

  const headerMembers = useMemo(() => {
    if (!community) return 0;
    const members = Array.isArray(community.members) ? community.members : [];
    const admins = Array.isArray(community.admins) ? community.admins : [];
    const owner = (community.ownerId as any)?._id || community.ownerId;
    const adminIds = new Set(admins.map((a: any) => String((a && (a._id || a)) || "")));
    return members.filter((m: any) => {
      const id = String((m && (m._id || m)) || "");
      if (!id) return false;
      if (String(owner) === id) return false;
      if (adminIds.has(id)) return false;
      return true;
    }).length;
  }, [community]);

  const featuredMembers = useMemo(() => {
    if (!community) return [] as any[];
    const members = Array.isArray(community.members) ? community.members : [];
    const admins = Array.isArray(community.admins) ? community.admins : [];
    const owner = (community.ownerId as any)?._id || community.ownerId;
    const adminIds = new Set(admins.map((a: any) => String((a && (a._id || a)) || "")));
    return members.filter((m: any) => {
      const id = String((m && (m._id || m)) || "");
      if (!id) return false;
      if (String(owner) === id) return false;
      if (adminIds.has(id)) return false;
      return true;
    }).slice(0, 5);
  }, [community]);
  const showAdminView = isOwner && pageView === "admin";
  const showMemberPreviewBanner = isOwner && pageView === "member";
  const showOwnerViewToggle = isOwner;

  const switchToView = (target: "admin" | "member") => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("view", target);
      return next;
    });
  };

  const handleCommunityImageUpload = async (file?: File, target: "logo" | "coverImage" = "logo") => {
    if (!file || !showAdminView || !community?._id) return;
    try {
      if (target === "logo") {
        setProfileImageUploading(true);
      } else {
        setCoverImageUploading(true);
      }
      const result = await uploadToCloudinary(file);
      const updateData = { [target]: result.url };
      const res = await api.updateCommunity(community._id, updateData);
      const updatedCommunity = (res as any).data?.community || (res as any).data?.data?.community || (res as any).data || community;
      setCommunity(updatedCommunity as Community);
      toast({ title: "Photo saved", description: "The image was uploaded and saved successfully." });
    } catch (error) {
      console.error("Failed to upload community image", error);
      toast({
        title: "Upload failed",
        description: "Could not upload the photo right now.",
        variant: "destructive",
      });
    } finally {
      if (target === "logo") {
        setProfileImageUploading(false);
      } else {
        setCoverImageUploading(false);
      }
    }
  };

  const handleCommunityImageRemove = async (target: "logo" | "coverImage") => {
    if (!showAdminView || !community?._id) return;
    try {
      const updateData = { [target]: "" };
      const res = await api.updateCommunity(community._id, updateData);
      const updatedCommunity = (res as any).data?.community || (res as any).data?.data?.community || (res as any).data || community;
      setCommunity(updatedCommunity as Community);
      toast({ title: "Photo removed", description: "The image was removed successfully." });
    } catch (error) {
      console.error("Failed to remove community image", error);
      toast({
        title: "Remove failed",
        description: "Could not remove the image right now.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#f4f2ed]">
        {showMemberPreviewBanner && (
          <div className="w-full bg-[#0a66c2] px-4 py-2 text-xs font-medium text-white sm:px-6">
            <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-2">
              <p>You are viewing this page as a member</p>
              <Button
                type="button"
                size="sm"
                onClick={() => switchToView("admin")}
                className="h-7 rounded-full bg-white text-black  hover:text-blue-700 hover:bg-white active:bg-white  "
              >
                View as admin
              </Button>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-[1200px] px-3 py-4 sm:px-6">
          {communityLoading ? (
            <div className="flex items-center justify-center py-16">
              <FiLoader className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : !community ? (
            <div className="py-16 text-center text-sm text-slate-500">Community not found.</div>
          ) : (
            showAdminView ? (
              <CommunityAdminWorkspace
                community={community}
                headerMembers={headerMembers}
                posts={posts}
                postsLoading={postsLoading}
                coverImageUploading={coverImageUploading}
                profileImageUploading={profileImageUploading}
                showOwnerViewToggle={showOwnerViewToggle}
                onSwitchToMember={() => switchToView("member")}
                onUploadImage={(file, target = "logo") => handleCommunityImageUpload(file, target)}
                onRemoveImage={handleCommunityImageRemove}
                onCommunityUpdated={(updatedCommunity) => setCommunity(updatedCommunity)}
                onRefreshPosts={() => void loadPosts()}
                formatRelativeTime={formatRelativeTime}
              />
            ) : (
              <CommunityMemberView
                community={community}
                headerMembers={headerMembers}
                posts={posts}
                postsLoading={postsLoading}
                featuredMembers={featuredMembers}
                formatRelativeTime={formatRelativeTime}
                onCommunityUpdated={(updatedCommunity) => setCommunity(updatedCommunity)}
                onRefreshPosts={() => void loadPosts()}
              />
            )
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CommunityDetail;
