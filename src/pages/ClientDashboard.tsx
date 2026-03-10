import { FiTrendingUp, FiDollarSign, FiUsers, FiClock } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";

const ClientDashboard = () => {
  const stats = [
    { label: "Active Jobs", value: "5", icon: FiUsers, color: "blue" },
    { label: "Total Spent", value: "₹2,45,000", icon: FiDollarSign, color: "green" },
    { label: "Avg Response Time", value: "< 2h", icon: FiClock, color: "purple" },
    { label: "Success Rate", value: "96%", icon: FiTrendingUp, color: "yellow" },
  ];

  const activeJobs = [
    { id: 1, title: "Website Redesign", freelancer: "Priya Sharma", status: "In Progress", proposals: 12, budget: "₹25,000" },
    { id: 2, title: "Video Editing", freelancer: "Rahul Verma", status: "Review", proposals: 8, budget: "₹15,000" },
  ];

  return (
    <Layout>
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Dashboard</h1>
              <p className="text-gray-600">Manage your projects</p>
            </div>
            <Link to="/post-job">
              <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-full">
                Post New Job
              </Button>
            </Link>
          </div>

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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Active Jobs</h2>
            <div className="space-y-4">
              {activeJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                    <p className="text-sm text-gray-600">Assigned to: {job.freelancer}</p>
                    <p className="text-xs text-gray-500 mt-1">{job.proposals} proposals received</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{job.budget}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      job.status === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
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

export default ClientDashboard;
