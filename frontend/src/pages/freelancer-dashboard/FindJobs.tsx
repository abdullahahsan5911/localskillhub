import React, { useState, useEffect } from "react";
import { Search, DollarSign, MapPin, Briefcase, ArrowRight, SlidersHorizontal, X } from "lucide-react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { JobStatusBadges } from "@/components/JobStatusBadges";
import { CATEGORIES } from "@/constants/categories";
import { useAuth } from "@/contexts/AuthContext";

// ── skeleton card ──────────────────────────────────────────────────────
const SkeletonCard = () => (
	<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
		<div className="flex items-start justify-between gap-4">
			<div className="flex-1 space-y-2.5">
				<div className="h-4 w-2/3 bg-slate-200 rounded-lg" />
				<div className="h-3 w-full bg-slate-200 rounded-lg" />
				<div className="h-3 w-4/5 bg-slate-200 rounded-lg" />
				<div className="flex gap-2 mt-1">
					<div className="h-5 w-16 bg-slate-200 rounded-md" />
					<div className="h-5 w-20 bg-slate-200 rounded-md" />
					<div className="h-5 w-14 bg-slate-200 rounded-md" />
				</div>
			</div>
			<div className="h-8 w-20 bg-slate-200 rounded-xl flex-shrink-0" />
		</div>
	</div>
);

// ── main ───────────────────────────────────────────────────────────────
const FindJobs = () => {
	const [search, setSearch]   = useState("");
	const [jobs, setJobs]       = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [mounted, setMounted] = useState(false);
	const { user } = useAuth();
	const isClient = !!user && user.role === "client";

	useEffect(() => { setMounted(true); }, []);

	useEffect(() => {
		const fetchJobs = async () => {
			try {
				const res = await api.getJobs({ page: 1 } as any);
				const d = res.data as any;
				setJobs(d.jobs || []);
			} catch {
				setJobs([]);
			} finally {
				setLoading(false);
			}
		};
		fetchJobs();
	}, []);

	const filtered = jobs.filter(j => j.title?.toLowerCase().includes(search.toLowerCase()));

	return (
		<div className="space-y-5 font-sans" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

			{/* ── search bar — DARK ──────────────────────────────── */}
			<div
				className="rounded-2xl p-4 bg-white border border-slate-200 shadow-[0_10px_25px_rgba(15,23,42,0.06)]"
			>
				<p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Find Work</p>
				<div className="flex gap-3">
					<div className="relative flex-1">
						<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
						<input
							type="text"
							placeholder="Search jobs by title, skill, or keyword…"
							className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
							value={search}
							onChange={e => setSearch(e.target.value)}
						/>
						{search && (
							<button
								onClick={() => setSearch("")}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors"
							>
								<X className="w-4 h-4" />
							</button>
						)}
					</div>
					<button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:border-blue-500 text-slate-600 hover:text-slate-900 text-sm rounded-xl transition-all">
						<SlidersHorizontal className="w-4 h-4" /> Filters
					</button>
				</div>

				{/* live count */}
				<p className="text-[11px] text-slate-600 mt-2.5">
					{loading ? "Loading…" : `${filtered.length} job${filtered.length !== 1 ? "s" : ""} found${search ? ` for "${search}"` : ""}`}
				</p>
			</div>

			{/* ── job list — LIGHT cards ─────────────────────────── */}
			{loading ? (
				<div className="space-y-3">
					{[1, 2, 3].map(i => <SkeletonCard key={i} />)}
				</div>
			) : filtered.length === 0 ? (
				<div
					className="rounded-2xl border border-dashed border-slate-200 p-14 flex flex-col items-center text-center bg-white shadow-[0_10px_25px_rgba(15,23,42,0.04)]"
				>
					<div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
						<Briefcase className="w-7 h-7 text-blue-500" />
					</div>
					<p className="text-sm font-semibold text-slate-800">No jobs found</p>
					<p className="text-xs text-slate-500 mt-1">Try a different keyword or clear your search</p>
					{search && (
						<button onClick={() => setSearch("")} className="mt-4 text-xs text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2">
							Clear search
						</button>
					)}
				</div>
			) : (
				<div className="space-y-3">
					{filtered.map((job: any, idx: number) => {
						const cat = CATEGORIES.find(c => c.id === job.category);
						const Icon = cat?.icon;
						return (
							<div
								key={job._id}
								className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_25px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_32px_rgba(15,23,42,0.12)] hover:border-blue-200 transition-all duration-300"
								style={{
									opacity: mounted ? 1 : 0,
									transform: mounted ? "translateY(0)" : "translateY(8px)",
									transition: `opacity .28s ease ${idx * 40}ms, transform .28s ease ${idx * 40}ms`,
								}}
						>
							<div className="flex items-start justify-between gap-4">
								{/* left */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap mb-1.5">
										<h3 className="font-semibold text-slate-900 text-sm leading-snug">{job.title}</h3>
											{cat && (
												<span
													className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 border"
												>
													{cat.name}
												</span>
											)}
										</div>

										<p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
											{job.description}
										</p>

										{/* meta row */}
									<div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap mb-3">
										<span className="flex items-center gap-1 font-semibold text-black">
											<DollarSign className="w-3.5 h-3.5 text-black" />
												{job.budget?.amount?.toLocaleString()}
											</span>
											{job.location?.city && (
												<span className="flex items-center gap-1">
													<MapPin className="w-3 h-3" />
													{job.location.city}
												</span>
											)}
											{job.budget?.type && (
												<span className="capitalize">{job.budget.type}</span>
											)}
										</div>

										{/* skill tags */}
										{job.skills?.length > 0 && (
											<div className="flex gap-1.5 flex-wrap">
												{job.skills.slice(0, 5).map((s: string) => (
													<span key={s} className="text-[10px] font-medium bg-slate-200 text-slate-600 border border-white/[0.08] px-2 py-0.5 rounded-md">
														{s}
													</span>
												))}
												{job.skills.length > 5 && (
													<span className="text-[10px] text-black">+{job.skills.length - 5}</span>
												)}
											</div>
										)}

										{/* Job Status Badges */}
										<div className="mt-2">
											<JobStatusBadges job={job} />
										</div>
									</div>

									{/* right — apply button */}
									{!isClient && (
										<div className="flex-shrink-0 flex flex-col items-end gap-3">
											<Link to={`/jobs/${job._id}`}>
												<button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm shadow-blue-600/20 group-hover:shadow-md group-hover:shadow-blue-600/30">
													Apply <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
												</button>
											</Link>
										</div>
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

export default FindJobs;