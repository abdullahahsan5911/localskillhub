import { Link } from "react-router-dom";
import { Briefcase, FileCheck, FileText, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Analytics, Job, Proposal } from "../client-dashboard/types";
import { statusColors } from "../client-dashboard/types";

interface OverviewTabProps {
  analytics: Analytics | null;
  jobs: Job[];
  proposals: Proposal[];
  loading: boolean;
  canPostCompanyJob?: boolean;
}

const CompanyOverviewTab = ({ analytics, jobs, proposals, loading, canPostCompanyJob = true }: OverviewTabProps) => {
  const stats = [
    { label: "Company Jobs Posted", value: analytics?.jobsPosted ?? 0, icon: Briefcase, glowClass: "bg-blue-400/25", iconBg: "bg-blue-50", iconColor: "text-blue-500" },
    { label: "Active Company Contracts", value: analytics?.activeContracts ?? 0, icon: FileCheck, glowClass: "bg-emerald-400/25", iconBg: "bg-emerald-50", iconColor: "text-emerald-500" },
    { label: "Total Proposals", value: analytics?.totalProposalsReceived ?? 0, icon: FileText, glowClass: "bg-violet-400/25", iconBg: "bg-violet-50", iconColor: "text-violet-500" },
    { label: "Total Company Spend", value: `${((analytics?.totalSpent ?? 0)).toLocaleString()}`, icon: DollarSign, glowClass: "bg-amber-400/25", iconBg: "bg-amber-50", iconColor: "text-amber-500" },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6 font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-2xl p-5 border border-slate-300 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
            >
              <div
                className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none ${s.glowClass}`}
              />

              <div className="relative flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
                <div
                  className={`w-7 sm:w-8 md:w-9 h-7 sm:h-8 md:h-9 rounded-lg sm:rounded-xl md:rounded-xl flex items-center justify-center ${s.iconBg}`}
                >
                  <Icon className={`w-4 sm:w-4.5 md:w-5 h-4 sm:h-4.5 md:h-5 ${s.iconColor}`} />
                </div>
              </div>

              <p className="text-base sm:text-lg md:text-xl lg:text-[1.6rem] font-bold tracking-tight text-slate-900 leading-none">
                {loading ? "—" : s.value}
              </p>
              <p className="text-[10px] sm:text-xs md:text-xs text-slate-500 mt-0.5 sm:mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        <div className="rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-300 bg-white overflow-hidden shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 md:py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm md:text-sm font-semibold text-slate-900">Recent Company Jobs</h3>
            <Badge variant="secondary" className="text-[9px] sm:text-[10px] md:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full">
              {jobs.length}
            </Badge>
          </div>
          <div className="divide-y divide-slate-100">
            {jobs.slice(0, 5).map((job: Job) => (
              <div key={job._id} className="px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm md:text-sm font-medium text-slate-900 truncate">{job.title}</p>
                    <p className="text-[10px] sm:text-xs md:text-xs text-slate-500 mt-0.5">
                      ${job.budget.amount.toLocaleString()} · {job.proposals?.length ?? 0} proposals
                    </p>
                  </div>
                  <span className={`text-[9px] sm:text-[10px] md:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0 ${statusColors[job.status] || "bg-slate-100 text-slate-600"}`}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
            {jobs.length === 0 && !loading && (
              <div className="px-3 sm:px-4 md:px-5 py-6 sm:py-8 text-center">
                <Briefcase className="w-6 sm:w-8 md:w-8 h-6 sm:h-8 md:h-8 text-slate-300 mx-auto mb-1.5 sm:mb-2" />
                <p className="text-xs sm:text-sm md:text-sm text-slate-500">No company jobs posted yet</p>
                {canPostCompanyJob ? (
                  <Link to="/post-job?scope=company">
                    <Button size="sm" className="mt-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl">
                      Post a Company Job
                    </Button>
                  </Link>
                ) : (
                  <Button size="sm" className="mt-3 rounded-xl" variant="outline" disabled>
                    Complete Profile to Post
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg sm:rounded-xl md:rounded-2xl border border-slate-300 bg-white overflow-hidden shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 md:py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm md:text-sm font-semibold text-slate-900">Latest Proposals</h3>
            <Badge variant="secondary" className="text-[9px] sm:text-[10px] md:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full">
              {proposals.length}
            </Badge>
          </div>
          <div className="divide-y divide-slate-100">
            {proposals.slice(0, 5).map((p: Proposal) => (
              <div key={p._id} className="px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm md:text-sm font-medium text-slate-900 truncate">{p.freelancerId?.name}</p>
                    <p className="text-[10px] sm:text-xs md:text-xs text-slate-500 truncate">
                      {p.jobId?.title} · ${(p.proposedRate?.amount ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-[9px] sm:text-[10px] md:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0 ${statusColors[p.status] || "bg-slate-100 text-slate-600"}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
            {proposals.length === 0 && !loading && (
              <div className="px-3 sm:px-4 md:px-5 py-6 sm:py-8 text-center">
                <FileText className="w-6 sm:w-8 md:w-8 h-6 sm:h-8 md:h-8 text-slate-300 mx-auto mb-1.5 sm:mb-2" />
                <p className="text-xs sm:text-sm md:text-sm text-slate-500">No proposals yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyOverviewTab;
