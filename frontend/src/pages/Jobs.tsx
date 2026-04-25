import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiSearch, FiMapPin, FiClock, FiX, FiChevronDown, FiChevronUp, FiCalendar, FiUsers, FiBookmark } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import LocationSelector, { type LocationValue } from "@/components/LocationSelector";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserHoverCard, UserHoverCardData } from "@/components/UserHoverCard";
import { JobStatusBadges } from "@/components/JobStatusBadges";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";
import { CATEGORIES } from "@/constants/categories";
import { Coins } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { addGuestSavedJob, getGuestSavedJobs, removeGuestSavedJob } from "@/lib/guestStorage";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { resolveAvatarSrc } from "@/lib/avatar";

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  location: {
    city: string;
    state: string;
    country: string;
  };
  budget: {
    type: string;
    amount: number;
    maxAmount?: number;
    currency: string;
  };
  remoteAllowed: boolean;
  createdAt: string;
  duration?: string;
  experienceLevel?: string;
  status: string;
  clientId: {
    _id: string;
    name: string;
    avatar?: string;
  };
  proposalsCount?: number;
  attachments?: Array<{
    filename?: string;
    url: string;
    uploadedAt?: string;
  }>;
}

const Jobs = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser, updateUser } = useAuth();
  const [urlParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || "");
  const [debouncedQuery, setDebouncedQuery] = useState(urlParams.get('search') || "");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRealtimeSearching, setIsRealtimeSearching] = useState(false);
  const [locationFilter, setLocationFilter] = useState<LocationValue>({ country: "", state: "", city: "" });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("All"); // Store category ID
  const [showCategories, setShowCategories] = useState(true);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [isSelectedJobSaved, setIsSelectedJobSaved] = useState(false);
  const latestRequestId = useRef(0);
  const isClient = !!user && user.role === "client";

  const categoryOptions = [
    { id: "All", name: "All" },
    ...CATEGORIES.slice(0, 15).map(cat => ({ id: cat.id, name: cat.name }))
  ];

  // Debounce typing so we can search in realtime without spamming requests.
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    fetchJobs(debouncedQuery, selectedCategoryId !== "All" ? selectedCategoryId : undefined, true);
  }, [debouncedQuery, selectedCategoryId, locationFilter.country, locationFilter.state, locationFilter.city]);

  const matchesLocationFilter = (job: Job) => {
    if (!locationFilter.country && !locationFilter.state && !locationFilter.city) return true;

    const jobCountry = (job.location?.country || "").toLowerCase();
    const jobState = (job.location?.state || "").toLowerCase();
    const jobCity = (job.location?.city || "").toLowerCase();

    if (locationFilter.country && jobCountry !== locationFilter.country.toLowerCase()) return false;
    if (locationFilter.state && jobState !== locationFilter.state.toLowerCase()) return false;
    if (locationFilter.city && jobCity !== locationFilter.city.toLowerCase()) return false;

    return true;
  };

  const fetchJobs = async (search?: string, category?: string, isLiveSearch = false) => {
    const requestId = ++latestRequestId.current;

    try {
      if (isLiveSearch) {
        setIsRealtimeSearching(true);
      }
      setLoading(true);
      setError("");
      const params: any = {};
      if (search && search.trim()) params.search = search.trim();
      if (category && category !== "All") params.category = category;
      if (locationFilter.country) params.country = locationFilter.country;
      if (locationFilter.state) params.state = locationFilter.state;
      if (locationFilter.city) params.city = locationFilter.city;
      params.limit = 200;
      params.status = 'open';

      const response = await api.getJobs(params);
      if (requestId !== latestRequestId.current) return;

      const fetchedJobs =
        response.data && Array.isArray(response.data)
          ? response.data
          : response.data && (response.data as any).jobs
            ? (response.data as any).jobs
            : [];

      const filteredJobs = fetchedJobs.filter((job: Job) => matchesLocationFilter(job));

      if (response.data && Array.isArray(response.data)) {
        setJobs(filteredJobs);
      } else if (response.data && (response.data as any).jobs) {
        setJobs(filteredJobs);
      } else {
        setJobs([]);
      }
    } catch (err: any) {
      if (requestId !== latestRequestId.current) return;
      setError(err.message || "Failed to fetch jobs");
      setJobs([]);
    } finally {
      if (requestId !== latestRequestId.current) return;
      if (isLiveSearch) {
        setIsRealtimeSearching(false);
      }
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setDebouncedQuery(searchQuery);
    fetchJobs(searchQuery, selectedCategoryId !== "All" ? selectedCategoryId : undefined);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  useEffect(() => {
    if (!selectedJob) {
      setIsSelectedJobSaved(false);
      return;
    }

    if (isAuthenticated && user) {
      const rawSaved = (user as any)?.savedJobs || [];
      const savedJobIds: string[] = (Array.isArray(rawSaved) ? rawSaved : [])
        .map((entry: any) => (typeof entry === "string" ? entry : entry?._id))
        .filter((id: any): id is string => typeof id === "string" && id.length > 0);
      setIsSelectedJobSaved(savedJobIds.includes(selectedJob._id));
    } else {
      const guestSaved = getGuestSavedJobs();
      setIsSelectedJobSaved(guestSaved.includes(selectedJob._id));
    }
  }, [selectedJob?._id, isAuthenticated, user]);

  const formatBudget = (job: Job) => {
    const { budget } = job;
    const minAmount = formatCurrency(budget.amount, budget.currency);

    if (budget.maxAmount) {
      const maxAmount = formatCurrency(budget.maxAmount, budget.currency);
      return `${minAmount} - ${maxAmount}`;
    }

    return budget.type === 'hourly' ? `${minAmount}/hr` : minAmount;
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getDownloadUrl = (url: string) => {
    if (!url) return "#";
    return url.includes('/upload/') ? url.replace('/upload/', '/upload/fl_attachment/') : url;
  };

  const handleSubmitProposalClick = () => {
    if (!selectedJob) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!user || user.role !== "freelancer") {
      // Only freelancers can propose
      toast({
        title: "Only freelancers can submit proposals",
        description: "Switch to a freelancer account to send proposals.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to full job detail page where the proposal form lives
    navigate(`/jobs/${selectedJob._id}`);
  };

  const handleBookmarkClick = async () => {
    if (!selectedJob) return;

    if (!isAuthenticated) {
      if (isSelectedJobSaved) {
        removeGuestSavedJob(selectedJob._id);
        setIsSelectedJobSaved(false);
        toast({
          title: "Removed from saved jobs",
          description: "This job has been removed from your device.",
        });
      } else {
        addGuestSavedJob(selectedJob._id);
        setIsSelectedJobSaved(true);
        toast({
          title: "Job saved for later",
          description: "Log in or sign up to keep it on your dashboard.",
        });
      }
      return;
    }

    try {
      setBookmarkLoading(true);
      if (isSelectedJobSaved) {
        await api.unbookmarkJob(selectedJob._id);
        // Optimistically update local auth user savedJobs
        if (user) {
          const rawSaved = (user as any)?.savedJobs || [];
          const currentIds: string[] = (Array.isArray(rawSaved) ? rawSaved : [])
            .map((entry: any) => (typeof entry === "string" ? entry : entry?._id))
            .filter((id: any): id is string => typeof id === "string" && id.length > 0);
          const nextIds = currentIds.filter((id) => id !== selectedJob._id);
          updateUser({ savedJobs: nextIds as any });
        }
        setIsSelectedJobSaved(false);
        await refreshUser();
        toast({
          title: "Removed from Saved",
          description: "This job was removed from your Saved tab.",
        });
      } else {
        await api.bookmarkJob(selectedJob._id);
        if (user) {
          const rawSaved = (user as any)?.savedJobs || [];
          const currentIds: string[] = (Array.isArray(rawSaved) ? rawSaved : [])
            .map((entry: any) => (typeof entry === "string" ? entry : entry?._id))
            .filter((id: any): id is string => typeof id === "string" && id.length > 0);
          const nextIds = currentIds.includes(selectedJob._id)
            ? currentIds
            : [...currentIds, selectedJob._id];
          updateUser({ savedJobs: nextIds as any });
        }
        setIsSelectedJobSaved(true);
        await refreshUser();
        toast({
          title: "Job saved",
          description: "This job is now in your Saved tab.",
        });
      }
    } catch (err) {
      console.error("Failed to bookmark job", err);
      toast({
        title: isSelectedJobSaved ? "Could not update saved job" : "Could not save job",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <Layout>
      {/* Hero cover with vibrant gradient background */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#c83d8a] via-[#a36712] to-[#3c27c6]">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 md:py-14 flex flex-col items-center text-center text-white">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Find your next creative job nearby
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-2xl">
            Discover local clients looking for designers, editors, videographers, developers, and more.
            Filter by category, skills, and budget to land the right gig faster.
          </p>
        </div>
      </section>

      {/* Main content area */}
      <section className="bg-gray-50 min-h-screen">
        <div className="w-full px-4 sm:px-6 py-8">
          <div className="flex gap-6">
            {/* Left Sidebar - Categories */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-24 space-y-5">
                <button
                  onClick={() => setShowCategories(!showCategories)}
                  className="flex items-center justify-between w-full mb-4 text-lg font-semibold text-gray-900"
                >
                  <span>Categories</span>
                  {showCategories ? <FiChevronUp /> : <FiChevronDown />}
                </button>

                {showCategories && (
                  <RadioGroup
                    value={selectedCategoryId}
                    onValueChange={handleCategorySelect}
                    className="gap-1.5"
                  >
                    {categoryOptions.map((category) => (
                      <label
                        key={category.id}
                        htmlFor={`desktop-category-${category.id}`}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-lg px-1 font-sans text-sm transition-colors",
                          selectedCategoryId === category.id
                            ? "bg-blue-50 text-blue-700 font-semibold"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <RadioGroupItem value={category.id} id={`desktop-category-${category.id}`} />
                        <span className="line-clamp-1">{category.name}</span>
                      </label>
                    ))}
                  </RadioGroup>
                )}

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">Location</h3>
                  <LocationSelector
                    value={locationFilter}
                    onChange={setLocationFilter}
                    layout="column"
                  />
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {/* Mobile Category Filter - Shows only on small screens */}
              <div className="lg:hidden mb-4">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
                  <h3 className="mb-3 text-sm font-semibold text-gray-800">Location</h3>
                  <LocationSelector
                    value={locationFilter}
                    onChange={setLocationFilter}
                    layout="column"
                  />
                </div>
              </div>

              {/* Search Bar and Filters */}
              <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 p-3 shadow-sm sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex w-full border border-gray-400 p-2 rounded-full bg-white focus:outline-1 focus:outline-blue-500">
                    <div className="w-full flex">
                      <input
                        type="text"
                        placeholder="Search jobs by title, skill, or keyword..."
                        className="h-12 w-full rounded-full  bg-white pl-8 pr-4 text-md text-slate-800 focus:outline-none "
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}                      
                      />
                    </div>
                    <div className="flex w-full gap-2 sm:w-auto">
                      <Button
                        onClick={handleSearch}
                        className="h-12 w-full rounded-full bg-blue-700 px-6 text-white hover:bg-blue-600 sm:w-auto"
                      >
                        Search
                      </Button>
                      {searchQuery.trim() && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSearchQuery("")}
                          className="h-12 rounded-full border-gray-400 px-4 text-slate-600 hover:bg-blue-700"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>


                </div>

          
              </div>

              {/* Jobs count and active filters */}
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-blue-700">
                  {loading ? "Loading..." : `${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'} found`}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {selectedCategoryId !== "All" && (
                    <button
                      onClick={() => handleCategorySelect("All")}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <FiX className="h-4 w-4" />
                      Clear category filter
                    </button>
                  )}
                  {(locationFilter.country || locationFilter.state || locationFilter.city) && (
                    <button
                      onClick={() => setLocationFilter({ country: "", state: "", city: "" })}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <FiX className="h-4 w-4" />
                      Clear location filter
                    </button>
                  )}
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading jobs...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl mb-6">
                  {error}
                </div>
              )}

              {/* Empty State */}
              {!loading && jobs.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                  <p className="text-gray-600 text-lg">No jobs found. Try adjusting your filters.</p>
                </div>
              )}

              {/* Job Cards Grid */}
              {!loading && jobs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-3">
                  {jobs.map((job) => {
                    const client = job.clientId;
                    const hoverUser: UserHoverCardData | null = client && client._id && client.name
                      ? {
                        id: client._id,
                        name: client.name,
                        avatarUrl: client.avatar,
                        role: "client",
                        city: job.location?.city,
                        state: job.location?.state,
                      }
                      : null;

                    return (
                      <button
                        key={job._id}
                        onClick={() => setSelectedJob(job)}
                        className="bg-white border border-gray-300 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left group overflow-visible"
                      >
                        {/* Company/Client Avatar */}
                        <div className="flex items-start gap-3 mb-4">
                          {hoverUser ? (
                            <div className="flex items-start gap-3 min-w-0 w-full">
                              <img
                                src={resolveAvatarSrc(client.avatar)}
                                alt={client.name}
                                className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-white shadow"
                              />
                              <UserHoverCard user={hoverUser}>
                                <div className="flex-1 min-w-0 max-w-full">
                                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2 [overflow-wrap:anywhere]">
                                    {job.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 truncate hover:text-black hover:underline hover:font-bold">{client.name}
                                  </p>
                                </div>
                              </UserHoverCard>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3 min-w-0 w-full">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                {job.clientId?.name?.charAt(0) || 'C'}
                              </div>
                              <div className="flex-1 min-w-0 max-w-full">
                                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2 [overflow-wrap:anywhere]">
                                  {job.title}
                                </h3>
                                <p className="text-sm text-gray-600 truncate">{job.clientId?.name || 'Anonymous Client'}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Location and Remote */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 min-w-0">
                          <FiMapPin className="h-4 w-4" />
                          <span className="truncate max-w-full">{job.location.city}, {job.location.state}</span>
                        </div>

                        {/* Description Preview */}
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2 [overflow-wrap:anywhere]">
                          {job.description}
                        </p>

                        {/* Skills */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {job.skills.slice(0, 2).map((skill) => (
                            <span key={skill} className="px-1 py-1 bg-gray-100 border border-gray-3 text-gray-700 rounded-md text-xs font-medium truncate max-w-full [overflow-wrap:anywhere]">
                              {skill.slice(0, 10)}{skill.length > 10 ? "..." : ""}
                            </span>
                          ))}
                          {job.skills.length > 2 && (
                            <span className="px-1 py-1 bg-gray-100 text-gray-600 border border-gray-300 rounded-md text-xs">
                              +{job.skills.length - 2} more
                            </span>
                          )}
                        </div>

                        {/* Job Status Badges - Visible to All Users */}
                        <div className="mb-4">
                          <JobStatusBadges job={job} />
                        </div>

                        {/* Footer - Budget and Time */}
                        <div className="flex items-center justify-between pt-4 border-t border-zinc-300 gap-3 min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 min-w-0">
                            {/* <FiDollarSign className="h-4 w-4" /> */}
                            <span className="truncate">{formatBudget(job)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
                            <FiClock className="h-3.5 w-3.5" />
                            {getTimeAgo(job.createdAt)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Right Slide-out Detail Panel */}
      {selectedJob && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedJob(null)}
          />

          {/* Slide Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full sm:max-w-2xl bg-white z-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">

            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b px-4 sm:px-8 py-6 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Job Details</h2>

              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <FiX className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="p-4 sm:p-8 pb-3">

              {/* Job Title + Client */}
              <div className="flex flex-col gap-4 mb-8 items-center justify-center ">

                <img
                  src={resolveAvatarSrc(selectedJob.clientId?.avatar)}
                  alt={selectedJob.clientId.name}
                  className="w-20 sm:w-28 h-auto rounded-full object-cover border"
                />

                <div className="flex-col items-center justify-center text-center">

                  <p className="text-gray-500 mt-1">
                    {selectedJob.clientId?.name || "Anonymous Client"}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                    {selectedJob.title}
                  </h3>

                </div>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8">

                <div className="flex items-center gap-3 p-4 rounded-xl border bg-gray-50">
                  <Coins className="text-blue-600 h-5 w-5" />
                  <div>
                    <p className="text-xs text-gray-500">Budget</p>
                    <p className="font-semibold">{formatBudget(selectedJob)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl border bg-gray-50">
                  <FiMapPin className="text-green-800 h-5 w-5" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-semibold">
                      {selectedJob.location.city}, {selectedJob.location.state}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl border bg-gray-50">
                  <FiClock className="text-purple-600 h-5 w-5" />
                  <div>
                    <p className="text-xs text-gray-500">Posted</p>
                    <p className="font-semibold">{getTimeAgo(selectedJob.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl border bg-gray-50">
                  <FiUsers className="text-orange-600 h-5 w-5" />
                  <div>
                    <p className="text-xs text-gray-500">Proposals</p>
                    <p className="font-semibold">{selectedJob.proposalsCount || 0}</p>
                  </div>
                </div>

              </div>

              {/* Description */}
              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Job Description
                </h4>

                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {selectedJob.description}
                </p>
              </div>

              {/* Experience */}
              {selectedJob.experienceLevel && (
                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Experience Level
                  </h4>

                  <span className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium capitalize">
                    {selectedJob.experienceLevel}
                  </span>
                </div>
              )}

              {/* Duration */}
              {selectedJob.duration && (
                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Project Duration
                  </h4>

                  <div className="flex items-center gap-2 text-gray-600">
                    <FiCalendar />
                    {selectedJob.duration}
                  </div>
                </div>
              )}

              {/* Skills */}
              <div className="mb-10">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Required Skills
                </h4>

                <div className="flex flex-wrap gap-2">
                  {selectedJob.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {selectedJob.attachments && selectedJob.attachments.length > 0 && (
                <div className="mb-10">
                  <h4 className="font-semibold text-gray-900 mb-3">Project Documents</h4>
                  <div className="space-y-2">
                    {selectedJob.attachments.map((file, index) => (
                      <div
                        key={`${file.url}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-gray-50 px-3 py-2"
                      >
                        <span className="text-sm text-gray-800 truncate">{file.filename || `Document ${index + 1}`}</span>
                        <a
                          href={getDownloadUrl(file.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Sticky Footer CTA */}
            <div className="sticky bottom-0 bg-white border-t px-4 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row gap-2 sm:gap-3">

              {!isClient && (
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-5 sm:py-6 rounded-xl font-semibold text-sm sm:text-base"
                  onClick={handleSubmitProposalClick}
                >
                  Submit Proposal
                </Button>
              )}

              <Button
                variant="outline"
                className={`px-4 sm:px-5 border rounded-xl flex items-center gap-1.5 ${isSelectedJobSaved ? "border-blue-600 bg-blue-50 text-blue-700" : ""
                  }`}
                onClick={handleBookmarkClick}
                disabled={bookmarkLoading}
              >
                <FiBookmark className={isSelectedJobSaved ? "text-blue-600" : ""} />
                <span className="text-xs sm:text-sm font-medium">
                  {isSelectedJobSaved ? "Saved" : "Save"}
                </span>
              </Button>

            </div>

          </div>
        </>
      )}
    </Layout>
  );
};

export default Jobs;
