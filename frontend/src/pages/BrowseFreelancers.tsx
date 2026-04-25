import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatCurrency } from "@/lib/currency";
import { UserHoverCard, UserHoverCardData } from "@/components/UserHoverCard";
import Avatar from "@/components/Avatar";
import LocationSelector from "@/components/LocationSelector";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";
import { CATEGORIES } from "@/constants/categories";
import {
  FiMapPin,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiStar,
  FiX,
} from "react-icons/fi";
import { TbCategory } from "react-icons/tb";
import { TfiLocationPin } from "react-icons/tfi";


const skills = ["All", ...CATEGORIES.map((category) => category.name)];
type SortOption = "Recommended" | "Top rated" | "Most jobs" | "Newest";
const PAGE_SIZE = 12;

interface FreelancerProfile {
  _id: string;
  userId: {
    _id: string;
    name: string;
    avatar?: string;
    location: {
      city: string;
      state: string;
      country?: string;
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

interface AssetSummary {
  _id: string;
  fileUrl?: string;
  previewImages?: string[];
}

const BrowseFreelancers = () => {
  const [urlParams, setSearchParams] = useSearchParams();
  const [activeSkill, setActiveSkill] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationCountry, setLocationCountry] = useState("");
  const [locationState, setLocationState] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [isLocationOpen, setIsLocationOpen] = useState(true);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [sortOption, setSortOption] = useState<SortOption>("Recommended");
  const [assetImagesByUserId, setAssetImagesByUserId] = useState<Record<string, string[]>>({});
  const mediaRowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const sortFreelancers = (list: FreelancerProfile[], option: SortOption) => {
    const sorted = [...list];
    sorted.sort((a, b) => {
      const scoreA = a.localScore ?? 0;
      const scoreB = b.localScore ?? 0;
      const ratingA = a.ratings?.average ?? 0;
      const ratingB = b.ratings?.average ?? 0;
      const jobsA = a.completedJobs ?? 0;
      const jobsB = b.completedJobs ?? 0;
      const viewsA = a.profileViews ?? 0;
      const viewsB = b.profileViews ?? 0;

      switch (option) {
        case "Top rated":
          return ratingB - ratingA || jobsB - jobsA || scoreB - scoreA;
        case "Most jobs":
          return jobsB - jobsA || ratingB - ratingA || scoreB - scoreA;
        case "Newest":
          return viewsB - viewsA || jobsB - jobsA || ratingB - ratingA;
        case "Recommended":
        default:
          return scoreB - scoreA || ratingB - ratingA || jobsB - jobsA;
      }
    });

    return sorted;
  };

  useEffect(() => {
    const nextSkill = urlParams.get("skill") || "All";
    const nextSearch = urlParams.get("search") || "";
    const legacyLocation = urlParams.get("location") || "";
    const nextCountry = urlParams.get("country") || "";
    const nextState = urlParams.get("state") || "";
    const nextCity = urlParams.get("city") || legacyLocation;

    setActiveSkill(nextSkill);
    setSearchQuery(nextSearch);
    setLocationCountry(nextCountry);
    setLocationState(nextState);
    setLocationCity(nextCity);
    fetchFreelancers({
      page: 1,
      resetResults: true,
      skill: nextSkill,
      searchValue: nextSearch,
      countryValue: nextCountry,
      stateValue: nextState,
      cityValue: nextCity,
    });
  }, [urlParams]);

  const fetchFreelancers = async ({
    page,
    resetResults,
    skill,
    searchValue,
    countryValue,
    stateValue,
    cityValue,
  }: {
    page: number;
    resetResults: boolean;
    skill: string;
    searchValue: string;
    countryValue: string;
    stateValue: string;
    cityValue: string;
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

      if (countryValue) params.country = countryValue;
      if (stateValue) params.state = stateValue;
      if (cityValue) params.city = cityValue;

      if (searchValue) {
        params.search = searchValue;
      }

      const response = await api.getFreelancers(params);
      const payload = response.data as any;

      if (payload && Array.isArray(payload)) {
        setFreelancers(sortFreelancers(payload as FreelancerProfile[], sortOption));
        setCurrentPage(1);
        setTotalPages(1);
        setTotalResults(payload.length);
      } else if (payload && payload.freelancers) {
        const nextResults = payload.freelancers as FreelancerProfile[];
        setFreelancers((previous) => {
          const combined = resetResults ? nextResults : [...previous, ...nextResults];
          return sortFreelancers(combined, sortOption);
        });
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

  useEffect(() => {
    setFreelancers((previous) => sortFreelancers(previous, sortOption));
  }, [sortOption]);

  useEffect(() => {
    const userIds = Array.from(
      new Set(
        freelancers
          .map((freelancer) => freelancer.userId?._id)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const missingUserIds = userIds.filter((id) => !Object.prototype.hasOwnProperty.call(assetImagesByUserId, id));
    if (missingUserIds.length === 0) return;

    let cancelled = false;

    const fetchAssetsForFreelancers = async () => {
      const resultEntries = await Promise.all(
        missingUserIds.map(async (userId) => {
          try {
            const allAssets: AssetSummary[] = [];
            let page = 1;
            let totalPages = 1;

            do {
              const response = await api.getAssets({ creatorId: userId, page, limit: 50, sort: "-createdAt" });
              const payload = (response as any)?.data || {};
              const pageAssets = (payload.assets || []) as AssetSummary[];
              allAssets.push(...pageAssets);
              totalPages = Number(payload.totalPages || 1);
              page += 1;
            } while (page <= totalPages && page <= 20);

            const urls = allAssets
              .map((asset) => {
                if (Array.isArray(asset.previewImages) && asset.previewImages.length > 0) {
                  return asset.previewImages[0];
                }
                return asset.fileUrl || "";
              })
              .filter((url): url is string => Boolean(url));

            return [userId, urls] as [string, string[]];
          } catch {
            return [userId, []] as [string, string[]];
          }
        }),
      );

      if (cancelled) return;

      setAssetImagesByUserId((previous) => {
        const next = { ...previous };
        resultEntries.forEach(([userId, urls]) => {
          next[userId] = urls;
        });
        return next;
      });
    };

    fetchAssetsForFreelancers();

    return () => {
      cancelled = true;
    };
  }, [freelancers, assetImagesByUserId]);

  const handleMediaRowScroll = (freelancerId: string, direction: "prev" | "next") => {
    const row = mediaRowRefs.current[freelancerId];
    if (!row) return;

    row.scrollBy({
      left: direction === "next" ? 240 : -240,
      behavior: "smooth",
    });
  };

  const syncUrl = (overrides: Partial<{ skill: string; search: string; country: string; state: string; city: string }> = {}) => {
    const nextSkill = overrides.skill ?? activeSkill;
    const nextSearch = overrides.search ?? searchQuery;
    const nextCountry = overrides.country ?? locationCountry;
    const nextState = overrides.state ?? locationState;
    const nextCity = overrides.city ?? locationCity;

    const nextParams = new URLSearchParams();
    if (nextSkill && nextSkill !== "All") nextParams.set("skill", nextSkill);
    if (nextSearch.trim()) nextParams.set("search", nextSearch.trim());
    if (nextCountry.trim()) nextParams.set("country", nextCountry.trim());
    if (nextState.trim()) nextParams.set("state", nextState.trim());
    if (nextCity.trim()) nextParams.set("city", nextCity.trim());

    setSearchParams(nextParams);
  };

  const handleSkillFilter = (skill: string) => {
    setActiveSkill(skill);
    syncUrl({ skill });
  };

  const handleSearch = () => {
    syncUrl({
      search: searchQuery,
      country: locationCountry,
      state: locationState,
      city: locationCity,
    });
  };

  const handleClearSidebarFilters = () => {
    setActiveSkill("All");
    setLocationCountry("");
    setLocationState("");
    setLocationCity("");
    syncUrl({ skill: "All", country: "", state: "", city: "" });
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
      countryValue: locationCountry,
      stateValue: locationState,
      cityValue: locationCity,
    });
  };

  const formatRate = (rates: FreelancerProfile['rates']) => {
    if (!rates || typeof rates.minRate !== "number") {
      return "Rate on request";
    }

    const amount = formatCurrency(rates.minRate, rates.currency);

    return rates.rateType === 'hourly' ? `${amount}/hr` : amount;
  };

  const truncateText = (text: string | null | undefined, maxLength: number): string => {
    if (!text) return "No title available";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
  };

  return (
    <Layout>
      <section className="border-b border-gray-200 bg-white">
        <div className="w-full px-4 sm:px-6 py-5 sm:py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Browse Freelancers</h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600">
                Discover top local talent with portfolio-first browsing.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative w-full sm:w-96">
                <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  placeholder="Search freelancers, skills, services"
                  className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500"
                />
              </div>
              <Button onClick={handleSearch} className="rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                Search
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600">Showing {freelancers.length} of {totalResults} freelancers</p>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-500">Sort by</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
              >
                <option>Recommended</option>
                <option>Top rated</option>
                <option>Most jobs</option>
                <option>Newest</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f6f8] py-6 sm:py-8">
        <div className="w-full px-4 sm:px-6 lg:flex lg:items-start lg:gap-6 lg:min-w-0">
          <aside className="lg:w-72 lg:sticky lg:top-24 space-y-4">

            <div className="rounded-2xl border border-gray-200 bg-white p-2">
              <button
                type="button"
                onClick={() => setIsCategoriesOpen((current) => !current)}
                className="flex w-full items-center justify-between"
              >
                <div className="flex gap-3 justify-center items-center">
                  <span><TbCategory /></span>
                  <h3 className="text-sm font-semibold text-gray-900">Categories</h3>
                </div>
                <FiChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isCategoriesOpen ? "rotate-180" : ""}`} />
              </button>
              {isCategoriesOpen && (
                <div className="mt-2 max-h-[360px] space-y-1 overflow-y-auto pr-1">
                  <RadioGroup value={activeSkill} onValueChange={handleSkillFilter} className="gap-1">
                    {skills.map((skill) => {
                      const isActive = activeSkill === skill;
                      return (
                        <label
                          key={skill}
                          htmlFor={`skill-${skill}`}
                          className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-1  text-left text-sm transition-colors ${isActive
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                          <RadioGroupItem id={`skill-${skill}`} value={skill} />
                          <span className="line-clamp-1">{skill}</span>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleClearSidebarFilters}
                className="mt-3 w-full rounded-xl border-gray-300 hover:bg-blue-700"
              >
                Clear Filters
              </Button>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <button
                type="button"
                onClick={() => setIsLocationOpen((current) => !current)}
                className="flex w-full items-center justify-between"
              >
                <div className="flex gap-3 justify-center items-center">
                  <span><TfiLocationPin /></span>
                  <h3 className="text-sm font-semibold text-gray-900">Location</h3>
                </div>
                <FiChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isLocationOpen ? "rotate-180" : ""}`} />
              </button>
              {isLocationOpen && (
                <div className="mt-3 space-y-2.5">
                  <LocationSelector
                    value={{
                      country: locationCountry,
                      state: locationState,
                      city: locationCity,
                    }}
                    onChange={(next) => {
                      setLocationCountry(next.country);
                      setLocationState(next.state);
                      setLocationCity(next.city);
                    }}
                  />

                  {(locationCountry || locationState || locationCity) && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setLocationCountry("");
                        setLocationState("");
                        setLocationCity("");
                        syncUrl({ country: "", state: "", city: "" });
                      }}
                      className="w-full rounded-xl border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      <FiX className="mr-2 h-4 w-4" />
                      Clear Location
                    </Button>
                  )}

                  <Button onClick={handleSearch} className="w-full rounded-xl bg-blue-700 text-white  hover:bg-blue-800">
                    Apply Location
                  </Button>
                </div>
              )}
            </div>

