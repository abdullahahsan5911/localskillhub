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

const Index = () => {
  const navigate = useNavigate();

  const [liked, setLiked] = useState<string[]>([]);
  const [allFreelancers, setAllFreelancers] = useState<Freelancer[]>([]);
  const [filteredFreelancers, setFilteredFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);

  const [homeSearch, setHomeSearch] = useState("");
  const [activeDiscoveryTab, setActiveDiscoveryTab] = useState<DiscoveryTab>("Projects");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);

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
          setAllFreelancers(freelancersList);
          setFilteredFreelancers(freelancersList);
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
  };

  const displayFreelancers = filteredFreelancers.filter(
    f =>
      f.portfolio &&
      f.portfolio.length > 0 &&
      (f.portfolio[0].images?.[0] || (f.portfolio[0] as any).imageUrl)
  );

  return (
    <Layout>
      {/* HERO */}
      <section className="bg-white pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <div className="text-center mb-12">

            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Discover Local Talent
            </h1>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with skilled freelancers in your region for trusted collaboration
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
      />

      {/* GRID */}
      <section className="bg-white py-12">

        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Filter Status */}
          {selectedCategoryId && !loading && (
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {displayFreelancers.length} {displayFreelancers.length === 1 ? 'freelancer' : 'freelancers'} in{' '}
                <span className="font-semibold text-gray-900">
                  {CATEGORIES.find(cat => cat.id === selectedCategoryId)?.name}
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
              <p className="text-gray-600 text-lg mb-4">
                {selectedCategoryId
                  ? `No freelancers found in ${CATEGORIES.find(cat => cat.id === selectedCategoryId)?.name}`
                  : 'No freelancers found'}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

              {displayFreelancers.map(freelancer => {

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

                      <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-2xl transition duration-300">

                        {/* Image */}
                        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">

                          {portfolioItem?.images?.[0] ? (

                            <img
                              src={portfolioItem.images[0]}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            />

                          ) : (

                            <div className="w-full h-full flex items-center justify-center text-6xl text-gray-400">
                              {user.name.charAt(0)}
                            </div>

                          )}

                          {/* bookmark */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleLike(freelancer._id);
                            }}
                            className="opacity-0 group-hover:flex flex  group-hover:opacity-100
                 transition-opacity duration-300 ease-in-out absolute top-2 right-0 w-10 h-10 rounded-l-full bg-white  items-center justify-center shadow"
                          >
                            <Bookmark
                              className={`${liked.includes(freelancer._id)
                                  ? "text-orange-400 fill-orange-400"
                                  : "text-gray-700"
                                }`}
                            />
                          </button>

                        </div>

                        {/* Info */}
                        <div className="p-4">

                          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-black">
                            {portfolioItem?.title?.slice(0, 30) || user.name}
                          </h3>

                          <div className="flex items-center gap-2 mb-3">
                            <UserHoverCard user={hoverUser}>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">
                                  {user.avatar ? (
                                    <img
                                      src={user.avatar}
                                      alt={user.name}
                                      className="w-full h-full object-cover rounded-full"
                                    />
                                  ) : (
                                    user.name.charAt(0)
                                  )}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {user.name}
                                </span>
                                {user.verification?.identity && (
                                  <FiShield className="text-gray-700" />
                                )}
                              </div>
                            </UserHoverCard>
                          </div>

                          <div className="flex justify-between text-sm text-gray-500">

                            <span className="bg-gray-100 px-3 py-1 rounded-full">
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

        <div className="max-w-4xl mx-auto text-center text-white">

          <h2 className="text-4xl font-bold mb-4">
            Ready to hire local talent?
          </h2>

          <p className="mb-8 text-gray-300">
            Join freelancers and businesses in your region
          </p>

          <div className="flex justify-center gap-4">

            <Link to="/signup">
              <Button variant="outline" className="bg-white text-black px-8 py-6 rounded-full">
                Sign Up
              </Button>
            </Link>

            <Link to="/browse">
              <Button variant="outline" className="border-white text-black px-8 py-6 rounded-full">
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