import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FiMapPin, FiShield, FiFilter, FiGrid, FiList, FiX } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { UserHoverCard, UserHoverCardData } from "@/components/UserHoverCard";
import Layout from "@/components/layout/Layout";
import SearchFilterSection from "../components/SearchFilterSection";
import api from "@/lib/api";
import { CATEGORIES } from "@/constants/categories";
import { DISCOVERY_TAB_PATHS, DiscoveryTab } from "@/constants/discoveryTabs";
const skills = ["All", ...CATEGORIES.map((category) => category.name)];
const availabilityOptions = ["all", "available", "busy", "unavailable"] as const;
const PAGE_SIZE = 12;

interface BrowseFilters {
  minRate: string;
  maxRate: string;
  availability: string;
  verifiedOnly: boolean;
}

const defaultFilters: BrowseFilters = {
  minRate: "",
  maxRate: "",
  availability: "all",
  verifiedOnly: false,
};

interface FreelancerProfile {
  _id: string;
  userId: {
    _id: string;
    name: string;
    location: {
      city: string;
      state: string;
    };
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
    followers?: string[];
  };
  title: string;
  bio: string;
  skills: Array<{
    name: string;
    level: string;
  }>;
  rates: {
    minRate: number;
    maxRate: number;
    currency: string;
    rateType: string;
  };
  localScore: number;
  globalScore: number;
  availability: {
    status: string;
  };
  portfolio: Array<{
    title: string;
    images: string[];
    imageUrl?: string; // legacy fallback
  }>;
  ratings?: {
    average?: number;
    count?: number;
  };
  completedJobs?: number;
  profileViews?: number;
}

