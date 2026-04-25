import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUsers, FiShield, FiHeart, FiLoader, FiThumbsUp, FiEye } from "react-icons/fi";
import { BsEyeFill } from "react-icons/bs";
import { MdThumbUp } from "react-icons/md";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import SearchFilterSection from "../components/SearchFilterSection";
import { UserHoverCard, UserHoverCardData } from "@/components/UserHoverCard";
import { api } from "@/lib/api";
import { resolveAvatarSrc } from "@/lib/avatar";
import { CATEGORIES } from "@/constants/categories";
import { DISCOVERY_TAB_PATHS, DiscoveryTab } from "@/constants/discoveryTabs";
import { Bookmark, Eye, EyeClosed, EyeIcon, ThumbsUp, ThumbsUpIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toggleGuestFollow, getGuestFollows, getGuestSavedPortfolios, toggleGuestSavedPortfolio } from "@/lib/guestStorage";
import { toast } from "@/components/ui/use-toast";
import PortfolioPreviewModal from "@/components/PortfolioPreviewModal";
import FeaturedRibbon from "@/components/featured/FeaturedRibbon";


interface Freelancer {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
    adminBadges?: Array<{ type: string; assignedAt?: string }>;
    verification?: {
      identity: boolean;
    };
  };
  skills: Array<{ name: string; level: string; yearsOfExperience: number; _id: string }>;
  tools?: string[];
  portfolio?: Array<{
    _id?: string;
    title: string;
    description: string;
    images: string[];
    imageUrl?: string;
    appreciations?: string[];
  }>;
  rating: number;
  completedJobs: number;
  profileViews: number;

}

type HomeSortOption = "Recommended" | "Top rated" | "Most jobs" | "Newest";

