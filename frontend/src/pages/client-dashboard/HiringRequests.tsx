import { useEffect, useMemo, useState } from "react";
import { Briefcase, Building2, Search, User, Clock3, CheckCircle2, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import type { Contract } from "./types";

interface HiringRequestsTabProps {
  contracts: Contract[];
  loading: boolean;
  focusContractId?: string;
  onOpenContractPayment: (contractId: string) => void;
}

const HiringRequestsTab = ({ contracts, loading, focusContractId, onOpenContractPayment }: HiringRequestsTabProps) => {
  const [statusFilter, setStatusFilter] = useState<"all" | "pending_freelancer" | "accepted" | "rejected">("all");
  const [hiringTypeFilter, setHiringTypeFilter] = useState<"all" | "individual" | "company">("all");
  const [query, setQuery] = useState("");

  const requests = useMemo(() => {
    return contracts.filter((c) => c.isHiringRequest === true);
  }, [contracts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return requests.filter((c) => {
      const offerStatus = c.offerStatus || "accepted";
      const hiringType = c.hiringContext?.type || "individual";
      const freelancerName = c.freelancerId?.name?.toLowerCase() || "";
      const contractTitle = (c.title || c.jobId?.title || "").toLowerCase();
      const companyName =
        typeof c.hiringContext?.companyId === "object"
          ? c.hiringContext?.companyId?.name?.toLowerCase() || ""
          : "";

      if (statusFilter !== "all" && offerStatus !== statusFilter) return false;
      if (hiringTypeFilter !== "all" && hiringType !== hiringTypeFilter) return false;
      if (q && !freelancerName.includes(q) && !contractTitle.includes(q) && !companyName.includes(q)) return false;
      return true;
    });
  }, [requests, statusFilter, hiringTypeFilter, query]);

  const statusChip = (status?: string) => {
    if (status === "pending_freelancer") {
      return <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">Pending</span>;
    }
    if (status === "rejected") {
      return <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700">Rejected</span>;
    }
    return <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">Accepted</span>;
  };

  useEffect(() => {
    if (!focusContractId) return;
    const el = document.getElementById(`hiring-request-${focusContractId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusContractId, filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {["all", "pending_freelancer", "accepted", "rejected"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              statusFilter === status
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
            }`}
          >
            {status === "all" ? "All" : status.replace("_", " ")}
          </button>
        ))}

        {["all", "individual", "company"].map((mode) => (
          <button
            key={mode}
            onClick={() => setHiringTypeFilter(mode as any)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              hiringTypeFilter === mode
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
            }`}
          >
            {mode === "all" ? "All Hiring Types" : mode}
          </button>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search freelancer, title, company"
          className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-slate-200 bg-white animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-600 text-sm">No hiring requests match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const hiringType = c.hiringContext?.type || "individual";
            const companyName =
              typeof c.hiringContext?.companyId === "object"
                ? c.hiringContext?.companyId?.name
                : undefined;

            return (
              <div
                id={`hiring-request-${c._id}`}
                key={c._id}
                className={`rounded-2xl border border-slate-200 bg-white shadow-sm p-4 ${focusContractId === c._id ? 'ring-2 ring-violet-300' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="w-10 h-10 ring-1 ring-slate-200">
                      <AvatarImage src={c.freelancerId?.avatar} />
                      <AvatarFallback className="bg-slate-100 text-slate-700">
                        {c.freelancerId?.name?.charAt(0) || "F"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{c.title || c.jobId?.title || "Direct Hire Contract"}</p>
                      <p className="text-xs text-slate-500">with {c.freelancerId?.name}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                        {hiringType === "company" ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        <span>{hiringType === "company" ? `Company${companyName ? `: ${companyName}` : ""}` : "Individual"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(c.amount?.total || 0, c.amount?.currency)}</p>
                    <div className="mt-1 flex justify-end">{statusChip(c.offerStatus)}</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  {c.offerStatus === "pending_freelancer" && (
                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                      <Clock3 className="w-3.5 h-3.5" /> Waiting for freelancer response
                    </span>
                  )}
                  {c.offerStatus === "accepted" && (
                    <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready to fund escrow
                    </span>
                  )}
                  {c.offerStatus === "rejected" && (
                    <span className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Request declined
                    </span>
                  )}

                  {c.offerStatus === "accepted" && !c.signatures?.client?.signed && (
                    <Button
                      size="sm"
                      className="ml-auto bg-slate-900 hover:bg-slate-800 text-white text-xs rounded-lg"
                      onClick={() => onOpenContractPayment(c._id)}
                    >
                      Fund Escrow
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HiringRequestsTab;
