import { useState, useEffect } from "react";
import { FiTrendingUp, FiDollarSign, FiEye, FiUsers, FiStar, FiCheckCircle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

interface Analytics {
  profileViews: number;
  activeProposals: number;
  totalEarnings: number;
  averageRating: number;
  completedJobs: number;
}

interface Contract {
  _id: string;
  jobId: {
    title: string;
    budget: {
      amount: number;
      currency: string;
    };
  };
  clientId: {
    name: string;
  };
  status: string;
  deadline: string;
}

const FreelancerDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch analytics
      const analyticsRes = await api.getFreelancerAnalytics();
      if (analyticsRes.data) {
        setAnalytics(analyticsRes.data as any);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { 
      label: "Profile Views", 
      value: analytics?.profileViews?.toLocaleString() || "0", 
      icon: FiEye, 
      change: "+12%", 
      color: "blue" 
    },
    { 
      label: "Active Proposals", 
      value: analytics?.activeProposals?.toString() || "0", 
      icon: FiUsers, 
      change: "+3", 
      color: "purple" 
    },
    { 
      label: "Total Earnings", 
      value: analytics?.totalEarnings ? `₹${analytics.totalEarnings.toLocaleString()}` : "₹0", 
      icon: FiDollarSign, 
      change: "+25k", 
      color: "green" 
    },
    { 
      label: "Avg Rating", 
      value: analytics?.averageRating?.toFixed(1) || "0.0", 
      icon: FiStar, 
      change: "+0.2", 
      color: "yellow" 
    },
  ];

  return (
    <Layout>
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Freelancer Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.name || 'Freelancer'}!</p>
            </div>
            <Link to={`/profile/${user?._id}`}>
              <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-full">
                View Profile
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
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${stat.color}-50`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                  <span className="text-sm font-medium text-green-600">{stat.change}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Recent Jobs */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Contracts</h2>
            {contracts.length > 0 ? (
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <div key={contract._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <h3 className="font-semibold text-gray-900">{contract.jobId?.title || 'Untitled Job'}</h3>
                      <p className="text-sm text-gray-600">{contract.clientId?.name || 'Anonymous Client'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {contract.jobId?.budget?.currency || '₹'}
                          {contract.jobId?.budget?.amount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-gray-600">Due: {new Date(contract.deadline).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        contract.status === "completed" ? "bg-green-100 text-green-700" :
                        contract.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                        "bg-orange-100 text-orange-700"
                      }`}>
                        {contract.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No contracts yet. Start bidding on jobs!</p>
            )}
          </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default FreelancerDashboard;
