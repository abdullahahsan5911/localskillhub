import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileCheck, Flag, AlertTriangle, CreditCard, ChevronDown, ChevronUp, Receipt, Eye, Download, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import api from "@/lib/api";
import type { Contract } from "./types";
import { statusColors } from "./types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import ContractEscrowPaymentDialog from "@/components/payments/ContractEscrowPaymentDialog";

interface ContractsTabProps {
  contracts: Contract[];
  loading: boolean;
  onRefresh: () => void;
  payContractId?: string | null;
  focusContractId?: string;
  onPayFlowComplete?: () => void;
}

const ContractsTab = ({
  contracts,
  loading,
  onRefresh,
  payContractId,
  focusContractId,
  onPayFlowComplete,
}: ContractsTabProps) => {
  const { user } = useAuth();
  const currentUserId = (user as any)?._id as string | undefined;
  const [acting, setActing] = useState<string | null>(null);
  const [paymentContractId, setPaymentContractId] = useState<string | null>(null);

  const [breakdownContractId, setBreakdownContractId] = useState<string | null>(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);
  const [breakdownData, setBreakdownData] = useState<any | null>(null);
  const [breakdownCache, setBreakdownCache] = useState<Record<string, any>>({});
  const [receiptOpenId, setReceiptOpenId] = useState<string | null>(null);
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);
  const [receiptErrors, setReceiptErrors] = useState<Record<string, string>>({});

  const [reportContractId, setReportContractId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionTarget, setRevisionTarget] = useState<{
    contractId: string;
    milestoneId: string;
    milestoneTitle: string;
    amount: number;
    currency?: string;
  } | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [revisionLoading, setRevisionLoading] = useState(false);

  const [reviewContractId, setReviewContractId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewedContracts, setReviewedContracts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const hydrateReviewedContracts = async () => {
      if (!currentUserId || contracts.length === 0) return;
      const eligible = contracts.filter(
        (c) => (["completed", "paid"] as string[]).includes(c.status) && (c as any).paymentStatus === "released"
      );
      if (eligible.length === 0) return;

      try {
        const results = await Promise.all(
          eligible.map((c) =>
            api
              .getContractReviews(c._id)
              .catch(() => null)
          )
        );

        const map: Record<string, boolean> = {};
        eligible.forEach((c, idx) => {
          const res: any = results[idx];
          if (!res) return;
          const payload = res.data || res;
          const reviews = payload.data?.reviews || payload.reviews || [];
          const hasMine = reviews.some((r: any) => {
            const reviewer = r.reviewerId;
            const reviewerId = typeof reviewer === "object" ? reviewer?._id : reviewer;
            return reviewerId && reviewerId.toString() === currentUserId.toString();
          });
          if (hasMine) map[c._id] = true;
        });

        if (Object.keys(map).length > 0) {
          setReviewedContracts((prev) => ({ ...prev, ...map }));
        }
      } catch {
        // silent failure; button will still be available, backend prevents duplicates
      }
    };

    hydrateReviewedContracts();
  }, [contracts, currentUserId]);

  const handleReportSubmit = async () => {
    if (!reportContractId || !reportReason) return;
    setReportLoading(true);
    try {
      await api.reportContract(reportContractId, reportReason, reportDesc);
      toast({ title: "Report submitted", description: "Admin will review your concern." });
      setReportContractId(null);
      setReportReason("");
      setReportDesc("");
      onRefresh();
    } catch (err: any) {
      toast({ title: "Error submitting report", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setReportLoading(false);
    }
  };

  const act = async (key: string, fn: () => Promise<any>) => {
    try {
      setActing(key);
      await fn();
      onRefresh();
    } catch {
      alert("Action failed. Please try again.");
    } finally {
      setActing(null);
    }
  };

  const toggleReceipt = async (contract: Contract) => {
    const contractId = contract._id;
    if (receiptOpenId === contractId) { setReceiptOpenId(null); return; }
    const paymentStatus = (contract as any).paymentStatus;
    if (paymentStatus === "pending") {
      setReceiptErrors((prev) => ({ ...prev, [contractId]: "Stripe hasn't charged this contract yet." }));
      setReceiptOpenId(contractId);
      return;
    }
    const cached = breakdownCache[contractId];
    const hasStripeCharge = cached?.stripeChargeId || typeof cached?.processingFee === "number";
    if (!hasStripeCharge) {
      setReceiptLoadingId(contractId);
      setReceiptErrors((prev) => { const next = { ...prev }; delete next[contractId]; return next; });
      try {
        const res: any = await api.getClientPaymentBreakdown(contractId);
        const data = (res?.data as any)?.data || res?.data || res;
        setBreakdownCache((prev) => ({ ...prev, [contractId]: data }));
      } catch (err: any) {
        const status = err?.response?.status;
        const message = status === 404 ? "We couldn't find a completed payment for this contract yet." : err?.response?.data?.message || "Unable to load Stripe receipt right now.";
        setReceiptErrors((prev) => ({ ...prev, [contractId]: message }));
      } finally {
        setReceiptLoadingId(null);
      }
    }
    setReceiptOpenId(contractId);
  };

  useEffect(() => {
    if (payContractId) {
      const exists = contracts.some((c) => c._id === payContractId);
      if (exists) setPaymentContractId(payContractId);
    }
  }, [payContractId, contracts]);

  useEffect(() => {
    if (!focusContractId) return;
    const el = document.getElementById(`client-contract-${focusContractId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusContractId, contracts]);

  const getPaymentStatusChip = (paymentStatus?: string | null) => {
    if (!paymentStatus) return null;
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: "Awaiting Payment", className: "bg-amber-50 text-amber-700 border border-amber-200" },
      escrow: { label: "In Escrow", className: "bg-blue-50 text-blue-700 border border-blue-200" },
      released: { label: "Paid Out", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
      refunded: { label: "Refunded", className: "bg-rose-50 text-rose-700 border border-rose-200" },
      disputed: { label: "Disputed", className: "bg-red-50 text-red-700 border border-red-200" },
    };
    const cfg = map[paymentStatus];
    if (!cfg) return null;
    return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>{cfg.label}</span>;
  };

  const activePaymentContract = paymentContractId ? contracts.find((c) => c._id === paymentContractId) : undefined;

  return (
    <>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Contracts</h2>
            <p className="text-sm text-slate-500 mt-0.5">Manage your active project agreements</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-slate-600" />
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100" />
                  <div className="space-y-2">
                    <div className="h-3.5 w-40 bg-slate-100 rounded-full" />
                    <div className="h-3 w-24 bg-slate-100 rounded-full" />
                  </div>
                </div>
                <div className="h-px bg-slate-100 mb-4" />
                <div className="flex gap-2">
                  <div className="h-8 w-24 bg-slate-100 rounded-lg" />
                  <div className="h-8 w-24 bg-slate-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : contracts.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-16 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-4">
              <FileCheck className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No contracts yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">Accepted proposals will appear here as active contracts ready for payment.</p>
          </div>
        ) : (
          contracts.map((c) => (
            <div
              id={`client-contract-${c._id}`}
              key={c._id}
              className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden ${focusContractId === c._id ? 'ring-2 ring-blue-300' : ''}`}
            >

              {/* Contract Header */}
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <Avatar className="w-11 h-11 ring-2 ring-slate-100 ring-offset-1">
                    <AvatarImage src={c.freelancerId?.avatar} />
                    <AvatarFallback className="bg-slate-800 text-white text-sm font-bold">
                      {c.freelancerId?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm leading-tight">{c.jobId?.title || c.title || "Direct Hire Contract"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">with {c.freelancerId?.name}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-slate-900 tabular-nums">
                    {formatCurrency(c.amount?.total ?? 0, c.amount?.currency)}
                  </p>
                  <div className="flex items-center justify-end gap-1.5 mt-1.5 flex-wrap">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusColors[c.status] || "bg-slate-50 text-slate-600 border-slate-200"}`}>
                      {c.status}
                    </span>
                    {getPaymentStatusChip((c as any).paymentStatus)}
                    {(c as any).offerStatus === "pending_freelancer" && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                        Waiting for Freelancer
                      </span>
                    )}
                    {(c as any).offerStatus === "rejected" && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        Request Rejected
                      </span>
                    )}
                    {(c as any).isHeldByAdmin && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Held by Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              {(() => {
                const total = c.amount?.total ?? 0;
                const platformFeePercentage = (c as any).platformFee?.percentage ?? 3;
                const platformFee = (total * platformFeePercentage) / 100;
                const freelancerNet = total - platformFee;
                const released = (c as any).totalPaid ?? 0;

                if ((c as any).paymentStatus === "disputed") {
                  return (
                    <div className="mx-5 mb-4 rounded-xl bg-red-50 border border-red-200 p-4">
                      <p className="text-xs font-semibold text-red-700 mb-3 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Payment Frozen — Dispute Active
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-red-700">
                          <span>Job Price</span>
                          <span className="font-semibold">{formatCurrency(total, c.amount?.currency)}</span>
                        </div>
                        <div className="flex justify-between text-red-500">
                          <span>Platform Fee ({platformFeePercentage}%)</span>
                          <span>−{formatCurrency(platformFee, c.amount?.currency)}</span>
                        </div>
                        <div className="flex justify-between border-t border-red-200 pt-2 font-semibold text-red-700">
                          <span>Freelancer Gets</span>
                          <span>{formatCurrency(freelancerNet, c.amount?.currency)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="mx-5 mb-4 rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-xs space-y-2">
                    <div className="flex justify-between text-slate-700">
                      <span>Contract Value</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(total, c.amount?.currency)}</span>
                    </div>
                    {released > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium border-t border-slate-200 pt-2">
                        <span>Amount Released</span>
                        <span>{formatCurrency(Math.min(released, freelancerNet), c.amount?.currency)}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 pt-0.5">Service fees are applied at the time of payout.</p>
                  </div>
                );
              })()}

              {/* Divider */}
              <div className="h-px bg-slate-100 mx-5" />

              {/* Action Bar */}
              <div className="px-5 py-3.5 flex flex-wrap items-center gap-2">
                {c.jobId?._id && (
                  <Link to={`/jobs/${c.jobId._id}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs font-medium text-slate-600 border-slate-200 rounded-lg px-3"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> View Job Details
                    </Button>
                  </Link>
                )}

                {!c.signatures?.client?.signed && (c as any).offerStatus !== "rejected" && (
                  <Button
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 rounded-lg transition-all shadow-sm"
                    onClick={() => setPaymentContractId(c._id)}
                    disabled={(c as any).paymentStatus === "disputed" || (c as any).offerStatus === "pending_freelancer"}
                  >
                    <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                    {(c as any).offerStatus === "pending_freelancer"
                      ? "Waiting for Acceptance"
                      : (c as any).paymentStatus === "pending"
                        ? "Pay Now"
                        : "Sign & Pay"}
                  </Button>
                )}

                {c.status !== "cancelled" && (c as any).paymentStatus !== "disputed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-medium text-slate-600 border-slate-200 rounded-lg px-3"
                    onClick={() => setReportContractId(c._id)}
                  >
                    <Flag className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Report
                  </Button>
                )}

                {(["completed", "paid"] as string[]).includes(c.status) && (c as any).paymentStatus === "released" && !reviewedContracts[c._id] && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-medium text-slate-600 border-slate-200 rounded-lg px-3"
                    onClick={() => {
                      setReviewContractId(c._id);
                      setReviewRating(5);
                      setReviewText("");
                    }}
                  >
                    <Star className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Leave Review
                  </Button>
                )}

                {(["pending", "escrow", "released", "refunded", "disputed"] as string[]).includes((c as any).paymentStatus || "") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs font-medium text-slate-600 border border-slate-200 rounded-lg px-3"
                    onClick={async () => {
                      setBreakdownContractId(c._id);
                      setBreakdownLoading(true);
                      setBreakdownError(null);
                      setBreakdownData(null);
                      try {
                        let res: any;
                        if ((c as any).paymentStatus === "pending") {
                          res = await api.getContractPaymentPreview(c._id);
                        } else {
                          res = await api.getClientPaymentBreakdown(c._id);
                        }
                        const d = (res?.data as any)?.data || res?.data || res;
                        setBreakdownData(d);
                        setBreakdownCache((prev) => ({ ...prev, [c._id]: d }));
                      } catch (err: any) {
                        const status = err?.response?.status;
                        if (status === 404) {
                          setBreakdownError("No payment has been made for this contract yet.");
                        } else {
                          setBreakdownError(err?.response?.data?.message || "Unable to load payment breakdown right now.");
                        }
                      } finally {
                        setBreakdownLoading(false);
                      }
                    }}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Payment Details
                  </Button>
                )}

                {(c as any).offerStatus === "pending_freelancer" ? (
                  <span className="text-xs text-violet-600 italic ml-1">
                    Hiring request sent. Payment unlocks after freelancer accepts.
                  </span>
                ) : c.paymentStatus === "pending" ? (
                  <span className="text-xs text-slate-400 italic ml-1">
                    Awaiting payment — freelancer will be notified once processed.
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs font-medium text-slate-600 border border-slate-200w rounded-lg px-3"
                    onClick={() => toggleReceipt(c)}
                  >
                    <Receipt className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    {receiptOpenId === c._id ? "Hide Receipt" : "Stripe Receipt"}
                    {receiptOpenId === c._id ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                  </Button>
                )}
              </div>

              {/* Stripe Receipt Inline */}
              {receiptOpenId === c._id && (
                <div className="mx-5 mb-4 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                  <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">Stripe Receipt</span>
                  </div>
                  <div className="p-4 text-xs text-slate-700 space-y-2">
                    {receiptLoadingId === c._id ? (
                      <div className="flex items-center gap-2 text-slate-500">
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Loading receipt…
                      </div>
                    ) : receiptErrors[c._id] ? (
                      <p className="text-red-500">{receiptErrors[c._id]}</p>
                    ) : (() => {
                      const receiptData = breakdownCache[c._id];
                      const hasChargeData = receiptData?.stripeChargeId || typeof receiptData?.processingFee === "number";
                      if (!hasChargeData) return <p className="text-slate-400">No payment data available yet.</p>;
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Price</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(receiptData.jobPrice || 0, receiptData.currency || c.amount?.currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Service Fee</span>
                            <span className="text-amber-600 font-medium">+{formatCurrency(receiptData.processingFee ?? receiptData.estimatedProcessingFee ?? 0, receiptData.currency || c.amount?.currency)}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
                            <span className="text-slate-700">Total Charged</span>
                            <span className="text-slate-900">{formatCurrency(receiptData.clientTotal || 0, receiptData.currency || c.amount?.currency)}</span>
                          </div>
                          {receiptData.stripeChargeId && (
                            <p className="text-[10px] text-slate-400 pt-1 font-mono">ID: {receiptData.stripeChargeId}</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Milestones */}
              {(c.milestones || []).length > 0 && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-3">
                  <p className="text-[13px] font-semibold text-slate-500 uppercase border-t border-slate-300 pt-4 tracking-wider">Milestones</p>
                  {c.milestones!.map((m) => (
                    <div key={m._id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{m.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {formatCurrency(m.amount, c.amount?.currency)}
                          <span className="mx-1.5 text-slate-300">·</span>
                          <span className="capitalize">{m.status}</span>
                        </p>
                        {m.feedback && (
                          <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
                            {m.feedback}
                          </p>
                        )}
                        {Array.isArray(m.deliverables) && m.deliverables.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            <p className="text-[12px] font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <FileCheck className="w-3.5 h-3.5 text-slate-500" /> Deliverables
                            </p>
                            <ul className="space-y-2 max-h-48 overflow-auto pr-1">
                              {m.deliverables.map((d, idx) => {
                                const fileName = d.filename || `File ${idx + 1}`;
                                const isTextDataUrl = d.url?.startsWith("data:text/plain");
                                const isTextFile = (fileName || "").toLowerCase().endsWith(".txt");
                                const ext = (fileName.includes(".") ? fileName.split(".").pop() : "") || "";
                                let textPreview: string | null = null;
                                if (isTextDataUrl) {
                                  try {
                                    const [, dataPart] = d.url.split(",", 2);
                                    if (dataPart) {
                                      textPreview = decodeURIComponent(dataPart);
                                    }
                                  } catch {
                                    textPreview = null;
                                  }
                                }
                                const linkLabel = isTextFile ? "Download .txt" : "Download";
                                return (
                                  <li key={idx} className="text-[13px] space-y-1">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-start gap-2 min-w-0">
                                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex-shrink-0">
                                          <FileCheck className="w-3.5 h-3.5" />
                                        </span>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="truncate text-slate-700 font-semibold">
                                              {fileName}
                                            </span>
                                            {ext && (
                                              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 flex-shrink-0">
                                                {ext}
                                              </span>
                                            )}
                                          </div>
                                          {isTextDataUrl && textPreview && (
                                            <div className="flex mt-1 w-full h-full rounded-lg border border-slate-400 bg-slate-50 px-2 py-1.5 text-slate-800 whitespace-pre-wrap">
                                              {textPreview}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      {d.url && (
                                        <a
                                          href={d.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 hover:text-slate-900 underline-offset-2 hover:underline whitespace-nowrap flex-shrink-0"
                                          {...(isTextDataUrl ? { download: fileName || `notes-${idx + 1}.txt` } : {})}
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                          <span>{linkLabel}</span>
                                        </a>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {m.status === "submitted" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg px-3"
                              disabled={acting === `approve-${c._id}-${m._id}`}
                              onClick={() => act(`approve-${c._id}-${m._id}`, () => api.approveMilestone(c._id, m._id))}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs rounded-lg px-3 border-slate-200"
                              disabled={revisionLoading && revisionTarget?.contractId === c._id && revisionTarget?.milestoneId === m._id}
                              onClick={() => {
                                setRevisionTarget({
                                  contractId: c._id,
                                  milestoneId: m._id,
                                  milestoneTitle: m.title,
                                  amount: m.amount,
                                  currency: c.amount?.currency,
                                });
                                setRevisionFeedback("");
                                setRevisionDialogOpen(true);
                              }}
                            >
                              Request Revision
                            </Button>
                          </>
                        )}
                        {m.status === "approved" && (
                          <Button
                            size="sm"
                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs rounded-lg px-3"
                            disabled={acting === `release-${c._id}-${m._id}`}
                            onClick={() => act(`release-${c._id}-${m._id}`, () => api.releaseMilestonePayment(c._id, m._id))}
                          >
                            Release Payment
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ─── Revision Dialog ─── */}
      <Dialog
        open={revisionDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setRevisionDialogOpen(false);
            setRevisionTarget(null);
            setRevisionFeedback("");
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Request Revision</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Explain what needs to be changed or improved so your freelancer can update this milestone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {revisionTarget && (
              <div className="rounded-xl bg-slate-50 py-2.5">
                <p className="text-xs font-semibold text-slate-700">{revisionTarget.milestoneTitle}</p>
                  {/* <p className="text-[11px] text-slate-500 mt-0.5">
                    Milestone amount: {formatCurrency(revisionTarget.amount, revisionTarget.currency)}
                  </p> */}
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Feedback for your freelancer</label>
              <textarea
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                rows={4}
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                placeholder="Be as specific as possible about what needs revision (e.g. copy changes, design tweaks, missing items)…"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                className="rounded-xl text-sm border-slate-200"
                onClick={() => {
                  setRevisionDialogOpen(false);
                  setRevisionTarget(null);
                  setRevisionFeedback("");
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!revisionFeedback.trim() || revisionLoading}
                onClick={async () => {
                  if (!revisionTarget || !revisionFeedback.trim()) return;
                  setRevisionLoading(true);
                  try {
                    await api.requestMilestoneRevision(revisionTarget.contractId, revisionTarget.milestoneId, revisionFeedback.trim());
                    toast({
                      title: "Revision requested",
                      description: "The freelancer has been notified about your feedback.",
                    });
                    setRevisionDialogOpen(false);
                    setRevisionTarget(null);
                    setRevisionFeedback("");
                    onRefresh();
                  } catch (err: any) {
                    toast({
                      title: "Could not request revision",
                      description: err?.message || "Please try again.",
                      variant: "destructive",
                    });
                  } finally {
                    setRevisionLoading(false);
                  }
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm"
              >
                {revisionLoading ? "Sending…" : "Send Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ContractEscrowPaymentDialog
        open={!!paymentContractId}
        contractId={paymentContractId}
        currency={activePaymentContract?.amount?.currency}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentContractId(null);
            onPayFlowComplete?.();
          }
        }}
        onPaid={async () => {
          if (!paymentContractId) return;
          await api.signContract(paymentContractId);
          setPaymentContractId(null);
          onRefresh();
          onPayFlowComplete?.();
        }}
      />

      {/* ─── Report Dialog ─── */}
      <Dialog open={!!reportContractId} onOpenChange={(open) => !open && setReportContractId(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-500" /> Report Contract
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              An admin will review your concern and get back to you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Reason</label>
              <select
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="">Select a reason…</option>
                <option value="Non-responsive freelancer">Non-responsive freelancer</option>
                <option value="Poor quality work">Poor quality work</option>
                <option value="Missed deadlines">Missed deadlines</option>
                <option value="Fraud or Scams">Fraud or Scams</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Description</label>
              <textarea
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                rows={4}
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Provide additional context about the issue…"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" className="rounded-xl text-sm" onClick={() => setReportContractId(null)}>Cancel</Button>
              <Button
                disabled={!reportReason || reportLoading}
                onClick={handleReportSubmit}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm"
              >
                {reportLoading ? "Submitting…" : "Submit Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Payment Breakdown Dialog ─── */}
      <Dialog
        open={!!breakdownContractId}
        onOpenChange={(open) => {
          if (!open) { setBreakdownContractId(null); setBreakdownData(null); setBreakdownError(null); setBreakdownLoading(false); }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-base font-bold text-slate-900">Payment Breakdown</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              A detailed view of all fees and the total charged to you.
            </DialogDescription>
          </DialogHeader>

          {breakdownLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading breakdown…
            </div>
          )}

          {breakdownError && !breakdownLoading && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-600">{breakdownError}</p>
            </div>
          )}

          {!breakdownLoading && !breakdownError && breakdownData && (
            <>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-slate-600">Job Price</span>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(breakdownData.jobPrice || 0, breakdownData.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-slate-600">
                      Platform Fee ({((breakdownData.jobPrice ? (breakdownData.platformFeeAmount / breakdownData.jobPrice) * 100 : 0).toFixed(2))}%)
                    </span>
                    <span className="text-sm font-medium text-red-600">−{formatCurrency(breakdownData.platformFeeAmount || 0, breakdownData.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 bg-emerald-50">
                    <span className="text-sm font-medium text-emerald-800">Freelancer Receives</span>
                    <span className="text-sm font-bold text-emerald-700">{formatCurrency(breakdownData.freelancerNetAmount ?? breakdownData.freelancerNet ?? 0, breakdownData.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-slate-600">Card Processing Fee</span>
                    <span className="text-sm font-medium text-amber-600">+{formatCurrency(breakdownData.processingFee || 0, breakdownData.currency)}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 bg-slate-900">
                    <span className="text-sm font-semibold text-white">Total Charged to You</span>
                    <span className="text-sm font-bold text-white">{formatCurrency(breakdownData.clientTotal || 0, breakdownData.currency)}</span>
                  </div>
                </div>
                {breakdownData.stripeChargeId && (
                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200">
                    <p className="text-[10px] text-slate-400 font-mono">Payment ID: {breakdownData.stripeChargeId}</p>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                Card processing fees are charged on top of the job price and paid by you to cover Stripe costs. The freelancer's payout is only reduced by the platform fee.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Review Dialog ─── */}
      <Dialog
        open={!!reviewContractId}
        onOpenChange={(open) => {
          if (!open) {
            setReviewContractId(null);
            setReviewText("");
            setReviewRating(5);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" /> Leave a Review
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Share feedback about your experience. Your review helps other clients and improves the freelancer's reputation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Overall rating</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setReviewRating(value)}
                    className={`w-7 h-7 flex items-center justify-center rounded-full border text-xs font-medium transition-colors ${
                      reviewRating >= value
                        ? "bg-amber-100 border-amber-300 text-amber-700"
                        : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {value}
                  </button>
                ))}
                <span className="text-[11px] text-slate-400 ml-1">1 = Poor, 5 = Excellent</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Your review</label>
              <textarea
                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Describe what went well and what could be improved…"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                className="rounded-xl text-sm"
                onClick={() => {
                  setReviewContractId(null);
                  setReviewText("");
                  setReviewRating(5);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!reviewText.trim() || reviewLoading}
                onClick={async () => {
                  if (!reviewContractId || !reviewText.trim()) return;
                  const contract = contracts.find((c) => c._id === reviewContractId);
                  if (!contract) {
                    setReviewContractId(null);
                    return;
                  }
                  setReviewLoading(true);
                  try {
                    await api.createReview({
                      contractId: contract._id,
                      jobId: contract.jobId?._id,
                      reviewedUserId: contract.freelancerId?._id,
                      reviewerType: "client",
                      rating: { overall: reviewRating },
                      reviewText: reviewText.trim(),
                    });
                    toast({
                      title: "Review submitted",
                      description: "Thank you for your feedback. Your review is now visible on the freelancer's profile.",
                    });
                    setReviewedContracts((prev) => ({ ...prev, [contract._id]: true }));
                    setReviewContractId(null);
                    setReviewText("");
                    setReviewRating(5);
                    onRefresh();
                  } catch (err: any) {
                    const message = err?.response?.data?.message || "Unable to submit review. You may have already reviewed this contract.";
                    toast({ title: "Could not submit review", description: message, variant: "destructive" });
                  } finally {
                    setReviewLoading(false);
                  }
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm"
              >
                {reviewLoading ? "Submitting…" : "Submit Review"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContractsTab;