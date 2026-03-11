import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiSearch, FiMapPin, FiTrendingUp, FiUsers, FiShield, FiHeart, FiLoader } from "react-icons/fi";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { CATEGORIES } from "@/constants/categories";

// Get top categories for filtering
const topCategoryIds = [
  "web-development",
  "graphic-design", 
  "video-production",
  "digital-marketing",
  "photography",
  "content-writing",
  "mobile-development",
  "ui-ux-design"
];

const filterCategories = [
  { id: "all", name: "All" },
  ...CATEGORIES.filter(cat => topCategoryIds.includes(cat.id))
];

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
    imageUrl?: string; // legacy fallback
  }>;
  rating: number;
  completedJobs: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [liked, setLiked] = useState<string[]>([]);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [homeSearch, setHomeSearch] = useState("");
  const [homeLocation, setHomeLocation] = useState("");

  const handleHomeSearch = () => {
    const params = new URLSearchParams();
    if (homeSearch) params.set('search', homeSearch);
    if (homeLocation) params.set('location', homeLocation);
    navigate(`/browse?${params.toString()}`);
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
        console.error('Failed to fetch freelancers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFreelancers();
  }, []);

  const toggleLike = (id: string) => {
    setLiked(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredFreelancers = activeCategory === "all" 
    ? freelancers 
    : freelancers.filter(f => 
        f.skills.some(skill => {
          const activeCat = CATEGORIES.find(c => c.id === activeCategory);
          const skillName = skill.name;
          return activeCat && (
            skillName.toLowerCase().includes(activeCat.name.toLowerCase()) ||
            activeCat.name.toLowerCase().includes(skillName.toLowerCase())
          );
        })
      );

  // Only show profiles that have portfolio images — filter out incomplete accounts
  const displayFreelancers = filteredFreelancers.filter(f =>
    f.portfolio && f.portfolio.length > 0 &&
    (f.portfolio[0].images?.[0] || (f.portfolio[0] as any).imageUrl)
  );

  return (
    <Layout>
      {/* Hero Section - Behance Style */}
      <section className="bg-white pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              Discover Local Talent
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Connect with skilled freelancers in your region for verified, trusted collaboration
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-full shadow-sm p-2 flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-4 py-2">
              <FiSearch className="text-gray-400 mr-2 h-5 w-5" />
              <input
                type="text"
                placeholder="Search for services..."
                className="w-full bg-transparent border-none focus:outline-none text-gray-900 placeholder-gray-400"
                value={homeSearch}
                onChange={(e) => setHomeSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleHomeSearch()}
              />
            </div>
            <div className="flex-1 flex items-center px-4 py-2 border-t md:border-t-0 md:border-l border-gray-200">
              <HiOutlineLocationMarker className="text-gray-400 mr-2 h-5 w-5" />
              <input
                type="text"
                placeholder="Location"
                className="w-full bg-transparent border-none focus:outline-none text-gray-900 placeholder-gray-400"
                value={homeLocation}
                onChange={(e) => setHomeLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleHomeSearch()}
              />
            </div>
            <Button
              onClick={handleHomeSearch}
              className="bg-blue-600 text-white font-semibold px-8 py-6 rounded-full hover:bg-blue-700"
            >
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="bg-gray-50 border-y border-gray-200 py-6 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {filterCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-blue-600"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Work Grid - Behance Style */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <FiLoader className="h-12 w-12 text-blue-600 animate-spin" />
            </div>
          ) : displayFreelancers.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No freelancers found. Try a different category.</p>
              <Link to="/browse">
                <Button className="mt-6 bg-blue-600 text-white">
                  Browse All Freelancers
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayFreelancers.map((freelancer) => {
                const portfolioItem = freelancer.portfolio?.[0];
                const user = freelancer.userId;
                
                return (
                  <div key={freelancer._id} className="group">
                    <Link to={`/profile/${freelancer.userId._id}`}>
                      <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300">
                        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
                          {portfolioItem?.images?.[0] || portfolioItem?.imageUrl ? (
                            <img
                              src={portfolioItem.images?.[0] || portfolioItem.imageUrl || ''}
                              alt={portfolioItem.title || 'Portfolio'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-blue-600/30">
                              {user.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleLike(freelancer._id);
                            }}
                            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                          >
                            <FiHeart
                              className={`h-5 w-5 ${
                                liked.includes(freelancer._id) ? "fill-red-500 text-red-500" : "text-gray-700"
                              }`}
                            />
                          </button>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {portfolioItem?.title || user.name || 'Freelancer Portfolio'}
                          </h3>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                              {user.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="text-sm text-gray-600">{user.name || 'Anonymous'}</span>
                            {user.verification?.identity && (
                              <FiShield className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span className="text-xs bg-gray-100 px-3 py-1 rounded-full line-clamp-1">
                              {freelancer.skills[0]?.name || 'Freelancer'}
                            </span>
                            <div className="flex items-center gap-1">
                              <FiUsers className="h-4 w-4" />
                              <span>{freelancer.completedJobs || 0} jobs</span>
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

      {/* Features Section */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose LocalSkillHub?
            </h2>
            <p className="text-lg text-gray-600">
              Connect with verified local talent and grow your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: FiMapPin, title: "Location-Based", desc: "Find talent in your city for in-person collaboration" },
              { icon: FiShield, title: "Verified Profiles", desc: "Government ID and skill verification for trust" },
              { icon: FiUsers, title: "Community Trust", desc: "Peer-endorsed ratings and reputation scores" },
              { icon: FiTrendingUp, title: "Fair Pricing", desc: "Transparent rates with local market insights" },
            ].map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-700 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to find local talent?
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            Join thousands of freelancers and clients in your region
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button className="bg-white text-blue-600 font-semibold px-8 py-6 text-base hover:bg-gray-100 rounded-full">
                Sign Up Free
              </Button>
            </Link>
            <Link to="/browse">
              <Button variant="outline" className="border-2 border-white text-white font-semibold px-8 py-6 text-base hover:bg-blue-600 rounded-full">
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
