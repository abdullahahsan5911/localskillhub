import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  MapPin,
  Loader2,
  Star,
  UserPlus,
  UserCheck,
  Mail,
  Share2,
  Briefcase,
  Clock,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { toggleGuestFollow } from "@/lib/guestStorage";
import { useUserPresence } from "@/hooks/usePresence";
import { formatLastSeen } from "@/utils/presence";
import { resolveAvatarSrc } from "@/lib/avatar";
import type { Job } from "./client-dashboard/types";

interface ClientUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  followers?: string[];
  following?: string[];
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  verifiedBadges?: { type: string; verifiedAt?: string }[];
  adminBadges?: { type: string; assignedAt?: string; assignedBy?: string }[];
  role: string;
}

interface ReputationStats {
  stats?: {
    totalJobsCompleted?: number;
    profileViews?: number;
    successRate?: number;
  };
  scoreBreakdown?: {
    reviews?: number;
  };
}

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();

  const [client, setClient] = useState<ClientUser | null>(null);
  const [reputation, setReputation] = useState<ReputationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<"about" | "jobs">("about");

  // Get real-time online status
  const { isOnline, lastSeen } = useUserPresence(client?._id || '');

  const isOwnProfile = currentUser?._id === id;

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        const [userRes, repRes, jobsRes] = await Promise.all([
          api.getUser(id),
          api.getReputation(id),
          api.getJobs({ clientId: id, status: "open", limit: 5 }),
        ]);

        const backendUser: any = (userRes as any).data?.user || (userRes as any).data;
        const repData: any = (repRes as any).data || repRes;
        const jobsPayload: any = (jobsRes as any).data;

        if (!backendUser) {
          setError("Client not found");
          setClient(null);
          return;
        }

        if (backendUser.role !== "client") {
          setError("This user is not a client.");
        }

        const followers: string[] = backendUser.followers || [];

        let clientJobs: Job[] = [];
        if (Array.isArray(jobsPayload)) {
          clientJobs = jobsPayload as Job[];
        } else if (jobsPayload?.jobs) {
          clientJobs = jobsPayload.jobs as Job[];
        } else if (jobsPayload?.data?.jobs) {
          clientJobs = jobsPayload.data.jobs as Job[];
        }

        setClient(backendUser);
        setFollowerCount(followers.length);
        setFollowing(currentUser?._id ? followers.includes(currentUser._id) : false);
        setReputation(repData);
        setJobs(clientJobs);
      } catch (err: any) {
        setError(err.message || "Failed to load client profile");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, currentUser?._id]);

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const locationText = client?.location
    ? [client.location.city, client.location.state, client.location.country]
        .filter(Boolean)
        .join(", ")
    : "";

  const getBadgeLabel = (badgeType: string) => {
    const labels: Record<string, string> = {
      verified: "Verified",
      top_freelancer: "Top Freelancer",
      rising_talent: "Rising Talent",
      local_verified: "Local Verified",
      trusted_client: "Trusted Client",
      email: "Email Verified",
      phone: "Phone Verified",
      id: "ID Verified",
      selfie: "Selfie Verified",
      college: "College Verified",
      workshop: "Workshop Certified",
      employer: "Employer Verified",
      github: "GitHub Verified"
    };
    return labels[badgeType] || badgeType;
  };

  const getBadgeColor = (badgeType: string) => {
    if (badgeType === "verified" || badgeType === "trusted_client") return "bg-blue-100 text-blue-700 border-blue-300";
    if (badgeType === "top_freelancer") return "bg-purple-100 text-purple-700 border-purple-300";
    if (badgeType === "rising_talent") return "bg-amber-100 text-amber-700 border-amber-300";
    if (badgeType === "local_verified") return "bg-green-100 text-green-700 border-green-300";
    // Verified badge colors
    if (badgeType === "email" || badgeType === "phone") return "bg-cyan-100 text-cyan-700 border-cyan-300";
    if (badgeType === "id" || badgeType === "selfie") return "bg-indigo-100 text-indigo-700 border-indigo-300";
    if (badgeType === "college" || badgeType === "workshop") return "bg-amber-100 text-amber-700 border-amber-300";
    if (badgeType === "employer" || badgeType === "github") return "bg-slate-100 text-slate-700 border-slate-300";
    return "bg-gray-100 text-gray-700 border-gray-300";
  };

  // Only public-facing badges are shown on the client profile page.
  const publicBadgeTypes: string[] = ["verified", "trusted_client", "employer"];

  const allClientBadges = [
    ...(client?.verifiedBadges || []).map(b => ({ ...b, source: 'verified' as const })),
    ...(client?.adminBadges || []).map(b => ({ ...b, source: 'admin' as const }))
  ].filter(b => publicBadgeTypes.includes(b.type));

  const handleFollow = async () => {
    if (!client) return;

    if (!currentUser) {
      const isNowFollowing = toggleGuestFollow(client._id);
      setFollowing(isNowFollowing);
      setFollowerCount((c) => (isNowFollowing ? c + 1 : Math.max(c - 1, 0)));
      return;
    }

    setFollowLoading(true);
    try {
      if (following) {
        await (api as any).unfollowUser(client._id);
        setFollowing(false);
        setFollowerCount((c) => (c > 0 ? c - 1 : 0));
      } else {
        await (api as any).followUser(client._id);
        setFollowing(true);
        setFollowerCount((c) => c + 1);
      }
      await refreshUser();
    } catch {
      // silently ignore follow errors on profile page
    } finally {
      setFollowLoading(false);
    }
  };

  const getDashboardBase = () => {
    if (!currentUser) return "/";
    if (currentUser.role === "client") return "/dashboard/client";
    if (currentUser.role === "freelancer") return "/dashboard/freelancer";
    return "/";
  };

  const handleContact = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    if (!client?._id) return;

    const dashboardBase = getDashboardBase();
    navigate(`${dashboardBase}?tab=messages&userId=${client._id}`);
  };

  const handleShare = async () => {
    if (!client?.name) return;

    const url = window.location.href;
    const title = `${client.name} – Client on LocalSkillHub`;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Profile link copied",
          description: "You can now paste it anywhere to share.",
        });
      } else {
        const dummy = document.createElement("input");
        dummy.value = url;
        document.body.appendChild(dummy);
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
        toast({
          title: "Profile link copied",
          description: "You can now paste it anywhere to share.",
        });
      }
    } catch {
      toast({
        title: "Unable to share",
        description: "Something went wrong while sharing this profile.",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!client) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
          <p className="text-red-600 mb-4">{error || "Client not found"}</p>
          <Link to="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </Layout>
    );
  }

  const followingCount = client.following?.length || 0;
  const completedJobs = reputation?.stats?.totalJobsCompleted ?? 0;
  const profileViews = reputation?.stats?.profileViews ?? 0;
  const successRate = reputation?.stats?.successRate ?? 0;
  const reviewScore = reputation?.scoreBreakdown?.reviews ?? 0;

  return (
    <Layout>
      <section className="min-h-screen bg-white">
        <div className="w-full">
          <div className="group relative">
            <div className="group relative h-36 sm:h-48 md:h-64 overflow-hidden border-b border-white/10 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900">
              <div className="absolute inset-0 bg-black/25" />
            </div>

            <div className="absolute -bottom-14 left-10">
              <div className="bottom-0 h-24 w-24 shrink-0 rounded-full bg-slate-100 shadow-md sm:h-32 sm:w-32">
                <img
                  src={resolveAvatarSrc(client.avatar)}
                  alt={client.name}
                  className="h-full w-full rounded-full object-cover"
                />
                <span
                  className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-gray-400"}`}
                  title={isOnline ? "Online" : `Last seen ${formatLastSeen(lastSeen)}`}
                />
              </div>
            </div>

            <div className="mb-24" />
          </div>

          <div className="mx-auto mt-4 w-full max-w-[1500px] px-3 sm:mt-6 sm:px-6">
            <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row">
              <aside className="space-y-3 sm:space-y-4 lg:w-72">
                <div className="rounded-xl bg-white p-4 text-gray-900">
                  <div className="flex flex-col items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col">
                          <h1 className="truncate text-2xl font-bold text-gray-900">{client.name}</h1>
                          <p className="rounded-lg bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            Trusted client
                          </p>
                        </div>
                        {allClientBadges.some((b) => b.type === "verified" || b.type === "trusted_client") && (
                          <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600" />
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600">Client on LocalSkillHub</p>
                      <div className="mt-2 space-y-1 text-xs text-gray-500">
                        {locationText && (
                          <p className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {locationText}
                          </p>
                        )}
                        <p className="text-xs">
                          {isOnline ? "Online" : `Last seen ${formatLastSeen(lastSeen)}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {allClientBadges.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {allClientBadges.map((badge, idx) => (
                        <span
                          key={`${badge.source}-${badge.type}-${idx}`}
                          className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold ${getBadgeColor(badge.type)}`}
                          title={`${getBadgeLabel(badge.type)} ${badge.source === "admin" ? "(Admin Badge)" : ""}`}
                        >
                          {getBadgeLabel(badge.type)}
                        </span>
                      ))}
                    </div>
                  )}

                  {!isOwnProfile && (
                    <div className="mt-4 space-y-2">
                      <Button
                        onClick={handleFollow}
                        disabled={followLoading}
                        variant={following ? "outline" : "default"}
                        className={`w-full rounded-full gap-2 text-xs sm:text-sm ${
                          following
                            ? "border-blue-300 text-blue-700 hover:bg-blue-700 hover:text-blue-50"
                            : "bg-blue-700 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {followLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : following ? (
                          <>
                            <UserCheck className="h-4 w-4" /> Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" /> Follow
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleContact}
                        variant="outline"
                        className="w-full rounded-full gap-2 border-gray-300 bg-white text-xs text-gray-700 hover:bg-blue-700 sm:text-sm"
                      >
                        <Mail className="h-4 w-4" /> Message
                      </Button>
                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-full rounded-full border border-gray-300 px-3 py-2 text-xs text-black transition hover:bg-gray-50 hover:text-gray-500 sm:text-sm"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Share2 className="h-4 w-4" /> Share profile
                        </span>
                      </button>
                    </div>
                  )}

                  {isOwnProfile && (
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        className="w-full rounded-full text-xs sm:text-sm"
                        onClick={() => navigate("/dashboard/client")}
                      >
                        Go to dashboard
                      </Button>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg sm:rounded-2xl border border-gray-200 p-3 sm:p-4 text-xs sm:text-sm">
                  <p className="font-semibold text-gray-900 mb-3">Client Insights</p>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Followers</span>
                      <span className="font-semibold text-gray-900">{followerCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Following</span>
                      <span className="font-semibold text-gray-900">{followingCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Jobs completed</span>
                      <span className="font-semibold text-gray-900">{completedJobs}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Profile views</span>
                      <span className="font-semibold text-gray-900">{profileViews}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Success rate</span>
                      <span className="font-semibold text-gray-900">{successRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Review score</span>
                      <span className="flex items-center gap-1 font-semibold text-gray-900">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {reviewScore ? `${(reviewScore / 20).toFixed(1)}` : "0.0"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg sm:rounded-2xl border border-gray-200 p-3 sm:p-4 text-xs sm:text-sm">
                  <p className="font-semibold text-gray-900 mb-2">About this client</p>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-6">
                    This client hires local talent on LocalSkillHub. Their detailed hiring history and preferences will appear here as they complete more jobs and interact with freelancers.
                  </p>
                </div>
              </aside>

              <main className="flex-1 bg-white rounded-lg sm:rounded-2xl border border-gray-200">
                <div className="flex gap-1 border-b border-gray-200 px-3 sm:px-4 md:px-6 overflow-x-auto scrollbar-hide">
                  {[
                    { id: "about", label: "About" },
                    { id: "jobs", label: "Jobs" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as "about" | "jobs")}
                      className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                        activeTab === tab.id
                          ? "text-blue-600 border-blue-600"
                          : "text-gray-500 border-transparent hover:text-gray-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-3 sm:p-4 md:p-6 text-xs sm:text-sm">
                  {activeTab === "about" && (
                    <div className="max-w-2xl space-y-3 sm:space-y-4">
                      <h2 className="text-base font-semibold text-gray-900 mb-1">About this client</h2>
                      <p className="text-gray-700 leading-relaxed">
                        This client hires local talent on LocalSkillHub. Their detailed hiring history and preferences will appear here as they complete more jobs and collaborate with freelancers.
                      </p>
                    </div>
                  )}

                  {activeTab === "jobs" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                          Open jobs by this client
                        </h2>
                        {jobs.length > 0 && (
                          <span className="text-xs text-gray-500">
                            Showing {jobs.length} job{jobs.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {jobs.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                          <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                          <p className="font-medium">No open jobs right now</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Check back later to see new opportunities from this client.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {jobs.map((job) => (
                            <Link
                              key={job._id}
                              to={`/jobs/${job._id}`}
                              className="block rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm line-clamp-2">{job.title}</p>
                                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <DollarSign className="w-3.5 h-3.5" />
                                      {job.budget?.amount?.toLocaleString()} {job.budget?.currency}
                                      {job.budget?.type === "hourly" ? "/hr" : ""}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      {new Date(job.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 capitalize">
                                  {job.status}
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ClientProfile;
