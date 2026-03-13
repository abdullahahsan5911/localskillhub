import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FiMapPin, FiDollarSign, FiClock, FiUsers, FiCalendar, FiCheckCircle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

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
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposalError, setProposalError] = useState("");
  const [proposalSuccess, setProposalSuccess] = useState("");
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    coverLetter: "",
    amount: "",
    type: "fixed",
    durationValue: "",
    durationUnit: "weeks",
  });

  useEffect(() => {
    fetchJobDetail();
  }, [id]);

  useEffect(() => {
    const checkExistingProposal = async () => {
      if (!id || !isAuthenticated || !user || (user.role !== "freelancer" && user.role !== "both")) {
        return;
      }

      try {
        const response = await api.getProposals(id);
        const proposals = ((response.data as any)?.proposals || []) as Array<{ _id: string }>;
        setAlreadyApplied(proposals.length > 0);
      } catch {
        // Silently skip; page should still be usable.
      }
    };

    checkExistingProposal();
  }, [id, isAuthenticated, user]);

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

  const handleProposalChange = (field: string, value: string) => {
    setProposalForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleStartProposal = () => {
    setProposalError("");
    setProposalSuccess("");

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!user || (user.role !== "freelancer" && user.role !== "both")) {
      setProposalError("Only freelancers can submit proposals.");
      return;
    }

    if (job?.status !== "open") {
      setProposalError("This job is no longer accepting proposals.");
      return;
    }

    if (alreadyApplied) {
      setProposalError("You have already submitted a proposal for this job.");
      return;
    }

    setProposalForm((prev) => ({
      ...prev,
      type: job?.budget?.type === "hourly" ? "hourly" : "fixed",
      amount: prev.amount || String(job?.budget?.amount || ""),
    }));
    setProposalOpen(true);
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job?._id) return;

    setProposalError("");
    setProposalSuccess("");

    const amount = Number(proposalForm.amount);
    const durationValue = Number(proposalForm.durationValue);

    if (!proposalForm.coverLetter.trim() || proposalForm.coverLetter.trim().length < 30) {
      setProposalError("Cover letter must be at least 30 characters.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setProposalError("Please enter a valid proposed amount.");
      return;
    }

    if (!Number.isFinite(durationValue) || durationValue <= 0) {
      setProposalError("Please enter a valid estimated duration.");
      return;
    }

    try {
      setProposalLoading(true);
      await api.createProposal({
        jobId: job._id,
        coverLetter: proposalForm.coverLetter.trim(),
        proposedRate: {
          amount,
          type: proposalForm.type,
          currency: job.budget?.currency || "INR",
        },
        estimatedDuration: {
          value: durationValue,
          unit: proposalForm.durationUnit,
        },
      });

      setAlreadyApplied(true);
      setProposalOpen(false);
      setProposalSuccess("Proposal submitted successfully.");
    } catch (err: any) {
      setProposalError(err?.message || "Failed to submit proposal. Please try again.");
    } finally {
      setProposalLoading(false);
    }
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
              <Button
                type="button"
                onClick={handleStartProposal}
                disabled={alreadyApplied || job.status !== "open"}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700 rounded-full py-6 text-base font-semibold disabled:bg-gray-300 disabled:text-gray-600"
              >
                {alreadyApplied ? "Proposal Submitted" : "Submit Proposal"}
              </Button>
              <Button variant="outline" className="border-2 border-gray-300 rounded-full px-8">
                Save Job
              </Button>
            </div>

            {proposalSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm">
                <FiCheckCircle className="h-4 w-4" />
                <span>{proposalSuccess}</span>
              </div>
            )}

            {proposalError && !proposalOpen && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
                {proposalError}
              </div>
            )}

            {proposalOpen && (
              <form onSubmit={handleSubmitProposal} className="mt-6 rounded-xl border border-gray-200 p-5 space-y-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Submit Your Proposal</h3>

                {proposalError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
                    {proposalError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter</label>
                  <textarea
                    value={proposalForm.coverLetter}
                    onChange={(e) => handleProposalChange("coverLetter", e.target.value)}
                    rows={6}
                    placeholder="Describe why you're the right fit for this job..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rate Type</label>
                    <select
                      value={proposalForm.type}
                      onChange={(e) => handleProposalChange("type", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="hourly">Hourly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount ({job.budget.currency || "INR"})</label>
                    <input
                      type="number"
                      min="1"
                      value={proposalForm.amount}
                      onChange={(e) => handleProposalChange("amount", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration Value</label>
                    <input
                      type="number"
                      min="1"
                      value={proposalForm.durationValue}
                      onChange={(e) => handleProposalChange("durationValue", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration Unit</label>
                  <select
                    value={proposalForm.durationUnit}
                    onChange={(e) => handleProposalChange("durationUnit", e.target.value)}
                    className="w-full md:w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={proposalLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {proposalLoading ? "Submitting..." : "Send Proposal"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setProposalOpen(false);
                      setProposalError("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default JobDetail;