const Index = () => {
  const navigate = useNavigate();

  const { user: currentUser, refreshUser } = useAuth();

  const [liked, setLiked] = useState<string[]>([]);
  const [allFreelancers, setAllFreelancers] = useState<Freelancer[]>([]);
  const [filteredFreelancers, setFilteredFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedPortfolioIds, setSavedPortfolioIds] = useState<string[]>([]);

  const [homeSearch, setHomeSearch] = useState("");
  const [activeDiscoveryTab, setActiveDiscoveryTab] = useState<DiscoveryTab>("Projects");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [sortOption, setSortOption] = useState<HomeSortOption>("Recommended");

  const [preview, setPreview] = useState<
    | {
        freelancer: Freelancer;
        portfolioItem: Freelancer["portfolio"][number] | undefined;
      }
    | null
  >(null);

  const formatViews = (views: number | undefined | null) => {
    const value = typeof views === "number" ? views : 0;
    if (value >= 1000) {
      const k = value / 1000;
      return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
    }
    return value;
  };

  const handleHireFromPreview = (targetUserId: string) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    navigate(`/freelancers/${targetUserId}?action=hire`);
  };

  const handleShareProfile = async (freelancer: Freelancer) => {
    if (!freelancer?.userId?.name) return;

    const url = `${window.location.origin}/freelancers/${freelancer.userId._id}`;
    const title = `${freelancer.userId.name}`;

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

  const isPortfolioSaved = (itemId?: string) => {
    if (!itemId) return false;
    return savedPortfolioIds.includes(itemId);
  };

  const handleToggleSave = () => {
    if (!preview || !preview.portfolioItem) return;

    const itemId = (preview.portfolioItem as any)._id as string | undefined;
    if (!itemId) return;

    const isNowSaved = toggleGuestSavedPortfolio({
      id: itemId,
      title: preview.portfolioItem.title,
      image:
        preview.portfolioItem.images?.[0] ||
        (preview.portfolioItem as any).imageUrl,
      freelancerName: preview.freelancer.userId.name,
      freelancerId: preview.freelancer.userId._id,
    });

    setSavedPortfolioIds((prev) =>
      isNowSaved ? [...prev, itemId] : prev.filter((id) => id !== itemId),
    );
  };

  const handleToggleAppreciation = async () => {
    if (!preview || !preview.portfolioItem || !preview.portfolioItem._id) return;

    const itemId = preview.portfolioItem._id;

    if (!currentUser) {
      navigate("/login");
      return;
    }

    const hasAppreciated = preview.portfolioItem.appreciations?.includes(
      (currentUser as any)._id,
    );

    try {
      if (hasAppreciated) {
        await api.removePortfolioAppreciation(itemId);
      } else {
        await api.appreciatePortfolioItem(itemId);
      }

      setPreview((prev) => {
        if (!prev || !prev.portfolioItem || prev.portfolioItem._id !== itemId) return prev;

        const currentList = prev.portfolioItem.appreciations || [];
        const userId = (currentUser as any)._id;
        const nextList = hasAppreciated
          ? currentList.filter((id) => id !== userId)
          : [...currentList, userId];

        return {
          ...prev,
          portfolioItem: {
            ...prev.portfolioItem,
            appreciations: nextList,
          },
        };
      });
    } catch (error) {
      console.error("Failed to toggle appreciation", error);
    }
  };

  // Initialize liked state from persisted follows (guest or logged-in)
  useEffect(() => {
    if (currentUser?._id && Array.isArray((currentUser as any).following)) {
      setLiked((currentUser as any).following as string[]);
    } else if (!currentUser) {
      setLiked(getGuestFollows());
    }
  }, [currentUser?._id]);

  // Initialize saved portfolio ids from guest storage
  useEffect(() => {
    const saved = getGuestSavedPortfolios();
    setSavedPortfolioIds(saved.map((p) => p.id));
  }, []);

  const sortFreelancers = (list: Freelancer[], option: HomeSortOption) => {
    const getCreatedAtFromObjectId = (id?: string) => {
      // Mongo ObjectId embeds a creation timestamp in its first 8 hex chars.
      if (!id || id.length < 8) return 0;
      const seconds = Number.parseInt(id.slice(0, 8), 16);
      return Number.isNaN(seconds) ? 0 : seconds;
    };

    const getTimestamp = (value?: string) => {
      if (!value) return 0;
      const ms = Date.parse(value);
      return Number.isNaN(ms) ? 0 : ms;
    };

    const getNewestSignal = (freelancer: Freelancer) => {
      const profileCreatedAt = getTimestamp((freelancer as any).createdAt);
      const userCreatedAt = getTimestamp((freelancer.userId as any)?.createdAt);
      const portfolioCreatedAt = getTimestamp((freelancer.portfolio?.[0] as any)?.createdAt);

      if (profileCreatedAt || userCreatedAt || portfolioCreatedAt) {
        return Math.max(profileCreatedAt, userCreatedAt, portfolioCreatedAt);
      }

      const profileFromId = getCreatedAtFromObjectId(freelancer._id);
      const userFromId = getCreatedAtFromObjectId(freelancer.userId?._id);
      const portfolioFromId = getCreatedAtFromObjectId((freelancer.portfolio?.[0] as any)?._id);
      return Math.max(profileFromId, userFromId, portfolioFromId);
    };

    const onboardingInterests = Array.isArray(currentUser?.interests)
      ? currentUser.interests
      : [];

    const interestKeywords = onboardingInterests
      .map((interest) => {
        const category = CATEGORIES.find((cat) => cat.id === interest);
        if (!category) return [interest];
        return [category.id, category.name];
      })
      .flat()
      .map((value) => value.toLowerCase().replace(/[-_]/g, " "));

    const getInterestMatchScore = (freelancer: Freelancer) => {
      if (interestKeywords.length === 0) return 0;

      const freelancerSkillText = (freelancer.skills || [])
        .map((skill) => (skill.name || "").toLowerCase())
        .join(" ");

      return interestKeywords.reduce((score, keyword) => {
        if (!keyword) return score;
        return freelancerSkillText.includes(keyword) ? score + 1 : score;
      }, 0);
    };

    const sorted = [...list];
    sorted.sort((a, b) => {
      const ratingA = a.rating ?? 0;
      const ratingB = b.rating ?? 0;
      const jobsA = a.completedJobs ?? 0;
      const jobsB = b.completedJobs ?? 0;
      const viewsA = a.profileViews ?? 0;
      const viewsB = b.profileViews ?? 0;
      const createdAtA = getNewestSignal(a);
      const createdAtB = getNewestSignal(b);
      const interestScoreA = getInterestMatchScore(a);
      const interestScoreB = getInterestMatchScore(b);

      switch (option) {
        case "Top rated":
          return ratingB - ratingA || viewsB - viewsA || createdAtB - createdAtA;
        case "Most jobs":
          return jobsB - jobsA || createdAtB - createdAtA || viewsB - viewsA;
        case "Newest":
          return createdAtB - createdAtA || ratingB - ratingA || jobsB - jobsA;
        case "Recommended":
        default:
          if (interestScoreA !== interestScoreB) {
            return interestScoreB - interestScoreA;
          }

          return (
            ratingB * 100 + jobsB * 5 + viewsB * 0.03 -
            (ratingA * 100 + jobsA * 5 + viewsA * 0.03)
          ) || createdAtB - createdAtA;
      }
    });

    return sorted;
  };

  const handleHomeSearch = () => {
    const params = new URLSearchParams();
    if (homeSearch) params.set("search", homeSearch);
    if (selectedCategoryId) {
      const selectedCategory = CATEGORIES.find((cat) => cat.id === selectedCategoryId);
      if (selectedCategory) params.set("skill", selectedCategory.name);
    }
    navigate(`/browse?${params.toString()}`);
  };

  const handleDiscoveryTabChange = (tab: DiscoveryTab) => {
    setActiveDiscoveryTab(tab);
    const path = DISCOVERY_TAB_PATHS[tab];
    if (path) {
      navigate(path);
    }
  };

  const handleVisualCategorySelect = (categoryId: string) => {
    // Toggle category selection - if clicking the same category, clear filter
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(undefined);
      setFilteredFreelancers(allFreelancers);
      return;
    }

    setSelectedCategoryId(categoryId);

    // Filter freelancers based on selected category
    const selectedCategory = CATEGORIES.find((cat) => cat.id === categoryId);
    if (selectedCategory) {
      const categoryNameLower = selectedCategory.name.toLowerCase();
      const filtered = allFreelancers.filter((freelancer) =>
        freelancer.skills.some((skill) => {
          const skillNameLower = skill.name.toLowerCase();
          // Match if skill contains category name or category name contains skill
          return skillNameLower.includes(categoryNameLower) ||
            categoryNameLower.includes(skillNameLower);
        })
      );
      setFilteredFreelancers(filtered);
    } else {
      setFilteredFreelancers(allFreelancers);
    }
  };

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        setLoading(true);
        const response = await api.getFreelancers({ completeOnly: false });
        if (response.data) {
          const freelancersList = (response.data as any).freelancers || [];
          const sorted = sortFreelancers(freelancersList, sortOption);
          setAllFreelancers(sorted);
          setFilteredFreelancers(sorted);
        }
      } catch (error) {
        console.error("Failed to fetch freelancers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFreelancers();
  }, []);

  const toggleLike = async (userId: string) => {
    if (!userId) return;

    // If not logged in, treat this as a guest follow
    if (!currentUser) {
      const isNowFollowing = toggleGuestFollow(userId);
      setLiked(prev =>
        isNowFollowing ? [...prev, userId] : prev.filter((id) => id !== userId)
      );
      return;
    }

    try {
      const isCurrentlyLiked = liked.includes(userId);

      if (isCurrentlyLiked) {
        await api.unfollowUser(userId);
        setLiked(prev => prev.filter((id) => id !== userId));
      } else {
        await api.followUser(userId);
        setLiked(prev => [...prev, userId]);
      }

      await refreshUser();
      setFilteredFreelancers(sortFreelancers(allFreelancers, sortOption));
    } catch (error) {
      console.error("Failed to toggle freelancer save state", error);
    }
  };

  useEffect(() => {
    setAllFreelancers((previous) => sortFreelancers(previous, sortOption));
    setFilteredFreelancers((previous) => sortFreelancers(previous, sortOption));
  }, [sortOption, currentUser?.interests]);

  const displayFreelancers = filteredFreelancers.filter(
    (f) =>
      f.userId &&
      f.portfolio &&
      f.portfolio.length > 0 &&
      (f.portfolio[0].images?.[0] || (f.portfolio[0] as any).imageUrl)
  );

  return (
    <Layout>
      {/* HERO */}
      <section className="bg-white pt-12 sm:pt-20 pb-10 sm:pb-16">
        <div className="w-full px-2 xs:px-4 sm:px-6">
          <div className="text-center max-w-2xl sm:max-w-4xl mx-auto">
            <h1 className="text-3xl xs:text-4xl sm:text-6xl lg:text-7xl font-bold text-slate-700 leading-tight mb-4 sm:mb-6">
              Discover <span className="text-blue-700">Local Talent </span>
              <br className="hidden xs:block" />
              Build Powerful Connections
            </h1>
            <p className="text-base xs:text-lg sm:text-xl text-gray-600 max-w-xs xs:max-w-md sm:max-w-2xl mx-auto leading-relaxed">
              Find trusted freelancers in your region. Collaborate faster,
              build real relationships, and complete projects with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section - Sticky */}
      <SearchFilterSection
        searchValue={homeSearch}
        onSearchChange={setHomeSearch}
        onSearchSubmit={handleHomeSearch}
        activeDiscoveryTab={activeDiscoveryTab}
        onDiscoveryTabChange={handleDiscoveryTabChange}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={handleVisualCategorySelect}
        showDiscoveryTabs={true}
        showFilterButton={false}
        showRecommended={true}
        recommendedOptions={["Recommended", "Top rated", "Most jobs", "Newest"]}
        selectedRecommended={sortOption}
        onRecommendedChange={(value) => setSortOption(value as HomeSortOption)}
      />

      {/* GRID */}
      <section className="bg-white py-2">
        <div className="w-full px-4 sm:px-6">
          {/* Filter Status */}
          {selectedCategoryId && !loading && (
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {displayFreelancers.length}{" "}
                {displayFreelancers.length === 1 ? "freelancer" : "freelancers"}
                {" "}
                in{" "}
                <span className="font-semibold text-gray-900">
                  {CATEGORIES.find((cat) => cat.id === selectedCategoryId)?.name}
                </span>
              </p>
              <button
                onClick={() => {
                  setSelectedCategoryId(undefined);
                  setFilteredFreelancers(allFreelancers);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filter
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <FiLoader className="h-10 w-10 animate-spin text-gray-700" />
            </div>
          ) : displayFreelancers.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg mb-4 ">
                {selectedCategoryId
                  ? `No freelancers found in ${CATEGORIES.find(
                    (cat) => cat.id === selectedCategoryId
                  )?.name}`
                  : "No freelancers found"}
              </p>
              {selectedCategoryId && (
                <button
                  onClick={() => {
                    setSelectedCategoryId(undefined);
                    setFilteredFreelancers(allFreelancers);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all freelancers
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {displayFreelancers.map((freelancer) => {
                const portfolioItem = freelancer.portfolio?.[0];
                const user = freelancer.userId;

                // Defensive check to prevent null reference errors
                if (!user) return null;

                const displayName = user.name || freelancer.skills?.[0]?.name || "Freelancer";
                const truncatedName =
                  displayName.length > 22
                    ? displayName.slice(0, 22).trimEnd() + "…"
                    : displayName;

                const hoverUser: UserHoverCardData = {
                  id: user._id,
                  name: user.name,
                  avatarUrl: user.avatar,
                  role: "Freelancer",
                  completedJobs: freelancer.completedJobs,
                  rating: freelancer.rating,
                  projectImages: portfolioItem?.images?.filter(Boolean) || [],
                };

                return (
                  <div key={freelancer._id} className="flex flex-col ">
                    <div className="rounded-sm bg-white transition duration-300 hover:shadow-2xl">
                      {/* Image */}
                      <button
                        type="button"
                        className="relative h-52 w-full bg-gray-100 group"
                        onClick={() => setPreview({ freelancer, portfolioItem })}
                      >
                        <div className="absolute inset-0 overflow-hidden">
                          {portfolioItem?.images?.[0] ? (
                            <img
                              src={portfolioItem.images[0]}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-5xl text-gray-300">
                              {user.name.charAt(0)}
                            </div>
                          )}

                          {portfolioItem?.title && (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t  from-zinc-500  to-transparent px-3 py-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                              <p className="line-clamp-1 text-start underline underline-offset-4 font-sans text-md font-bold text-black">{portfolioItem.title}</p>
                            </div>
                          )}
                        </div>

                        {Array.isArray(user.adminBadges) && user.adminBadges.some((b) => b.type === "featured_visualization") && (
                          <FeaturedRibbon
                            containerClassName="absolute right-2 top-0 z-30"
                            tooltipClassName="hidden"
                            showOnHover={true}
                          />
                        )}
                      </button>
 
                      {/* Info */}
                      <div className="p-1 py-3 flex flex-row justify-between items-center">
                        <div className="px-1 flex items-center justify-envemly h-full w-full gap-3">
                          <UserHoverCard user={hoverUser}>
                            <Link to={`/freelancers/${user._id}`} className="flex items-center gap-2 no-underline text-inherit">
                              <div className="flex h-6 w-h-6 items-center justify-center rounded-full bg-gray-900 text-xs text-white shrink-0">
                                <img
                                  src={resolveAvatarSrc(user.avatar)}
                                  alt={displayName}
                                  className="h-full w-full rounded-full object-cover"
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 truncate transition-colors">
                                {truncatedName}
                              </span>
                              {user.verification?.identity && (
                                <FiShield className="text-gray-700" />
                              )}
                            </Link>
                          </UserHoverCard>
                        </div>

                        <div className="flex items-center justify-between text-sm gap-2 text-gray-500  h-full">
                          <div className="flex items-center gap-1">
                            <MdThumbUp />
                            {portfolioItem?.appreciations?.length ?? 0}
                          </div>
                          <div className="flex items-center gap-1 ">
                            <BsEyeFill />
                            {formatViews(freelancer.profileViews)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-neutral-800 py-20">
        <div className="w-full max-w-4xl mx-auto text-center text-white">
          <h2 className="mb-4 text-4xl font-bold">
            Ready to hire local talent?
          </h2>
          <p className="mb-8 text-gray-300">
            Join freelancers and businesses in your region
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/signup">
              <Button
                variant="outline"
                className="rounded-full bg-white px-8 py-6 text-black"
              >
                Sign Up
              </Button>
            </Link>
            <Link to="/browse">
              <Button
                variant="outline"
                className="rounded-full border-white px-8 py-6 text-black"
              >
                Browse Talent
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Portfolio preview modal */}
      <PortfolioPreviewModal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.portfolioItem?.title}
        description={preview?.portfolioItem?.description}
        imageUrl={
          preview?.portfolioItem?.images?.[0] ||
          (preview?.portfolioItem as any)?.imageUrl ||
          undefined
        }
        author={{
          id: preview?.freelancer.userId._id || "",
          name: preview?.freelancer.userId.name,
          avatarUrl: preview?.freelancer.userId.avatar,
          verified: preview?.freelancer.userId.verification?.identity,
        }}
        stats={{
          completedJobs: preview?.freelancer.completedJobs,
          views: preview?.freelancer.profileViews,
          rating: preview?.freelancer.rating,
        }}
        isSaved={
          preview && (preview.portfolioItem as any)?._id
            ? isPortfolioSaved((preview.portfolioItem as any)._id)
            : false
        }
        onSaveClick={preview ? handleToggleSave : undefined}
        isFollowing={preview ? liked.includes(preview.freelancer.userId._id) : false}
        onFollowClick={
          preview
            ? () => toggleLike(preview.freelancer.userId._id)
            : undefined
        }
        onHireClick={
          preview
            ? () => handleHireFromPreview(preview.freelancer.userId._id)
            : undefined
        }
        onShareClick={
          preview ? () => handleShareProfile(preview.freelancer) : undefined
        }
        isAppreciated={
          !!(
            preview &&
            currentUser &&
            preview.portfolioItem?.appreciations?.includes((currentUser as any)._id)
          )
        }
        appreciationCount={preview?.portfolioItem?.appreciations?.length ?? 0}
        onAppreciateClick={preview ? handleToggleAppreciation : undefined}
        onProfileClick={
          preview
            ? () => navigate(`/freelancers/${preview.freelancer.userId._id}`)
            : undefined
        }
        iconGridItems={
          preview
            ? (Array.isArray(preview.freelancer.tools) && preview.freelancer.tools.length > 0
                ? preview.freelancer.tools.map((label) => ({ label, type: "tool" as const }))
                : (preview.freelancer.skills || []).map((skill) => ({ label: skill.name, type: "skill" as const })))
            : []
        }
      />
    </Layout>
  );
};

export default Index;