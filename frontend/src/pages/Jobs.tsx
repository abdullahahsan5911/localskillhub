import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FiSearch, FiMapPin, FiClock, FiDollarSign, FiX, FiChevronDown, FiChevronUp, FiCalendar, FiUsers, FiBookmark } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";
import { CATEGORIES } from "@/constants/categories";

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
  };
  proposalsCount?: number;
}

const Jobs = () => {
  const [urlParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || "");
  const [locationQuery, setLocationQuery] = useState(urlParams.get('location') || "");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showCategories, setShowCategories] = useState(true);
  const [showLocationFilter, setShowLocationFilter] = useState(false);

  const categories = ["All", ...CATEGORIES.slice(0, 15).map(cat => cat.name)];

  useEffect(() => {
    fetchJobs(searchQuery, locationQuery, selectedCategory !== "All" ? selectedCategory : undefined);
  }, [selectedCategory]);

  const fetchJobs = async (search?: string, city?: string, category?: string) => {
    try {
      setLoading(true);
      setError("");
      const params: any = {};
      if (search) params.search = search;
      if (city) params.city = city;
      if (category && category !== "All") params.category = category;
      params.limit = 200;
      params.status = 'open';
      
      const response = await api.getJobs(params);
      if (response.data && Array.isArray(response.data)) {
        setJobs(response.data);
      } else if (response.data && (response.data as any).jobs) {
        setJobs((response.data as any).jobs);
      } else {
        setJobs([]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchJobs(searchQuery, locationQuery, selectedCategory !== "All" ? selectedCategory : undefined);
  };

  const formatBudget = (job: Job) => {
    const { budget } = job;
    const minAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: budget.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(budget.amount);
    
    if (budget.maxAmount) {
      const maxAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: budget.currency || 'INR',
        maximumFractionDigits: 0,
      }).format(budget.maxAmount);
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

  return (
    <Layout>
      {/* Header with gradient background */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Creative Jobs</h1>
          <p className="text-xl text-white/90">Browse and discover your next opportunity</p>
        </div>
      </section>

      {/* Main content area */}
      <section className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex gap-6">
            {/* Left Sidebar - Categories */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-24">
                <button
                  onClick={() => setShowCategories(!showCategories)}
                  className="flex items-center justify-between w-full mb-4 text-lg font-semibold text-gray-900"
                >
                  <span>Categories</span>
                  {showCategories ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                
                {showCategories && (
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                          selectedCategory === category
                            ? "bg-blue-50 text-blue-700 font-semibold"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}

                <hr className="my-5 border-gray-200" />

                <button
                  onClick={() => setShowLocationFilter(!showLocationFilter)}
                  className="flex items-center justify-between w-full mb-4 text-lg font-semibold text-gray-900"
                >
                  <span>Location</span>
                  {showLocationFilter ? <FiChevronUp /> : <FiChevronDown />}
                </button>

                {showLocationFilter && (
                  <div className="space-y-2">
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="City..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {/* Search Bar and Filters */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search jobs..."
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button 
                    onClick={handleSearch}
                    className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-8"
                  >
                    Search
                  </Button>
                </div>
              </div>

              {/* Jobs count */}
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {loading ? "Loading..." : `${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'} found`}
                </p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {jobs.map((job) => (
                    <button
                      key={job._id}
                      onClick={() => setSelectedJob(job)}
                      className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left group"
                    >
                      {/* Company/Client Avatar */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                          {job.clientId?.name?.charAt(0) || 'C'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {job.title}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">{job.clientId?.name || 'Anonymous Client'}</p>
                        </div>
                      </div>

                      {/* Location and Remote */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <FiMapPin className="h-4 w-4" />
                        <span>{job.location.city}, {job.location.state}</span>
                      </div>

                      {/* Description Preview */}
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {job.description}
                      </p>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.skills.slice(0, 3).map((skill) => (
                          <span key={skill} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 3 && (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                            +{job.skills.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Footer - Budget and Time */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                          <FiDollarSign className="h-4 w-4" />
                          {formatBudget(job)}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <FiClock className="h-3.5 w-3.5" />
                          {getTimeAgo(job.createdAt)}
                        </div>
                      </div>
                    </button>
                  ))}
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
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setSelectedJob(null)}
          />
          
          {/* Slide Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white z-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            <div className="p-8">
              {/* Company Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                  {selectedJob.clientId?.name?.charAt(0) || 'C'}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedJob.title}</h3>
                  <p className="text-lg text-gray-600">{selectedJob.clientId?.name || 'Anonymous Client'}</p>
                </div>
              </div>

              {/* Key Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8 p-5 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FiDollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Budget</p>
                    <p className="font-semibold text-gray-900">{formatBudget(selectedJob)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <FiMapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">
                      {selectedJob.location.city}, {selectedJob.location.state}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FiClock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Posted</p>
                    <p className="font-semibold text-gray-900">{getTimeAgo(selectedJob.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <FiUsers className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Proposals</p>
                    <p className="font-semibold text-gray-900">{selectedJob.proposalsCount || 0}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-900 mb-3">Job Description</h4>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{selectedJob.description}</p>
              </div>

              {/* Experience Level */}
              {selectedJob.experienceLevel && (
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-900 mb-3">Experience Level</h4>
                  <span className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium capitalize">
                    {selectedJob.experienceLevel}
                  </span>
                </div>
              )}

              {/* Duration */}
              {selectedJob.duration && (
                <div className="mb-8">
                  <h4 className="text-lg font-bold text-gray-900 mb-3">Project Duration</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <FiCalendar className="h-5 w-5" />
                    <span className="capitalize">{selectedJob.duration}</span>
                  </div>
                </div>
              )}

              {/* Required Skills */}
              <div className="mb-8">
                <h4 className="text-lg font-bold text-gray-900 mb-3">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.skills.map((skill) => (
                    <span key={skill} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 sticky bottom-0 bg-white pt-4 pb-6 border-t border-gray-200">
                <Button className="flex-1 bg-blue-600 text-white hover:bg-blue-700 rounded-xl py-6 text-base font-semibold">
                  Submit Proposal
                </Button>
                <Button variant="outline" className="border-2 border-gray-300 rounded-xl px-8">
                  <FiBookmark className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Jobs;
