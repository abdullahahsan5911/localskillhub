import { useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiMapPin, FiStar, FiShield, FiFilter, FiGrid, FiList } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

import avatar1 from "@/assets/avatars/avatar-1.jpg";
import avatar2 from "@/assets/avatars/avatar-2.jpg";
import avatar3 from "@/assets/avatars/avatar-3.jpg";
import avatar4 from "@/assets/avatars/avatar-4.jpg";
import avatar5 from "@/assets/avatars/avatar-5.jpg";
import avatar6 from "@/assets/avatars/avatar-6.jpg";
import avatar7 from "@/assets/avatars/avatar-7.jpg";
import avatar8 from "@/assets/avatars/avatar-8.jpg";

import webDesignImg from "@/assets/categories/web-design.jpg";
import graphicDesignImg from "@/assets/categories/graphic-design.jpg";
import photographyImg from "@/assets/categories/photography.jpg";
import videoProductionImg from "@/assets/categories/video-production.jpg";

const skills = ["All", "Web Development", "Graphic Design", "Video Production", "Digital Marketing", "Photography", "Content Writing", "Mobile Dev", "Data Science"];

const mockFreelancers = [
  { 
    id: 1, 
    name: "Priya Sharma", 
    skill: "UI/UX Designer", 
    city: "Mumbai", 
    rating: 4.9, 
    reviews: 47, 
    verified: true, 
    rate: "₹2,500/hr", 
    localScore: 96, 
    tags: ["Figma", "Adobe XD", "Prototyping"], 
    availability: "Available Now", 
    avatar: avatar1,
    portfolio: [webDesignImg, graphicDesignImg, photographyImg]
  },
  { 
    id: 2, 
    name: "Arjun Patel", 
    skill: "Full Stack Developer", 
    city: "Bangalore", 
    rating: 4.8, 
    reviews: 92, 
    verified: true, 
    rate: "₹3,000/hr", 
    localScore: 94, 
    tags: ["React", "Node.js", "MongoDB"], 
    availability: "Available Now", 
    avatar: avatar2,
    portfolio: [webDesignImg, graphicDesignImg]
  },
  { 
    id: 3, 
    name: "Sneha Gupta", 
    skill: "Content Writer", 
    city: "Delhi", 
    rating: 4.9, 
    reviews: 124, 
    verified: true, 
    rate: "₹1,200/hr", 
    localScore: 98, 
    tags: ["SEO", "Blog", "Copywriting"], 
    availability: "Busy until Mar 15", 
    avatar: avatar3,
    portfolio: [graphicDesignImg, webDesignImg, photographyImg]
  },
  { 
    id: 4, 
    name: "Rahul Verma", 
    skill: "Video Editor", 
    city: "Pune", 
    rating: 4.7, 
    reviews: 38, 
    verified: false, 
    rate: "₹1,800/hr", 
    localScore: 85, 
    tags: ["Premiere Pro", "After Effects", "Motion"], 
    availability: "Available Now", 
    avatar: avatar4,
    portfolio: [videoProductionImg, graphicDesignImg]
  },
  { 
    id: 5, 
    name: "Ananya Singh", 
    skill: "Graphic Designer", 
    city: "Hyderabad", 
    rating: 4.8, 
    reviews: 67, 
    verified: true, 
    rate: "₹2,000/hr", 
    localScore: 91, 
    tags: ["Branding", "Illustration", "Print"], 
    availability: "Available Now", 
    avatar: avatar5,
    portfolio: [graphicDesignImg, photographyImg, webDesignImg]
  },
  { 
    id: 6, 
    name: "Vikram Rao", 
    skill: "Digital Marketer", 
    city: "Chennai", 
    rating: 4.6, 
    reviews: 53, 
    verified: true, 
    rate: "₹2,200/hr", 
    localScore: 88, 
    tags: ["Google Ads", "Meta Ads", "Analytics"], 
    availability: "Available Now", 
    avatar: avatar6,
    portfolio: [graphicDesignImg, webDesignImg]
  },
  { 
    id: 7, 
    name: "Meera Joshi", 
    skill: "Photographer", 
    city: "Jaipur", 
    rating: 4.9, 
    reviews: 89, 
    verified: true, 
    rate: "₹3,500/hr", 
    localScore: 97, 
    tags: ["Wedding", "Portrait", "Product"], 
    availability: "Busy until Mar 20", 
    avatar: avatar7,
    portfolio: [photographyImg, webDesignImg, graphicDesignImg]
  },
  { 
    id: 8, 
    name: "Karan Mehta", 
    skill: "Mobile Developer", 
    city: "Ahmedabad", 
    rating: 4.7, 
    reviews: 41, 
    verified: false, 
    rate: "₹2,800/hr", 
    localScore: 82, 
    tags: ["React Native", "Flutter", "iOS"], 
    availability: "Available Now", 
    avatar: avatar8,
    portfolio: [webDesignImg, graphicDesignImg, photographyImg]
  },
];

