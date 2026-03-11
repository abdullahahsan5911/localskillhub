import { useState, useEffect } from "react";
import { FiTrendingUp, FiDollarSign, FiUsers, FiClock } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

interface Analytics {
  activeJobs: number;
  totalSpent: number;
  averageResponseTime: string;
  successRate: number;
}

interface Job {
  _id: string;
  title: string;
  status: string;
  budget: {
    amount: number;
    currency: string;
  };
  proposalsCount?: number;
}

const ClientDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch analytics
      const analyticsRes = await api.getClientAnalytics();
      if (analyticsRes.data) {
        setAnalytics(analyticsRes.data as any);
      }
      
      // Fetch jobs
      const jobsRes = await api.getJobs();
      if (jobsRes.data) {
        const jobsData = Array.isArray(jobsRes.data) ? jobsRes.data : (jobsRes.data as any).jobs || [];
        setJobs(jobsData.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { 
      label: "Active Jobs", 
      value: analytics?.activeJobs?.toString() || "0", 
      icon: FiUsers, 
      color: "blue" 
    },
    { 
      label: "Total Spent", 
      value: analytics?.totalSpent ? `₹${analytics.totalSpent.toLocaleString()}` : "₹0", 
      icon: FiDollarSign, 
      color: "green" 
    },
    { 
      label: "Avg Response Time", 
      value: analytics?.averageResponseTime || "N/A", 
      icon: FiClock, 
      color: "purple" 
    },
    { 
      label: "Success Rate", 
      value: analytics?.successRate ? `${analytics.successRate}%` : "0%", 
      icon: FiTrendingUp, 
      color: "yellow" 
    },
  ];

  return (
    <Layout>
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name || 'Client'}!</p>
            </div>
            <Link to="/post-job">
              <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-full">
                Post New Job
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-xl bg-${stat.color}-50`}>
                        <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Active Jobs */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Your Jobs</h2>
                {jobs.length > 0 ? (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <Link 
                        key={job._id} 
                        to={`/jobs/${job._id}`}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">{job.proposalsCount || 0} proposals received</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {job.budget?.currency || '₹'}{job.budget?.amount?.toLocaleString() || '0'}
                            </p>
                          </div>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${
                            job.status === "active" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                          }`}>
                            {job.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No jobs posted yet</p>
                    <Link to="/post-job">
                      <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-full">
                        Post Your First Job
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ClientDashboard;
