import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { FiStar, FiMapPin, FiShield, FiAward, FiHeart, FiShare2, FiMail, FiCheckCircle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";

interface FreelancerData {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
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
  completedJobs: number;
  availability: {
    status: string;
  };
  portfolio: Array<{
    _id: string;
    title: string;
    description: string;
    imageUrl: string;
    tags: string[];
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
}

const FreelancerProfile = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("work");
  const [freelancer, setFreelancer] = useState<FreelancerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFreelancerProfile();
  }, [id]);

  const fetchFreelancerProfile = async () => {
    try {
      setLoading(true);
      const response = await api.getFreelancer(id!);
      if (response.data) {
        setFreelancer(response.data as any);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch freelancer profile");
    } finally {
      setLoading(false);
    }
  };

  const formatRate = () => {
    if (!freelancer) return "";
    const { rates } = freelancer;
    const amount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: rates.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(rates.minRate);
    return rates.rateType === 'hourly' ? `${amount}/hr` : amount;
  };

  const getUserInitials = () => {
    if (!freelancer?.userId?.name) return "U";
    const names = freelancer.userId.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return freelancer.userId.name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !freelancer) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center">
            <p className="text-red-600">{error || "Freelancer not found"}</p>
            <Link to="/browse" className="text-blue-600 hover:underline mt-4 inline-block">← Back to Browse</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-20">
                {freelancer.userId.avatar ? (
                  <img src={freelancer.userId.avatar} alt={freelancer.userId.name} className="w-32 h-32 rounded-2xl mx-auto mb-4 object-cover" />
                ) : (
                  <div className="w-32 h-32 rounded-2xl mx-auto mb-4 bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                    {getUserInitials()}
                  </div>
                )}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold">{freelancer.userId.name}</h1>
                    {(freelancer.userId.isPhoneVerified || freelancer.userId.isEmailVerified) && <FiShield className="h-6 w-6 text-blue-600" />}
                  </div>
                  <p className="text-gray-600">{freelancer.title}</p>
                  <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-600">
                    <FiMapPin className="h-4 w-4" />
                    <span>{freelancer.userId.location.city}, {freelancer.userId.location.state}</span>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{freelancer.localScore || 0}</div>
                      <div className="text-xs text-gray-600">Local Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{freelancer.completedJobs || 0}</div>
                      <div className="text-xs text-gray-600">Jobs Done</div>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-2xl font-bold text-gray-900 text-center mb-2">{formatRate()}</p>
                  <span className={`block text-center px-3 py-1.5 rounded-full text-sm font-medium ${
                    freelancer.availability?.status === "available"
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}>
                    {freelancer.availability?.status === "available" ? "Available Now" : "Busy"}
                  </span>
                </div>
                <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 rounded-full py-6 mb-3">
                  <FiMail className="mr-2" /> Contact
                </Button>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {freelancer.skills?.slice(0, 6).map((skill, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  {freelancer.bio && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">About</h3>
                      <p className="text-sm text-gray-600">{freelancer.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="mb-6">
                <div className="flex gap-4 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab("work")}
                    className={`px-4 py-3 font-medium transition-colors ${
                      activeTab === "work"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Portfolio
                  </button>
                  <button
                    onClick={() => setActiveTab("about")}
                    className={`px-4 py-3 font-medium transition-colors ${
                      activeTab === "about"
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    About
                  </button>
                </div>
              </div>

              {activeTab === "work" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {freelancer.portfolio && freelancer.portfolio.length > 0 ? (
                    freelancer.portfolio.map((work) => (
                      <div key={work._id} className="group cursor-pointer">
                        <div className="relative overflow-hidden rounded-xl bg-gray-100 aspect-[4/3] mb-3">
                          <img 
                            src={work.imageUrl} 
                            alt={work.title} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                          />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{work.title}</h3>
                        {work.description && (
                          <p className="text-sm text-gray-600 mb-2">{work.description}</p>
                        )}
                        {work.tags && work.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {work.tags.map((tag, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-12 text-gray-500">
                      No portfolio items yet
                    </div>
                  )}
                </div>
              )}

              {activeTab === "about" && (
                <div className="space-y-6">
                  {freelancer.bio && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Bio</h3>
                      <p className="text-gray-700 leading-relaxed">{freelancer.bio}</p>
                    </div>
                  )}

                  {freelancer.experience && freelancer.experience.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Experience</h3>
                      <div className="space-y-4">
                        {freelancer.experience.map((exp, idx) => (
                          <div key={idx} className="border-l-2 border-blue-600 pl-4">
                            <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                            <p className="text-sm text-gray-600">{exp.company}</p>
                            <p className="text-xs text-gray-500">{exp.duration}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {freelancer.education && freelancer.education.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Education</h3>
                      <div className="space-y-4">
                        {freelancer.education.map((edu, idx) => (
                          <div key={idx} className="border-l-2 border-green-600 pl-4">
                            <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                            <p className="text-sm text-gray-600">{edu.institution}</p>
                            <p className="text-xs text-gray-500">{edu.year}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {freelancer.skills && freelancer.skills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">All Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {freelancer.skills.map((skill, idx) => (
                          <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                            {skill.name} • {skill.level}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FreelancerProfile;
