import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiUsers, FiShield, FiHeart, FiLoader } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import SearchFilterSection from "../components/SearchFilterSection";
import { UserHoverCard, UserHoverCardData } from "@/components/UserHoverCard";
import { api } from "@/lib/api";
import { CATEGORIES } from "@/constants/categories";
import { DISCOVERY_TAB_PATHS, DiscoveryTab } from "@/constants/discoveryTabs";
import { Bookmark } from "lucide-react";

interface Freelancer {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
    verification?: {
      identity: boolean;
    };
  };
  skills: Array<{ name: string; level: string; yearsOfExperience: number; _id: string }>;
  portfolio?: Array<{
    title: string;
    description: string;
    images: string[];
    imageUrl?: string;
  }>;
  rating: number;
  completedJobs: number;
}

type HomeSortOption = "Recommended" | "Top rated" | "Most jobs" | "Newest";

const Index = () => {
  const navigate = useNavigate();

  const [liked, setLiked] = useState<string[]>([]);
  const [allFreelancers, setAllFreelancers] = useState<Freelancer[]>([]);
  const [filteredFreelancers, setFilteredFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);

  const [homeSearch, setHomeSearch] = useState("");
  const [activeDiscoveryTab, setActiveDiscoveryTab] = useState<DiscoveryTab>("Projects");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [sortOption, setSortOption] = useState<HomeSortOption>("Recommended");

  const sortFreelancers = (list: Freelancer[], option: HomeSortOption) => {
    const sorted = [...list];
    sorted.sort((a, b) => {
      const ratingA = a.rating ?? 0;
      const ratingB = b.rating ?? 0;
      const jobsA = a.completedJobs ?? 0;
      const jobsB = b.completedJobs ?? 0;

      switch (option) {
        case "Top rated":
          return ratingB - ratingA || jobsB - jobsA;
        case "Most jobs":
          return jobsB - jobsA || ratingB - ratingA;
        case "Newest":
          // No createdAt field available; fall back to completed jobs as a proxy
          return jobsB - jobsA || ratingB - ratingA;
        case "Recommended":
        default:
          // Simple heuristic: prioritize rating, then jobs
          return ratingB - ratingA || jobsB - jobsA;
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

  const toggleLike = (id: string) => {
    setLiked(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    setFilteredFreelancers(sortFreelancers(allFreelancers, sortOption));
  };

  useEffect(() => {
    setAllFreelancers((previous) => sortFreelancers(previous, sortOption));
    setFilteredFreelancers((previous) => sortFreelancers(previous, sortOption));
  }, [sortOption]);

  const displayFreelancers = filteredFreelancers.filter(
    (f) =>
      f.portfolio &&
      f.portfolio.length > 0 &&
      (f.portfolio[0].images?.[0] || (f.portfolio[0] as any).imageUrl)
  );

  return (
    <Layout>
      {/* HERO */}
      <section className="bg-white pt-16 pb-12">
        <div className="w-full px-4 sm:px-6">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Discover Local Talent
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with skilled freelancers in your region for trusted
              collaboration
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
      <section className="bg-white py-12">
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
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayFreelancers.map((freelancer) => {
                const portfolioItem = freelancer.portfolio?.[0];
                const user = freelancer.userId;

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
                  <div key={freelancer._id} className="group">
                    <Link to={`/profile/${user._id}`}>
                      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white transition duration-300 hover:shadow-2xl">
                        {/* Image */}
                        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                          {portfolioItem?.images?.[0] ? (
                            <img
                              src={portfolioItem.images[0]}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-6xl text-gray-400">
                              {user.name.charAt(0)}
                            </div>
                          )}

                          {/* bookmark */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleLike(freelancer._id);
                            }}
                            className="absolute right-0 top-2 flex h-10 w-10 items-center justify-center rounded-l-full bg-white opacity-0 shadow transition-opacity duration-300 ease-in-out group-hover:flex group-hover:opacity-100"
                          >
                            <Bookmark
                              className={
                                liked.includes(freelancer._id)
                                  ? "text-orange-400 fill-orange-400"
                                  : "text-gray-700"
                              }
                            />
                          </button>
                        </div>

                        {/* Info */}
                        <div className="p-4">
                          <h3 className="mb-2 font-semibold text-gray-900 group-hover:text-black">
                            {portfolioItem?.title?.slice(0, 30) || user.name}
                          </h3>

                          <div className="mb-3 flex items-center gap-2">
                            <UserHoverCard user={hoverUser}>
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs text-white">
                                  {user.avatar ? (
                                    <img
                                      src={user.avatar}
                                      alt={user.name}
                                      className="h-full w-full rounded-full object-cover"
                                    />
                                  ) : (
                                    user.name.charAt(0)
                                  )}
                                </div>
                                <span className="text-sm text-gray-600 hover:text-black hover:underline hover:font-bold">
                                  {user.name}
                                </span>
                                {user.verification?.identity && (
                                  <FiShield className="text-gray-700" />
                                )}
                              </div>
                            </UserHoverCard>
                          </div>

                          <div className="flex justify-between text-sm text-gray-500">
                            <span className="rounded-full bg-gray-100 px-3 py-1">
                              {freelancer.skills[0]?.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <FiUsers />
                              {freelancer.completedJobs}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
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
    </Layout>
  );
};

export default Index;