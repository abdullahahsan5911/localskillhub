import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiSearch, FiMapPin, FiClock, FiDollarSign } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  location: {
    city: string;
    state: string;
    country: string;
  };
  budget: {
    type: string;
    amount: number;
    currency: string;
  };
  remoteAllowed: boolean;
  createdAt: string;
  clientId: {
    name: string;
  };
}

const Jobs = () => {
  const [urlParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || "");
  const [locationQuery, setLocationQuery] = useState(urlParams.get('location') || "");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async (search?: string, city?: string) => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (city) params.city = city;
      
      const response = await api.getJobs(params);
      if (response.data && Array.isArray(response.data)) {
        setJobs(response.data);
      } else if (response.data && (response.data as any).jobs) {
        setJobs((response.data as any).jobs);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchJobs(searchQuery, locationQuery);
  };

  const formatBudget = (job: Job) => {
    const { budget } = job;
    const amount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: budget.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(budget.amount);
    
    return budget.type === 'hourly' ? `${amount}/hr` : amount;
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <Layout>
      <section className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Find Local Jobs</h1>
          <p className="text-lg text-gray-600 mb-8">Browse opportunities in your region</p>
          
          <div className="bg-white border border-gray-300 rounded-2xl p-2 max-w-3xl shadow-sm">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50">
                <FiSearch className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  className="bg-transparent w-full outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50">
                <FiMapPin className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="City or location..."
                  className="bg-transparent w-full outline-none"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch}
                className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-8"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading jobs...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {!loading && jobs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No jobs found. Try adjusting your search.</p>
            </div>
          )}

          <div className="space-y-4">
            {jobs.map((job) => (
              <Link
                key={job._id}
                to={`/jobs/${job._id}`}
                className="block bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                    <p className="text-gray-600">{job.clientId?.name || 'Anonymous Client'}</p>
                  </div>
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full capitalize">{job.budget.type}</span>
                </div>
                
                <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1.5">
                    <FiMapPin className="h-4 w-4" />
                    <span>{job.location.city}, {job.location.state}</span>
                    {job.remoteAllowed && <span className="text-green-600">(Remote OK)</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiDollarSign className="h-4 w-4" />
                    <span className="font-semibold text-gray-900">{formatBudget(job)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FiClock className="h-4 w-4" />
                    <span>{getTimeAgo(job.createdAt)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{skill}</span>
                  ))}
                </div>

                <div className="text-sm text-gray-600">{job.description.slice(0, 150)}...</div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" className="border-2 border-gray-300 px-8 py-6 rounded-full">Load More Jobs</Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Jobs;
