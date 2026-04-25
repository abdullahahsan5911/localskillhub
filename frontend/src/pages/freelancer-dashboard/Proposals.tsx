import React, { useState } from "react";
import { FileText, Eye, DollarSign, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { Proposal } from "./types";
import { formatCurrency } from "@/lib/currency";

const Proposals = ({ proposals, loading }: { proposals: Proposal[]; loading: boolean }) => {
	const [filter, setFilter] = useState("all");
	const filtered = proposals.filter((p: Proposal) => filter === "all" ? true : p.status === filter);

	return (
		<div className="space-y-5 font-sans" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
			{/* header */}
			<div>
				<h2 className="text-lg font-bold text-slate-900 tracking-tight">My Proposals</h2>
				<p className="text-xs text-slate-500 mt-0.5">Track all your submitted proposals</p>
			</div>

			{/* filter tabs */}
			<div className="flex gap-2 flex-wrap">
				{["all", "sent", "viewed", "shortlisted", "accepted", "rejected", "withdrawn"].map(s => (
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
						<div key={i} className="rounded-2xl border border-slate-200 h-24 bg-white shadow-sm animate-pulse" />
					))}
				</div>
			) : filtered.length === 0 ? (
				<div
					className="rounded-2xl border  border-slate-400 p-12 flex flex-col items-center text-center bg-white shadow-[0_10px_25px_rgba(15,23,42,0.04)]"
				>
					<div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
						<FileText className="w-7 h-7 text-blue-500" />
					</div>
					<p className="text-sm font-semibold text-slate-800">No proposals found</p>
					<p className="text-xs text-slate-500 mt-1">Start applying to jobs to see your proposals here</p>
					<Link to="/jobs">
						<Button className="mt-5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl">Browse Jobs</Button>
					</Link>
				</div>
			) : (
				<div className="space-y-3">
					{filtered.map((p: Proposal) => (
						<div
							key={p._id}
							className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_25px_rgba(15,23,42,0.06)]"
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex-1 min-w-0">
									<p className="font-semibold text-slate-900 truncate">{p.jobId?.title}</p>
									<p className="text-sm text-slate-600 mt-1 line-clamp-1">{p.coverLetter}</p>
									<div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
										<span className="flex items-center gap-1">
											<DollarSign className="w-3.5 h-3.5 text-emerald-400" />
											Bid: {formatCurrency(p.proposedRate?.amount ?? 0, p.proposedRate?.currency)}
										</span>
										<span className="flex items-center gap-1">
											<Clock className="w-3.5 h-3.5" />
											{new Date(p.createdAt).toLocaleDateString()}
										</span>
									</div>
								</div>
								<div className="flex flex-col items-end gap-2">
									<span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize">
										{p.status}
									</span>
									<Link to={`/jobs/${p.jobId?._id}`}>
										<Button size="sm" variant="outline" className="rounded-xl gap-1 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 bg-white hover:bg-slate-50">
											<Eye className="w-3.5 h-3.5" /> View Job
										</Button>
									</Link>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default Proposals;