const BrowseFreelancers = () => {
  const navigate = useNavigate();
  const [urlParams, setSearchParams] = useSearchParams();
  const [activeDiscoveryTab, setActiveDiscoveryTab] = useState<DiscoveryTab>("Projects");
  const [activeSkill, setActiveSkill] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<BrowseFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    const nextSkill = urlParams.get("skill") || "All";
    const nextSearch = urlParams.get("search") || "";
    const nextLocation = urlParams.get("location") || "";
    const nextTab = (urlParams.get("tab") as DiscoveryTab) || "Projects";
    const nextFilters: BrowseFilters = {
      minRate: urlParams.get("minRate") || "",
      maxRate: urlParams.get("maxRate") || "",
      availability: urlParams.get("availability") || "all",
      verifiedOnly: urlParams.get("verifiedOnly") === "true",
    };

    setActiveSkill(nextSkill);
    setSearchQuery(nextSearch);
    setLocationQuery(nextLocation);
    setActiveDiscoveryTab(nextTab);
    setFilters(nextFilters);
    fetchFreelancers({
      page: 1,
      resetResults: true,
      skill: nextSkill,
      searchValue: nextSearch,
      cityValue: nextLocation,
      nextFilters,
    });
  }, [urlParams]);

  const fetchFreelancers = async ({
    page,
    resetResults,
    skill,
    searchValue,
    cityValue,
    nextFilters,
  }: {
    page: number;
    resetResults: boolean;
    skill: string;
    searchValue: string;
    cityValue: string;
    nextFilters: BrowseFilters;
  }) => {
    try {
      if (resetResults) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError("");
      const params: Record<string, string | number | boolean> = {
        page,
        limit: PAGE_SIZE,
        completeOnly: false,
      };

      if (skill && skill !== "All") {
        params.skills = skill;
      }

      if (cityValue) {
        params.city = cityValue;
      }

      if (searchValue) {
        params.search = searchValue;
      }

      if (nextFilters.minRate) {
        params.minRate = Number(nextFilters.minRate);
      }

      if (nextFilters.maxRate) {
        params.maxRate = Number(nextFilters.maxRate);
      }

      if (nextFilters.availability !== "all") {
        params.availability = nextFilters.availability;
      }

      if (nextFilters.verifiedOnly) {
        params.verifiedOnly = true;
      }

      const response = await api.getFreelancers(params);
      const payload = response.data as any;

      if (payload && Array.isArray(payload)) {
        setFreelancers(payload);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalResults(payload.length);
      } else if (payload && payload.freelancers) {
        const nextResults = payload.freelancers as FreelancerProfile[];
        setFreelancers((previous) => (resetResults ? nextResults : [...previous, ...nextResults]));
        setCurrentPage(payload.currentPage || page);
        setTotalPages(payload.totalPages || 1);
        setTotalResults(payload.total || nextResults.length);
      } else {
        setFreelancers([]);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalResults(0);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch freelancers");
      if (resetResults) {
        setFreelancers([]);
        setCurrentPage(1);
        setTotalPages(1);
        setTotalResults(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const syncUrl = (overrides: Partial<{ skill: string; search: string; location: string } & BrowseFilters> = {}) => {
    const nextSkill = overrides.skill ?? activeSkill;
    const nextSearch = overrides.search ?? searchQuery;
    const nextLocation = overrides.location ?? locationQuery;
    const nextFilters: BrowseFilters = {
      minRate: overrides.minRate ?? filters.minRate,
      maxRate: overrides.maxRate ?? filters.maxRate,
      availability: overrides.availability ?? filters.availability,
      verifiedOnly: overrides.verifiedOnly ?? filters.verifiedOnly,
    };

    const nextParams = new URLSearchParams();
    if (nextSkill && nextSkill !== "All") nextParams.set("skill", nextSkill);
    if (nextSearch.trim()) nextParams.set("search", nextSearch.trim());
    if (nextLocation.trim()) nextParams.set("location", nextLocation.trim());
    if (nextFilters.minRate.trim()) nextParams.set("minRate", nextFilters.minRate.trim());
    if (nextFilters.maxRate.trim()) nextParams.set("maxRate", nextFilters.maxRate.trim());
    if (nextFilters.availability !== "all") nextParams.set("availability", nextFilters.availability);
    if (nextFilters.verifiedOnly) nextParams.set("verifiedOnly", "true");

    setSearchParams(nextParams);
  };

  const handleSkillFilter = (skill: string) => {
    setActiveSkill(skill);
    syncUrl({ skill });
  };

  const handleVisualCategorySelect = (categoryId: string) => {
    const selectedCategory = CATEGORIES.find((category) => category.id === categoryId);
    const categoryName = selectedCategory?.name || categoryId;

    // Toggle category - if clicking the same category, go back to "All"
    if (activeSkill === categoryName) {
      handleSkillFilter("All");
    } else {
      handleSkillFilter(categoryName);
    }
  };

  const handleDiscoveryTabChange = (tab: DiscoveryTab) => {
    setActiveDiscoveryTab(tab);
    const path = DISCOVERY_TAB_PATHS[tab];
    if (path) {
      navigate(path);
    }
  };

  const handleSearch = () => {
    syncUrl({ search: searchQuery, location: locationQuery });
  };

  const handleApplyFilters = () => {
    syncUrl(filters);
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    syncUrl(defaultFilters);
  };

  const handleLoadMore = () => {
    if (loadingMore || currentPage >= totalPages) {
      return;
    }

    fetchFreelancers({
      page: currentPage + 1,
      resetResults: false,
      skill: activeSkill,
      searchValue: searchQuery,
      cityValue: locationQuery,
      nextFilters: filters,
    });
  };

  const formatRate = (rates: FreelancerProfile['rates']) => {
    if (!rates || typeof rates.minRate !== "number") {
      return "Rate on request";
    }

    const amount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: rates.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(rates.minRate);

    return rates.rateType === 'hourly' ? `${amount}/hr` : amount;
  };

  return (
    <Layout>
      {/* Header */}
      <section className="border-b border-gray-200 bg-white">
        <div className="w-full px-4 sm:px-6 py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium mb-5">
              <FiShield className="h-3.5 w-3.5" />
              {totalResults} professionals matching your search
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
              Browse Local Talent
            </h1>
            <p className="text-lg text-gray-600 max-w-xl">
              Discover trust-verified freelancers in your region
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section - Sticky */}
      <SearchFilterSection
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
        activeDiscoveryTab={activeDiscoveryTab}
        onDiscoveryTabChange={handleDiscoveryTabChange}
        selectedCategoryId={activeSkill !== "All" ? CATEGORIES.find(cat => cat.name === activeSkill)?.id : undefined}
        onCategorySelect={handleVisualCategorySelect}
        showDiscoveryTabs={true}
      />


      {/* Results Section */}
      <section className="bg-white py-8">
        <div className="w-full px-4 sm:px-6">
          {/* Filter Bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <span className="text-sm text-gray-600">
              Showing {freelancers.length} of {totalResults} freelancers
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters((current) => !current)}
                className="border-gray-300 text-gray-700 gap-2 hover:bg-gray-50"
              >
                <FiFilter className="h-4 w-4" /> Filters
              </Button>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                >
                  <FiGrid className="h-4 w-4 text-gray-700" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 border-l border-gray-300 ${viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                >
                  <FiList className="h-4 w-4 text-gray-700" />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Min rate</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={filters.minRate}
                    onChange={(e) => setFilters((current) => ({ ...current, minRate: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Max rate</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    value={filters.maxRate}
                    onChange={(e) => setFilters((current) => ({ ...current, maxRate: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Availability</label>
                  <select
                    value={filters.availability}
                    onChange={(e) => setFilters((current) => ({ ...current, availability: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500"
                  >
                    {availabilityOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === "all" ? "Any status" : option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex w-full items-center justify-between rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700">
                    <span>Verified only</span>
                    <input
                      type="checkbox"
                      checked={filters.verifiedOnly}
                      onChange={(e) => setFilters((current) => ({ ...current, verifiedOnly: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button onClick={handleApplyFilters} className="rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                  Apply Filters
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearFilters}
                  className="rounded-xl border-gray-300"
                >
                  <FiX className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          )}

          {/* Loading and Error States */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading freelancers...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-6">
              {error}
            </div>
          )}

          {!loading && freelancers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No freelancers found. Try adjusting your filters.</p>
            </div>
          )}

          {/* Grid View */}
          {!loading && viewMode === "grid" && freelancers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {freelancers.map((freelancer) => {
                const ratingValue = freelancer.ratings?.average;
                const ratingCount = freelancer.ratings?.count;
                const followersCount = freelancer.userId?.followers?.length || 0;

                const hoverUser: UserHoverCardData = {
                  id: freelancer.userId?._id,
                  name: freelancer.userId?.name || "Unknown",
                  city: freelancer.userId?.location?.city,
                  state: freelancer.userId?.location?.state,
                  completedJobs: freelancer.completedJobs,
                  followers: followersCount,
                  profileViews: freelancer.profileViews,
                  rating: ratingValue,
                  ratingCount,
                  projectImages:
                    (freelancer.portfolio || [])
                      .map((item: any) => item.images?.[0] || item.imageUrl || "")
                      .filter((url: string) => Boolean(url)),
                };

                return (
                  <Link
                    to={`/profile/${freelancer.userId?._id}`}
                    className="group bg-white border border-gray-200 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Portfolio Preview */}
                    {/* Portfolio Preview */}
                    <div className="grid grid-cols-3 gap-1 bg-gray-100 aspect-[3/2] overflow-hidden rounded-t-2xl">        
                    {freelancer.portfolio && freelancer.portfolio.length > 0 ? (
                      freelancer.portfolio.slice(0, 3).map((item, idx) => (
                        <div key={idx} className={`${idx === 0 ? 'col-span-2 row-span-2' : ''} overflow-hidden`}>
                          <img
                            src={item.images?.[0] || item.imageUrl || ''}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 flex items-center justify-center bg-gray-200">
                        <span className="text-gray-400 text-sm">No portfolio yet</span>
                      </div>
                    )}
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                          {freelancer.userId?.name?.charAt(0) || '?'}
                        </div>
                        <UserHoverCard key={freelancer._id} user={hoverUser}>

                          <div className=" min-w-0 relative z-10">
                            <div className="flex items-center gap-1.5 mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">{freelancer.userId?.name || 'Unknown'}</h3>
                              {(freelancer.userId?.isPhoneVerified || freelancer.userId?.isEmailVerified) && (
                                <FiShield className="h-4 w-4 text-blue-600 shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate">{freelancer.title}</p>
                          </div>
                        </UserHoverCard>

                      </div>



                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <FiMapPin className="h-4 w-4" />
                          <span>{freelancer.userId?.location?.city || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                          <span>Score: {freelancer.localScore || 0}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {freelancer.skills?.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                            {skill.name}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-sm font-semibold text-gray-900">{formatRate(freelancer.rates)}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${freelancer.availability?.status === "available"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                          }`}>
                          {freelancer.availability?.status === "available" ? "Available Now" : "Busy"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* List View */}
          {!loading && viewMode === "list" && freelancers.length > 0 && (
            <div className="space-y-4">
              {freelancers.map((freelancer) => (
                <Link
                  key={freelancer._id}
                  to={`/profile/${freelancer.userId?._id}`}
                  className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 flex gap-6"
                >
                  <div className="w-20 h-20 rounded-xl bg-blue-600 flex items-center justify-center text-white font-semibold text-2xl shrink-0">
                    {freelancer.userId?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{freelancer.userId?.name || 'Unknown'}</h3>
                      {(freelancer.userId?.isPhoneVerified || freelancer.userId?.isEmailVerified) && (
                        <FiShield className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{freelancer.title}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <FiMapPin className="h-4 w-4" />
                        <span>{freelancer.userId?.location?.city || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                          Score: {freelancer.localScore || 0}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatRate(freelancer.rates)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {freelancer.skills?.map((skill, idx) => (
                        <span key={idx} className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col justify-between items-end shrink-0">
                    <span className={`text-xs px-3 py-1.5 rounded-full ${freelancer.availability?.status === "available"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                      }`}>
                      {freelancer.availability?.status === "available" ? "Available Now" : "Busy"}
                    </span>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-6">
                      View Profile
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Load More */}
          <div className="text-center mt-12">
            {currentPage < totalPages ? (
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="border-2 border-gray-300 font-semibold px-8 py-6 text-base hover:bg-gray-50 rounded-full disabled:opacity-60"
              >
                {loadingMore ? "Loading more..." : "Load More Freelancers"}
              </Button>
            ) : freelancers.length > 0 ? (
              <p className="text-sm text-gray-500">You have reached the end of the results.</p>
            ) : null}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BrowseFreelancers;



{/* <UserHoverCard
                            user={{
                              id: freelancer.userId?._id,
                              name: freelancer.userId?.name || "Unknown",
                              city: freelancer.userId?.location?.city,
                              state: freelancer.userId?.location?.state,
                              completedJobs: freelancer.completedJobs,
                              followers: followersCount,
                              profileViews: freelancer.profileViews,
                              rating: ratingValue,
                              ratingCount,
                            } as UserHoverCardData}
                          >
                            <h3 className="text-lg font-semibold flex justify-center items-center  text-gray-900 truncate" title={freelancer.userId?.name}>
                              {freelancer.userId?.name || "Unknown"}
                            </h3>
                          </UserHoverCard> */}