          </aside>

          <div className="mt-6 lg:mt-0 flex-1 min-w-0 space-y-4">
            {loading && (
              <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600"></div>
                <p className="mt-4 text-sm text-gray-600">Loading freelancers...</p>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}

            {!loading && freelancers.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center">
                <p className="text-gray-600 text-lg">No freelancers found. Try another category or location.</p>
              </div>
            )}

            {!loading && freelancers.length > 0 && (
              <>
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
                    projectImages: (freelancer.portfolio || [])
                      .flatMap((item: any) => (Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.imageUrl || ""]))
                      .filter((url: string) => Boolean(url)),
                  };

                  const portfolioImages = (freelancer.portfolio || [])
                    .map((item) => (Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : item.imageUrl || ""))
                    .filter((url): url is string => Boolean(url));

                  const assetImages = assetImagesByUserId[freelancer.userId?._id || ""] || [];
                  const allMedia = [...portfolioImages, ...assetImages];

                  return (
                    <article
                      key={freelancer._id}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <Avatar
                            src={freelancer.userId?.avatar}
                            name={freelancer.userId?.name}
                            className="h-12 w-12 shrink-0"
                          />
                          <div className="min-w-0">
                            <UserHoverCard key={freelancer._id} user={hoverUser}>
                              <h3 className="truncate text-base font-semibold text-gray-900 hover:text-blue-700">
                                {freelancer.userId?.name || "Unknown"}
                              </h3>
                            </UserHoverCard>
                            <p className="mt-0.5 text-sm text-gray-600" title={freelancer.title || "No title available"}>
                              {truncateText(freelancer.title, 44)}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              <span className="inline-flex items-center gap-1">
                                <FiMapPin className="h-3.5 w-3.5" />
                                {[freelancer.userId?.location?.city, freelancer.userId?.location?.state, freelancer.userId?.location?.country]
                                  .filter(Boolean)
                                  .join(", ") || "No location"}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <FiStar className="h-3.5 w-3.5" />
                                {(ratingValue || 0).toFixed(1)}{ratingCount ? ` (${ratingCount})` : ""}
                              </span>
                              <span className="rounded bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                                Score {freelancer.localScore || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-2 lg:items-end">
                          <span className="text-sm font-semibold text-gray-900">{formatRate(freelancer.rates)}</span>
                          {/* <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${freelancer.availability?.status === "available"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                              }`}
                          >
                            {freelancer.availability?.status === "available" ? "Available" : "Busy"}
                          </span> */}
                          <Link to={`/freelancers/${freelancer.userId?._id}`}>
                            <Button size="sm" className="mt-1 rounded-full bg-blue-700 text-white hover:bg-blue-800">
                              View Profile
                              <FiChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="relative max-w-full overflow-hidden rounded-lg p-2">

                      {/* Buttons must be INSIDE the relative container, NOT wrapped in a dimensionless div */}

                        {allMedia.length > 1 && (
                          <div className="flex w-full items-center justify-end px-3 py-1">
                            <button
                              type="button"
                              onClick={() => handleMediaRowScroll(freelancer._id, "prev")}
                              className="rounded-full  font-bold p-1  text-black  "
                              aria-label="Previous preview"
                            >
                              <FiChevronLeft className="h-5 w-5  " />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMediaRowScroll(freelancer._id, "next")}
                              className="rounded-full  p-1 text-black  "
                              aria-label="Next preview"
                            >
                              <FiChevronRight className="h-5 w-5  " />
                            </button>

                          </div>
                        )}

