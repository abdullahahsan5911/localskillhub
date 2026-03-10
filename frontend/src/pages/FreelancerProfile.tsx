import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiStar, FiMapPin, FiShield, FiAward, FiHeart, FiShare2, FiMail } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

import avatar1 from "@/assets/avatars/avatar-1.jpg";
import webDesignImg from "@/assets/categories/web-design.jpg";
import graphicDesignImg from "@/assets/categories/graphic-design.jpg";
import photographyImg from "@/assets/categories/photography.jpg";

const FreelancerProfile = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("work");

  const freelancer = {
    name: "Priya Sharma",
    title: "UI/UX Designer & Brand Strategist",
    avatar: avatar1,
    city: "Mumbai",
    rating: 4.9,
    reviews: 47,
    verified: true,
    localScore: 96,
    rate: "₹2,500/hr",
    completedJobs: 132,
    bio: "Award-winning UI/UX designer with 8+ years of experience creating beautiful, user-centered digital products.",
    portfolio: [
      { id: 1, title: "E-commerce Mobile App", likes: 234, image: webDesignImg },
      { id: 2, title: "SaaS Dashboard Redesign", likes: 189, image: graphicDesignImg },
      { id: 3, title: "Brand Identity System", likes: 412, image: photographyImg },
    ],
  };

  return (
    <Layout>
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-20">
                <img src={freelancer.avatar} alt={freelancer.name} className="w-32 h-32 rounded-2xl mx-auto mb-4" />
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold">{freelancer.name}</h1>
                    {freelancer.verified && <FiShield className="h-6 w-6 text-blue-600" />}
                  </div>
                  <p className="text-gray-600">{freelancer.title}</p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <FiStar className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{freelancer.rating}</span>
                    <span className="text-sm text-gray-600">({freelancer.reviews})</span>
                  </div>
                </div>
                <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 rounded-full py-6">
                  <FiMail className="mr-2" /> Contact
                </Button>
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="grid grid-cols-2 gap-4">
                {freelancer.portfolio.map((work) => (
                  <div key={work.id} className="group cursor-pointer">
                    <div className="relative overflow-hidden rounded-xl bg-gray-100 aspect-[4/3] mb-3">
                      <img src={work.image} alt={work.title} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-semibold">{work.title}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FreelancerProfile;
