import { useState } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiMapPin, FiTrendingUp, FiUsers, FiShield, FiZap, FiStar, FiHeart } from "react-icons/fi";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

import webDesignImg from "@/assets/categories/web-design.jpg";
import graphicDesignImg from "@/assets/categories/graphic-design.jpg";
import videoProductionImg from "@/assets/categories/video-production.jpg";
import digitalMarketingImg from "@/assets/categories/digital-marketing.jpg";
import photographyImg from "@/assets/categories/photography.jpg";
import contentWritingImg from "@/assets/categories/content-writing.jpg";

import avatar1 from "@/assets/avatars/avatar-1.jpg";
import avatar2 from "@/assets/avatars/avatar-2.jpg";
import avatar3 from "@/assets/avatars/avatar-3.jpg";
import avatar4 from "@/assets/avatars/avatar-4.jpg";
import avatar5 from "@/assets/avatars/avatar-5.jpg";
import avatar6 from "@/assets/avatars/avatar-6.jpg";
import avatar7 from "@/assets/avatars/avatar-7.jpg";
import avatar8 from "@/assets/avatars/avatar-8.jpg";

const categories = [
  "All", "Web Development", "Graphic Design", "Video Production", 
  "Digital Marketing", "Photography", "Content Writing", "Mobile Apps"
];

const featuredWork = [
  { id: 1, title: "Brand Identity for Eco Startup", creator: "Priya Sharma", category: "Graphic Design", likes: 847, image: graphicDesignImg, avatar: avatar1, verified: true },
  { id: 2, title: "E-commerce Platform Redesign", creator: "Arjun Patel", category: "Web Development", likes: 1203, image: webDesignImg, avatar: avatar2, verified: true },
  { id: 3, title: "Wedding Photography Collection", creator: "Meera Joshi", category: "Photography", likes: 956, image: photographyImg, avatar: avatar7, verified: true },
  { id: 4, title: "Social Media Campaign", creator: "Vikram Rao", category: "Digital Marketing", likes: 623, image: digitalMarketingImg, avatar: avatar6, verified: true },
  { id: 5, title: "Product Demo Video", creator: "Rahul Verma", category: "Video Production", likes: 1134, image: videoProductionImg, avatar: avatar4, verified: false },
  { id: 6, title: "Blog Content Strategy", creator: "Sneha Gupta", category: "Content Writing", likes: 445, image: contentWritingImg, avatar: avatar3, verified: true },
  { id: 7, title: "Mobile App UI Design", creator: "Karan Mehta", category: "Mobile Apps", likes: 892, image: webDesignImg, avatar: avatar8, verified: true },
  { id: 8, title: "Restaurant Branding", creator: "Ananya Singh", category: "Graphic Design", likes: 731, image: graphicDesignImg, avatar: avatar5, verified: true },
  { id: 9, title: "Corporate Website", creator: "Priya Sharma", category: "Web Development", likes: 1045, image: webDesignImg, avatar: avatar1, verified: true },
  { id: 10, title: "Portrait Series", creator: "Meera Joshi", category: "Photography", likes: 1289, image: photographyImg, avatar: avatar7, verified: true },
  { id: 11, title: "Instagram Ads Campaign", creator: "Vikram Rao", category: "Digital Marketing", likes: 567, image: digitalMarketingImg, avatar: avatar6, verified: true },
  { id: 12, title: "Product Photography", creator: "Meera Joshi", category: "Photography", likes: 934, image: photographyImg, avatar: avatar7, verified: true },
];

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [liked, setLiked] = useState<number[]>([]);

  const toggleLike = (id: number) => {
    setLiked(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredWork = activeCategory === "All" 
    ? featuredWork 
    : featuredWork.filter(work => work.category === activeCategory);

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
              />
            </div>
            <div className="flex-1 flex items-center px-4 py-2 border-t md:border-t-0 md:border-l border-gray-200">
              <HiOutlineLocationMarker className="text-gray-400 mr-2 h-5 w-5" />
              <input
                type="text"
                placeholder="Location"
                className="w-full bg-transparent border-none focus:outline-none text-gray-900 placeholder-gray-400"
              />
            </div>
            <Button className="bg-blue-600 text-white font-semibold px-8 py-6 rounded-full hover:bg-blue-700">
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Filter */}
      <section className="bg-gray-50 border-y border-gray-200 py-6 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:border-blue-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Work Grid - Behance Style */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWork.map((work) => (
              <div key={work.id} className="group">
                <Link to={`/freelancer/${work.creator.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={work.image}
                        alt={work.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleLike(work.id);
                        }}
                        className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                      >
                        <FiHeart
                          className={`h-5 w-5 ${
                            liked.includes(work.id) ? "fill-red-500 text-red-500" : "text-gray-700"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {work.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <img
                          src={work.avatar}
                          alt={work.creator}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm text-gray-600">{work.creator}</span>
                        {work.verified && (
                          <FiShield className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">{work.category}</span>
                        <div className="flex items-center gap-1">
                          <FiHeart className="h-4 w-4" />
                          <span>{work.likes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
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
