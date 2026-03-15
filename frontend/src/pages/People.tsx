import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMapPin, FiShield, FiStar } from "react-icons/fi";
import Layout from "@/components/layout/Layout";
import { UserHoverCard, UserHoverCardData } from "@/components/UserHoverCard";
import SearchFilterSection from "@/components/SearchFilterSection";
import { DISCOVERY_TAB_PATHS, DiscoveryTab } from "@/constants/discoveryTabs";
import api from "@/lib/api";

interface PeopleFreelancer {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
    location?: {
      city?: string;
      state?: string;
    };
    isPhoneVerified?: boolean;
    isEmailVerified?: boolean;
    followers?: string[];
  };
  title?: string;
  skills?: Array<{
    name: string;
    level?: string;
  }>;
  portfolio?: Array<{
    title?: string;
    images?: string[];
    imageUrl?: string;
  }>;
  ratings?: {
    average?: number;
    count?: number;
  };
  completedJobs?: number;
  profileViews?: number;
  availability?: {
    status?: string;
  };
  localScore?: number;
}

const People = () => {
  const navigate = useNavigate();
  const activeDiscoveryTab: DiscoveryTab = "People";

  const [searchValue, setSearchValue] = useState("");
  const [freelancers, setFreelancers] = useState<PeopleFreelancer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDiscoveryTabChange = (tab: DiscoveryTab) => {
    const path = DISCOVERY_TAB_PATHS[tab];
    if (path) navigate(path);
  };

  const getCoverImage = (freelancer: PeopleFreelancer) => {
    const firstItem = freelancer.portfolio?.[0];
    return firstItem?.images?.[0] || firstItem?.imageUrl || "";
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatLocation = (freelancer: PeopleFreelancer) => {
    const city = freelancer.userId?.location?.city;
    const state = freelancer.userId?.location?.state;
    if (city && state) return `${city}, ${state}`;
    return city || state || "Location not set";
  };

  const formatStatsNumber = (value?: number) => {
    if (value === undefined || value === null) return "—";
    if (value < 0) return "—";
    if (value === 0) return "0";
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  const fetchFreelancers = async (search?: string) => {
    try {
      setLoading(true);
      setError("");

      const params: Record<string, string | number | boolean> = {
        limit: 24,
        completeOnly: false,
      };

      if (search && search.trim()) {
        params.search = search.trim();
      }

      const response = await api.getFreelancers(params);
      const payload = response.data as any;

      if (payload && Array.isArray(payload)) {
        setFreelancers(payload as PeopleFreelancer[]);
      } else if (payload && payload.freelancers) {
        setFreelancers(payload.freelancers as PeopleFreelancer[]);
      } else {
        setFreelancers([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load creators");
      setFreelancers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreelancers();
  }, []);

  const handleSearchSubmit = () => {
    fetchFreelancers(searchValue);
  };

  return (
    <Layout>

      {/* Search bar + tabs */}
      <SearchFilterSection
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchSubmit={handleSearchSubmit}
        activeDiscoveryTab={activeDiscoveryTab}
        onDiscoveryTabChange={handleDiscoveryTabChange}
        showDiscoveryTabs={true}
        showCategoryGrid={false}
      />

      {/* Hero banner */}

      <section className="border-b border-gray-200 bg-white">
        <div className="w-full sm:px-6 md:py-4 flex flex-col gap-8">

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-600 via-neutral-500 to-gray-400">
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.7),_transparent_55%),_radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.8),_transparent_55%)]" />
            <div className="relative  flex flex-col md:flex-row items-center justify-between gap-6   px-6 py-8 md:px-10 md:py-10">
              <div className="max-w-xl text-white">
                <h2 className="text-2xl md:text-3xl font-semibold mb-2">
                  Looking to hire a creator?
                </h2>
                <p className="text-sm md:text-base text-indigo-100">
                  Discover curated freelance designers, developers, photographers, and more from your local community.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/browse")}
                className="inline-flex items-center justify-center rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-md hover:bg-white transition"
              >
                View all talent
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* People grid */}
      <section className="bg-white py-10">
        <div className="w-full px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Featured creators on LocalSkillHub
              </p>
              <p className="text-xs text-gray-500">
                Showing {freelancers.length} {freelancers.length === 1 ? "creator" : "creators"}
              </p>
            </div>
          </div>

          {error && (
            <p className="mb-6 text-sm text-red-600">{error}</p>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
            </div>
          ) : freelancers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <p className="text-gray-600">
                No creators found. Try adjusting your search.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {freelancers.map((freelancer) => {
                const user = freelancer.userId;
                if (!user) return null;

                const cover = getCoverImage(freelancer);
                const ratingValue = freelancer.ratings?.average;
                const ratingCount = freelancer.ratings?.count;
                const followersCount = user.followers?.length || 0;

                return (
                  <article
                    key={freelancer._id}
                    className="group rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Link to={`/profile/${user._id}`} className="block">
                      <div className="relative h-40 w-full bg-gray-100">
                        {cover ? (
                          <img
                            src={cover}
                            alt={freelancer.portfolio?.[0]?.title || freelancer.title || user.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500" />
                        )}

                        <div className="absolute flex items-center justify-center -bottom-7 left-4 right-4">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="h-20 w-20 rounded-full border-2 border-gray-300 object-cover shadow-md"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-white text-lg font-semibold shadow-md">
                              {getInitials(user.name)}
                            </div>
                          )}
                        </div>
                      </div>

                    <div className="px-4 pt-9 pb-4">
                      <div className="mb-2">
                        <div className="flex-row items-center justify-between gap-2 ">
                          <UserHoverCard
                            user={{
                              id: user._id,
                              name: user.name,
                              city: freelancer.userId?.location?.city,
                              state: freelancer.userId?.location?.state,
                              completedJobs: freelancer.completedJobs,
                              followers: followersCount,
                              profileViews: freelancer.profileViews,
                              rating: ratingValue,
                              ratingCount,
                              projectImages: getCoverImage(freelancer) ? [getCoverImage(freelancer)] : undefined,
                            } as UserHoverCardData}
                          >
                            <h3 className="text-lg font-semibold flex justify-center items-center  text-gray-900 truncate" title={user.name}>
                              {user.name}
                            </h3>
                          </UserHoverCard>
                          {/* {user.isEmailVerified || user.isPhoneVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-100">
                              <FiShield className="h-3 w-3" />
                              Verified
                            </span>
                          ) : null} */}
                        </div>
                        <p className="mt-0.5 flex flex-row justify-center items-center text-sm text-black "
                          title={formatLocation(freelancer)}>
                          <FiMapPin className="mr-1 inline-block h-4 w-4 text-gray-400" />
                          {formatLocation(freelancer).slice(0, 30)}
                        </p>
                      </div>

                      <p className=" flex flex-row justify-center line-clamp-2 text-xs text-gray-600 min-h-[2.5rem]">
                        {freelancer.title || "Freelance professional"}
                      </p>

                      <div className="flex flex-col items-center justify-between text-sm  text-gray-500">
                       <div className="mb-3">
                         <div className="flex items-center gap-1 ">
                          <FiStar className="h-3 w-3 text-yellow-500" />
                          <span>{ratingValue ? ratingValue.toFixed(1) : "New"}</span>
                          {ratingCount ? <span className="text-gray-400">({ratingCount})</span> : 0 + ` ratings`}
                        </div>
                       </div>

                       <div className="gap-4 flex items-center text-sm text-gray-400 mb-3"> 
                        <span>{formatStatsNumber(freelancer.completedJobs)} jobs</span>
                        <div className="border-r-2 border-gray-400 h-8"></div>
                        <span>{formatStatsNumber(followersCount)} followers</span>
                        <div className="border-r-2 border-gray-400 h-8"></div>
                        <span>{formatStatsNumber(freelancer.profileViews)} views</span>
                       </div>
                      </div>


                      <div className="flex flex-wrap gap-1 ">
                        {freelancer.availability?.status && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-100">
                            {freelancer.availability.status === "available" ? "Available for work" : freelancer.availability.status}
                          </span>
                        )}
                        {freelancer.localScore !== undefined && (
                          <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 border border-purple-100">
                            Local score {freelancer.localScore}
                          </span>
                        )}
                        {freelancer.skills?.[0]?.name && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                            {freelancer.skills[0].name}
                          </span>
                        )}
                      </div>


                    </div>
                                        </Link>

                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default People;
