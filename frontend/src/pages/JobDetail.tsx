import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FiMapPin, FiDollarSign, FiClock, FiUsers, FiCalendar, FiCheckCircle, FiDownload, FiFileText } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { JobStatusBadges } from "@/components/JobStatusBadges";
import Layout from "@/components/layout/Layout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { addGuestSavedJob, getGuestSavedJobs, removeGuestSavedJob } from "@/lib/guestStorage";
import Avatar from "@/components/Avatar";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency, DEFAULT_CURRENCY } from "@/lib/currency";

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
    avatar?: string;
  };
  proposals?: Array<{ _id: string }>;
  proposalsCount?: number;
  attachments?: Array<{
    filename?: string;
    url: string;
    uploadedAt?: string;
  }>;
}

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser, updateUser } = useAuth();

  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaved, setIsSaved] = useState(false);

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
  const isClient = !!user && user.role === "client";

  const fetchJobDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.getJob(id!);
      if (response.data) {
        setJob(((response.data as any).job || response.data) as JobData);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchJobDetail();
    }
  }, [id]);

  useEffect(() => {
    if (!job?._id) return;

    if (isAuthenticated && user) {
      const rawSaved = (user as any)?.savedJobs || [];
      const savedJobIds: string[] = (Array.isArray(rawSaved) ? rawSaved : [])
        .map((entry: any) => (typeof entry === "string" ? entry : entry?._id))
        .filter((id: any): id is string => typeof id === "string" && id.length > 0);
      setIsSaved(savedJobIds.includes(job._id));
    } else {
      const guestSaved = getGuestSavedJobs();
      setIsSaved(guestSaved.includes(job._id));
    }
  }, [job?._id, isAuthenticated, user]);

  useEffect(() => {
    const checkExistingProposal = async () => {
      if (!id || !isAuthenticated || !user || user.role !== "freelancer") {
        return;
      }

      try {
        const response = await api.getProposals(id);
        const proposals = ((response.data as any)?.proposals || []) as Array<{ _id: string }>;
        setAlreadyApplied(proposals.length > 0);
      } catch {
        // Silently ignore; page should remain usable.
      }
    };

    checkExistingProposal();
  }, [id, isAuthenticated, user]);

  const formatBudget = () => {
    if (!job) return "";
    const { budget } = job;
    const minAmount = formatCurrency(budget.amount, budget.currency);

    if (budget.maxAmount) {
      const maxAmount = formatCurrency(budget.maxAmount, budget.currency);
      return `${minAmount} - ${maxAmount}`;
    }

    return budget.type === "hourly" ? `${minAmount}/hr` : minAmount;
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
    return new Date(date).toLocaleDateString();
  };

  const getDownloadUrl = (url: string) => {
    if (!url) return "#";
    return url.includes('/upload/') ? url.replace('/upload/', '/upload/fl_attachment/') : url;
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

    if (!user || user.role !== "freelancer") {
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

  const handleSaveJob = async () => {
    if (!job?._id) return;

    if (!isAuthenticated) {
      if (isSaved) {
        removeGuestSavedJob(job._id);
        setIsSaved(false);
        toast({
          title: "Removed from saved jobs",
          description: "This job has been removed from your device.",
        });
      } else {
        addGuestSavedJob(job._id);
        setIsSaved(true);
        toast({
          title: "Job saved for later",
          description: "Log in or sign up to keep it on your dashboard.",
        });
      }
      return;
    }

    try {
      if (isSaved) {
        await api.unbookmarkJob(job._id);
        if (user) {
          const rawSaved = (user as any)?.savedJobs || [];
          const currentIds: string[] = (Array.isArray(rawSaved) ? rawSaved : [])
            .map((entry: any) => (typeof entry === "string" ? entry : entry?._id))
            .filter((id: any): id is string => typeof id === "string" && id.length > 0);
          const nextIds = currentIds.filter((id) => id !== job._id);
          updateUser({ savedJobs: nextIds as any });
        }
        setIsSaved(false);
        await refreshUser();
        toast({
          title: "Removed from Saved",
          description: "This job was removed from your Saved tab.",
        });
      } else {
        await api.bookmarkJob(job._id);
        if (user) {
          const rawSaved = (user as any)?.savedJobs || [];
          const currentIds: string[] = (Array.isArray(rawSaved) ? rawSaved : [])
            .map((entry: any) => (typeof entry === "string" ? entry : entry?._id))
            .filter((id: any): id is string => typeof id === "string" && id.length > 0);
          const nextIds = currentIds.includes(job._id) ? currentIds : [...currentIds, job._id];
          updateUser({ savedJobs: nextIds as any });
        }
        setIsSaved(true);
        await refreshUser();
        toast({
          title: "Job saved",
          description: "This job is now in your Saved tab.",
        });
      }
    } catch (err) {
      console.error("Failed to bookmark job", err);
      toast({
        title: isSaved ? "Could not update saved job" : "Could not save job",
        description: "Please try again.",
        variant: "destructive",
      });
    }
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
          currency: job.budget?.currency || DEFAULT_CURRENCY,
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
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }

  if (error || !job) {
    return (
      <Layout>
        <div className="w-full px-4 py-12 sm:px-6">
          <div className="text-center">
            <p className="text-red-600">{error || "Job not found"}</p>
            <Link to="/jobs" className="mt-4 inline-block text-blue-600 hover:underline">
              ← Back to Jobs
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-slate-50">
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-10 md:py-12">
          <div className="mb-4 sm:mb-6">
            <Link
              to="/jobs"
              className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              <span className="mr-1">←</span>
              Back to Jobs
            </Link>
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <div className="mb-4 sm:mb-6">
              <h1 className="mb-2 text-xl sm:mb-3 sm:text-2xl md:text-3xl font-bold text-slate-900">{job.title}</h1>
              <Avatar
                src={job.clientId?.avatar}
                name={job.clientId?.name || "Client"}
                size={48}
              />
              <p className="text-sm text-slate-600 sm:text-base">
                Posted by {job.clientId?.name || "Anonymous Client"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    job.status === "open"
                      ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                      : "border border-amber-100 bg-amber-50 text-amber-700"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {job.status === "open" ? "Open to proposals" : job.status}
                </span>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {job.category}
                </span>
                <span className="text-xs text-slate-500">Posted {getTimeAgo(job.createdAt)}</span>
              </div>

              {/* Job Status Badges - Flagged, Featured, Deleted */}
              <div className="mt-3">
                <JobStatusBadges job={job} />
              </div>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-4 sm:gap-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                  <FiMapPin className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Location</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {job.location.city}, {job.location.state}
                    {job.remoteAllowed && (
                      <span className="ml-1 inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        Remote
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                  <FiDollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Budget</p>
                  <p className="text-sm font-semibold text-slate-900">{formatBudget()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                  <FiClock className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Posted</p>
                  <p className="text-sm font-semibold text-slate-900">{getTimeAgo(job.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                  <FiUsers className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Proposals</p>
                  <p className="text-sm font-semibold text-slate-900">{job.proposalsCount || job.proposals?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 sm:text-xl">Job Description</h2>
              <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line sm:text-base">{job.description}</p>
            </div>

            {job.experienceLevel && (
              <div className="mb-8">
                <h2 className="mb-3 text-lg font-semibold text-slate-900 sm:text-xl">Experience Level</h2>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 capitalize">
                  {job.experienceLevel}
                </span>
              </div>
            )}

            {job.duration && (
              <div className="mb-8">
                <h2 className="mb-3 text-lg font-semibold text-slate-900 sm:text-xl">Project Duration</h2>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <FiCalendar className="h-5 w-5 text-slate-500" />
                  <span>{job.duration}</span>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 sm:text-xl">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-700 sm:text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {job.attachments && job.attachments.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 text-lg font-semibold text-slate-900 sm:text-xl">Project Documents</h2>
                <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:p-4">
                  {job.attachments.map((file, index) => (
                    <div key={`${file.url}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5 border border-slate-100">
                      <div className="min-w-0 flex items-center gap-2">
                        <FiFileText className="h-4 w-4 text-slate-500" />
                        <span className="truncate text-sm text-slate-800 font-medium">{file.filename || `Document ${index + 1}`}</span>
                      </div>
                      <a
                        href={getDownloadUrl(file.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <FiDownload className="h-3.5 w-3.5" />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isClient && (
              <>
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      onClick={handleStartProposal}
                      disabled={alreadyApplied || job.status !== "open"}
                      className="flex-1 rounded-full bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 sm:py-4 sm:text-base disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      {alreadyApplied ? "Proposal Submitted" : "Submit Proposal"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSaveJob}
                      className={`rounded-full border-2 px-6 text-sm font-semibold sm:px-8 ${
                        isSaved
                          ? "border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {isSaved ? "Saved" : "Save Job"}
                    </Button>
                  </div>
                </div>

                {proposalSuccess && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    <FiCheckCircle className="h-4 w-4" />
                    <span>{proposalSuccess}</span>
                  </div>
                )}

                {proposalError && !proposalOpen && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {proposalError}
                  </div>
                )}
  
                {proposalOpen && (
                  <form
                    onSubmit={handleSubmitProposal}
                    className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6"
                  >
                    <h3 className="text-base font-semibold text-slate-900 sm:text-lg">Submit Your Proposal</h3>

                    {proposalError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {proposalError}
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Cover Letter</label>
                      <textarea
                        value={proposalForm.coverLetter}
                        onChange={(e) => handleProposalChange("coverLetter", e.target.value)}
                        rows={6}
                        placeholder="Describe why you're the right fit for this job..."
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Rate Type</label>
                        <select
                          value={proposalForm.type}
                          onChange={(e) => handleProposalChange("type", e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="fixed">Fixed</option>
                          <option value="hourly">Hourly</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Amount ({job.budget.currency || DEFAULT_CURRENCY})
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={proposalForm.amount}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleProposalChange("amount", val === "" ? "" : String(Math.max(1, Number(val))));
                          }}
                          onWheel={e => e.currentTarget.blur()}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-outer-spin-button]:[appearance:none] [&::-webkit-inner-spin-button]:[appearance:none]"
                          step="any"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Duration Value</label>
                        <input
                          type="number"
                          min="1"
                          value={proposalForm.durationValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleProposalChange("durationValue", val === "" ? "" : String(Math.max(1, Number(val))));
                          }}
                          onWheel={e => e.currentTarget.blur()}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-outer-spin-button]:[appearance:none] [&::-webkit-inner-spin-button]:[appearance:none]"
                          step="any"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Duration Unit</label>
                      <select
                        value={proposalForm.durationUnit}
                        onChange={(e) => handleProposalChange("durationUnit", e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 md:w-48"
                      >
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                      </select>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="submit"
                        disabled={proposalLoading}
                        className="bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        {proposalLoading ? "Submitting..." : "Send Proposal"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setProposalOpen(false);
                          setProposalError("");
                        }}
                        className="border-slate-200 text-slate-700 hover:bg-white"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default JobDetail;
