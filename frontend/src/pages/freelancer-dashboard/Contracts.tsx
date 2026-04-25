import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FileCheck, Flag, AlertTriangle, Scale, Clock, CheckCircle, Upload, Info, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import type { Contract } from "./types";
import { formatCurrency } from "@/lib/currency";

// ─── Payment Status Badge ──────────────────────────────────────────────────────
const PAYMENT_STATUS_MAP: Record<string, { label: string; className: string }> = {
	pending: { label: "Awaiting Payment", className: "bg-amber-50 text-amber-700 border border-amber-200" },
	escrow: { label: "In Escrow", className: "bg-blue-50 text-blue-700 border border-blue-200" },
	released: { label: "Paid Out", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
	refunded: { label: "Refunded", className: "bg-rose-50 text-rose-700 border border-rose-200" },
	disputed: { label: "Disputed", className: "bg-red-50 text-red-700 border border-red-200" },
};

function PaymentStatusChip({ status }: { status?: string }) {
	if (!status) return null;
	const cfg = PAYMENT_STATUS_MAP[status];
	if (!cfg) return null;
	return (
		<span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.className}`}>
			{cfg.label}
		</span>
	);
}

// ─── Summary Stat ─────────────────────────────────────────────────────────────
function SummaryStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
			<p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
			<p className="text-base font-bold text-slate-900 tabular-nums">{value}</p>
		</div>
	);
}

// ─── Main Component ───────────────────────────────────────────────────────────
const Contracts = ({
	contracts,
	loading,
	onRefresh,
	focusContractId,
}: {
	contracts: Contract[];
	loading: boolean;
	onRefresh: () => void;
	focusContractId?: string;
}) => {
	const [acting, setActing] = useState<string | null>(null);
	const [reportContractId, setReportContractId] = useState<string | null>(null);
	const [reportReason, setReportReason] = useState("");
	const [reportDesc, setReportDesc] = useState("");
	const [reportLoading, setReportLoading] = useState(false);
	const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
	const [submitTarget, setSubmitTarget] = useState<{
		contractId: string;
		milestoneId: string;
		milestoneTitle: string;
		amount: number;
		currency?: string;
	} | null>(null);
	const [submitNote, setSubmitNote] = useState("");
	const [submitFiles, setSubmitFiles] = useState<
		Array<{ filename: string; url: string; fileSize?: number; fileType?: string }>
	>([]);
	const [submitUploading, setSubmitUploading] = useState(false);
	const [submitLoading, setSubmitLoading] = useState(false);
	const submitFileInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (!focusContractId) return;
		const el = document.getElementById(`freelancer-contract-${focusContractId}`);
		if (!el) return;
		el.scrollIntoView({ behavior: "smooth", block: "center" });
	}, [focusContractId, contracts]);

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

	const summary = useMemo(() => {
		const base = { totalEarned: 0, inEscrow: 0, completed: 0 };
		return contracts.reduce((acc, c) => {
			const total = c.amount?.total ?? 0;
			const platformFeePercentage = (c as any).platformFee?.percentage ?? 3;
			const platformFee = (total * platformFeePercentage) / 100;
			const freelancerNet = total - platformFee;
			const grossReleased = c.totalPaid ?? 0;
			const releaseRatio = total > 0 ? Math.min(grossReleased / total, 1) : 0;
			const netReleased = freelancerNet * releaseRatio;
			acc.totalEarned += netReleased;
			if (c.status === "completed") acc.completed += 1;
			if (c.paymentStatus === "escrow") {
				acc.inEscrow += Math.max(freelancerNet - netReleased, 0);
			}
			return acc;
		}, base);
	}, [contracts]);

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

	const handleSubmitFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		if (!files.length) return;
		setSubmitUploading(true);
		try {
			for (const file of files) {
				const uploaded: any = await api.uploadFile(file, "contract-deliverables");
				// Backend now returns a single canonical Cloudinary secure_url as `url`.
				const url = uploaded.url;
				if (!url) continue;
				setSubmitFiles(prev => [
					...prev,
					{
						filename: uploaded.fileName || file.name,
						url,
						fileSize: uploaded.fileSize ?? file.size,
						fileType: uploaded.fileType ?? file.type,
					},
				]);
			}
		} catch (error: any) {
			toast({
				title: "File upload failed",
				description: error?.message || "Please try again.",
				variant: "destructive",
			});
		} finally {
			setSubmitUploading(false);
		}
	};

	const handleSubmitMilestone = async () => {
		if (!submitTarget) return;
		const trimmedNote = submitNote.trim();
		const deliverables: Array<{ filename: string; url: string }> = [];

		if (trimmedNote) {
			const dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(trimmedNote)}`;
			deliverables.push({ filename: "Milestone-notes.txt", url: dataUrl });
		}

		for (const f of submitFiles) {
			if (f.url) {
				deliverables.push({ filename: f.filename, url: f.url });
			}
		}

		if (!deliverables.length) {
			toast({
				title: "Add details",
				description: "Please add notes or at least one file before submitting.",
				variant: "destructive",
			});
			return;
		}

		setSubmitLoading(true);
		try {
			await api.submitMilestone(submitTarget.contractId, submitTarget.milestoneId, deliverables);
			toast({
				title: "Milestone submitted",
				description: "Your client will be notified to review the deliverables.",
			});
			setSubmitDialogOpen(false);
			setSubmitTarget(null);
			setSubmitNote("");
			setSubmitFiles([]);
			onRefresh();
		} catch (error: any) {
			toast({
				title: "Submission failed",
				description: error?.message || "Please try again.",
				variant: "destructive",
			});
		} finally {
			setSubmitLoading(false);
		}
	};

	return (
		<>
			<div className="space-y-6 max-w-3xl mx-auto">

				{/* ── Header ── */}
				<div className="flex items-center justify-between pb-4 border-b border-slate-100">
					<div>
						<h2 className="text-xl font-bold text-slate-900 tracking-tight">My Contracts</h2>
						<p className="text-sm text-slate-400 mt-0.5">Track work in progress, completed projects, and earnings.</p>
					</div>
					<div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
						<FileCheck className="w-5 h-5 text-slate-600" />
					</div>
				</div>

				{/* ── Summary Stats ── */}
				{contracts.length > 0 && (
					<div className="grid grid-cols-3 gap-3">
						<SummaryStat label="Total Earned" value={formatCurrency(summary.totalEarned)} />
						<SummaryStat label="In Escrow" value={formatCurrency(summary.inEscrow)} />
						<SummaryStat label="Completed" value={String(summary.completed)} />
					</div>
				)}

				{/* ── Loading Skeleton ── */}
				{loading ? (
					<div className="space-y-4">
						{[1, 2].map((i) => (
							<div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 animate-pulse">
								<div className="flex items-center gap-3 mb-4">
									<div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
									<div className="space-y-2 flex-1">
										<div className="h-3.5 w-40 bg-slate-100 rounded-full" />
										<div className="h-3 w-24 bg-slate-100 rounded-full" />
									</div>
								</div>
								<div className="h-px bg-slate-100 mb-4" />
								<div className="flex gap-2">
									<div className="h-8 w-28 bg-slate-100 rounded-lg" />
									<div className="h-8 w-28 bg-slate-100 rounded-lg" />
								</div>
							</div>
						))}
					</div>
				) : contracts.length === 0 ? (
					/* ── Empty State ── */
					<div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-16 flex flex-col items-center text-center">
						<div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-4">
							<FileCheck className="w-6 h-6 text-slate-400" />
						</div>
						<p className="text-sm font-semibold text-slate-700">No active contracts yet</p>
						<p className="text-xs text-slate-400 mt-1">Accepted proposals will appear here as contracts.</p>
					</div>
				) : (
					contracts.map((c: Contract) => {
						const hasMilestones = Array.isArray(c.milestones) && c.milestones.length > 0;
						const isPaymentPending = c.paymentStatus === "pending";
						const isDisputed = c.paymentStatus === "disputed" || c.status === "disputed";
						const isHeldByAdmin = Boolean((c as any).isHeldByAdmin);
						const milestonesLocked = isPaymentPending || isHeldByAdmin || isDisputed;
						const canShowMilestones = hasMilestones && !milestonesLocked;
						const milestoneLockMessage = isPaymentPending
							? "Client payment must clear before milestones can be submitted."
							: isHeldByAdmin
								? "Admin hold is active; submissions are paused until payment is unheld."
								: isDisputed
									? "Contract is frozen while a dispute is reviewed."
									: "";

						const total = c.amount?.total ?? 0;
						const platformFeePercentage = (c as any).platformFee?.percentage ?? 3;
						const platformFee = (total * platformFeePercentage) / 100;
						const freelancerNet = total - platformFee;
						const grossReleased = c.totalPaid ?? 0;
						const releaseRatio = total > 0 ? Math.min(grossReleased / total, 1) : 0;
						const netReleased = freelancerNet * releaseRatio;
						const netInEscrow = c.paymentStatus === "escrow" ? Math.max(freelancerNet - netReleased, 0) : 0;

						return (
							<div
								id={`freelancer-contract-${c._id}`}
								key={c._id}
								className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 ${focusContractId === c._id ? 'ring-2 ring-blue-300' : ''}`}
							>
								{/* ── Card Header ── */}
								<div className="p-5 flex items-start justify-between gap-4">
									<div className="flex items-center gap-3.5 min-w-0">
										<Avatar className="w-11 h-11 ring-2 ring-slate-100 ring-offset-1 shrink-0">
											<AvatarImage src={c.clientId?.avatar} />
											<AvatarFallback className="bg-slate-800 text-white text-sm font-bold">
												{c.clientId?.name?.charAt(0)}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0">
											<p className="font-semibold text-slate-900 text-sm leading-tight truncate">{c.jobId?.title || c.title || "Direct Hire Contract"}</p>
											<p className="text-xs text-slate-500 mt-0.5">Client: {c.clientId?.name}</p>
										</div>
									</div>

									<div className="text-right shrink-0">
										<p className="text-xs text-slate-400 mb-0.5">Contract Total</p>
										<p className="text-lg font-bold text-slate-900 tabular-nums">
											{formatCurrency(total, c.amount?.currency)}
										</p>
										<div className="flex items-center justify-end gap-1.5 mt-1.5 flex-wrap">
											<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 capitalize">
												{c.status}
											</span>
											{c.signatures?.freelancer?.signed && <PaymentStatusChip status={c.paymentStatus} />}
											{c.offerStatus === "pending_freelancer" && (
												<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
													Hiring Request
												</span>
											)}
											{isHeldByAdmin && (
												<span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
													<AlertTriangle className="w-3 h-3" /> Held by Admin
												</span>
											)}
										</div>
									</div>
								</div>

								{/* ── Earnings Breakdown (signed contracts) ── */}
								{c.signatures?.freelancer?.signed && (
									<>
										{c.paymentStatus === "disputed" ? (
											<div className="mx-5 mb-4 rounded-xl bg-red-50 border border-red-200 p-4">
												<p className="text-xs font-semibold text-red-700 mb-3 flex items-center gap-1.5">
													<Scale size={13} /> Payment Frozen — Dispute Active
												</p>
												<div className="space-y-2 text-xs">
													<div className="flex justify-between text-red-700">
														<span>Contract Total</span>
														<span className="font-semibold">{formatCurrency(total, c.amount?.currency)}</span>
													</div>
													<div className="flex justify-between text-red-500">
														<span>Platform Fee ({platformFeePercentage}%)</span>
														<span>−{formatCurrency(platformFee, c.amount?.currency)}</span>
													</div>
													<div className="flex justify-between border-t border-red-200 pt-2 font-semibold text-red-700">
														<span>You Receive</span>
														<span>{formatCurrency(freelancerNet, c.amount?.currency)}</span>
													</div>
													<p className="text-[10px] text-red-500 pt-1">Card processing fees are paid by the client and do not reduce your payout.</p>
												</div>
											</div>
										) : (
											<div className="mx-5 mb-4 rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-xs space-y-2">
												<div className="flex justify-between text-slate-600">
													<span className="flex items-center gap-1.5">
														Service Fee
														<Tooltip>
															<TooltipTrigger asChild>
																<button
																	type="button"
																	className="text-slate-400 hover:text-slate-600 transition-colors"
																	aria-label={`Service fee details (${platformFeePercentage}% of contract total)`}
																>
																	<Info size={12} />
																</button>
															</TooltipTrigger>
															<TooltipContent side="top" align="start" className="max-w-xs text-[11px] leading-relaxed">
																<p>
																	A service fee of <span className="font-semibold">{platformFeePercentage}%</span> is applied to the contract amount and deducted before payout.
																	Clients cover any additional charges.
																</p>
															</TooltipContent>
														</Tooltip>
													</span>
													<span className="text-gray-600 font-medium">−{formatCurrency(platformFee, c.amount?.currency)}</span>
												</div>
												<div className="flex justify-between font-semibold text-slate-900 border-t border-slate-200 pt-2">
													<span>You'll Receive</span>
													<span className="text-gray-900">{formatCurrency(freelancerNet, c.amount?.currency)}</span>
												</div>
												{netReleased > 0 && (
													<div className="flex justify-between text-emerald-700 font-medium pt-1 border-t border-slate-200">
														<span>Released to You</span>
														<span>{formatCurrency(netReleased, c.amount?.currency)}</span>
													</div>
												)}
												{netInEscrow > 0 && (
													<div className="flex justify-between text-gray-600 font-medium">
														<span>Payment Held</span>
														<span>{formatCurrency(netInEscrow, c.amount?.currency)}</span>
													</div>
												)}
											</div>
										)}
									</>
								)}

								{/* ── Divider ── */}
								<div className="h-px bg-slate-100 mx-5" />

								{/* ── Actions ── */}
								<div className="px-5 py-3.5 flex flex-wrap gap-2 items-center">
									{c.jobId?._id && (
										<Link to={`/jobs/${c.jobId._id}`}>
											<Button
												size="sm"
												variant="outline"
												className="text-xs font-medium text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg px-3"
											>
												<Eye className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> View Job Details
											</Button>
										</Link>
									)}

									{c.offerStatus === "pending_freelancer" && c.status !== "cancelled" ? (
										<>
											<Button
												size="sm"
												className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 rounded-lg shadow-sm"
												disabled={acting === `offer-accept-${c._id}`}
												onClick={() => act(`offer-accept-${c._id}`, () => api.respondToHiringRequest(c._id, "accept"))}
											>
												{acting === `offer-accept-${c._id}` ? "Accepting..." : "Accept Hire Request"}
											</Button>
											<Button
												size="sm"
												variant="outline"
												className="text-xs font-medium text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg px-3"
												disabled={acting === `offer-reject-${c._id}`}
												onClick={() => act(`offer-reject-${c._id}`, () => api.respondToHiringRequest(c._id, "reject"))}
											>
												{acting === `offer-reject-${c._id}` ? "Rejecting..." : "Decline Request"}
											</Button>
										</>
									) : !c.signatures?.freelancer?.signed && c.status !== "cancelled" ? (
										c.paymentStatus !== "pending" && (
											<>
												<Button
													size="sm"
													className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 rounded-lg shadow-sm"
													disabled={acting === `sign-${c._id}`}
													onClick={() => act(`sign-${c._id}`, () => api.signContract(c._id))}
												>
													{acting === `sign-${c._id}` ? (
														<span className="flex items-center gap-1.5">
															<svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
																<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
																<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
															</svg>
															Signing…
														</span>
													) : (
														<span className="flex items-center gap-1.5"><CheckCircle size={13} /> Sign Contract</span>
													)}
												</Button>
												<Button
													size="sm"
													variant="outline"
													className="text-xs font-medium text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg px-3"
													disabled={acting === `decline-${c._id}`}
													onClick={() => act(`decline-${c._id}`, () => api.declineContract(c._id))}
												>
													{acting === `decline-${c._id}` ? "Declining…" : "Decline"}
												</Button>
												<Button
													size="sm"
													variant="outline"
													className="text-xs font-medium text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg px-3"
													onClick={() => setReportContractId(c._id)}
												>
													<Flag className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Report
												</Button>
											</>
										)
									) : c.status !== "cancelled" && (
										<div className="flex justify-end w-full">
											<Button
												size="sm"
												variant="outline"
												className="text-xs font-medium text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg px-3"
												onClick={() => setReportContractId(c._id)}
											>
												<Flag className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Report to Admin
											</Button>
										</div>
									)}
								</div>

								{/* ── Disputed Banner ── */}
								{isDisputed && (
									<div className="mx-5 mb-4 rounded-xl bg-red-50 border border-red-200 p-4">
										<p className="text-xs font-semibold text-red-700 mb-3 flex items-center gap-1.5">
											<Scale size={13} /> Dispute in Progress
										</p>
										<div className="space-y-2 text-xs">
											<div className="flex justify-between text-red-700">
												<span>Contract Total</span>
												<span className="font-semibold">{formatCurrency(total, c.amount?.currency)}</span>
											</div>
											<div className="flex justify-between text-red-500">
												<span>Platform Fee ({platformFeePercentage}%)</span>
												<span>−{formatCurrency(platformFee, c.amount?.currency)}</span>
											</div>
											<div className="flex justify-between border-t border-red-200 pt-2 font-semibold text-red-700">
												<span>You'll Receive</span>
												<span>{formatCurrency(freelancerNet, c.amount?.currency)}</span>
											</div>
											<p className="text-[10px] text-red-500 pt-1">Frozen in escrow — Admin is reviewing the dispute.</p>
										</div>
									</div>
								)}

								{/* ── Pending Payment Notice ── */}
								{isPaymentPending && (
									<div className="mx-5 mb-4 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
										<Clock size={14} className="text-amber-500 mt-0.5 shrink-0" />
										<div>
											<p className="text-xs font-semibold text-amber-800">
												{c.offerStatus === "accepted" ? "Awaiting client payment" : "Waiting for your response"}
											</p>
											<p className="text-[11px] text-amber-600 mt-0.5">
												{c.offerStatus === "accepted"
													? "You'll be notified once the payment is processed."
													: "Accept this request to allow client payment and move forward."}
											</p>
										</div>
									</div>
								)}

								{/* ── Milestones ── */}
								{canShowMilestones && (
									<div className="border-t border-slate-100 px-5 py-4 space-y-3">
										<p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Milestones</p>
										{c.milestones!.map((m) => (
											<div key={m._id} className="rounded-xl border border-slate-200 bg-white p-4">
												<div className="flex items-center justify-between gap-3 mb-3">
													<div>
														<p className="text-sm font-semibold text-slate-900">{m.title}</p>
														<p className="text-xs text-slate-500 mt-0.5 tabular-nums">
															{formatCurrency(m.amount, c.amount?.currency)}
														</p>
													</div>
													<span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 capitalize">
														{m.status}
													</span>
												</div>
												{m.feedback && (
													<p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 mb-3">
														{m.feedback}
													</p>
												)}
												{(["pending", "in-progress", "revision-requested"].includes(m.status)) && (
													<Button
														size="sm"
														className="bg-slate-900 hover:bg-slate-800 text-white text-xs rounded-lg px-3"
														disabled={submitLoading && submitTarget?.contractId === c._id && submitTarget?.milestoneId === m._id}
														onClick={() => {
															setSubmitTarget({
																contractId: c._id,
																milestoneId: m._id,
																milestoneTitle: m.title,
																amount: m.amount,
																currency: c.amount?.currency,
															});
															setSubmitNote("");
															setSubmitFiles([]);
															setSubmitDialogOpen(true);
														}}
													>
														<Upload size={13} className="mr-1.5" />
														{submitLoading && submitTarget?.contractId === c._id && submitTarget?.milestoneId === m._id ? "Submitting…" : "Submit Milestone"}
													</Button>
												)}
											</div>
										))}
									</div>
								)}

								{/* ── Milestones Locked Notice ── */}
								{hasMilestones && milestonesLocked && (
									<div className="mx-5 mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
										<AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
										<p className="text-xs text-amber-800">{milestoneLockMessage}</p>
									</div>
								)}
							</div>
						);
					})
				)}
			</div>

			{/* ── Submit Milestone Dialog ── */}
			<Dialog
				open={submitDialogOpen}
				onOpenChange={(open) => {
					if (!open) {
						setSubmitDialogOpen(false);
						setSubmitTarget(null);
						setSubmitNote("");
						setSubmitFiles([]);
					}
				}}
			>
				<DialogContent className="max-w-md rounded-2xl">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
							<Upload className="w-4 h-4" /> Submit Milestone
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-400">
							Share your completed work, notes, and any supporting files with the client.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						{submitTarget && (
							<div className="rounded-xl bg-slate-50 border border-slate-100  py-2 text-xs flex justify-between items-center">
								<div>
									<p className="font-semibold text-slate-800">{submitTarget.milestoneTitle}</p>
									{/* <p className="text-slate-500 mt-0.5">
										{formatCurrency(submitTarget.amount, submitTarget.currency)}
									</p> */}
								</div>
							</div>
						)}
						<div>
							<label className="text-xs font-semibold text-slate-700 flex  mb-1.5">Notes for your client</label>
							<textarea
								className="w-full p-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
								rows={4}
								value={submitNote}
								onChange={(e) => setSubmitNote(e.target.value)}
								placeholder="Explain what you've delivered, how to review it, or any next steps."
							/>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<label className="text-xs font-semibold text-slate-700">Attachments</label>
								<span className="text-[11px] text-slate-400">ZIP, PDF, DOCS, images, etc.</span>
							</div>
							<div className="space-y-2">
								{submitFiles.length > 0 && (
									<ul className="max-h-32 overflow-auto rounded-xl border border-slate-100 bg-slate-50 px-2 py-1.5 text-xs space-y-1">
										{submitFiles.map((file, idx) => (
											<li key={idx} className="flex items-center justify-between gap-2">
												<span className="truncate text-slate-700">{file.filename}</span>
												<Button
													variant="ghost"
													size="icon"
													className="h-6 w-6 text-slate-400 hover:text-slate-700"
													onClick={() => {
														setSubmitFiles((prev) => prev.filter((_, i) => i !== idx));
													}}
												>
													×
												</Button>
											</li>
										))}
									</ul>
								)}
								<div className="flex items-center justify-between gap-2">
									<input
										ref={submitFileInputRef}
										type="file"
										multiple
										className="hidden"
										onChange={handleSubmitFileSelect}
									/>
									<Button
										variant="outline"
										size="sm"
										className="rounded-xl text-xs border-slate-200"
										disabled={submitUploading}
										onClick={() => submitFileInputRef.current?.click()}
									>
										<Upload className="w-3 h-3 mr-1.5" />
										{submitUploading ? "Uploading…" : "Add files"}
									</Button>
									<span className="text-[11px] text-slate-400">Optional, but recommended.</span>
								</div>
							</div>
						</div>
						<div className="flex justify-end gap-2 pt-2">
							<Button
								variant="outline"
								className="rounded-xl text-sm border-slate-200"
								onClick={() => {
									setSubmitDialogOpen(false);
									setSubmitTarget(null);
									setSubmitNote("");
									setSubmitFiles([]);
								}}
							>
								Cancel
							</Button>
							<Button
								className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm"
								disabled={submitLoading || submitUploading}
								onClick={handleSubmitMilestone}
							>
								{submitLoading ? "Submitting…" : "Submit Milestone"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* ── Report Dialog ── */}
			<Dialog open={!!reportContractId} onOpenChange={(open) => !open && setReportContractId(null)}>
				<DialogContent className="max-w-md rounded-2xl">
					<DialogHeader>
						<DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
							<Flag className="w-4 h-4 text-red-500" /> Report Contract
						</DialogTitle>
						<DialogDescription className="text-xs text-slate-400">
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
								<option value="Non-responsive client">Non-responsive client</option>
								<option value="Scope creep or unreasonable demands">Scope creep or unreasonable demands</option>
								<option value="Payment concerns">Payment concerns</option>
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
							<Button variant="outline" className="rounded-xl text-sm border-slate-200" onClick={() => setReportContractId(null)}>
								Cancel
							</Button>
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
		</>
	);
};
export default Contracts;