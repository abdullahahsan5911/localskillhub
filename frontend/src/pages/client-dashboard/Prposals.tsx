import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Eye, FileText, XCircle, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Proposal } from "./types";
import { statusColors } from "./types";
import { formatCurrency } from "@/lib/currency";

interface ProposalsTabProps {
	proposals: Proposal[];
	loading: boolean;
	onAction: (proposal: Proposal, status: string) => Promise<void> | void;
}

const ProposalsTab = ({ proposals, loading, onAction }: ProposalsTabProps) => {
	const [filter, setFilter] = useState("all");

	const filtered = proposals.filter((p: Proposal) =>
		filter === "all" ? true : p.status === filter
	);

	return (
		<div className="space-y-4 font-sans">
			<div className="flex gap-2 flex-wrap">
				{["all", "sent", "viewed", "shortlisted", "accepted", "rejected"].map(s => (
					<button
						key={s}
						onClick={() => setFilter(s)}
						className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
							filter === s
								? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
								: "bg-white border border-slate-300 text-slate-600 hover:border-blue-400 hover:text-slate-900"
						}`}
					>
						{s}
					</button>
				))}
			</div>

			{loading ? (
				<div className="space-y-3">
					{[1, 2, 3].map(i => (
						<div
							key={i}
							className="rounded-2xl border border-slate-200 h-28 bg-white shadow-sm animate-pulse"
						/>
					))}
				</div>
			) : filtered.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-white shadow-[0_10px_25px_rgba(15,23,42,0.04)]">
					<FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
					<p className="text-slate-600">No proposals yet</p>
				</div>
			) : (
				<div className="space-y-3">
					{filtered.map((p: Proposal) => (
						<div
							key={p._id}
							className="rounded-2xl border border-slate-200 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.06)] p-5"
						>
							<div className="flex items-start gap-4">
								<Avatar className="w-11 h-11 flex-shrink-0 ring-1 ring-slate-200">
									<AvatarImage src={p.freelancerId?.avatar} />
									<AvatarFallback className="bg-blue-50 text-blue-600 font-semibold">
										{p.freelancerId?.name?.charAt(0)}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-2 flex-wrap">
										<div>
											<p className="font-semibold text-slate-900">{p.freelancerId?.name}</p>
											<p className="text-sm text-slate-600">For: {p.jobId?.title}</p>
											<div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
												<span className="flex items-center gap-1">
													<CalendarDays className="w-3.5 h-3.5" />
													{new Date(p.createdAt).toLocaleDateString()}
												</span>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-sm font-bold text-slate-900">{formatCurrency(p.proposedRate?.amount ?? 0, p.proposedRate?.currency)}</span>
											<span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[p.status] || "bg-slate-100 text-slate-600"}`}>
												{p.status}
											</span>
										</div>
									</div>
									<p className="text-sm text-slate-600 mt-2 line-clamp-2">{p.coverLetter}</p>
									<div className="flex gap-2 mt-3 flex-wrap">
										{p.jobId?._id && (
											<Link to={`/jobs/${p.jobId._id}`}>
												<Button size="sm" variant="outline" className="rounded-xl gap-1 border-slate-200 text-slate-700 hover:border-slate-300">
													<Eye className="w-3.5 h-3.5" /> View Job Details
												</Button>
											</Link>
										)}
										{["sent", "viewed", "shortlisted"].includes(p.status) && (
											<>
											<Button
													size="sm"
													className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl gap-1 shadow-sm shadow-blue-600/20"
													onClick={() => onAction(p, "accepted")}
												>
												<CheckCircle2 className="w-3.5 h-3.5" /> Hire &amp; Fund Project
												</Button>
											<Button
												size="sm"
												variant="outline"
												className="rounded-xl gap-1 text-rose-600 border-rose-200 hover:bg-rose-50"
												onClick={() => onAction(p, "rejected")}
											>
												<XCircle className="w-3.5 h-3.5" /> Decline
											</Button>
											<Link to={`/freelancers/${p.freelancerId?._id}`}>
												<Button size="sm" variant="outline" className="rounded-xl gap-1 border-slate-200 text-slate-700 hover:border-slate-300">
													<Eye className="w-3.5 h-3.5" /> Profile
												</Button>
											</Link>
											</>
										)}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default ProposalsTab;

