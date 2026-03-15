import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  MapPin, Shield, UserPlus, UserCheck, Mail, Star,
  Briefcase, ExternalLink, ChevronLeft, Share2, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

interface FreelancerData {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    location: { city: string; state: string };
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
    followers?: string[];
    following?: string[];
  };
  title: string;
  bio: string;
  skills: Array<{ name: string; level: string }>;
  rates: { minRate: number; maxRate: number; currency: string; rateType: string };
  localScore: number;
  globalScore: number;
  completedJobs: number;
  profileViews: number;
  availability: { status: string };
  portfolio: Array<{
    _id: string; title: string; description: string;
    images?: string[]; imageUrl?: string; link?: string; tags: string[];
  }>;
  experience: Array<{ title: string; company: string; duration: string }>;
  education: Array<{ degree: string; institution: string; year: string }>;
}

const FreelancerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = (user as any)?._id;

  const [activeTab, setActiveTab] = useState("portfolio");
  const [freelancer, setFreelancer] = useState<FreelancerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getFreelancer(id!);
      if (response.data) {
        const data = (response.data as any).freelancer || response.data;
        setFreelancer(data);
        const followers: string[] = data.userId?.followers || [];
        setFollowerCount(followers.length);
        setFollowing(currentUserId ? followers.includes(currentUserId) : false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch freelancer profile");
    } finally {
      setLoading(false);
    }
  }, [id, currentUserId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleFollow = async () => {
    if (!user) { navigate("/login"); return; }
    setFollowLoading(true);
    try {
      if (following) {
        await api.unfollowUser(freelancer!.userId._id);
        setFollowing(false);
        setFollowerCount(c => c - 1);
      } else {
        await api.followUser(freelancer!.userId._id);
        setFollowing(true);
        setFollowerCount(c => c + 1);
      }
    } catch { /* ignore */ } finally {
      setFollowLoading(false);
    }
  };

  const handleContact = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!freelancer?.userId._id) return;

    let dashboardBase = "/";
    if (user.role === "client") dashboardBase = "/dashboard/client";
    else if (user.role === "freelancer") dashboardBase = "/dashboard/freelancer";
    else if (user.role === "both") dashboardBase = "/dashboard/both";

    navigate(`${dashboardBase}?tab=messages&userId=${freelancer.userId._id}`);
  };

  const handleShare = async () => {
    if (!freelancer) return;

    const url = window.location.href;
    const title = `${freelancer.userId.name} – ${freelancer.title}`;

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
        // Fallback: select URL
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

  const formatRate = () => {
    if (!freelancer) return "";
    const { rates } = freelancer;
    const amount = new Intl.NumberFormat("en-IN", {
      style: "currency", currency: rates.currency || "INR", maximumFractionDigits: 0,
    }).format(rates.minRate);
    return rates.rateType === "hourly" ? `${amount}/hr` : amount;
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const getPortfolioImage = (item: FreelancerData["portfolio"][0]) =>
    item.images?.[0] || item.imageUrl || "";

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !freelancer) {
    return (
      <Layout>
        <div className="w-full px-4 sm:px-6 py-12 text-center">
          <p className="text-red-600 mb-4">{error || "Freelancer not found"}</p>
          <Link to="/browse" className="text-blue-600 hover:underline">← Back to Browse</Link>
        </div>
      </Layout>
    );
  }

  const isOwnProfile = currentUserId === freelancer.userId._id;

  const tabs = [
    { id: "portfolio", label: "Portfolio" },
    { id: "about", label: "About" },
    { id: "experience", label: "Experience" },
  ];

  return (
    <Layout>
      <section className="bg-gray-50 min-h-screen">
        {/* Back nav */}
        <div className="bg-white border-b border-gray-200">
          <div className="w-full px-4 sm:px-6 py-3 flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-500">Freelancer Profile</span>
          </div>
        </div>
  <div className="w-full px-4 sm:px-6 py-6 md:py-8">
          {/* Hero card */}
          <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-6">
            {/* Cover image / gradient */}
            <div className="h-40 md:h-52 relative bg-gradient-to-r from-gray-700 via-neutral-800 to-gray-800">
              {freelancer.portfolio?.length > 0 && getPortfolioImage(freelancer.portfolio[0]) && (
                <img
                  src={getPortfolioImage(freelancer.portfolio[0])}
                  alt={freelancer.portfolio[0].title}
                  className="absolute inset-0 h-full w-full object-cover opacity-80"
                />
              )}
            </div>

            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-4">
                {/* Avatar */}
                <div className="relative">
                  {freelancer.userId.avatar ? (
                    <img
                      src={freelancer.userId.avatar}
                      alt={freelancer.userId.name}
                      className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-blue-600 border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-bold">
                      {getInitials(freelancer.userId.name)}
                    </div>
                  )}
                  <span className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${freelancer.availability?.status === "available" ? "bg-green-400" : "bg-orange-400"
                    }`} />
                </div>

                {/* Action buttons */}
                {!isOwnProfile && (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={handleFollow}
                      disabled={followLoading}
                      variant={following ? "outline" : "default"}
                      className={`rounded-xl gap-2 ${following
                          ? "border-blue-300 text-blue-600 hover:bg-blue-50"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                    >
                      {followLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : following ? (
                        <><UserCheck className="w-4 h-4" /> Following</>
                      ) : (
                        <><UserPlus className="w-4 h-4" /> Follow</>
                      )}
                    </Button>
                    <Button
                      onClick={handleContact}
                      variant="outline"
                      className="rounded-xl gap-2 border-gray-300"
                    >
                      <Mail className="w-4 h-4" /> Message
                    </Button>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                    >
                      <Share2 className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* Name & info */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">{freelancer.userId.name}</h1>
                    {(freelancer.userId.isPhoneVerified || freelancer.userId.isEmailVerified) && (
                      <Shield className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <p className="text-gray-600 font-medium mb-2">{freelancer.title}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {freelancer.userId.location?.city}, {freelancer.userId.location?.state}
                    </span>
                    <span className={`flex items-center gap-1 font-medium ${freelancer.availability?.status === "available" ? "text-green-600" : "text-orange-500"
                      }`}>
                      {freelancer.availability?.status === "available" ? "● Available Now" : "● Busy"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{formatRate()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Starting rate</p>
                </div>
              </div>

            </div>
          </div>

          {/* Sidebar + main content (Behance-style layout) */}
          <div className="mt-4 flex flex-col lg:flex-row gap-6">
            {/* Left sidebar */}
            <aside className="lg:w-72 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-4 text-sm">
                <p className="font-semibold text-gray-900 mb-3">Profile Insights</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Followers</span>
                    <span className="font-semibold text-gray-900">{followerCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Following</span>
                    <span className="font-semibold text-gray-900">{freelancer.userId.following?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Completed Jobs</span>
                    <span className="font-semibold text-gray-900">{freelancer.completedJobs || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Profile Views</span>
                    <span className="font-semibold text-gray-900">{freelancer.profileViews || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Local Score</span>
                    <span className="font-semibold text-gray-900">{freelancer.localScore || 0}</span>
                  </div>
                </div>
              </div>

              {freelancer.bio && (
                <div className="bg-white rounded-2xl border border-gray-200 p-4 text-sm">
                  <p className="font-semibold text-gray-900 mb-2">About</p>
                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-6">{freelancer.bio}</p>
                </div>
              )}

              {freelancer.skills?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-4 text-sm">
                  <p className="font-semibold text-gray-900 mb-3">Top Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {freelancer.skills.slice(0, 10).map((skill, i) => (
                      <Badge key={i} variant="secondary" className="rounded-full text-xs">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* Main content with tabs and portfolio */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-200">
              <div className="flex gap-1 border-b border-gray-200 px-4 sm:px-6 overflow-x-auto">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${activeTab === t.id
                        ? "text-blue-600 border-blue-600"
                        : "text-gray-500 border-transparent hover:text-gray-900"
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-4 sm:p-6">
                {/* Portfolio */}
                {activeTab === "portfolio" && (
                  <div>
                    {freelancer.portfolio?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {freelancer.portfolio.map(work => (
                          <div key={work._id} className="group rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="relative aspect-video bg-gray-100 overflow-hidden">
                              {getPortfolioImage(work) ? (
                                <img
                                  src={getPortfolioImage(work)}
                                  alt={work.title}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                                  <Briefcase className="w-10 h-10 text-gray-400" />
                                </div>
                              )}
                              {work.link && (
                                <a
                                  href={work.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow opacity-0 group-hover:opacity-100 transition"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-gray-700" />
                                </a>
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900 mb-1 text-sm">{work.title}</h3>
                              {work.description && (
                                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{work.description}</p>
                              )}
                              {work.tags?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {work.tags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No portfolio items yet</p>
                        <p className="text-sm text-gray-400 mt-1">This freelancer hasn't added any work samples</p>
                      </div>
                    )}
                  </div>
                )}

                {/* About */}
                {activeTab === "about" && (
                  <div className="max-w-2xl space-y-6">
                    {freelancer.bio && (
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-2">About</h3>
                        <p className="text-gray-700 leading-relaxed">{freelancer.bio}</p>
                      </div>
                    )}
                    {freelancer.skills?.length > 0 && (
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-3">All Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {freelancer.skills.map((skill, i) => (
                            <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">
                              {skill.name}
                              <span className={`text-xs font-medium ${skill.level === "Expert" ? "text-purple-600" :
                                  skill.level === "Intermediate" ? "text-blue-600" : "text-green-600"
                                }`}>{skill.level}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(!freelancer.bio && !freelancer.skills?.length) && (
                      <p className="text-gray-500 text-center py-8">No details provided yet.</p>
                    )}
                  </div>
                )}

                {/* Experience */}
                {activeTab === "experience" && (
                  <div className="max-w-2xl space-y-6">
                    {freelancer.experience?.length > 0 && (
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" /> Work Experience
                        </h3>
                        <div className="space-y-4">
                          {freelancer.experience.map((exp, i) => (
                            <div key={i} className="flex gap-4">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <Briefcase className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1 border-b border-gray-100 pb-4">
                                <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                                <p className="text-sm text-gray-600">{exp.company}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{exp.duration}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {freelancer.education?.length > 0 && (
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Star className="w-4 h-4 text-green-500" /> Education
                        </h3>
                        <div className="space-y-4">
                          {freelancer.education.map((edu, i) => (
                            <div key={i} className="flex gap-4">
                              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                                <Star className="w-5 h-5 text-green-600" />
                              </div>
                              <div className="flex-1 border-b border-gray-100 pb-4">
                                <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                                <p className="text-sm text-gray-600">{edu.institution}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{edu.year}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {!freelancer.experience?.length && !freelancer.education?.length && (
                      <p className="text-gray-500 text-center py-8">No experience added yet.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FreelancerProfile;