                        <div
                          ref={(element) => { mediaRowRefs.current[freelancer._id] = element; }}
                          className="scrollbar-hide flex w-full max-w-full gap-2 overflow-x-auto pb-1 scroll-smooth snap-x snap-mandatory"
                        >
                          {allMedia.map((image, index) => (
                            <div
                              key={`${freelancer._id}-media-${index}`}
                              className="h-40 w-56 shrink-0 overflow-hidden rounded-md bg-white snap-start"
                            >
                              <img
                                src={image}
                                alt="Portfolio and asset preview"
                                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                              />
                            </div>
                          ))}
                        </div>
  
                        <div className="w-full flex justify-end">
                          <div className="rounded-full w-fit border border-gray-400 px-2 py-0.5 text-[11px] font-medium text-blue-800">
                            {allMedia.length} items
                          </div>

                        </div>

                      </div>
                    </article>
                  );
                })}

                <div className="pt-4 text-center">
                  {currentPage < totalPages ? (
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="rounded-full border-gray-300 px-8 py-6 text-base font-semibold hover:bg-gray-50 disabled:opacity-60"
                    >
                      {loadingMore ? "Loading more..." : "Load More Freelancers"}
                    </Button>
                  ) : (
                    <p className="text-sm text-gray-500">You have reached the end of the results.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BrowseFreelancers;
