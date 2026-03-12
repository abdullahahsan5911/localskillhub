import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiSearch, FiUsers, FiShield, FiHeart, FiLoader, FiSliders, FiChevronDown, FiImage, FiLayers } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import VisualCategoryGrid from "../components/VisualCategoryGrid";
import { api } from "@/lib/api";
import { CATEGORIES } from "@/constants/categories";

const discoveryTabs = ["Projects", "People", "Assets", "Images"] as const;

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
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);

  const [homeSearch, setHomeSearch] = useState("");
  const [activeDiscoveryTab, setActiveDiscoveryTab] = useState<(typeof discoveryTabs)[number]>("Projects");

  const handleHomeSearch = () => {
    const params = new URLSearchParams();
    if (homeSearch) params.set("search", homeSearch);
    navigate(`/browse?${params.toString()}`);
  };

  const handleVisualCategorySelect = (categoryId: string) => {
    const selectedCategory = CATEGORIES.find((category) => category.id === categoryId);
    navigate(`/browse?skill=${encodeURIComponent(selectedCategory?.name || categoryId)}`);
  };

  useEffect(() => {
    const fetchFreelancers = async () => {
      try {
        setLoading(true);
        const response = await api.getFreelancers();
        if (response.data) {
          setFreelancers((response.data as any).freelancers || []);
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

  const displayFreelancers = freelancers.filter(
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

      <section className="sticky top-16 z-40 border-y border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <button className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-gray-300 px-5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50">
              <FiSliders className="h-4 w-4" />
              Filter
            </button>

            <div className="flex-1 rounded-full border border-gray-300 bg-white px-5">
              <div className="flex flex-col gap-3 py-2 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search Behance-style categories, freelancers, or services..."
                    className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-500"
                    value={homeSearch}
                    onChange={(e) => setHomeSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleHomeSearch()}
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide border-t border-gray-200 pt-2 lg:border-t-0 lg:border-l lg:pl-4 lg:pt-0">
                  {discoveryTabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveDiscoveryTab(tab)}
                      className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                        activeDiscoveryTab === tab
                          ? "bg-black text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                    aria-label="Toggle image discovery"
                  >
                    <FiImage className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <button className="inline-flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold text-gray-900 transition-colors hover:text-black xl:px-2">
              <FiLayers className="h-4 w-4" />
              Recommended
              <FiChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div>
            <VisualCategoryGrid onSelect={handleVisualCategorySelect} />
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="bg-white py-12">

        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {loading ? (

            <div className="flex justify-center py-20">
              <FiLoader className="h-10 w-10 animate-spin text-gray-700" />
            </div>

          ) : (

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

              {displayFreelancers.map(freelancer => {

                const portfolioItem = freelancer.portfolio?.[0];
                const user = freelancer.userId;

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

                          {/* Like */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleLike(freelancer._id);
                            }}
                            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow"
                          >
                            <FiHeart
                              className={`${
                                liked.includes(freelancer._id)
                                  ? "text-red-500 fill-red-500"
                                  : "text-gray-700"
                              }`}
                            />
                          </button>

                        </div>

                        {/* Info */}
                        <div className="p-4">

                          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-black">
                            {portfolioItem?.title || user.name}
                          </h3>

                          <div className="flex items-center gap-2 mb-3">

                            <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">
                              {user.name.charAt(0)}
                            </div>

                            <span className="text-sm text-gray-600">
                              {user.name}
                            </span>

                            {user.verification?.identity && (
                              <FiShield className="text-gray-700" />
                            )}

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