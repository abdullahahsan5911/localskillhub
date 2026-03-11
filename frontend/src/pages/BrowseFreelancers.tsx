import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiSearch, FiMapPin, FiStar, FiShield, FiFilter, FiGrid, FiList } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";

const skills = ["All", "Web Development", "Graphic Design", "Video Production", "Digital Marketing", "Photography", "Content Writing", "Mobile Apps", "UI/UX Design"];

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
}

const BrowseFreelancers = () => {
  const [urlParams] = useSearchParams();
  const [activeSkill, setActiveSkill] = useState("All");
  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || "");
  const [locationQuery, setLocationQuery] = useState(urlParams.get('location') || "");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFreelancers();
  }, []);

  const fetchFreelancers = async (skillFilter?: string) => {
    try {
      setLoading(true);
      const params: any = {};
      if (skillFilter && skillFilter !== "All") {
        params.skills = skillFilter;
      }
      if (locationQuery) {
        params.city = locationQuery;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const response = await api.getFreelancers(params);
      if (response.data && Array.isArray(response.data)) {
        setFreelancers(response.data);
      } else if (response.data && (response.data as any).freelancers) {
        setFreelancers((response.data as any).freelancers);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch freelancers");
    } finally {
      setLoading(false);
    }
  };

  const handleSkillFilter = (skill: string) => {
    setActiveSkill(skill);
    fetchFreelancers(skill);
  };

  const formatRate = (rates: FreelancerProfile['rates']) => {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium mb-5">
              <FiShield className="h-3.5 w-3.5" />
              {freelancers.length} verified professionals near you
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
              Browse Local Talent
            </h1>
            <p className="text-lg text-gray-600 max-w-xl">
              Discover trust-verified freelancers in your region
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white border border-gray-300 rounded-2xl p-2 mt-8 max-w-3xl shadow-sm">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 transition-colors focus-within:bg-gray-100">
                <FiSearch className="h-5 w-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by skill, name, or keyword..."
                  className="bg-transparent w-full text-gray-900 placeholder:text-gray-500 outline-none text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 transition-colors focus-within:bg-gray-100">
                <FiMapPin className="h-5 w-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="City or region..."
                  className="bg-transparent w-full text-gray-900 placeholder:text-gray-500 outline-none text-sm"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => fetchFreelancers(activeSkill)}
                className="bg-blue-600 text-white font-semibold px-8 h-12 hover:bg-blue-700 transition-all duration-200 rounded-xl"
              >
                Search
              </Button>
            </div>
          </div>

          {/* Skill Pills */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
            {skills.map((skill) => (
              <button
                key={skill}
                onClick={() => handleSkillFilter(skill)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeSkill === skill
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Filter Bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <span className="text-sm text-gray-600">{freelancers.length} freelancers</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 gap-2 hover:bg-gray-50">
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
              {freelancers.map((freelancer) => (
                <Link 
                  key={freelancer._id} 
                  to={`/profile/${freelancer.userId?._id}`}
                  className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Portfolio Preview */}
                  <div className="grid grid-cols-3 gap-1 bg-gray-100 aspect-[3/2]">
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{freelancer.userId?.name || 'Unknown'}</h3>
                          {(freelancer.userId?.isPhoneVerified || freelancer.userId?.isEmailVerified) && (
                            <FiShield className="h-4 w-4 text-blue-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{freelancer.title}</p>
                      </div>
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
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        freelancer.availability?.status === "available"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {freelancer.availability?.status === "available" ? "Available Now" : "Busy"}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
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
                    <span className={`text-xs px-3 py-1.5 rounded-full ${
                      freelancer.availability?.status === "available"
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
            <Button variant="outline" className="border-2 border-gray-300 font-semibold px-8 py-6 text-base hover:bg-gray-50 rounded-full">
              Load More Freelancers
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BrowseFreelancers;
