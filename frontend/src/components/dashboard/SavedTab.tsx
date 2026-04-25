import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, MapPin, X } from "lucide-react";
import api from "@/lib/api";
import { getGuestSavedPortfolios, toggleGuestSavedPortfolio } from "@/lib/guestStorage";
import { useAuth } from "@/contexts/AuthContext";

interface SavedTabProps {
  user: any;
}

interface SavedJob {
  _id: string;
  title: string;
  budget?: { amount?: number; maxAmount?: number; currency?: string; type?: string };
  location?: { city?: string; state?: string; country?: string };
}

interface SavedPortfolioItem {
  id: string;
  title?: string;
  image?: string;
  freelancerName?: string;
  freelancerId?: string;
}

import { formatCurrency } from "@/lib/currency";

const formatBudget = (job: SavedJob) => {
  const budget = job.budget;
  if (!budget || typeof budget.amount !== "number") return "Budget not specified";

  const minAmount = formatCurrency(budget.amount, budget.currency);

  if (budget.maxAmount && budget.maxAmount > budget.amount) {
    const maxAmount = formatCurrency(budget.maxAmount, budget.currency);
    return `${minAmount} - ${maxAmount}`;
  }

  return budget.type === "hourly" ? `${minAmount}/hr` : minAmount;
};

const SavedTab = ({ user }: SavedTabProps) => {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedPortfolios, setSavedPortfolios] = useState<SavedPortfolioItem[]>([]);
  const { refreshUser } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const savedJobIds: string[] = (user as any)?.savedJobs || [];

        const jobPromises = savedJobIds.map(async (id) => {
          try {
            console.log("Fetching job ID:", id);

            const res = await api.getJob(id);

            console.log("API Response:", res);

            const payload: any = res.data;
            const job: any = payload?.job || payload;

            console.log("Processed Job:", job);

            return job as SavedJob;
          } catch (err) {
            console.error("Error fetching job:", id, err);
            return null;
          }
        });

        const jobsResult = await Promise.all(jobPromises);

        setSavedJobs(jobsResult.filter((j): j is SavedJob => Boolean(j)));
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      loadData();
    } else {
      setLoading(false);
    }

    // Load saved portfolio previews from local storage (client-only)
    const portfolios = getGuestSavedPortfolios();
    setSavedPortfolios(portfolios);
  }, [user]);

  const handleUnsaveJob = async (jobId: string) => {
    try {
      await api.unbookmarkJob(jobId);
      setSavedJobs((prev) => prev.filter((job) => job._id !== jobId));
      await refreshUser();
    } catch (err) {
      console.error("Error unsaving job", err);
    }
  };

  const handleUnsavePortfolio = (item: SavedPortfolioItem) => {
    toggleGuestSavedPortfolio(item);
    setSavedPortfolios((prev) => prev.filter((p) => p.id !== item.id));
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Saved Jobs */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Bookmark className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Saved Jobs</p>
              <p className="text-xs text-slate-500">Jobs you bookmarked to review later</p>
            </div>
          </div>
          <span className="text-xs font-medium rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
            {savedJobs.length}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No saved jobs yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {savedJobs.map((job) => (
              <div
                key={job._id}
                className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <Link to={`/jobs/${job._id}`} className="flex-1 min-w-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{job.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{formatBudget(job)}</p>
                  </div>
                  {job.location && (
                    <div className="flex flex-col items-end gap-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {job.location.city || ""}
                          {job.location.state ? `, ${job.location.state}` : ""}
                        </span>
                      </span>
                    </div>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => handleUnsaveJob(job._id)}
                  className="ml-3 inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-500 hover:border-red-200 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                  Unsave
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Saved Portfolio Items */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Bookmark className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Saved Work</p>
              <p className="text-xs text-slate-500">Portfolio pieces you saved from previews</p>
            </div>
          </div>
          <span className="text-xs font-medium rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
            {savedPortfolios.length}
          </span>
        </div>

        {savedPortfolios.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No saved work yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {savedPortfolios.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <Link
                  to={item.freelancerId ? `/freelancers/${item.freelancerId}` : '#'}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title || 'Saved work'}
                      className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.title || 'Saved portfolio item'}
                    </p>
                    {item.freelancerName && (
                      <p className="mt-0.5 text-xs text-slate-500 truncate">{item.freelancerName}</p>
                    )}
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => handleUnsavePortfolio(item)}
                  className="ml-3 inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-medium text-slate-500 hover:border-red-200 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                  Unsave
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedTab;
