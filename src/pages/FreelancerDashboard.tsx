import { FiTrendingUp, FiDollarSign, FiEye, FiUsers, FiStar, FiCheckCircle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

const FreelancerDashboard = () => {
  const stats = [
    { label: "Profile Views", value: "1,234", icon: FiEye, change: "+12%", color: "blue" },
    { label: "Active Proposals", value: "8", icon: FiUsers, change: "+3", color: "purple" },
    { label: "Total Earnings", value: "₹1,45,000", icon: FiDollarSign, change: "+₹25k", color: "green" },
    { label: "Avg Rating", value: "4.9", icon: FiStar, change: "+0.2", color: "yellow" },
  ];

  const recentJobs = [
    { id: 1, title: "Website Redesign", client: "FoodieHub", status: "In Progress", budget: "₹25,000", deadline: "Mar 20" },
    { id: 2, title: "Logo Design", client: "StartupXYZ", status: "Completed", budget: "₹8,000", deadline: "Mar 10" },
    { id: 3, title: "App UI Design", client: "TechCorp", status: "Pending", budget: "₹35,000", deadline: "Mar 25" },
  ];

  return (
    <Layout>
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Freelancer Dashboard</h1>
              <p className="text-gray-600">Welcome back, Priya!</p>
            </div>
            <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-full">
              Edit Profile
            </Button>
          </div>

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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Jobs</h2>
            <div className="space-y-4">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.client}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{job.budget}</p>
                      <p className="text-xs text-gray-600">Due: {job.deadline}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      job.status === "Completed" ? "bg-green-100 text-green-700" :
                      job.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FreelancerDashboard;