const BrowseFreelancers = () => {
  const [activeSkill, setActiveSkill] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <Layout>
      {/* Header */}
      <section className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium mb-5">
              <FiShield className="h-3.5 w-3.5" />
              {mockFreelancers.length} verified professionals near you
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
              <Button className="bg-blue-600 text-white font-semibold px-8 h-12 hover:bg-blue-700 transition-all duration-200 rounded-xl">
                Search
              </Button>
            </div>
          </div>

          {/* Skill Pills */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 scrollbar-hide">
            {skills.map((skill) => (
              <button
                key={skill}
                onClick={() => setActiveSkill(skill)}
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
            <span className="text-sm text-gray-600">{mockFreelancers.length} freelancers</span>
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

          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockFreelancers.map((freelancer) => (
                <Link 
                  key={freelancer.id} 
                  to={`/profile/${freelancer.id}`}
                  className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Portfolio Preview */}
                  <div className="grid grid-cols-3 gap-1 bg-gray-100 aspect-[3/2]">
                    {freelancer.portfolio.map((img, idx) => (
                      <div key={idx} className={`${idx === 0 ? 'col-span-2 row-span-2' : ''} overflow-hidden`}>
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <img
                        src={freelancer.avatar}
                        alt={freelancer.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{freelancer.name}</h3>
                          {freelancer.verified && (
                            <FiShield className="h-4 w-4 text-blue-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{freelancer.skill}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <FiMapPin className="h-4 w-4" />
                        <span>{freelancer.city}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiStar className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium text-gray-900">{freelancer.rating}</span>
                        <span className="text-gray-500">({freelancer.reviews})</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {freelancer.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-sm font-semibold text-gray-900">{freelancer.rate}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        freelancer.availability === "Available Now"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {freelancer.availability}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="space-y-4">
              {mockFreelancers.map((freelancer) => (
                <Link 
                  key={freelancer.id} 
                  to={`/profile/${freelancer.id}`}
                  className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 flex gap-6"
                >
                  <img
                    src={freelancer.avatar}
                    alt={freelancer.name}
                    className="w-20 h-20 rounded-xl object-cover border-2 border-gray-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900">{freelancer.name}</h3>
                      {freelancer.verified && (
                        <FiShield className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{freelancer.skill}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <FiMapPin className="h-4 w-4" />
                        <span>{freelancer.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FiStar className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium text-gray-900">{freelancer.rating}</span>
                        <span>({freelancer.reviews} reviews)</span>
                      </div>
                      <span className="font-semibold text-gray-900">{freelancer.rate}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {freelancer.tags.map((tag) => (
                        <span key={tag} className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col justify-between items-end shrink-0">
                    <span className={`text-xs px-3 py-1.5 rounded-full ${
                      freelancer.availability === "Available Now"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}>
                      {freelancer.availability}
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
