import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FiMapPin, FiDollarSign, FiClock, FiUsers, FiCalendar, FiCheckCircle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";

interface JobData {
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
    maxAmount?: number;
    currency: string;
  };
  remoteAllowed: boolean;
  duration: string;
  experienceLevel: string;
  status: string;
  createdAt: string;
  clientId: {
    _id: string;
    name: string;
  };
  proposals?: Array<{ _id: string }>;
  proposalsCount?: number;
}

const JobDetail = () => {
  const { id } = useParams();
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJobDetail();
  }, [id]);

  const fetchJobDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.getJob(id!);
      if (response.data) {
        setJob(((response.data as any).job || response.data) as JobData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch job details");
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = () => {
    if (!job) return "";
    const { budget } = job;
    const minAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: budget.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(budget.amount);
    
    if (budget.maxAmount) {
      const maxAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: budget.currency || 'INR',
        maximumFractionDigits: 0,
      }).format(budget.maxAmount);
      return `${minAmount} - ${maxAmount}`;
    }
    
    return budget.type === 'hourly' ? `${minAmount}/hr` : minAmount;
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
    return new Date(date).toLocaleDateString();
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

  if (error || !job) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center">
            <p className="text-red-600">{error || "Job not found"}</p>
            <Link to="/jobs" className="text-blue-600 hover:underline mt-4 inline-block">← Back to Jobs</Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="mb-6">
            <Link to="/jobs" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              ← Back to Jobs
            </Link>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{job.title}</h1>
              <p className="text-lg text-gray-600">Posted by {job.clientId?.name || 'Anonymous Client'}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <FiMapPin className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Location</p>
                  <p className="font-semibold text-gray-900">
                    {job.location.city}, {job.location.state}
                    {job.remoteAllowed && <span className="text-green-600 text-xs ml-1">(Remote)</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FiDollarSign className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Budget</p>
                  <p className="font-semibold text-gray-900">{formatBudget()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FiClock className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Posted</p>
                  <p className="font-semibold text-gray-900">{getTimeAgo(job.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FiUsers className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Proposals</p>
                  <p className="font-semibold text-gray-900">{job.proposalsCount || job.proposals?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Job Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{job.description}</p>
            </div>

            {job.experienceLevel && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Experience Level</h2>
                <span className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium capitalize">
                  {job.experienceLevel}
                </span>
              </div>
            )}

            {job.duration && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Project Duration</h2>
                <div className="flex items-center gap-2">
                  <FiCalendar className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-700">{job.duration}</span>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span key={skill} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1 bg-blue-600 text-white hover:bg-blue-700 rounded-full py-6 text-base font-semibold">
                Submit Proposal
              </Button>
              <Button variant="outline" className="border-2 border-gray-300 rounded-full px-8">
                Save Job
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default JobDetail;
