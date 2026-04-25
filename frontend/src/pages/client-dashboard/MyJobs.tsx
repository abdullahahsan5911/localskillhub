import { useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Clock, DollarSign, FileText, Plus, Search, Tag, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobStatusBadges } from "@/components/JobStatusBadges";
import { CATEGORIES } from "@/constants/categories";
import api from "@/lib/api";
import type { Job } from "./types";
import { statusColors } from "./types";
import { formatCurrency } from "@/lib/currency";

interface MyJobsTabProps {
	jobs: Job[];
	loading: boolean;
	onRefresh: () => void;
	// When embedded in CompanyDashboard, controls whether company users may post
	canPostCompanyJob?: boolean;
	isCompanyScope?: boolean; // if true, post link should include company scope
}

const MyJobsTab = ({ jobs, loading, onRefresh, canPostCompanyJob = true, isCompanyScope = false }: MyJobsTabProps) => {
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	const filtered = jobs.filter((j: Job) => {
		const matchSearch = j.title.toLowerCase().includes(search.toLowerCase());
		const matchStatus = statusFilter === "all" || j.status === statusFilter;
		return matchSearch && matchStatus;
	});

	const handleDelete = async (id: string) => {
		if (!confirm("Delete this job?")) return;
		try {
			await api.deleteJob(id);
			onRefresh();
		} catch {
			alert("Failed to delete");
		}
	};

	return (
		<div className="space-y-5 font-sans">
			<div
				className="rounded-2xl p-4 bg-white border border-slate-200 shadow-[0_10px_25px_rgba(15,23,42,0.06)] flex flex-col sm:flex-row gap-3"
			>
				<div className="relative flex-1">
					<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
					<input
						type="text"
						placeholder="Search jobs by title…"
						className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				<select
					className="px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
					value={statusFilter}
					onChange={(e) => setStatusFilter(e.target.value)}
				>
					<option value="all">All Status</option>
					<option value="open">Open</option>
					<option value="in-progress">In Progress</option>
					<option value="completed">Completed</option>
					<option value="closed">Closed</option>
				</select>
				
			</div>

			{loading ? (
				<div className="space-y-3">
					{[1, 2, 3].map(i => (
						<div
							key={i}
							className="rounded-2xl border border-slate-200 h-24 bg-white shadow-sm animate-pulse"
						/>
					))}
				</div>
			) : filtered.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-white shadow-[0_10px_25px_rgba(15,23,42,0.04)]">
					<Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
					<p className="text-slate-600 font-medium">No jobs found</p>
					{isCompanyScope ? (
						canPostCompanyJob ? (
							<Link to="/post-job?scope=company">
								<Button className="mt-4 bg-blue-600 text-white hover:bg-blue-700 rounded-xl">
									Post a Job
								</Button>
							</Link>
						) : (
							<Button size="sm" className="mt-4 rounded-xl" variant="outline" disabled title={`Complete profile first: ${(!canPostCompanyJob && 'company profile') || ''}`}>
								Complete profile to post
							</Button>
						)
					) : (
						<Link to="/post-job">
							<Button className="mt-4 bg-blue-600 text-white hover:bg-blue-700 rounded-xl">
								Post a Job
							</Button>
						</Link>
					)}
				</div>
			) : (
				<div className="space-y-3">
					{filtered.map((job: Job) => {
						const cat = CATEGORIES.find(c => c.id === job.category);
						return (
							<div
								key={job._id}
								className="rounded-2xl border border-slate-200 bg-white shadow-[0_10px_25px_rgba(15,23,42,0.06)] p-5 hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)] transition-shadow"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap mb-1.5">
											<h3 className="font-semibold text-slate-900 truncate">{job.title}</h3>
											<span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[job.status] || "bg-slate-100 text-slate-600"}`}>
												{job.status}
											</span>
										</div>
										<div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
											<span className="flex items-center gap-1">
												<DollarSign className="w-3.5 h-3.5" />
												{formatCurrency(job.budget.amount, job.budget.currency)} ({job.budget.type})
											</span>
											{cat && (
												<span className="flex items-center gap-1">
													<Tag className="w-3.5 h-3.5" />
													{cat.name}
												</span>
											)}
											<span className="flex items-center gap-1">
												<FileText className="w-3.5 h-3.5" />
												{job.proposals?.length ?? 0} proposals
											</span>
											<span className="flex items-center gap-1">
												<Clock className="w-3.5 h-3.5" />
												{new Date(job.createdAt).toLocaleDateString()}
											</span>
										</div>
										<div className="flex gap-1.5 mt-2 flex-wrap">
											{job.skills?.slice(0, 4).map(s => (
												<span key={s} className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
													{s}
												</span>
											))}
										</div>

										{/* Job Status Badges */}
										<div className="mt-2">
											<JobStatusBadges job={job} />
										</div>
									</div>
									<div className="flex items-center gap-2 flex-shrink-0">
										<Link to={`/jobs/${job._id}`}>
											<Button variant="outline" size="sm" className="rounded-xl gap-1 border-slate-200 text-slate-700 hover:border-slate-300">
												<Eye className="w-3.5 h-3.5" /> View
											</Button>
										</Link>
										<button
											onClick={() => handleDelete(job._id)}
											className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
										>
											<Trash2 className="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default MyJobsTab;

